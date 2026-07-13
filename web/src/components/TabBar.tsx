import { COLORS } from '../theme';
import type { Tab } from '../AppShell';

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Hoje' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'meals', label: 'Refeições' },
];

export default function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${COLORS.divider}`, background: 'rgba(255,255,255,0.92)', padding: '12px 12px' }}>
      {TABS.map((t) => (
        <div key={t.key} onClick={() => onChange(t.key)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: tab === t.key ? COLORS.navy : COLORS.textTertiary }}>
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}
