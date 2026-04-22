import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice, DOOR_TYPE_LABEL } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import Modal from '../components/UI/Modal';

const FIELDS = [
  { key: 'fire_cert_60a', label: '防火認證 60A' },
  { key: 'smoke_seal', label: '煙氣封條' },
  { key: 'old_door_removal', label: '拆舊門' },
  { key: 'old_frame_remove', label: '拆舊框' },
  { key: 'wet_grout', label: '濕式灌漿' },
  { key: 'wet_paint', label: '油漆' },
  { key: 'dry_frame', label: '乾式包框' },
  { key: 'soundproof_basic', label: '隔音（基本）' },
  { key: 'soundproof_50db', label: '隔音（50dB）' },
  { key: 'no_elevator_per_floor', label: '無電梯搬運/每層' },
  { key: 'oversize_width_per_10cm', label: '超寬/每10cm' },
  { key: 'oversize_height_per_10cm', label: '超高/每10cm' }
];

const inputStyle = { padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)', width: '100%' };

export default function Service() {
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [itemModal, setItemModal] = useState({ open: false, data: null });
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const [costs, custom] = await Promise.all([
        sbFetch('service_costs?select=*&order=door_type.asc'),
        sbFetch('service_items?select=*&order=sort_order.asc,name.asc')
      ]);
      setRows(costs || []);
      setItems(custom || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    FIELDS.forEach(f => { body[f.key] = Number(fd.get(f.key)) || 0; });
    try {
      await sbFetch(`service_costs?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast('已儲存', 'success');
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function saveItem(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: (fd.get('name') || '').trim(),
      unit_price: Number(fd.get('unit_price')) || 0,
      unit: (fd.get('unit') || '式').trim(),
      category: (fd.get('category') || '').trim() || null,
      show_on_quote: fd.get('show_on_quote') === 'on',
      is_active: fd.get('is_active') !== 'false',
      sort_order: parseInt(fd.get('sort_order'), 10) || 999,
      note: (fd.get('note') || '').trim() || null,
      updated_at: new Date().toISOString()
    };
    if (!body.name) { toast('項目名稱必填', 'error'); return; }
    try {
      if (itemModal.data?.id) await sbFetch(`service_items?id=eq.${itemModal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await sbFetch('service_items', { method: 'POST', body: JSON.stringify(body) });
      toast('已儲存', 'success');
      setItemModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function toggleShow(it) {
    try {
      await sbFetch(`service_items?id=eq.${it.id}`, { method: 'PATCH', body: JSON.stringify({ show_on_quote: !it.show_on_quote }) });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function toggleActive(it) {
    try {
      await sbFetch(`service_items?id=eq.${it.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !it.is_active }) });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  function delItem(it) {
    confirm('確認刪除？', `「${it.name}」將永久刪除。`, async () => {
      await sbFetch(`service_items?id=eq.${it.id}`, { method: 'DELETE' });
      toast('已刪除', 'success');
      load();
    });
  }

  const d = modal.data || {};
  const itd = itemModal.data || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">施工費用</div><div className="page-subtitle">依門型設定基礎施工費用 + 自訂附加項目（可勾選顯示在報價單）</div></div>
      </div>

      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <>
          {/* 基礎費用 by 門型 */}
          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>📋 基礎施工費用（依門型）</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>點「編輯」修改各門型的基礎施工附加金額。</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 28 }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>{r.door_type_name || DOOR_TYPE_LABEL[r.door_type] || r.door_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, letterSpacing: 1 }}>寬 {r.std_width} × 高 {r.std_height} cm</div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => setModal({ open: true, data: r })}>編輯</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                  {FIELDS.map(f => (
                    <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                      <span className="price">{fmtPrice(r[f.key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 自訂附加項目 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: 1 }}>🛠️ 附加施工項目（自訂）</div>
            <button className="btn btn-primary btn-sm" onClick={() => setItemModal({ open: true, data: null })}>+ 新增項目</button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>新增的項目可在「報價單」中作為「特殊需求」勾選並計入總計。</p>
          {items.length === 0 ? <div className="empty" style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 30 }}><div className="icon">🛠️</div>尚無附加項目，請新增</div> :
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: 'var(--surface-2)' }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1 }}>項目</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1 }}>分類</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textAlign: 'right' }}>單價</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1 }}>單位</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textAlign: 'center' }}>報價單顯示</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textAlign: 'center' }}>啟用</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--gold)', letterSpacing: 1, textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} style={{ borderTop: '1px solid var(--border)', opacity: it.is_active ? 1 : 0.5 }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{it.name}{it.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{it.note}</div>}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{it.category || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }} className="price">{fmtPrice(it.unit_price)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{it.unit || '式'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!it.show_on_quote} onChange={() => toggleShow(it)} style={{ accentColor: 'var(--gold)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!it.is_active} onChange={() => toggleActive(it)} style={{ accentColor: 'var(--gold)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setItemModal({ open: true, data: it })} style={{ marginRight: 4 }}>編輯</button>
                        <button className="btn btn-danger btn-sm" onClick={() => delItem(it)}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </>
      }

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={`編輯施工費用 — ${d.door_type_name || DOOR_TYPE_LABEL[d.door_type] || ''}`} maxWidth={550}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="svc-form">儲存</button></>}>
        <form id="svc-form" onSubmit={save} className="form-grid">
          {FIELDS.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              <input name={f.key} type="number" defaultValue={d[f.key] || 0} />
            </div>
          ))}
        </form>
      </Modal>

      <Modal open={itemModal.open} onClose={() => setItemModal({ open: false, data: null })} title={itd.id ? '編輯附加項目' : '新增附加項目'} maxWidth={520}
        footer={<><button className="btn btn-ghost" onClick={() => setItemModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="svc-item-form">儲存</button></>}>
        <form id="svc-item-form" onSubmit={saveItem} className="form-grid">
          <div className="form-group full"><label>項目名稱 *</label><input name="name" defaultValue={itd.name || ''} required placeholder="例：站框、油漆、無電梯搬運" /></div>
          <div className="form-group"><label>單價 (NT$)</label><input name="unit_price" type="number" defaultValue={itd.unit_price || 0} /></div>
          <div className="form-group"><label>單位</label><input name="unit" defaultValue={itd.unit || '式'} placeholder="式、樘、層" /></div>
          <div className="form-group"><label>分類</label><input name="category" defaultValue={itd.category || ''} placeholder="例：拆除、施工" /></div>
          <div className="form-group"><label>排序</label><input name="sort_order" type="number" defaultValue={itd.sort_order || 999} /></div>
          <div className="form-group full"><label>備註</label><input name="note" defaultValue={itd.note || ''} /></div>
          <div className="form-group full" style={{ display: 'flex', gap: 20, paddingTop: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="show_on_quote" defaultChecked={itd.show_on_quote !== false} style={{ accentColor: 'var(--gold)' }} />在報價單顯示
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" defaultChecked={itd.is_active !== false} style={{ accentColor: 'var(--gold)' }} value="true" />啟用
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
