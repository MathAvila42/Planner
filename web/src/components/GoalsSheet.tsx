import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { COLORS } from '../theme';

export default function GoalsSheet({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { data: goals } = useQuery({ queryKey: queryKeys.goals, queryFn: api.getGoals });

  if (!goals) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,30,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: '28px 28px 0 0', padding: '22px 22px 34px' }}
      >
        <div style={{ width: 36, height: 4, background: '#E0E1E5', borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.orange, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {goals.project}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, margin: '8px 0 18px' }}>
          Jornada de 6 meses com metas mensais realistas.
        </div>

        {goals.timeline.map((g, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: 600 }}>{g.month}</div>
            <div style={{ fontSize: 13, color: COLORS.timelineFoco, marginTop: 2 }}>{g.foco}</div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, background: COLORS.navyLight, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.navyLightText, fontWeight: 700, textTransform: 'uppercase' }}>Água / dia</div>
            <div style={{ fontSize: 16, color: COLORS.navy, fontWeight: 700, marginTop: 3 }}>{goals.water}</div>
          </div>
          <div style={{ flex: 1, background: COLORS.orangeLight, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.orangeLightText, fontWeight: 700, textTransform: 'uppercase' }}>Proteína / dia</div>
            <div style={{ fontSize: 16, color: COLORS.orange, fontWeight: 700, marginTop: 3 }}>{goals.protein}</div>
          </div>
        </div>

        <div onClick={onLogout} style={{ textAlign: 'center', fontSize: 14, color: COLORS.danger, fontWeight: 600, marginTop: 24, cursor: 'pointer' }}>
          Sair da conta
        </div>
      </div>
    </div>
  );
}
