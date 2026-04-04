import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtDate, fmtPrice } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import StatCard from '../components/UI/StatCard';

const STAGES = ['確定訂單', '精雕/蝕刻', '油漆/打印', '領料組裝', '驗收打包', '車間出貨'];
const STAGE_KEYS = ['cn_confirm_order', 'cn_engraving', 'cn_painting', 'cn_assembly', 'cn_inspection', 'cn_factory_ship'];
const STAGE_COLORS = ['#8b5cf6', '#f97316', '#eab308', '#3b82f6', '#ec4899', '#10b981'];

export default function ChinaFactory() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setData(await sbFetch('cases?select=*&status=in.(production,shipped)&factory_order_no=not.is.null&order=created_at.asc&limit=200') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getStageIdx(c) {
    for (let i = STAGE_KEYS.length - 1; i >= 0; i--) {
      if (c[STAGE_KEYS[i]]) return i;
    }
    return -1;
  }

  let filtered = data;
  if (filter === 'production') filtered = filtered.filter(c => c.status === 'production');
  if (filter === 'shipped') filtered = filtered.filter(c => c.status === 'shipped');
  if (filter === 'fire') filtered = filtered.filter(c => c.is_fireproof);

  const prodCount = data.filter(c => c.status === 'production').length;
  const shipCount = data.filter(c => c.status === 'shipped').length;
  const fireCount = data.filter(c => c.is_fireproof).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">大陸工廠</div><div className="page-subtitle">製作進度表（B表）— 確定訂單 → 精雕蝕刻 → 油漆 → 組裝 → 打包 → 出貨</div></div>
        <button className="btn btn-ghost" onClick={load}>↻ 更新</button>
      </div>
      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="全部" value={data.length} />
        <StatCard label="製作中" value={prodCount} />
        <StatCard label="已出貨" value={shipCount} color="var(--success)" />
        <StatCard label="防火門" value={fireCount} color="var(--danger)" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {[['全部', 'all'], ['製作中', 'production'], ['已出貨', 'shipped'], ['防火門', 'fire']].map(([l, v]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${filter === v ? 'var(--gold)' : 'var(--border)'}`, background: filter === v ? 'var(--gold-dim)' : 'var(--surface-2)', color: filter === v ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: filter === v ? 700 : 500 }}>{l}</button>
        ))}
      </div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>進度：</span>
        {STAGES.map((s, i) => (
          <span key={s} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[i], display: 'inline-block' }} />{s}
          </span>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        filtered.length === 0 ? <div className="empty"><div className="icon">🏭</div>無工廠資料</div> :
        <div className="table-wrap">
          <table>
            <thead><tr><th>下單編號</th><th>客戶</th><th>防火</th><th>進度</th><th>狀態</th><th>出貨日</th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const stIdx = getStageIdx(c);
                return (
                  <tr key={c.id}>
                    <td><strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.factory_order_no || c.order_no || c.case_no || '—'}</strong></td>
                    <td>{c.customer_name || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{c.is_fireproof ? '🔥' : ''}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {STAGES.map((s, i) => (
                          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                            {i > 0 && <div style={{ width: 8, height: 2, background: i <= stIdx ? '#10b981' : 'var(--surface-high)' }} />}
                            <div title={s} style={{ width: i === stIdx ? 20 : 16, height: i === stIdx ? 20 : 16, borderRadius: '50%', background: i < stIdx ? '#10b981' : i === stIdx ? STAGE_COLORS[i] : 'var(--surface-high)', color: i <= stIdx ? '#fff' : 'var(--text-muted)', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: i === stIdx ? `2px solid ${STAGE_COLORS[i]}` : 'none' }}>{i < stIdx ? '✓' : i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 11 }}>{stIdx >= 0 ? STAGES[stIdx] : '未開始'}</td>
                    <td style={{ fontSize: 12 }}>{c.cn_factory_ship ? fmtDate(c.cn_factory_ship).split(' ')[0] : '—'}</td>
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
