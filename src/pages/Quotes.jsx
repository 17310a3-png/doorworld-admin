import { useState, useEffect, useCallback } from 'react';
import { sbFetch, proxyCount } from '../api/supabase';
import { fmtDate, fmtPrice, DOOR_TYPE_LABEL, PAGE_SIZE } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/UI/Modal';
import StatCard from '../components/UI/StatCard';

const STATUS_MAP = { draft: ['草稿', '#94a3b8', '#f1f5f9'], sent: ['已送出', '#3b82f6', '#eff6ff'], confirmed: ['已確認', '#22c55e', '#f0fdf4'], cancelled: ['已取消', '#ef4444', '#fef2f2'] };

export default function Quotes() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, month: 0, confirmed: 0 });
  const [modal, setModal] = useState({ open: false, data: null });
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    let path = 'quotes?select=*&order=created_at.desc';
    if (search) path += `&or=(quote_no.ilike.*${encodeURIComponent(search)}*,customer_name.ilike.*${encodeURIComponent(search)}*)`;
    if (statusFilter) path += `&status=eq.${statusFilter}`;
    try {
      setTotal(await proxyCount(path.replace('select=*', 'select=id')));
      setRows(await sbFetch(path + `&offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`) || []);
      const all = await proxyCount('quotes?select=id');
      const month = new Date().toISOString().slice(0, 7);
      const mo = await proxyCount(`quotes?select=id&created_at=gte.${month}-01`);
      const conf = await proxyCount('quotes?select=id&status=eq.confirmed');
      setStats({ total: all, month: mo, confirmed: conf });
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [search, statusFilter, page, toast]);

  useEffect(() => { load(); }, [load]);

  function openDetail(q) { setModal({ open: true, data: q }); }

  async function saveStatus(status) {
    try {
      await sbFetch(`quotes?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast('狀態已更新', 'success');
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function deleteQuote(q) {
    confirm('確認刪除？', `估價單 ${q.quote_no} 將永久刪除。`, async () => {
      await sbFetch(`quotes?id=eq.${q.id}`, { method: 'DELETE' });
      toast('已刪除', 'success');
      setModal({ open: false, data: null });
      load();
    });
  }

  async function createCase(q) {
    const no = 'CS-' + new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
    try {
      const res = await sbFetch('cases', {
        method: 'POST', headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ case_no: no, quote_id: q.id, quote_no: q.quote_no, customer_name: q.customer_name, customer_phone: q.customer_phone, customer_addr: q.customer_addr, product_code: q.product_code, door_type: q.door_type, quantity: q.quantity, quoted_price: q.total_price, status: 'new', created_by: user?.display_name || '' })
      });
      if (res?.[0]) await sbFetch(`quotes?id=eq.${q.id}`, { method: 'PATCH', body: JSON.stringify({ case_id: res[0].id }) });
      toast('案件已建立: ' + no, 'success');
      setModal({ open: false, data: null });
    } catch (e) { toast(e.message, 'error'); }
  }

  const q = modal.data || {};
  const [sLabel, sColor, sBg] = STATUS_MAP[q.status] || ['未知', '#94a3b8', '#f1f5f9'];
  const from = page * PAGE_SIZE + 1, to = Math.min(from + PAGE_SIZE - 1, total);

  const renderRow = (label, value) => (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(77,70,53,0.06)', minHeight: 36 }}>
      <div style={{ width: 90, padding: '9px 12px', background: 'var(--bg)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</div>
      <div style={{ padding: '9px 12px', fontSize: 13, flex: 1 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">估價單</div><div className="page-subtitle">管理所有客戶報價單與確認狀態</div></div>
      </div>
      <div className="stats">
        <StatCard label="總筆數" value={stats.total} />
        <StatCard label="本月" value={stats.month} />
        <StatCard label="已確認" value={stats.confirmed} />
      </div>
      <div className="controls">
        <input className="search-box" placeholder="搜尋單號、客戶名稱..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} style={{ padding: '9px 32px 9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
          <option value="">全部狀態</option><option value="draft">草稿</option><option value="sent">已送出</option><option value="confirmed">已確認</option><option value="cancelled">已取消</option>
        </select>
        <button className="btn btn-ghost" onClick={load}>↻</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>單號</th><th>客戶</th><th>電話</th><th>產品</th><th>門型</th><th>數量</th><th>總價</th><th>狀態</th><th>建立時間</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="9"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            : rows.length === 0 ? <tr><td colSpan="9"><div className="empty"><div className="icon">📋</div>沒有估價單</div></td></tr>
            : rows.map(q => {
              const [sl, sc, sb] = STATUS_MAP[q.status] || STATUS_MAP.draft;
              return (
                <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(q)}>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{q.quote_no || '—'}</strong></td>
                  <td>{q.customer_name || '—'}</td>
                  <td>{q.customer_phone || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{q.product_code || '—'}</td>
                  <td>{DOOR_TYPE_LABEL[q.door_type] || q.door_type || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{q.quantity || 1}</td>
                  <td className="price">{fmtPrice(q.total_price)}</td>
                  <td><span className="badge" style={{ background: sb, color: sc, border: `1px solid ${sc}40` }}>{sl}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(q.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{total ? `${from}-${to} / ${total}` : ''}</span>
        <div className="page-btns">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <button className="page-btn" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={`估價單 ${q.quote_no || ''}`} maxWidth={620}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>關閉</button>
          {!q.case_id && <button className="btn btn-ghost" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => createCase(q)}>建立案件</button>}
          <button className="btn btn-danger" onClick={() => deleteQuote(q)}>刪除</button>
        </>}>
        {modal.open && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="badge" style={{ background: sBg, color: sColor, border: `1px solid ${sColor}40` }}>{sLabel}</span>
            {q.created_by && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>建單：{q.created_by}</span>}
          </div>
          <div style={{ border: '1px solid rgba(77,70,53,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 14 }}>
            {renderRow('姓名', q.customer_name || '—')}
            {renderRow('電話', q.customer_phone || '—')}
            {renderRow('地址', q.customer_addr || '—')}
            {renderRow('產品', q.product_code || '—')}
            {renderRow('門型', DOOR_TYPE_LABEL[q.door_type] || '—')}
            {renderRow('尺寸', q.width_cm && q.height_cm ? `${q.width_cm} × ${q.height_cm} cm` : '—')}
            {renderRow('數量', q.quantity || 1)}
            {renderRow('單價', fmtPrice(q.unit_price))}
            {renderRow('加價', fmtPrice((q.oversize_charge || 0) + (q.elevator_charge || 0) + (q.addon_total || 0)))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1a1a1a', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2 }}>總計金額</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{fmtPrice(q.total_price)}</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={q.status} onChange={e => saveStatus(e.target.value)} style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
              <option value="draft">草稿</option><option value="sent">已送出</option><option value="confirmed">已確認</option><option value="cancelled">已取消</option>
            </select>
          </div>
        </>}
      </Modal>
    </div>
  );
}
