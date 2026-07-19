import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { COLORS, SHADOW_CARD } from '../theme';
import { DAY_LABELS } from '../utils/date';
import type { ExerciseLoadHistory } from '../api/types';

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
}

function buildMonthCells(monthKey: string): (number | null)[] {
  const [y, m] = monthKey.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(iso));
}

function parseNumeric(load: string): number | null {
  const match = load.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

export default function ProgressPage({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const [month, setMonth] = useState(currentMonthKey());
  const { data } = useQuery({ queryKey: queryKeys.progress(month), queryFn: () => api.getProgressSummary(month) });

  const cells = useMemo(() => buildMonthCells(month), [month]);
  const trainedSet = useMemo(() => new Set(data?.trainedDays || []), [data]);
  const exercises = [...(data?.exercises || [])].reverse();

  return (
    <div style={{ position: 'fixed', inset: 0, background: COLORS.bgApp, zIndex: 90, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={onBack} style={{ fontSize: 22, color: COLORS.navy, cursor: 'pointer', width: 24 }}>‹</div>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>Progresso</div>
        </div>

        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div onClick={() => setMonth((m) => shiftMonth(m, -1))} style={{ fontSize: 18, color: COLORS.navy, cursor: 'pointer', padding: '0 8px' }}>‹</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, textTransform: 'capitalize' }}>{monthLabel(month)}</div>
            <div onClick={() => setMonth((m) => shiftMonth(m, 1))} style={{ fontSize: 18, color: COLORS.navy, cursor: 'pointer', padding: '0 8px' }}>›</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '16px 14px', boxShadow: SHADOW_CARD, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {DAY_LABELS.map((l) => (
                <div key={l} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: COLORS.textTertiary, textTransform: 'uppercase' }}>{l}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((day, i) => (
                <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {day !== null && (
                    <div
                      style={{
                        width: '75%', height: '75%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600,
                        background: trainedSet.has(day) ? COLORS.orange : '#F0F1F3',
                        color: trainedSet.has(day) ? '#fff' : '#5B6068',
                      }}
                    >
                      {day}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 10 }}>
              {trainedSet.size === 0 ? 'Nenhum treino concluído neste mês ainda.' : `${trainedSet.size} dia${trainedSet.size > 1 ? 's' : ''} treinado${trainedSet.size > 1 ? 's' : ''} neste mês.`}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Evolução de carga
          </div>
          {exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: COLORS.textTertiary, fontSize: 13.5, marginBottom: 20 }}>
              Ainda sem histórico de carga registrado.
            </div>
          )}
          {exercises.map((ex) => (
            <ExerciseHistoryCard key={`${ex.workoutId}::${ex.exerciseName}`} data={ex} />
          ))}
          <div style={{ height: 8 }} />
        </div>

        <div onClick={onLogout} style={{ textAlign: 'center', fontSize: 14, color: COLORS.danger, fontWeight: 600, padding: '14px 0 30px', cursor: 'pointer' }}>
          Sair da conta
        </div>
      </div>
    </div>
  );
}

function ExerciseHistoryCard({ data }: { data: ExerciseLoadHistory }) {
  const points = data.history.map((h) => parseNumeric(h.load));
  const numericPoints = points.every((p): p is number => p !== null) ? (points as number[]) : null;
  const first = data.history[0];
  const last = data.history[data.history.length - 1];

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', marginBottom: 10, boxShadow: SHADOW_CARD }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.textPrimary }}>{data.exerciseName}</div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 1, marginBottom: 8 }}>{data.workoutName}</div>

      {numericPoints && numericPoints.length >= 2 && <LoadSparkline points={numericPoints} />}

      {data.history.length === 1 ? (
        <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginTop: 6 }}>
          Carga atual: <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{last.load}</span>
          <span style={{ color: COLORS.textTertiary }}> ({formatShortDate(last.recordedAt)})</span>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textTertiary, marginTop: 6 }}>
          <span>{formatShortDate(first.recordedAt)}: <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{first.load}</span></span>
          <span>{formatShortDate(last.recordedAt)}: <span style={{ color: COLORS.orange, fontWeight: 700 }}>{last.load}</span></span>
        </div>
      )}
    </div>
  );
}

function LoadSparkline({ points }: { points: number[] }) {
  const w = 280;
  const h = 56;
  const pad = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y };
  });
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={polyline} fill="none" stroke={COLORS.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} fill={COLORS.orange} />
      ))}
    </svg>
  );
}
