import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR, CTYPE_SHORT } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function Ordering() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(deposit_paid,production,shipped)&order=created_at.desc&limit=500') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  let filtered = data;
  if (filter === 'fire') filtered = filtered.filter(c => c.is_fireproof);
  if (filter === 'nofire') filtered = filtered.filter(c => !c.is_fireproof);
  if (search) { const q = search.toLowerCase(); filtered = filtered.filter(c => [c.customer_name, c.order_no, c.case_no, c.sales_person].join(' ').toLowerCase().includes(q)); }

  const fire = data.filter(c => c.is_fireproof).length;
  const shipped = data.filter(c => c.status === 'shipped').length;

  const stages = ['下單', '回簽', '加工', '出貨', '運送'];
  function getStageIdx(c) {
    if (c.status === 'shipped') return 4;
    if (c.status === 'production') return 2;
    if (c.internal_order_date) return 1;
    return 0;
  }

  const FilterBtn = ({ label, value }) => (
    <button onClick={() => setFilter(value)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${filter === value ? 'var(--gold)' : 'var(--border)'}`, background: filter === value ? 'var(--gold-dim)' : 'var(--surface-2)', color: filter === value ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: filter === value ? 700 : 500 }}>{label}</button>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">下單追蹤</div><div className="page-subtitle">所有下單案件的生產與運送總覽</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="search-box" placeholder="搜尋客戶、訂單..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
          <button className="btn btn-ghost" onClick={load}>↻</button>
        </div>
      </div>
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="總下單" value={data.length} />
        <StatCard label="防火門" value={fire} color="var(--danger)" />
        <StatCard label="非防火" value={data.length - fire} color="var(--success)" />
        <StatCard label="已出貨" value={shipped} color="var(--success)" />
        <StatCard label="製作中" value={data.length - shipped} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <FilterBtn label={`全部 (${data.length})`} value="all" />
        <FilterBtn label="防火門" value="fire" />
        <FilterBtn label="非防火" value="nofire" />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>報價單號</th><th>客戶</th><th>業務</th><th>門型</th><th>付款日</th><th>進度</th><th>狀態</th><th>預計到倉</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            : filtered.length === 0 ? <tr><td colSpan="8"><div className="empty"><div className="icon">📦</div>無下單案件</div></td></tr>
            : filtered.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              const stIdx = getStageIdx(c);
              return (
                <tr key={c.id}>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.order_no || c.case_no || '—'}</strong></td>
                  <td>{c.customer_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{c.sales_person || '—'}</td>
                  <td>{c.door_type || '—'}{c.is_fireproof && <span style={{ color: 'var(--danger)', marginLeft: 4, fontSize: 10 }}>🔥</span>}</td>
                  <td style={{ fontSize: 12 }}>{c.deposit_50_paid_at ? fmtDate(c.deposit_50_paid_at).split(' ')[0] : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {stages.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                          {i > 0 && <div style={{ width: 10, height: 2, background: i <= stIdx ? '#10b981' : 'var(--surface-high)' }} />}
                          <div style={{ width: i === stIdx ? 22 : 18, height: i === stIdx ? 22 : 18, borderRadius: '50%', background: i < stIdx ? '#10b981' : i === stIdx ? 'var(--gold)' : 'var(--surface-high)', color: i <= stIdx ? '#fff' : 'var(--text-muted)', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={s}>{i < stIdx ? '✓' : i + 1}</div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status]}</span></td>
                  <td style={{ fontSize: 12 }}>{c.estimated_arrival ? fmtDate(c.estimated_arrival).split(' ')[0] : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
