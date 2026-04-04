import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

export default function Installation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(arrived,installed)&order=install_date.asc.nullslast&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const pending = data.filter(c => !c.install_date).length;
  const installed = data.filter(c => c.status === 'installed').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">安裝排程</div><div className="page-subtitle">到倉後安排安裝時間</div></div>
        <button className="btn btn-primary" onClick={load}>↻ 更新</button>
      </div>
      <div className="stats">
        <StatCard label="待安裝" value={pending} color="var(--danger)" />
        <StatCard label="已排程" value={data.length - pending - installed} />
        <StatCard label="已安裝" value={installed} color="var(--success)" />
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.length === 0 ? <div className="empty"><div className="icon">🔧</div>無待安裝案件</div> :
            data.map(c => {
              const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
              return (
                <div key={c.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 14, border: `1px solid ${!c.install_date && c.status !== 'installed' ? 'rgba(239,68,68,.3)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_no || c.case_no}</strong> <span style={{ marginLeft: 8 }}>{c.customer_name || '—'}</span></div>
                    <span className="badge" style={{ background: st.bg, color: st.color }}>{c.status === 'installed' ? '已安裝' : c.install_date ? '已排程' : '待安排'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>到倉日: {c.actual_arrival ? fmtDate(c.actual_arrival).split(' ')[0] : '—'}</span>
                    <span>安裝日: <strong style={{ color: c.install_date ? 'var(--text)' : 'var(--danger)' }}>{c.install_date ? fmtDate(c.install_date).split(' ')[0] : '未安排'}</strong></span>
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
