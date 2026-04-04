import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function SalesOrder() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(order_confirmed,deposit_paid)&order=created_at.desc&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  let filtered = data;
  if (filter === 'pending') filtered = filtered.filter(c => !c.sales_order_submitted);
  if (filter === 'done') filtered = filtered.filter(c => c.sales_order_submitted);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">業務下單</div><div className="page-subtitle">整理圖面資料，下單給內勤（3 個工作天內）</div></div>
        <button className="btn btn-ghost" onClick={load}>↻ 更新</button>
      </div>
      <div className="stats">
        <StatCard label="總數" value={data.length} />
        <StatCard label="待處理" value={data.filter(c => !c.sales_order_submitted).length} color="var(--danger)" />
        <StatCard label="已提交" value={data.filter(c => c.sales_order_submitted).length} color="var(--success)" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['全部', 'all'], ['待處理', 'pending'], ['已提交', 'done']].map(([l, v]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${filter === v ? 'var(--gold)' : 'var(--border)'}`, background: filter === v ? 'var(--gold-dim)' : 'var(--surface-2)', color: filter === v ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: filter === v ? 700 : 500 }}>{l}</button>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? <div className="empty"><div className="icon">📋</div>無待處理案件</div> :
            filtered.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              return (
                <div key={c.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no}</strong>
                      <span style={{ marginLeft: 10 }}>{c.customer_name || '—'}</span>
                    </div>
                    <span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>業務: {c.sales_person || '—'}</span>
                    <span>產品: {c.product_code || '—'}</span>
                    <span>門型: {c.door_type || '—'}{c.is_fireproof && ' 🔥'}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmtPrice(c.total_with_tax || c.official_price)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      }
    </div>
  );
}
