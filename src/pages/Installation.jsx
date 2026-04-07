import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, fmtPrice, CASE_STATUS_LABEL, CASE_STATUS_COLOR } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import StatCard from '../components/UI/StatCard';

function fmtD(d) { return d ? new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : '—'; }

export default function Installation() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      // 拉出所有已付款的案件（deposit_paid 之後的狀態）
      const cases = await sbFetch('cases?select=*&status=in.(deposit_paid,production,shipped,arrived,installed)&order=install_date.asc.nullslast,created_at.desc&limit=300') || [];
      setData(cases);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveInstallDate(caseId) {
    if (!editDate) { toast('請選擇安裝日期', 'error'); return; }
    try {
      await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify({ install_date: editDate, updated_at: new Date().toISOString() }) });
      toast('安裝日期已設定', 'success');
      setEditingId(null);
      setEditDate('');
      load();
    } catch (e) { toast('設定失敗: ' + e.message, 'error'); }
  }

  async function clearInstallDate(caseId) {
    confirm('取消安裝排程', '確定要清除安裝日期？', async () => {
      try {
        await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify({ install_date: null, updated_at: new Date().toISOString() }) });
        toast('已清除安裝日期', 'success');
        load();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  async function markInstalled(caseId) {
    confirm('確認安裝完成', '確定標記為已安裝？', async () => {
      try {
        await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify({ status: 'installed', updated_at: new Date().toISOString() }) });
        toast('已標記安裝完成', 'success');
        load();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  // Stats
  const noDate = data.filter(c => !c.install_date && c.status !== 'installed');
  const scheduled = data.filter(c => c.install_date && c.status !== 'installed');
  const installed = data.filter(c => c.status === 'installed');
  const overdue = scheduled.filter(c => new Date(c.install_date) < new Date() && c.status !== 'installed');

  // Filter
  let filtered = data;
  if (filter === 'nodate') filtered = noDate;
  if (filter === 'scheduled') filtered = scheduled;
  if (filter === 'installed') filtered = installed;
  if (filter === 'overdue') filtered = overdue;

  const filterBtn = (label, val, color) => {
    const on = filter === val;
    return (
      <button key={val} onClick={() => setFilter(val)} style={{
        padding: '5px 11px', borderRadius: 6,
        border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
        background: on ? 'var(--gold-dim)' : 'var(--surface-2)',
        color: on ? (color || 'var(--gold)') : 'var(--text-muted)',
        fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
        fontWeight: on ? 700 : 500
      }}>{label}</button>
    );
  };

  // Sort: overdue first, then by install_date, then no-date at bottom
  const sorted = [...filtered].sort((a, b) => {
    const aInst = a.status === 'installed' ? 2 : a.install_date ? 0 : 1;
    const bInst = b.status === 'installed' ? 2 : b.install_date ? 0 : 1;
    if (aInst !== bInst) return aInst - bInst;
    if (a.install_date && b.install_date) return new Date(a.install_date) - new Date(b.install_date);
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">安裝排程</div>
          <div className="page-subtitle">所有已付款案件 — 排定安裝日期</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 更新</button>
      </div>

      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="未排程" value={noDate.length} color={noDate.length ? 'var(--danger)' : undefined} />
        <StatCard label="已排程" value={scheduled.length} color="var(--gold)" />
        <StatCard label="已安裝" value={installed.length} color="var(--success)" />
        {overdue.length > 0 && <StatCard label="逾期未裝" value={overdue.length} color="var(--danger)" style={{ borderColor: 'rgba(239,68,68,.3)' }} />}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {filterBtn(`全部 (${data.length})`, 'all')}
        {filterBtn(`未排程 (${noDate.length})`, 'nodate', 'var(--danger)')}
        {filterBtn(`已排程 (${scheduled.length})`, 'scheduled')}
        {filterBtn(`已安裝 (${installed.length})`, 'installed', 'var(--success)')}
        {overdue.length > 0 && filterBtn(`逾期 (${overdue.length})`, 'overdue', 'var(--danger)')}
      </div>

      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>單號</th><th>客戶</th><th>業務</th><th>狀態</th><th>金額</th><th>地址</th><th>安裝日期</th><th>操作</th>
            </tr></thead>
            <tbody>
              {sorted.length === 0 ? <tr><td colSpan="8"><div className="empty"><div className="icon">🔧</div>無案件</div></td></tr> :
                sorted.map(c => {
                  const st = CASE_STATUS_COLOR[c.status] || CASE_STATUS_COLOR.new;
                  const isOverdue = c.install_date && new Date(c.install_date) < new Date() && c.status !== 'installed';
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} style={{ background: isOverdue ? 'rgba(239,68,68,.04)' : undefined, boxShadow: isOverdue ? 'inset 3px 0 0 var(--danger)' : undefined }}>
                      <td><strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.formal_quote_no || c.order_no || c.case_no || '—'}</strong></td>
                      <td>
                        {c.customer_name || '—'}
                        {c.customer_phone && <a href={`tel:${c.customer_phone}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 11, marginLeft: 6 }} title={c.customer_phone}>📞</a>}
                      </td>
                      <td style={{ fontSize: 12 }}>{c.sales_person || '—'}</td>
                      <td><span className="badge" style={{ background: st.bg, color: st.color }}>{CASE_STATUS_LABEL[c.status] || c.status}</span></td>
                      <td className="price">{fmtPrice(c.total_with_tax || c.official_price)}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.case_address || c.customer_addr || ''}>{c.case_address || c.customer_addr || '—'}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                              style={{ padding: '4px 8px', border: '1px solid var(--gold)', borderRadius: 4, fontSize: 11, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }} />
                            <button onClick={() => saveInstallDate(c.id)} style={{ background: 'var(--gold)', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, color: '#3d2e00', cursor: 'pointer' }}>確定</button>
                            <button onClick={() => { setEditingId(null); setEditDate(''); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>取消</button>
                          </div>
                        ) : c.status === 'installed' ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 12 }}>{c.install_date ? fmtD(c.install_date) + ' ✓' : '已安裝'}</span>
                        ) : c.install_date ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 12, color: isOverdue ? 'var(--danger)' : 'var(--text)' }}>{fmtD(c.install_date)}{isOverdue ? ' ⚠' : ''}</span>
                            <button onClick={() => { setEditingId(c.id); setEditDate(c.install_date ? c.install_date.slice(0, 10) : ''); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 10 }}>改</button>
                            <button onClick={() => clearInstallDate(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10 }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditDate(''); }}
                            style={{ background: 'transparent', border: '1px dashed var(--gold)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>
                            + 排程
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {c.install_date && c.status !== 'installed' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => markInstalled(c.id)} style={{ fontSize: 10, borderColor: 'var(--success)', color: 'var(--success)' }}>完成安裝</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
