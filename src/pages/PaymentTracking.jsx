import { useState, useEffect, useCallback } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice } from '../api/utils';
import StatCard from '../components/UI/StatCard';
import { useToast } from '../components/UI/Toast';

export default function PaymentTracking() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sbFetch('cases?select=*&status=in.(order_confirmed,deposit_paid,production,shipped,arrived,installed,completed)&order=created_at.desc&limit=500') || [];
      setCases(data);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  /* ── Compute totals ── */
  let totalAmt = 0;
  let collected = 0;
  cases.forEach(c => {
    totalAmt += (c.total_with_tax || c.official_price || 0);
    if (c.measure_fee && c.measure_fee_paid_at) collected += c.measure_fee;
    if (c.deposit_50 && c.deposit_50_paid_at) collected += c.deposit_50;
    if (c.balance && c.balance_paid_at) collected += c.balance;
  });

  /* ── Payment status helper ── */
  function payItem(value, paid) {
    return (
      <span style={{ color: paid ? 'var(--success)' : 'var(--text-muted)' }}>
        {fmtPrice(value)}{paid ? ' ✓' : ''}
      </span>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">收款追蹤</div>
          <div className="page-subtitle">訂金、丈量費、尾款收款狀況</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 重新載入</button>
      </div>

      {/* Stats */}
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="案件數" value={cases.length} />
        <StatCard label="總營收" value={fmtPrice(totalAmt)} />
        <StatCard label="已收款" value={fmtPrice(collected)} color="var(--success)" />
        <StatCard label="未收款" value={fmtPrice(totalAmt - collected)} color="var(--danger)" style={{ borderColor: 'rgba(239,68,68,.3)' }} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : cases.length === 0 ? (
        <div className="empty"><div className="icon">✔</div>無資料</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>案件編號</th>
                <th>客戶</th>
                <th>總金額</th>
                <th>丈量費</th>
                <th>訂金 50%</th>
                <th>尾款</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => {
                const total = c.total_with_tax || c.official_price || 0;
                const mfee = c.measure_fee || 0;
                const dep = c.deposit_50 || 0;
                const bal = c.balance || (total - dep - mfee);
                const mPaid = !!c.measure_fee_paid_at;
                const dPaid = !!c.deposit_50_paid_at;
                const bPaid = !!c.balance_paid_at;
                const allPaid = total > 0 && mPaid && dPaid && bPaid;

                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: 11 }}>{c.order_no || c.case_no || '—'}</td>
                    <td>{c.customer_name || '—'}</td>
                    <td className="price" style={{ color: 'var(--gold)' }}>{fmtPrice(total)}</td>
                    <td>{payItem(mfee, mPaid)}</td>
                    <td>{payItem(dep, dPaid)}</td>
                    <td>{payItem(bal, bPaid)}</td>
                    <td>
                      {allPaid
                        ? <span className="badge badge-active">已付清</span>
                        : <span className="badge badge-inactive">未付清</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
