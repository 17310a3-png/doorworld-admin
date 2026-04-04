export default function StatCard({ label, value, color, style }) {
  return (
    <div className="stat-card" style={style}>
      <div className="label">{label}</div>
      <div className="value" style={color ? { color } : undefined}>{value ?? '—'}</div>
    </div>
  );
}
