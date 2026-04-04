import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function InternalOrder() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(deposit_paid,production)&order=created_at.desc&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function exportCSV() {
    const headers = ['訂單編號', '客戶', '業務', '產品', '門型', '防火', '總價', '狀態', '下單日'];
    const rows = data.map(c => [c.order_no || c.case_no, c.customer_name, c.sales_person, c.product_code, c.door_type, c.is_fireproof ? 'YES' : 'NO', c.total_with_tax || c.official_price || '', CASE_STATUS_LABEL[c.status] || c.status, c.order_date || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `內勤下單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  let filtered = data;
  if (filter === 'pending') filtered = filtered.filter(c => !c.internal_order_date);
  if (filter === 'done') filtered = filtered.filter(c => c.internal_order_date);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">內勤下單</div><div className="page-subtitle">整理資料，下單給廠商（5 個工作天內）</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" onClick={exportCSV} style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>下載 CSV</button>
          <button className="btn btn-ghost" onClick={load}>↻</button>
        </div>
      </div>
      <div className="stats">
        <StatCard label="總數" value={data.length} />
        <StatCard label="待下單" value={data.filter(c => !c.internal_order_date).length} color="var(--danger)" />
        <StatCard label="已下單" value={data.filter(c => c.internal_order_date).length} color="var(--success)" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['全部', 'all'], ['待下單', 'pending'], ['已下單', 'done']].map(([l, v]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${filter === v ? 'var(--gold)' : 'var(--border)'}`, background: filter === v ? 'var(--gold-dim)' : 'var(--surface-2)', color: filter === v ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: filter === v ? 700 : 500 }}>{l}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>訂單</th><th>客戶</th><th>業務</th><th>產品</th><th>門型</th><th>防火</th><th>總價</th><th>下單日</th><th>狀態</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="9"><div className="loading"><div className="spinner" /><br />載入中...</div></td></tr>
            : filtered.length === 0 ? <tr><td colSpan="9"><div className="empty"><div className="icon">📋</div>無資料</div></td></tr>
            : filtered.map(c => (
              <tr key={c.id}>
                <td><strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.order_no || c.case_no || '—'}</strong></td>
                <td>{c.customer_name || '—'}</td>
                <td style={{ fontSize: 12 }}>{c.sales_person || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.product_code || '—'}</td>
                <td>{c.door_type || '—'}</td>
                <td style={{ textAlign: 'center' }}>{c.is_fireproof ? '🔥' : ''}</td>
                <td className="price">{fmtPrice(c.total_with_tax || c.official_price)}</td>
                <td style={{ fontSize: 12 }}>{c.internal_order_date ? fmtDate(c.internal_order_date).split(' ')[0] : '—'}</td>
                <td><span className="badge" style={{ background: c.internal_order_date ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)', color: c.internal_order_date ? '#10b981' : '#ef4444' }}>{c.internal_order_date ? '已下單' : '待下單'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
