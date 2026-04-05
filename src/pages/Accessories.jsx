import { useState, useEffect } from 'react';
import { uploadFile } from '../api/storage';
import { sbFetch } from '../api/supabase';
import { fmtPrice } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import Modal from '../components/UI/Modal';


export default function Accessories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try { setRows(await sbFetch('accessories?select=*&order=category.asc,name.asc') || []); }
    catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openModal(a) {
    setModal({ open: true, data: a || {} });
    setImageUrl(a?.image_url || '');
  }

  async function uploadImage(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('圖片不可超過 5MB', 'error'); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `accessories/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    setUploading(true);
    try {
      const url = await uploadFile('site-photos', fileName, file);
      setImageUrl(url);
      toast('圖片已上傳', 'success');
    } catch (e) { toast('上傳失敗: ' + e.message, 'error'); }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: fd.get('name'),
      category: fd.get('category'),
      type: fd.get('type') || 'standard',
      brand: fd.get('brand'),
      price: Number(fd.get('price')) || 0,
      note: fd.get('note') || null,
      fire_only: fd.get('fire_only') === 'on',
      is_active: fd.get('is_active') !== 'false',
      image_url: imageUrl || null
    };
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

  const inputStyle = { padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)', width: '100%' };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">五金配件</div><div className="page-subtitle">管理門鎖、鉸鏈、把手等五金配件</div></div>
        <button className="btn btn-primary" onClick={() => openModal(null)}>+ 新增配件</button>
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        rows.length === 0 ? <div className="empty"><div className="icon">🔩</div>尚無配件資料</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {rows.map(a => (
            <div key={a.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.name}
                    {a.fire_only && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: 'var(--danger)' }}>防火</span>}
                    {a.type === 'upgrade' && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6' }}>選配</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.category || ''} {a.brand ? `· ${a.brand}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {a.image_url && <img src={a.image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--border)' }} />}
                  <span className="price" style={{ fontSize: 16 }}>{fmtPrice(a.price)}</span>
                </div>
              </div>
              {a.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{a.note}</div>}
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openModal(a)}>編輯</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(a)}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      }
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={d.id ? '編輯配件' : '新增配件'} maxWidth={520}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="acc-form">儲存</button></>}>
        <form id="acc-form" onSubmit={save} className="form-grid">
          <div className="form-group"><label>名稱</label><input name="name" defaultValue={d.name || ''} required /></div>
          <div className="form-group"><label>分類</label><input name="category" defaultValue={d.category || ''} list="acc-cats" /><datalist id="acc-cats">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
          <div className="form-group"><label>品牌</label><input name="brand" defaultValue={d.brand || ''} /></div>
          <div className="form-group"><label>類型</label>
            <select name="type" defaultValue={d.type || 'standard'} style={inputStyle}>
              <option value="standard">標配</option>
              <option value="upgrade">選配/加購</option>
            </select>
          </div>
          <div className="form-group"><label>價格</label><input name="price" type="number" defaultValue={d.price || ''} /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" name="fire_only" defaultChecked={d.fire_only} style={{ accentColor: 'var(--gold)' }} />防火專用</label>
          </div>
          <div className="form-group full"><label>備註</label><input name="note" defaultValue={d.note || ''} /></div>

          {/* Image upload */}
          <div className="form-group full" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <label>產品圖片</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 6 }}>
              {imageUrl && (
                <div style={{ position: 'relative' }}>
                  <img src={imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', fontSize: 11 }}>
                    {uploading ? '上傳中...' : '上傳圖片'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadImage(e.target.files[0])} disabled={uploading} />
                  </label>
                </div>
                <input
                  type="text" placeholder="或輸入圖片 URL" value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  style={{ ...inputStyle, fontSize: 11, padding: '6px 10px' }}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
