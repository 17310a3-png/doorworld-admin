import { useState, useEffect, useCallback } from 'react';
import { sbFetch, proxyCount } from '../api/supabase';
import { fmtDate, PAGE_SIZE } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import Modal from '../components/UI/Modal';
import StatCard from '../components/UI/StatCard';

export default function Members() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, month: 0 });
  const [modal, setModal] = useState({ open: false, data: null });
  const [chatModal, setChatModal] = useState({ open: false, name: '', messages: [] });
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    let path = 'members?select=*,quotes(id)&order=created_at.desc';
    if (search) path += `&or=(display_name.ilike.*${encodeURIComponent(search)}*,phone.ilike.*${encodeURIComponent(search)}*)`;
    try {
      const t = await proxyCount(path.replace('select=*,quotes(id)', 'select=id'));
      setTotal(t);
      const data = await sbFetch(path + `&offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`);
      setRows(data || []);
      const all = await proxyCount('members?select=id');
      const month = new Date().toISOString().slice(0, 7);
      const mo = await proxyCount(`members?select=id&created_at=gte.${month}-01`);
      setStats({ total: all, month: mo });
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [search, page, toast]);

  useEffect(() => { load(); }, [load]);

  function openEdit(m) { setModal({ open: true, data: m || {} }); }

  async function saveMember(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { display_name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email') };
    try {
      if (modal.data?.id) {
        await sbFetch(`members?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('已更新', 'success');
      } else {
        await sbFetch('members', { method: 'POST', body: JSON.stringify(body) });
        toast('已新增', 'success');
      }
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function deleteMember(m) {
    confirm('確認刪除會員？', `「${m.display_name}」的資料將永久刪除（含對話紀錄）。`, async () => {
      try {
        if (m.line_user_id) await sbFetch(`sessions?line_user_id=eq.${m.line_user_id}`, { method: 'DELETE' });
        await sbFetch(`quotes?member_id=eq.${m.id}`, { method: 'PATCH', body: JSON.stringify({ member_id: null }) });
        await sbFetch(`members?id=eq.${m.id}`, { method: 'DELETE' });
        toast('已刪除', 'success');
        load();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  async function viewChat(userId, name) {
    try {
      const sessions = await sbFetch(`sessions?line_user_id=eq.${userId}&select=messages`);
      const msgs = sessions?.[0]?.messages || [];
      setChatModal({ open: true, name, messages: msgs });
    } catch { setChatModal({ open: true, name, messages: [] }); }
  }

  const from = page * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, total);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">會員管理</div>
          <div className="page-subtitle">管理所有 LINE 會員資料與對話紀錄</div>
        </div>
      </div>
      <div className="stats">
        <StatCard label="總會員數" value={stats.total} />
        <StatCard label="本月新增" value={stats.month} />
      </div>
      <div className="controls">
        <input className="search-box" placeholder="搜尋姓名、電話..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <button className="btn btn-ghost" onClick={load}>↻ 重整</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>姓名</th><th>電話</th><th>LINE ID</th><th>Email</th><th>建立時間</th><th>估價單</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="7"><div className="empty"><div className="icon">👥</div>沒有會員資料</div></td></tr>
            ) : rows.map(m => (
              <tr key={m.id}>
                <td><strong>{m.display_name || '—'}</strong></td>
                <td>{m.phone || '—'}</td>
                <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{m.line_user_id ? m.line_user_id.slice(0, 10) + '...' : '—'}</td>
                <td>{m.email || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(m.created_at)}</td>
                <td style={{ textAlign: 'center' }}>{m.quotes?.length || 0}</td>
                <td>
                  <div className="actions">
                    {m.line_user_id && <button className="btn btn-ghost btn-sm" onClick={() => viewChat(m.line_user_id, m.display_name)}>💬</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>編輯</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMember(m)}>刪除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{total ? `${from}-${to} / ${total}` : ''}</span>
        <div className="page-btns">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ 上一頁</button>
          <button className="page-btn" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>下一頁 ›</button>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data?.id ? '編輯會員' : '新增會員'}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="member-form">儲存</button></>}>
        <form id="member-form" onSubmit={saveMember} className="form-grid">
          <div className="form-group"><label>姓名</label><input name="name" defaultValue={modal.data?.display_name || ''} /></div>
          <div className="form-group"><label>電話</label><input name="phone" defaultValue={modal.data?.phone || ''} /></div>
          <div className="form-group full"><label>Email</label><input name="email" defaultValue={modal.data?.email || ''} /></div>
        </form>
      </Modal>

      <Modal open={chatModal.open} onClose={() => setChatModal({ open: false, name: '', messages: [] })} title={`對話紀錄 — ${chatModal.name}`} maxWidth={640}>
        <div className="chat-wrap">
          {chatModal.messages.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>無對話紀錄</div> :
            chatModal.messages.map((msg, i) => (
              <div key={i}>
                <div className="chat-label">{msg.role === 'user' ? '客戶' : 'AI'}</div>
                <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>{msg.content}</div>
              </div>
            ))}
        </div>
      </Modal>
    </div>
  );
}
