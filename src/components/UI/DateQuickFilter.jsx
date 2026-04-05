// Date range filter with quick presets (本週 / 本月 / 近 7 天)
// Returns ISO date strings for `from` and `to`

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function startOfMonth(d) {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}
function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(0, 0, 0, 0);
  return date;
}
function fmtISO(d) { return d.toISOString().slice(0, 10); }

export const DATE_PRESETS = {
  week: { label: '本週', getFrom: () => fmtISO(startOfWeek(new Date())), getTo: () => '' },
  month: { label: '本月', getFrom: () => fmtISO(startOfMonth(new Date())), getTo: () => '' },
  last7: { label: '近 7 天', getFrom: () => fmtISO(daysAgo(7)), getTo: () => '' },
  last30: { label: '近 30 天', getFrom: () => fmtISO(daysAgo(30)), getTo: () => '' }
};

export default function DateQuickFilter({ from, to, onChange, activePreset, onPresetChange, compact }) {
  const presetBtn = (key, label) => {
    const on = activePreset === key;
    return (
      <button key={key} onClick={() => {
        const p = DATE_PRESETS[key];
        onChange(p.getFrom(), p.getTo());
        onPresetChange?.(key);
      }} style={{
        padding: compact ? '4px 9px' : '5px 11px', borderRadius: 6,
        border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
        background: on ? 'var(--gold-dim)' : 'var(--surface-2)',
        color: on ? 'var(--gold)' : 'var(--text-muted)',
        fontSize: compact ? 11 : 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
        fontWeight: on ? 700 : 500
      }}>{label}</button>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {Object.entries(DATE_PRESETS).map(([k, v]) => presetBtn(k, v.label))}
      <input type="date" value={from || ''} onChange={e => { onChange(e.target.value, to); onPresetChange?.(null); }}
        style={{ padding: '5px 9px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>~</span>
      <input type="date" value={to || ''} onChange={e => { onChange(from, e.target.value); onPresetChange?.(null); }}
        style={{ padding: '5px 9px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }} />
      {(from || to) && <button onClick={() => { onChange('', ''); onPresetChange?.(null); }} style={{ padding: '4px 8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>清除</button>}
    </div>
  );
}
