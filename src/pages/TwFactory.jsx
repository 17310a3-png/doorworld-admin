import { useState, useEffect, useCallback } from 'react';
import { sbFetch } from '../api/supabase';
import StatCard from '../components/UI/StatCard';
import { useToast } from '../components/UI/Toast';

function fmtD(d) {
  return d ? new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : '—';
}

export default function TwFactory() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sbFetch('cases?select=*&status=in.(shipped,arrived)&order=created_at.desc&limit=200') || [];
      setCases(data);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const processing = cases.filter(c => c.status === 'shipped');
  const done = cases.filter(c => c.status === 'arrived');

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">台灣工廠</div>
          <div className="page-subtitle">台灣加工 & 入倉追蹤</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 重新載入</button>
      </div>

      {/* Stats */}
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="加工中" value={processing.length} />
        <StatCard label="已完成入倉" value={done.length} color="var(--success)" />
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : cases.length === 0 ? (
        <div className="empty"><div className="icon">✔</div>目前無台灣加工中案件</div>
      ) : (
        cases.map(c => {
          const arrStr = c.actual_arrival
            ? fmtD(c.actual_arrival) + ' 已入倉'
            : c.estimated_arrival
              ? '預計 ' + fmtD(c.estimated_arrival)
              : '—';
          const st = c.status === 'arrived'
            ? { bg: 'rgba(16,185,129,.15)', color: '#10b981', label: '已入倉' }
            : { bg: 'rgba(59,130,246,.15)', color: '#3b82f6', label: '台灣加工中' };

          return (
            <div key={c.id} style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface-low)',
              cursor: 'pointer',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 8
            }}>
              <strong className="mono" style={{ fontSize: 12 }}>{c.order_no || c.case_no || '—'}</strong>
              <span style={{ fontWeight: 600 }}>{c.customer_name || '—'}</span>
              <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gold)' }}>{arrStr}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
