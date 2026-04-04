import { useState, useEffect, useCallback } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import StatCard from '../components/UI/StatCard';
import { useToast } from '../components/UI/Toast';

/* ── helper: short date ── */
function fmtD(d) {
  return d ? new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : '—';
}

/* ── Pipeline configurations (mirrors admin.html PIPELINE_CONFIGS) ── */
const PIPELINE_CONFIGS = {
  measurement: {
    title: '丈量安排',
    subtitle: '待丈量 & 已排丈量案件追蹤',
    statuses: 'new,measure_scheduled',
    stats: [
      { label: '待排丈量', filter: c => c.status === 'new' },
      { label: '已排丈量', filter: c => c.status === 'measure_scheduled' },
      {
        label: '本週丈量', filter: c => {
          if (!c.measure_date) return false;
          const d = new Date(c.measure_date), now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + (7 - now.getDay()));
          return d >= now && d <= weekEnd;
        }
      }
    ],
    renderCard: c => {
      const dateStr = c.measure_date ? fmtD(c.measure_date) : '未排';
      const staffStr = c.measure_staff || '未指派';
      const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
      return (
        <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface-low)', marginBottom: 8 }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
            <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no || '—'}</strong>
            <span>{c.customer_name || '—'}</span>
            {c.sales_person && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.sales_person}</span>}
            <span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status] || c.status}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>丈量日</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.measure_date ? 'var(--gold)' : 'var(--text-muted)' }}>{dateStr}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>人員</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{staffStr}</div>
              </div>
              {c.case_address && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.case_address}>{c.case_address}</div>
              )}
            </div>
          </div>
        </div>
      );
    }
  },

  drafting: {
    title: '製圖',
    subtitle: '丈量完成、等待製圖出圖',
    statuses: 'measured',
    stats: [
      { label: '待製圖', filter: c => c.status === 'measured' && !c.official_price },
      { label: '已出圖報價', filter: c => c.status === 'measured' && !!c.official_price },
      {
        label: '逾期(>3天)', danger: true, filter: c => {
          if (!c.measured_at) return false;
          const diff = (new Date() - new Date(c.measured_at)) / 86400000;
          return diff > 3 && !c.official_price;
        }
      }
    ],
    renderCard: c => {
      const measuredDate = c.measured_at ? new Date(c.measured_at) : null;
      const daysSince = measuredDate ? Math.floor((new Date() - measuredDate) / 86400000) : null;
      const overdue = daysSince !== null && daysSince > 3 && !c.official_price;
      const borderColor = overdue ? 'rgba(239,68,68,.4)' : 'var(--border)';
      const sizeStr = c.actual_width_cm && c.actual_height_cm ? `${c.actual_width_cm}×${c.actual_height_cm}cm` : '—';
      return (
        <div key={c.id} style={{ border: `1px solid ${borderColor}`, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface-low)', cursor: 'pointer', marginBottom: 8 }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no || '—'}</strong>
            <span>{c.customer_name || '—'}</span>
            {c.product_code && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.product_code}</span>}
            {overdue && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>逾期 {daysSince} 天</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>實測尺寸</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{sizeStr}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>丈量完成</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{measuredDate ? `${Math.floor(daysSince)}天前` : '—'}</div>
              </div>
              {c.official_price && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>報價</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{fmtPrice(c.official_price)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  },

  installation: {
    title: '安裝排程',
    subtitle: '已到倉 & 安裝進度追蹤',
    statuses: 'arrived,installed',
    stats: [
      { label: '待排安裝', filter: c => c.status === 'arrived' && !c.install_date },
      { label: '已排安裝', filter: c => c.status === 'arrived' && !!c.install_date },
      {
        label: '到倉超7天未排', danger: true, filter: c => {
          if (c.status !== 'arrived' || c.install_date) return false;
          if (!c.actual_arrival) return false;
          return (new Date() - new Date(c.actual_arrival)) / 86400000 > 7;
        }
      },
      { label: '已安裝', filter: c => c.status === 'installed' },
      {
        label: '本週安裝', filter: c => {
          if (!c.install_date) return false;
          const d = new Date(c.install_date), now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + (7 - now.getDay()));
          return d >= now && d <= weekEnd;
        }
      }
    ],
    renderCard: c => {
      const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
      const installStr = c.install_date ? fmtD(c.install_date) : '未排';
      const arrivalStr = c.actual_arrival ? fmtD(c.actual_arrival) + ' 到倉' : '';
      const arrivedDays = c.actual_arrival && c.status === 'arrived' && !c.install_date ? Math.floor((new Date() - new Date(c.actual_arrival)) / 86400000) : 0;
      const arrivalOverdue = arrivedDays > 7;
      return (
        <div key={c.id} style={{
          border: `1px solid ${arrivalOverdue ? 'rgba(239,68,68,.4)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', overflow: 'hidden',
          background: arrivalOverdue ? 'rgba(239,68,68,.04)' : 'var(--surface-low)',
          cursor: 'pointer', marginBottom: 8
        }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no || '—'}</strong>
            <span>{c.customer_name || '—'}</span>
            <span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status] || c.status}</span>
            {arrivalOverdue
              ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>到倉 {arrivedDays} 天未排安裝</span>
              : arrivalStr && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{arrivalStr}</span>
            }
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>安裝日</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.install_date ? 'var(--gold)' : arrivalOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>{installStr}</div>
              </div>
              {c.case_address && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.case_address}>{c.case_address}</div>
              )}
            </div>
          </div>
        </div>
      );
    }
  }
};

/* ── Main component ── */
export default function PipelinePage({ pipelineKey }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const config = PIPELINE_CONFIGS[pipelineKey];

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const data = await sbFetch(`cases?select=*&status=in.(${config.statuses})&order=created_at.desc&limit=200`) || [];
      setCases(data);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }, [config, toast]);

  useEffect(() => { load(); }, [load]);

  if (!config) return <div className="empty"><div className="icon">?</div>未知的流水線: {pipelineKey}</div>;

  /* Compute stat counts */
  const statCounts = config.stats.map(s => ({
    label: s.label,
    count: cases.filter(s.filter).length,
    danger: s.danger
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">{config.title}</div>
          <div className="page-subtitle">{config.subtitle}</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 重新載入</button>
      </div>

      {/* Stats row */}
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: `repeat(${statCounts.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
        {statCounts.map(s => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.count}
            color={s.danger && s.count > 0 ? 'var(--danger)' : undefined}
            style={s.danger && s.count > 0 ? { borderColor: 'rgba(239,68,68,.3)' } : undefined}
          />
        ))}
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : cases.length === 0 ? (
        <div className="empty"><div className="icon">✔</div>目前沒有案件在此階段</div>
      ) : (
        cases.map(c => config.renderCard(c))
      )}
    </div>
  );
}
