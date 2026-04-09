import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ label, value, color, icon, style }) {
  return (
    <Card className="stat-card" style={style}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {icon && <span className="material-symbols-outlined" style={{ fontSize: 14, color: color || 'inherit' }}>{icon}</span>}
          {label}
        </div>
        <div className="text-2xl font-bold mt-1" style={color ? { color } : undefined}>{value ?? '—'}</div>
      </CardContent>
    </Card>
  );
}
