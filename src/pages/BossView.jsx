import { useState, useEffect, useCallback } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice, CASE_STATUS_LABEL, CASE_STEPS } from '../api/utils';
import StatCard from '../components/UI/StatCard';
import { useToast } from '../components/UI/Toast';

/* ── delay calc (same logic as Dashboard.jsx / admin.html calcCaseDelay) ── */
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

function fmtD(d) {
  return d ? new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : '—';
}

export default function BossView() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sbFetch('cases?select=*&status=not.eq.cancelled&order=created_at.desc&limit=500') || [];
      setAll(data);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  /* ── derived data ── */
  const confirmed = all.filter(c => ['order_confirmed', 'deposit_paid', 'production', 'shipped', 'arrived', 'installed', 'completed'].includes(c.status));
  const preCases = all.filter(c => ['new', 'measure_scheduled', 'measured', 'official_quoted'].includes(c.status));
  const active = confirmed.filter(c => c.status !== 'completed');
  const completedCases = confirmed.filter(c => c.status === 'completed');
  const delayed = active.filter(c => calcDelay(c).delayed);
  let totalRev = 0;
  confirmed.forEach(c => { totalRev += (c.total_with_tax || c.official_price || 0); });
  const unpaid = confirmed.filter(c => !c.balance_paid_at && c.status !== 'completed' && (c.total_with_tax || c.official_price));

  /* pipeline steps */
  const steps = [
    { label: '待丈量', count: all.filter(c => c.status === 'new' || c.status === 'measure_scheduled').length },
    { label: '製圖中', count: all.filter(c => c.status === 'measured').length },
    { label: '待報價回覆', count: all.filter(c => c.status === 'official_quoted').length },
    { label: '待下單', count: confirmed.filter(c => c.status === 'deposit_paid' && !c.internal_order_date).length },
    { label: '生產中', count: all.filter(c => c.status === 'production' || c.status === 'shipped').length },
    { label: '待安裝', count: all.filter(c => c.status === 'arrived').length }
  ];

  /* sales summary */
  const salesMap = {};
  all.forEach(c => {
    const n = c.sales_person || '未指派';
    if (!salesMap[n]) salesMap[n] = { active: 0, completed: 0 };
    if (c.status === 'completed') salesMap[n].completed++;
    else salesMap[n].active++;
  });

  /* production cases */
  const prodCases = all.filter(c => c.status === 'production' || c.status === 'shipped');

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">老闆管理看板</div>
          <div className="page-subtitle">KPI 總覽與關鍵指標</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 更新數據</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : (
        <>
          {/* ── Urgent alert — TOP ── */}
          {delayed.length > 0 && (
            <div style={{ borderLeft: '3px solid var(--danger)', borderRadius: 'var(--radius)', background: 'rgba(239,68,68,.04)', padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: 22, fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>需立即處理 — {delayed.length} 件逾期</span>
              </div>
              {delayed.slice(0, 5).map(c => {
                const d = calcDelay(c);
                return (
                  <div key={c.id} style={{ padding: '4px 0', display: 'flex', gap: 10, borderBottom: '1px solid rgba(239,68,68,.1)' }}>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.order_no || c.case_no}</span>
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.customer_name || ''}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 12 }}>{d.milestone} {d.days}天</span>
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{fmtPrice(c.total_with_tax || c.official_price || 0)}</span>
                  </div>
                );
              })}
              {delayed.length > 5 && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>...另有 {delayed.length - 5} 件</div>}
            </div>
          )}

          {/* ── KPI Stats ── */}
          <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            <StatCard label="前置作業" value={preCases.length} icon="pending_actions" />
            <StatCard label="進行中" value={active.length} color="var(--gold)" icon="play_circle" />
            <StatCard label="逾期" value={delayed.length} color="var(--danger)" style={{ borderColor: 'rgba(239,68,68,.3)' }} icon="warning" />
            <StatCard label="已結案" value={completedCases.length} color="var(--success)" icon="check_circle" />
            <StatCard label="總營收" value={fmtPrice(totalRev)} icon="payments" />
          </div>

          {/* ── Status banner ── */}
          {delayed.length === 0 && (
            <div style={{ padding: '10px 16px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 'var(--radius)', color: '#10b981', fontWeight: 600, fontSize: 13, marginBottom: 20 }}>
              ✔ 所有案件進度正常
            </div>
          )}

          {/* ── Two-column layout ── */}
          <div className="boss-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Pipeline steps */}
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>各階段案件數</div>
              {steps.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{s.count}</span>
                </div>
              ))}
            </div>

            {/* Sales summary */}
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>業務人員統計</div>
              {Object.keys(salesMap).length > 0 ? Object.entries(salesMap).map(([name, s]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{name}</span>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>進行 {s.active}</span>
                  <span style={{ fontSize: 12, color: 'var(--success)' }}>結案 {s.completed}</span>
                </div>
              )) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>無資料</div>
              )}
            </div>
          </div>

          {/* ── Two-column: Unpaid + Production ── */}
          <div className="boss-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Unpaid */}
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>未收款案件</div>
              {unpaid.length > 0 ? unpaid.slice(0, 8).map(c => {
                const total = c.total_with_tax || c.official_price || 0;
                const paid = (c.deposit_50 || 0) + (c.measure_fee || 0);
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.order_no || c.case_no}</span>
                    <span style={{ flex: 1 }}>{c.customer_name || ''}</span>
                    <span style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>未收 {fmtPrice(total - paid)}</span>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--success)', fontSize: 13 }}>全部已收</div>
              )}
            </div>

            {/* Production */}
            <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>生產進度</div>
              {prodCases.length > 0 ? prodCases.slice(0, 8).map(c => {
                const estStr = c.estimated_arrival ? fmtD(c.estimated_arrival) : '未定';
                const factory = c.factory_type === 'tw' ? '台廠' : c.factory_type === 'cn' ? '陸廠' : '—';
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.order_no || c.case_no}</span>
                    <span style={{ flex: 1 }}>{c.customer_name || ''}</span>
                    {c.is_fireproof && <span style={{ fontSize: 10, color: 'var(--danger)' }}>防火</span>}
                    <span style={{ fontSize: 11 }}>{factory}</span>
                    <span style={{ fontSize: 12, color: 'var(--gold)' }}>到倉 {estStr}</span>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>無生產中案件</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
