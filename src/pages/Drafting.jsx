import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function Drafting() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(measured,official_quoted)&order=measured_at.asc.nullslast&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const drafted = data.filter(c => c.drawing_note).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">製圖進度</div><div className="page-subtitle">丈量完成後 3 個工作天內完成圖面繪製</div></div>
        <button className="btn btn-primary" onClick={load}>↻ 更新</button>
      </div>
      <div className="stats">
        <StatCard label="待製圖" value={data.length - drafted} color="var(--danger)" />
        <StatCard label="製圖完成" value={drafted} color="var(--success)" />
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.length === 0 ? <div className="empty"><div className="icon">✏️</div>無待製圖案件</div> :
            data.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              const daysSinceMeasure = c.measured_at ? Math.ceil((Date.now() - new Date(c.measured_at).getTime()) / 86400000) : null;
              const overdue = daysSinceMeasure && daysSinceMeasure > 3 && !c.drawing_note;
              return (
                <div key={c.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 14, border: `1px solid ${overdue ? 'rgba(239,68,68,.3)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no}</strong> <span style={{ marginLeft: 8 }}>{c.customer_name || '—'}</span></div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {overdue && <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700 }}>逾期{daysSinceMeasure - 3}天</span>}
                      <span className="badge" style={{ background: c.drawing_note ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)', color: c.drawing_note ? '#10b981' : '#ef4444' }}>{c.drawing_note ? '已製圖' : '待製圖'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>丈量完成: {c.measured_at ? fmtDate(c.measured_at).split(' ')[0] : '—'}</span>
                    <span>實測尺寸: {c.actual_width_cm && c.actual_height_cm ? `${c.actual_width_cm} × ${c.actual_height_cm} cm` : '—'}</span>
                    <span>業務: {c.sales_person || '—'}</span>
                  </div>
                </div>
              );
            })}
        </div>
      }
    </div>
  );
}
