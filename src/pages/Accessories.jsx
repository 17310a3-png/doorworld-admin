import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import Modal from '../components/UI/Modal';

export default function Accessories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try { setRows(await sbFetch('accessories?select=*&order=category.asc,name.asc') || []); }
    catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { name: fd.get('name'), category: fd.get('category'), brand: fd.get('brand'), price: Number(fd.get('price')) || 0, note: fd.get('note') || null };
    try {
      if (modal.data?.id) {
        await sbFetch(`accessories?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await sbFetch('accessories', { method: 'POST', body: JSON.stringify(body) });
      }
      toast('已儲存', 'success');
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  function del(a) {
    confirm('確認刪除？', `${a.name} 將永久刪除。`, async () => {
      await sbFetch(`accessories?id=eq.${a.id}`, { method: 'DELETE' });
      toast('已刪除', 'success');
      load();
    });
  }

  const d = modal.data || {};
  const categories = [...new Set(rows.map(r => r.category).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">五金配件</div><div className="page-subtitle">管理門鎖、鉸鏈、把手等五金配件</div></div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: {} })}>+ 新增配件</button>
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        rows.length === 0 ? <div className="empty"><div className="icon">🔩</div>尚無配件資料</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {rows.map(a => (
            <div key={a.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.category || ''} {a.brand ? `· ${a.brand}` : ''}</div>
                </div>
                <span className="price" style={{ fontSize: 16 }}>{fmtPrice(a.price)}</span>
              </div>
              {a.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{a.note}</div>}
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ open: true, data: a })}>編輯</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(a)}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      }
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={d.id ? '編輯配件' : '新增配件'} maxWidth={500}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="acc-form">儲存</button></>}>
        <form id="acc-form" onSubmit={save} className="form-grid">
          <div className="form-group"><label>名稱</label><input name="name" defaultValue={d.name || ''} required /></div>
          <div className="form-group"><label>分類</label><input name="category" defaultValue={d.category || ''} list="acc-cats" /><datalist id="acc-cats">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
          <div className="form-group"><label>品牌</label><input name="brand" defaultValue={d.brand || ''} /></div>
          <div className="form-group"><label>價格</label><input name="price" type="number" defaultValue={d.price || ''} /></div>
          <div className="form-group full"><label>備註</label><input name="note" defaultValue={d.note || ''} /></div>
        </form>
      </Modal>
    </div>
  );
}
