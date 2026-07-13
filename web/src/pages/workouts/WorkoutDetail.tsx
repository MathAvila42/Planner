import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { COLORS, SHADOW_CARD } from '../../theme';
import { DAY_LABELS_FULL, todayKey } from '../../utils/date';
import PhotoSlot from '../../components/PhotoSlot';
import type { Exercise, TextPhotoItem } from '../../api/types';

const SECTION_LABEL_STYLE = { fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 8 };

export default function WorkoutDetail({
  workoutId, onBack, onEdit, onDeleted,
}: {
  workoutId: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const date = todayKey();
  const { data: w } = useQuery({ queryKey: queryKeys.workout(workoutId), queryFn: () => api.getWorkout(workoutId) });
  const { data: completions } = useQuery({ queryKey: queryKeys.completions(date), queryFn: () => api.getCompletions(date) });

  const invalidateWorkout = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workout(workoutId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
  };
  const invalidateCompletions = () => queryClient.invalidateQueries({ queryKey: queryKeys.completions(date) });

  if (!w) return null;

  const done = completions?.[workoutId] || { stretches: {}, exercises: {} };
  const stretchesTodo = w.stretches.filter((s) => !done.stretches[s.id]);
  const stretchesDone = w.stretches.filter((s) => done.stretches[s.id]);
  const exercisesTodo = w.exercises.filter((e) => !done.exercises[e.id]);
  const exercisesDone = w.exercises.filter((e) => done.exercises[e.id]);

  const toggleStretch = async (id: string) => { await api.toggleCompletion(workoutId, 'stretches', id, date); invalidateCompletions(); };
  const toggleExercise = async (id: string) => { await api.toggleCompletion(workoutId, 'exercises', id, date); invalidateCompletions(); };
  const setStretchPhoto = async (id: string, url: string) => { await api.updateStretchItem(workoutId, id, { photoUrl: url }); invalidateWorkout(); };
  const setCorePhoto = async (id: string, url: string) => { await api.updateCoreItem(workoutId, id, { photoUrl: url }); invalidateWorkout(); };
  const setExercisePhoto = async (id: string, url: string) => { await api.updateExercise(workoutId, id, { photoUrl: url }); invalidateWorkout(); };
  const setExerciseLoad = async (id: string, load: string) => { await api.updateExercise(workoutId, id, { load }); invalidateWorkout(); };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este treino?')) return;
    await api.deleteWorkout(workoutId);
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
    onDeleted();
  };

  const dayTimeLabel = `${w.day === null ? 'Sem dia definido' : DAY_LABELS_FULL[w.day]} · ${w.time}`;
  const cardioDetail = [w.cardio.duration, w.cardio.extra].filter(Boolean).join(' · ');

  return (
    <div>
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={onBack} style={{ fontSize: 22, color: COLORS.navy, cursor: 'pointer', width: 24 }}>‹</div>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{w.name}</div>
        <div onClick={onEdit} style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, cursor: 'pointer' }}>Editar</div>
      </div>

      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 }}>{w.subtitle}</div>
        <div style={{ fontSize: 13, color: COLORS.orange, fontWeight: 600, marginBottom: 20 }}>{dayTimeLabel}</div>

        {w.warmup.length > 0 && (
          <>
            <div style={SECTION_LABEL_STYLE}>Aquecimento</div>
            <div style={{ background: '#fff', borderRadius: 18, padding: '6px 18px', marginBottom: 20, boxShadow: SHADOW_CARD }}>
              {w.warmup.map((t, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < w.warmup.length - 1 ? `1px solid ${COLORS.borderLight}` : undefined, fontSize: 14, color: COLORS.bodyText }}>
                  {t}
                </div>
              ))}
            </div>
          </>
        )}

        {w.stretches.length > 0 && (
          <>
            <div style={SECTION_LABEL_STYLE}>Alongamento</div>
            <div style={{ background: '#fff', borderRadius: 18, padding: '6px 18px', marginBottom: 8, boxShadow: SHADOW_CARD }}>
              {stretchesTodo.map((s, i) => (
                <StretchRow key={s.id} item={s} isLast={i === stretchesTodo.length - 1} onToggle={() => toggleStretch(s.id)} onPhoto={(url) => setStretchPhoto(s.id, url)} />
              ))}
            </div>
            {stretchesDone.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Concluído</div>
                <div style={{ background: '#fff', borderRadius: 18, padding: '6px 18px', marginBottom: 20, boxShadow: SHADOW_CARD }}>
                  {stretchesDone.map((s, i) => (
                    <div key={s.id} onClick={() => toggleStretch(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stretchesDone.length - 1 ? `1px solid ${COLORS.borderLight}` : undefined, cursor: 'pointer' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>✓</div>
                      <div style={{ fontSize: 14, color: COLORS.textTertiary, textDecoration: 'line-through' }}>{s.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {w.exercises.length > 0 && (
          <>
            <div style={SECTION_LABEL_STYLE}>Exercícios</div>
            {exercisesTodo.map((e) => (
              <ExerciseCard key={e.id} exercise={e} onToggle={() => toggleExercise(e.id)} onPhoto={(url) => setExercisePhoto(e.id, url)} onLoadChange={(load) => setExerciseLoad(e.id, load)} />
            ))}
            {exercisesDone.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Concluído</div>
                {exercisesDone.map((e) => (
                  <div key={e.id} style={{ background: '#F7F8FA', borderRadius: 18, padding: '14px 18px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div onClick={() => toggleExercise(e.id)} style={{ width: 20, height: 20, borderRadius: 6, background: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0, cursor: 'pointer' }}>✓</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.textTertiary, textDecoration: 'line-through' }}>{e.name}</div>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textTertiary, fontWeight: 700 }}>{e.sets}×{e.reps}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {w.core.length > 0 && (
          <>
            <div style={{ ...SECTION_LABEL_STYLE, margin: '14px 0 8px' }}>Core</div>
            <div style={{ background: '#fff', borderRadius: 18, padding: '6px 18px', marginBottom: 20, boxShadow: SHADOW_CARD }}>
              {w.core.map((c, i) => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: i < w.core.length - 1 ? `1px solid ${COLORS.borderLight}` : undefined }}>
                  <div style={{ fontSize: 14, color: COLORS.bodyText }}>{c.text}</div>
                  <div style={{ marginTop: 8 }}>
                    <PhotoSlot photoUrl={c.photoUrl} placeholder="Foto do exercício de core" height={100} radius={12} onChange={(url) => setCorePhoto(c.id, url)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(w.cardio.modality || w.cardio.duration) && (
          <>
            <div style={SECTION_LABEL_STYLE}>Cardio</div>
            <div style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', marginBottom: 20, boxShadow: SHADOW_CARD }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.textPrimary }}>{w.cardio.modality}</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>{cardioDetail}</div>
            </div>
          </>
        )}

        {w.notes && (
          <>
            <div style={SECTION_LABEL_STYLE}>Observações</div>
            <div style={{ background: COLORS.notesBg, borderRadius: 18, padding: '14px 18px', marginBottom: 20, fontSize: 13.5, color: COLORS.notesText, lineHeight: 1.5 }}>
              {w.notes}
            </div>
          </>
        )}

        <div onClick={handleDelete} style={{ textAlign: 'center', fontSize: 14, color: COLORS.danger, fontWeight: 600, padding: '14px 0 30px', cursor: 'pointer' }}>
          Excluir treino
        </div>
      </div>
    </div>
  );
}

function StretchRow({ item, isLast, onToggle, onPhoto }: { item: TextPhotoItem; isLast: boolean; onToggle: () => void; onPhoto: (url: string) => void }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: isLast ? undefined : `1px solid ${COLORS.borderLight}` }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${COLORS.borderDashed}`, flexShrink: 0 }} />
        <div style={{ fontSize: 14, color: COLORS.bodyText }}>{item.text}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <PhotoSlot photoUrl={item.photoUrl} placeholder="Foto do alongamento" height={100} radius={12} onChange={onPhoto} />
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, onToggle, onPhoto, onLoadChange }: {
  exercise: Exercise; onToggle: () => void; onPhoto: (url: string) => void; onLoadChange: (load: string) => void;
}) {
  const [load, setLoad] = useState(exercise.load);

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '14px 18px', marginBottom: 10, boxShadow: SHADOW_CARD }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div onClick={onToggle} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${COLORS.borderDashed}`, flexShrink: 0, marginTop: 2, cursor: 'pointer' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.textPrimary }}>{exercise.name}</div>
            <div style={{ fontSize: 13, color: COLORS.navy, fontWeight: 700 }}>{exercise.sets}×{exercise.reps}</div>
          </div>
          {exercise.note && <div style={{ fontSize: 12.5, color: COLORS.orange, marginTop: 5 }}>{exercise.note}</div>}
          <div style={{ marginTop: 10 }}>
            <PhotoSlot photoUrl={exercise.photoUrl} placeholder="Foto do exercício" height={120} radius={14} onChange={onPhoto} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 600 }}>Carga</div>
            <input
              value={load}
              onChange={(e) => setLoad(e.target.value)}
              onBlur={() => { if (load !== exercise.load) onLoadChange(load); }}
              placeholder="Ex: 20 kg"
              style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 12px', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
