import { useState, useEffect } from 'react';
import { sbFetch, proxyCount } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR, CTYPE_SHORT, PAGE_SIZE } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function FormalQuote() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    let path = 'cases?select=*&order=created_at.desc';
    if (search) path += `&or=(case_no.ilike.*${encodeURIComponent(search)}*,customer_name.ilike.*${encodeURIComponent(search)}*,order_no.ilike.*${encodeURIComponent(search)}*)`;
    if (filter !== 'all') path += `&status=eq.${filter}`;
    try {
      setTotal(await proxyCount(path.replace('select=*', 'select=id')));
      setRows(await sbFetch(path + `&offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`) || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filter, page]);

  const from = page * PAGE_SIZE + 1, to = Math.min(from + PAGE_SIZE - 1, total);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">報價單總表</div><div className="page-subtitle">所有正式報價單 — 追蹤報價 → 成案 → 付款 → 發包 → 完工</div></div>
      </div>
      <div className="stats">
        <StatCard label="總數" value={total} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input className="search-box" placeholder="搜尋單號、客戶..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ width: 250 }} />
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} style={{ padding: '9px 32px 9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
          <option value="all">全部</option>
          <option value="official_quoted">已報價</option>
          <option value="order_confirmed">已下單</option>
          <option value="deposit_paid">已付訂</option>
          <option value="production">製作中</option>
          <option value="completed">已結案</option>
        </select>
        <button className="btn btn-ghost" onClick={load}>↻</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>訂單編號</th><th>客戶</th><th>型態</th><th>業務</th><th>報價金額</th><th>總價</th><th>狀態</th><th>建立</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            : rows.length === 0 ? <tr><td colSpan="8"><div className="empty"><div className="icon">📋</div>無資料</div></td></tr>
            : rows.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              return (
                <tr key={c.id}>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.order_no || c.case_no || '—'}</strong></td>
                  <td>{c.customer_name || '—'}</td>
                  <td style={{ fontSize: 11 }}>{CTYPE_SHORT[c.customer_type] || c.customer_type || '—'}</td>
                  <td style={{ fontSize: 12 }}>{c.sales_person || '—'}</td>
                  <td className="price">{fmtPrice(c.official_price || c.quoted_price)}</td>
                  <td className="price">{fmtPrice(c.total_with_tax)}</td>
                  <td><span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status] || c.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(c.created_at)}</td>
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
    </div>
  );
}
