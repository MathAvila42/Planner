import type { MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { COLORS, SHADOW_CARD } from '../../theme';
import { DAY_LABELS_FULL } from '../../utils/date';

export default function WorkoutsList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const queryClient = useQueryClient();
  const { data: workouts = [] } = useQuery({ queryKey: queryKeys.workouts, queryFn: api.getWorkouts });

  const sorted = [...workouts].sort((a, b) => (a.day === null ? 99 : a.day) - (b.day === null ? 99 : b.day));

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir este treino?')) return;
    await api.deleteWorkout(id);
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
  };

  return (
    <div>
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary }}>Treinos</div>
        <button
          onClick={onNew}
          style={{ border: 'none', background: COLORS.navy, color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 16px', borderRadius: 14, cursor: 'pointer' }}
        >
          + Novo
        </button>
      </div>
      <div style={{ padding: '8px 20px 0' }}>
        {sorted.map((w) => (
          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              onClick={() => onOpen(w.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: SHADOW_CARD, cursor: 'pointer' }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, background: COLORS.navyLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: COLORS.navy, flexShrink: 0 }}>
                {w.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{w.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 1 }}>{w.subtitle}</div>
                <div style={{ fontSize: 12, color: COLORS.orange, marginTop: 4, fontWeight: 600 }}>
                  {w.day === null ? 'Sem dia definido' : `${DAY_LABELS_FULL[w.day]} · ${w.time}`}
                </div>
              </div>
              <div style={{ color: COLORS.chevron, fontSize: 18 }}>›</div>
            </div>
            <div
              onClick={(e) => handleDelete(w.id, e)}
              style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.dangerBg, color: COLORS.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
            >
              ×
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textTertiary }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum treino cadastrado</div>
            <div style={{ fontSize: 13 }}>Toque em "+ Novo" para criar seu primeiro treino.</div>
          </div>
        )}
      </div>
    </div>
  );
}
