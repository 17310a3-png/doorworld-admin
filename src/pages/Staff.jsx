import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import Modal from '../components/UI/Modal';

export default function Staff() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try { setRows(await sbFetch('staff?select=*&order=created_at.desc') || []); }
    catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      display_name: fd.get('name'), username: fd.get('username'),
      password: fd.get('password'), role: fd.get('role'),
      permissions: {
        members: { view: fd.get('p_members') === 'on', edit: fd.get('p_members') === 'on' },
        products: { view: fd.get('p_products') === 'on', edit: fd.get('p_products') === 'on' },
        service: { view: fd.get('p_service') === 'on', edit: fd.get('p_service') === 'on' },
        cases: { view: fd.get('p_cases') === 'on', edit: fd.get('p_cases') === 'on' },
        finance: { view: fd.get('p_finance') === 'on', edit: fd.get('p_finance') === 'on' },
      }
    };
    try {
      if (modal.data?.id) {
        if (!body.password) delete body.password;
        await sbFetch(`staff?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await sbFetch('staff', { method: 'POST', body: JSON.stringify(body) });
      }
      toast('已儲存', 'success');
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  function del(s) {
    confirm('確認刪除？', `員工 ${s.display_name} 將永久刪除。`, async () => {
      await sbFetch(`staff?id=eq.${s.id}`, { method: 'DELETE' });
      toast('已刪除', 'success');
      load();
    });
  }

  const d = modal.data || {};
  const perm = d.permissions || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">員工帳號</div><div className="page-subtitle">管理員工登入帳號與存取權限</div></div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: {} })}>+ 新增員工</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>姓名</th><th>帳號</th><th>角色</th><th>權限</th><th>建立時間</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            : rows.length === 0 ? <tr><td colSpan="6"><div className="empty"><div className="icon">👤</div>沒有員工</div></td></tr>
            : rows.map(s => (
              <tr key={s.id}>
                <td><strong>{s.display_name}</strong></td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.username}</td>
                <td><span className="badge" style={{ background: s.role === 'admin' ? 'rgba(201,162,39,.15)' : 'var(--surface-high)', color: s.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)' }}>{s.role === 'admin' ? '管理員' : '員工'}</span></td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Object.entries(s.permissions || {}).filter(([, v]) => v?.view).map(([k]) => k).join(', ') || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(s.created_at)}</td>
                <td><div className="actions"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ open: true, data: s })}>編輯</button><button className="btn btn-danger btn-sm" onClick={() => del(s)}>刪除</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={d.id ? '編輯員工' : '新增員工'} maxWidth={580}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="staff-form">儲存</button></>}>
        <form id="staff-form" onSubmit={save} className="form-grid">
          <div className="form-group"><label>姓名</label><input name="name" defaultValue={d.display_name || ''} required /></div>
          <div className="form-group"><label>帳號</label><input name="username" defaultValue={d.username || ''} required /></div>
          <div className="form-group"><label>密碼</label><input name="password" type="password" placeholder={d.id ? '留空不修改' : '設定密碼'} /></div>
          <div className="form-group"><label>角色</label><select name="role" defaultValue={d.role || 'staff'}><option value="staff">員工</option><option value="admin">管理員</option></select></div>
          <div className="form-group full" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <label>模組權限</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
              {[['members', '會員'], ['products', '產品'], ['service', '施工費'], ['cases', '案件'], ['finance', '財務']].map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" name={`p_${k}`} defaultChecked={perm[k]?.view} style={{ accentColor: 'var(--gold)' }} />{l}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
