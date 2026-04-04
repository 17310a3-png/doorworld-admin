import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function Measurement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(new,measure_scheduled,measured)&order=measure_date.asc.nullslast&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const scheduled = data.filter(c => c.measure_date).length;
  const done = data.filter(c => c.status === 'measured').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">丈量安排</div><div className="page-subtitle">管理現場丈量排程與勘查紀錄</div></div>
        <button className="btn btn-primary" onClick={load}>↻ 更新</button>
      </div>
      <div className="stats">
        <StatCard label="待安排" value={data.length - scheduled} color="var(--danger)" />
        <StatCard label="已排程" value={scheduled - done} />
        <StatCard label="丈量完成" value={done} color="var(--success)" />
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.length === 0 ? <div className="empty"><div className="icon">📏</div>無待丈量案件</div> :
            data.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              return (
                <div key={c.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 14, border: `1px solid ${!c.measure_date ? 'rgba(239,68,68,.3)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no}</strong> <span style={{ marginLeft: 8 }}>{c.customer_name || '—'}</span></div>
                    <span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>丈量日期: <strong style={{ color: c.measure_date ? 'var(--text)' : 'var(--danger)' }}>{c.measure_date ? fmtDate(c.measure_date).split(' ')[0] : '未安排'}</strong></span>
                    <span>人員: {c.measure_staff || '—'}</span>
                    <span>地址: {c.case_address || c.customer_addr || '—'}</span>
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
