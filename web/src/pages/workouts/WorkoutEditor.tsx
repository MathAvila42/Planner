import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { COLORS } from '../../theme';
import { DAY_LABELS_FULL } from '../../utils/date';
import type { Workout, WorkoutDraft } from '../../api/types';

function blankDraft(): WorkoutDraft {
  return {
    id: null, name: '', subtitle: '', day: '', time: '07:00',
    warmup: [], stretches: [], core: [],
    exercises: [{ name: '', sets: '', reps: '', load: '', note: '' }],
    cardio: { modality: '', duration: '', extra: '' },
    notes: '',
  };
}

function draftFromWorkout(w: Workout): WorkoutDraft {
  return {
    id: w.id, name: w.name, subtitle: w.subtitle, day: w.day === null ? '' : String(w.day), time: w.time,
    warmup: [...w.warmup],
    stretches: w.stretches.map((s) => s.text),
    core: w.core.map((c) => c.text),
    exercises: w.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, load: e.load, note: e.note })),
    cardio: { ...w.cardio },
    notes: w.notes,
  };
}

const LABEL_STYLE = { fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase' as const, marginBottom: 6 };
const INPUT_STYLE = { width: '100%', height: 46, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '0 16px', fontSize: 15, marginBottom: 14, outline: 'none' };
const ROW_INPUT_STYLE = { flex: 1, height: 42, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '0 14px', fontSize: 14, outline: 'none' };
const REMOVE_BTN_STYLE = { width: 42, height: 42, borderRadius: 12, background: COLORS.dangerBg, color: COLORS.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0 };

export default function WorkoutEditor({
  workoutId, isNew, onCancel, onSaved,
}: {
  workoutId: string | null;
  isNew: boolean;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: existing } = useQuery({
    queryKey: workoutId ? queryKeys.workout(workoutId) : ['workout', 'none'],
    queryFn: () => api.getWorkout(workoutId!),
    enabled: !isNew && !!workoutId,
  });

  const [draft, setDraft] = useState<WorkoutDraft | null>(isNew ? blankDraft() : null);

  useEffect(() => {
    if (!isNew && existing && !draft) setDraft(draftFromWorkout(existing));
  }, [isNew, existing, draft]);

  if (!draft) return null;

  const update = (patch: Partial<WorkoutDraft>) => setDraft({ ...draft, ...patch });
  const updateCardio = (patch: Partial<WorkoutDraft['cardio']>) => setDraft({ ...draft, cardio: { ...draft.cardio, ...patch } });

  const updateListItem = (key: 'warmup' | 'stretches' | 'core', idx: number, value: string) => {
    const list = draft[key].slice();
    list[idx] = value;
    setDraft({ ...draft, [key]: list });
  };
  const addListItem = (key: 'warmup' | 'stretches' | 'core') => setDraft({ ...draft, [key]: [...draft[key], ''] });
  const removeListItem = (key: 'warmup' | 'stretches' | 'core', idx: number) =>
    setDraft({ ...draft, [key]: draft[key].filter((_, i) => i !== idx) });

  const updateExercise = (idx: number, field: keyof WorkoutDraft['exercises'][number], value: string) => {
    const list = draft.exercises.slice();
    list[idx] = { ...list[idx], [field]: value };
    setDraft({ ...draft, exercises: list });
  };
  const addExercise = () => setDraft({ ...draft, exercises: [...draft.exercises, { name: '', sets: '', reps: '', load: '', note: '' }] });
  const removeExercise = (idx: number) => setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== idx) });

  const save = async () => {
    const result = draft.id
      ? await api.saveWorkout(draft.id, draft)
      : await api.createWorkout(draft);
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
    queryClient.invalidateQueries({ queryKey: queryKeys.workout(result.id) });
    onSaved(result.id);
  };

  return (
    <div>
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={onCancel} style={{ fontSize: 14, color: COLORS.textSecondary, cursor: 'pointer' }}>Cancelar</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
          {isNew ? 'Novo treino' : 'Editar treino'}
        </div>
        <div onClick={save} style={{ fontSize: 14, color: COLORS.navy, fontWeight: 700, cursor: 'pointer' }}>Salvar</div>
      </div>

      <div style={{ padding: '8px 20px 40px' }}>
        <div style={LABEL_STYLE}>Nome do treino</div>
        <input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ex: Inferiores A" style={INPUT_STYLE} />

        <div style={LABEL_STYLE}>Grupo muscular / descrição</div>
        <input value={draft.subtitle} onChange={(e) => update({ subtitle: e.target.value })} placeholder="Ex: Pernas (Quadríceps)" style={INPUT_STYLE} />

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={LABEL_STYLE}>Dia da semana</div>
            <select value={draft.day} onChange={(e) => update({ day: e.target.value })} style={{ width: '100%', height: 46, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '0 12px', fontSize: 14, outline: 'none' }}>
              <option value="">Sem dia definido</option>
              {DAY_LABELS_FULL.map((label, i) => <option key={i} value={String(i)}>{label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={LABEL_STYLE}>Horário</div>
            <input type="time" value={draft.time} onChange={(e) => update({ time: e.target.value })} style={{ width: '100%', height: 46, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '0 12px', fontSize: 14, outline: 'none' }} />
          </div>
        </div>

        <ListSection title="Aquecimento" items={draft.warmup} placeholder="Ex: 10 min bicicleta" onAdd={() => addListItem('warmup')} onChange={(i, v) => updateListItem('warmup', i, v)} onRemove={(i) => removeListItem('warmup', i)} />
        <ListSection title="Alongamento" items={draft.stretches} placeholder="Ex: Alongamento Isquiotibiais — 30 seg" onAdd={() => addListItem('stretches')} onChange={(i, v) => updateListItem('stretches', i, v)} onRemove={(i) => removeListItem('stretches', i)} topMargin />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
          <div style={LABEL_STYLE}>Exercícios</div>
          <div onClick={addExercise} style={{ fontSize: 13, color: COLORS.navy, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar</div>
        </div>
        {draft.exercises.map((ex, idx) => (
          <div key={idx} style={{ background: '#fff', border: `1px solid ${COLORS.borderLight}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} placeholder="Nome do exercício" style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 12px', fontSize: 13.5, outline: 'none' }} />
              <div onClick={() => removeExercise(idx)} style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.dangerBg, color: COLORS.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>×</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} placeholder="Séries" style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 10px', fontSize: 13, outline: 'none' }} />
              <input value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} placeholder="Reps" style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 10px', fontSize: 13, outline: 'none' }} />
              <input value={ex.load} onChange={(e) => updateExercise(idx, 'load', e.target.value)} placeholder="Carga" style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 10px', fontSize: 13, outline: 'none' }} />
            </div>
            <input value={ex.note} onChange={(e) => updateExercise(idx, 'note', e.target.value)} placeholder="Observação" style={{ width: '100%', height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 10px', fontSize: 13, outline: 'none' }} />
          </div>
        ))}

        <ListSection title="Core" items={draft.core} placeholder="Ex: Prancha — 3×30 seg" onAdd={() => addListItem('core')} onChange={(i, v) => updateListItem('core', i, v)} onRemove={(i) => removeListItem('core', i)} topMargin />

        <div style={{ ...LABEL_STYLE, margin: '16px 0 8px' }}>Cardio</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={draft.cardio.modality} onChange={(e) => updateCardio({ modality: e.target.value })} placeholder="Modalidade" style={ROW_INPUT_STYLE} />
          <input value={draft.cardio.duration} onChange={(e) => updateCardio({ duration: e.target.value })} placeholder="Duração" style={ROW_INPUT_STYLE} />
        </div>
        <input value={draft.cardio.extra} onChange={(e) => updateCardio({ extra: e.target.value })} placeholder="Detalhe (inclinação, velocidade...)" style={{ ...INPUT_STYLE, marginBottom: 16 }} />

        <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>Observações</div>
        <textarea
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Observações gerais do treino"
          style={{ width: '100%', height: 80, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none' }}
        />
      </div>
    </div>
  );
}

function ListSection({ title, items, placeholder, onAdd, onChange, onRemove, topMargin }: {
  title: string; items: string[]; placeholder: string;
  onAdd: () => void; onChange: (idx: number, value: string) => void; onRemove: (idx: number) => void;
  topMargin?: boolean;
}) {
  return (
    <div style={{ marginTop: topMargin ? 16 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={LABEL_STYLE}>{title}</div>
        <div onClick={onAdd} style={{ fontSize: 13, color: COLORS.navy, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar</div>
      </div>
      {items.map((val, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={val} onChange={(e) => onChange(idx, e.target.value)} placeholder={placeholder} style={ROW_INPUT_STYLE} />
          <div onClick={() => onRemove(idx)} style={REMOVE_BTN_STYLE}>×</div>
        </div>
      ))}
    </div>
  );
}
