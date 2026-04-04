import { useState, useEffect, useRef } from 'react';
import { sbFetch, proxyCount } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR, CASE_STEPS, CTYPE_SHORT } from '../api/utils';
import StatCard from '../components/UI/StatCard';
import Chart from 'chart.js/auto';

function calcDelay(c) {
  if (c.status === 'completed' || c.status === 'cancelled') return { delayed: false, days: 0, milestone: '' };
  const now = new Date();
  const statusIdx = CASE_STEPS.indexOf(c.status);
  if (c.estimated_arrival && !c.actual_arrival && statusIdx >= CASE_STEPS.indexOf('production')) {
    const est = new Date(c.estimated_arrival);
    if (now > est) return { delayed: true, days: Math.ceil((now - est) / 86400000), milestone: '到倉過期' };
  }
  if (c.order_date && !c.install_date && statusIdx >= CASE_STEPS.indexOf('deposit_paid')) {
    const target = new Date(c.order_date);
    target.setDate(target.getDate() + 60);
    if (now > target) return { delayed: true, days: Math.ceil((now - target) / 86400000), milestone: '安裝過期' };
  }
  const thresholds = { new: 14, measure_scheduled: 14, measured: 10, official_quoted: 14, order_confirmed: 7, deposit_paid: 7, production: 45, shipped: 21, arrived: 14 };
  const threshold = thresholds[c.status] || 30;
  const lastUpdate = c.updated_at || c.created_at;
  if (lastUpdate) {
    const diff = Math.ceil((now - new Date(lastUpdate)) / 86400000);
    if (diff > threshold) return { delayed: true, days: diff - threshold, milestone: (CASE_STATUS_LABEL[c.status] || '') + '停滯' };
  }
  return { delayed: false, days: 0, milestone: '' };
}

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const statusChartRef = useRef(null);
  const salesChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const charts = useRef({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await sbFetch('cases?select=*&status=not.in.(completed,cancelled)&order=created_at.desc&limit=200');
      setCases(data || []);
      renderCharts(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function renderCharts(data) {
    Object.values(charts.current).forEach(c => c.destroy());
    charts.current = {};
    // Status doughnut
    if (statusChartRef.current) {
      const counts = {};
      data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
      const statusColors = { new: '#c9a227', measure_scheduled: '#3b82f6', measured: '#10b981', official_quoted: '#8b5cf6', order_confirmed: '#f59e0b', deposit_paid: '#10b981', production: '#3b82f6', shipped: '#f59e0b', arrived: '#c9a227', installed: '#22c55e', completed: '#10b981', cancelled: '#ef4444' };
      charts.current.status = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: { labels: Object.keys(counts).map(k => CASE_STATUS_LABEL[k] || k), datasets: [{ data: Object.values(counts), backgroundColor: Object.keys(counts).map(k => statusColors[k] || '#666'), borderWidth: 0 }] },
        options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#99907b', font: { size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 10 } } } }
      });
    }
    // Sales bar
    if (salesChartRef.current) {
      const salesMap = {};
      data.forEach(c => { const n = c.sales_person || '未指定'; salesMap[n] = (salesMap[n] || 0) + 1; });
      const sorted = Object.entries(salesMap).sort((a, b) => b[1] - a[1]);
      charts.current.sales = new Chart(salesChartRef.current, {
        type: 'bar',
        data: { labels: sorted.map(s => s[0]), datasets: [{ data: sorted.map(s => s[1]), backgroundColor: 'rgba(201,162,39,0.6)', borderColor: '#c9a227', borderWidth: 1, borderRadius: 4, barThickness: 28 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(77,70,53,0.15)' }, ticks: { color: '#99907b' } }, y: { grid: { display: false }, ticks: { color: '#e5e2e1', font: { size: 12 } } } } }
      });
    }
    // Revenue
    if (revenueChartRef.current) {
      sbFetch('cases?select=total_with_tax,official_price,quoted_price,created_at,status&order=created_at.asc&limit=500').then(all => {
        const monthMap = {};
        (all || []).forEach(c => {
          if (c.status === 'cancelled') return;
          const m = (c.created_at || '').slice(0, 7);
          if (!m) return;
          monthMap[m] = (monthMap[m] || 0) + (c.total_with_tax || c.official_price || c.quoted_price || 0);
        });
        const months = Object.keys(monthMap).sort().slice(-12);
        charts.current.revenue = new Chart(revenueChartRef.current, {
          type: 'bar',
          data: { labels: months.map(m => m.split('-')[1] + '月'), datasets: [{ data: months.map(m => monthMap[m]), backgroundColor: 'rgba(201,162,39,0.25)', borderColor: '#c9a227', borderWidth: 1.5, borderRadius: 6 }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#99907b' } }, y: { grid: { color: 'rgba(77,70,53,0.12)' }, ticks: { color: '#99907b', callback: v => v >= 10000 ? (v / 10000).toFixed(0) + '萬' : v } } } }
        });
      });
    }
  }

  const stats = {
    active: cases.length,
    ontime: cases.filter(c => !calcDelay(c).delayed).length,
    delayed: cases.filter(c => calcDelay(c).delayed).length,
    pendingMeasure: cases.filter(c => ['new', 'measure_scheduled'].includes(c.status)).length,
    pendingInstall: cases.filter(c => ['shipped', 'arrived'].includes(c.status)).length,
  };

  const delayed = cases.filter(c => calcDelay(c).delayed).sort((a, b) => calcDelay(b).days - calcDelay(a).days);

  let filtered = [...cases];
  if (filter === 'delayed') filtered = filtered.filter(c => calcDelay(c).delayed);
  else if (filter === 'measure') filtered = filtered.filter(c => ['new', 'measure_scheduled', 'measured', 'official_quoted'].includes(c.status));
  else if (filter === 'production') filtered = filtered.filter(c => ['order_confirmed', 'deposit_paid', 'production'].includes(c.status));
  else if (filter === 'shipping') filtered = filtered.filter(c => ['shipped', 'arrived'].includes(c.status));

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">儀表板</div>
          <div className="page-subtitle">案件進度追蹤與營運數據</div>
        </div>
        <button className="btn btn-primary" onClick={loadData}>↻ 更新數據</button>
      </div>

      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="進行中" value={stats.active} />
        <StatCard label="正常" value={stats.ontime} color="var(--success)" />
        <StatCard label="延遲中" value={stats.delayed} color="var(--danger)" style={{ borderColor: 'rgba(239,68,68,.3)' }} />
        <StatCard label="待丈量" value={stats.pendingMeasure} />
        <StatCard label="待安裝" value={stats.pendingInstall} />
      </div>

      {delayed.length > 0 ? (
        <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>⚠ {delayed.length} 件案件延遲中</div>
          {delayed.slice(0, 5).map(c => {
            const d = calcDelay(c);
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700, minWidth: 60 }}>延遲{d.days}天</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.order_no || c.case_no}</span>
                <span>{c.customer_name || ''}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{d.milestone}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 'var(--radius)', marginBottom: 20, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
          ✔ 所有案件進度正常，無延遲
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} id="db-charts-row">
        <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>案件狀態分布</div>
          <div style={{ maxWidth: 260, margin: '0 auto' }}><canvas ref={statusChartRef} /></div>
        </div>
        <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>業務人員案件數</div>
          <canvas ref={salesChartRef} style={{ maxHeight: 220 }} />
        </div>
      </div>
      <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>月度營收趨勢</div>
        <canvas ref={revenueChartRef} style={{ maxHeight: 240 }} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>案件進度追蹤</div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '7px 32px 7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <option value="all">全部進行中</option>
          <option value="delayed">僅延遲</option>
          <option value="measure">待丈量/報價</option>
          <option value="production">製作中</option>
          <option value="shipping">待到倉/安裝</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty"><div className="icon">✔</div>無符合條件的案件</div>
      ) : (
        filtered.map(c => {
          const d = calcDelay(c);
          const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
          const pct = c.status === 'cancelled' ? 0 : Math.round((CASE_STEPS.indexOf(c.status) / (CASE_STEPS.length - 1)) * 100);
          const price = c.total_with_tax ? fmtPrice(c.total_with_tax) : c.official_price ? fmtPrice(c.official_price) : c.quoted_price ? fmtPrice(c.quoted_price) : '';
          const timeDots = [['丈量', c.measure_date], ['下單', c.order_date], ['到倉', c.actual_arrival || c.estimated_arrival], ['安裝', c.install_date]];
          return (
            <div key={c.id} style={{ border: `1px solid ${d.delayed ? 'rgba(239,68,68,.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', marginBottom: 10, background: 'var(--surface-low)', cursor: 'pointer' }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no || ''}</strong>
                <span style={{ fontSize: 13 }}>{c.customer_name || ''}</span>
                {c.sales_person && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.sales_person}</span>}
                {c.customer_type && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'var(--surface-high)', color: 'var(--text-muted)' }}>{CTYPE_SHORT[c.customer_type] || c.customer_type}</span>}
                <span style={{ marginLeft: 'auto' }}><span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status] || c.status}</span></span>
                {d.delayed && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>延遲{d.days}天 ({d.milestone})</span>}
              </div>
              <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-high)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: d.delayed ? 'var(--danger)' : 'var(--success)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
              <div style={{ padding: '4px 16px 12px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {timeDots.map(([label, date]) => (
                  <div key={label} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: date ? '#10b981' : 'var(--surface-high)', border: `1px solid ${date ? '#10b981' : 'var(--text-muted)'}` }} />
                    <span style={{ color: date ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
                    {date && <span style={{ color: 'var(--text-muted)' }}>{new Date(date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}</span>}
                  </div>
                ))}
                {price && <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{price}</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
