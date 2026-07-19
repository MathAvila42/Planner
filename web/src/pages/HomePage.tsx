import { useState, type CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { COLORS, SHADOW_CARD } from '../theme';
import { DAY_LABELS, formatTodayLabel, getTodayIdx, mondayOfThisWeek } from '../utils/date';
import { MEAL_TYPE_LABELS } from '../api/types';
import type { User, DayBlock, MealType, DaySelections } from '../api/types';

function selectedIdFor(selections: DaySelections | undefined, mealType: MealType): string | null {
  if (!selections) return null;
  switch (mealType) {
    case 'cafe': return selections.cafeSelectedId;
    case 'lancheManha': return selections.lancheManhaSelectedId;
    case 'lancheTarde': return selections.lancheTardeSelectedId;
    case 'jantar': return selections.jantarSelectedId;
  }
}

function selectionPatchFor(mealType: MealType, optionId: string): Partial<DaySelections> {
  switch (mealType) {
    case 'cafe': return { cafeSelectedId: optionId };
    case 'lancheManha': return { lancheManhaSelectedId: optionId };
    case 'lancheTarde': return { lancheTardeSelectedId: optionId };
    case 'jantar': return { jantarSelectedId: optionId };
  }
}

export default function HomePage({
  user, onOpenWorkout, onOpenGoals, onLogout,
}: {
  user: User;
  onOpenWorkout: (id: string) => void;
  onOpenGoals: () => void;
  onLogout: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(getTodayIdx());
  const queryClient = useQueryClient();

  const { data: workouts = [] } = useQuery({ queryKey: queryKeys.workouts, queryFn: api.getWorkouts });
  const { data: blocks = [] } = useQuery({ queryKey: queryKeys.dayBlocks(selectedDay), queryFn: () => api.getDayBlocks(selectedDay) });
  const { data: selections } = useQuery({ queryKey: queryKeys.daySelections(selectedDay), queryFn: () => api.getDaySelections(selectedDay) });
  const { data: mealLibrary } = useQuery({ queryKey: queryKeys.meals, queryFn: api.getMeals });
  const { data: goals } = useQuery({ queryKey: queryKeys.goals, queryFn: api.getGoals });

  const invalidateDay = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dayBlocks(selectedDay) });
  };
  const invalidateSelections = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.daySelections(selectedDay) });
  };
  const invalidateWorkouts = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
  };

  const monday = mondayOfThisWeek();
  const weekDaysVM = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const selected = i === selectedDay;
    return { label, dateNum: d.getDate(), selected, i };
  });

  const workoutBlocks = workouts
    .filter((w) => w.day === selectedDay)
    .map((w) => ({ time: w.time, kind: 'workout' as const, workout: w }));
  const otherBlocks = blocks.map((b) => ({ time: b.time, kind: 'block' as const, block: b }));
  const merged = [...otherBlocks, ...workoutBlocks].sort((a, b) => a.time.localeCompare(b.time));

  const updateBlockTime = async (id: string, time: string) => { await api.patchDayBlock(id, { time }); invalidateDay(); };
  const updateBlockLabel = async (id: string, label: string) => { await api.patchDayBlock(id, { label }); invalidateDay(); };
  const removeBlock = async (id: string) => { await api.deleteDayBlock(id); invalidateDay(); };
  const addActivity = async () => { await api.addDayBlock(selectedDay, '12:00', ''); invalidateDay(); };
  const selectMealOption = async (mealType: MealType, optionId: string) => {
    await api.patchDaySelections(selectedDay, selectionPatchFor(mealType, optionId));
    invalidateSelections();
  };
  const toggleAlmoco = async () => {
    await api.patchDaySelections(selectedDay, { almocoChecked: !selections?.almocoChecked });
    invalidateSelections();
  };
  const updateWorkoutTime = async (id: string, time: string) => { await api.updateWorkoutTime(id, time); invalidateWorkouts(); };

  return (
    <div>
      <div style={{ padding: '24px 20px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>Olá, {user.name} 👋</div>
            <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' }}>
              {formatTodayLabel()}
            </div>
          </div>
          <div
            onClick={onLogout}
            style={{
              width: 40, height: 40, borderRadius: '50%', background: COLORS.navy, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
            }}
            title="Sair"
          >
            {user.name.charAt(0)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 20, marginBottom: 22 }}>
          {weekDaysVM.map((day) => (
            <div
              key={day.label + day.i}
              onClick={() => setSelectedDay(day.i)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0',
                borderRadius: 16, cursor: 'pointer', background: day.selected ? COLORS.navyLight : 'transparent',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: day.selected ? COLORS.navy : COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {day.label}
              </div>
              <div
                style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600,
                  background: day.selected ? COLORS.orange : '#F0F1F3',
                  color: day.selected ? '#fff' : '#5B6068',
                }}
              >
                {day.dateNum}
              </div>
            </div>
          ))}
        </div>

        {goals && (
          <div
            onClick={onOpenGoals}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLORS.navy,
              borderRadius: 22, padding: '18px 20px', marginBottom: 16, cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#B9C4EA', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                {goals.project}
              </div>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginTop: 4 }}>Ver objetivo completo</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>
              →
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        {merged.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            {item.kind === 'block' && item.block.type === 'plain' && (
              <PlainBlockRow block={item.block} onTimeChange={updateBlockTime} onLabelChange={updateBlockLabel} onRemove={removeBlock} />
            )}
            {item.kind === 'block' && item.block.type === 'meal' && (
              <MealBlockRow
                block={item.block}
                options={item.block.mealType && mealLibrary ? mealLibrary[item.block.mealType] : []}
                selectedId={item.block.mealType ? selectedIdFor(selections, item.block.mealType) : null}
                onTimeChange={updateBlockTime}
                onSelect={selectMealOption}
              />
            )}
            {item.kind === 'block' && item.block.type === 'lunch' && (
              <LunchBlockRow block={item.block} checked={!!selections?.almocoChecked} onTimeChange={updateBlockTime} onToggle={toggleAlmoco} />
            )}
            {item.kind === 'workout' && (
              <WorkoutBlockRow
                time={item.workout.time}
                name={item.workout.name}
                subtitle={item.workout.subtitle}
                onTimeChange={(t) => updateWorkoutTime(item.workout.id, t)}
                onOpen={() => onOpenWorkout(item.workout.id)}
              />
            )}
          </div>
        ))}

        {merged.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px 20px', color: COLORS.textTertiary }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhuma atividade cadastrada</div>
            <div style={{ fontSize: 13 }}>Use as abas Treinos e Refeições para montar sua rotina.</div>
          </div>
        )}

        <div
          onClick={addActivity}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, margin: '6px 0 20px',
            borderRadius: 16, border: `1.5px dashed ${COLORS.borderDashed}`, color: COLORS.navy, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Adicionar atividade
        </div>
      </div>
    </div>
  );
}

function TimeInput({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: CSSProperties }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 76, border: 'none', background: 'transparent', fontSize: 12, color: COLORS.textTertiary, fontWeight: 600, flexShrink: 0, padding: 0, ...style }}
    />
  );
}

function PlainBlockRow({ block, onTimeChange, onLabelChange, onRemove }: {
  block: DayBlock; onTimeChange: (id: string, v: string) => void; onLabelChange: (id: string, v: string) => void; onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
        <TimeInput value={block.time} onChange={(v) => onTimeChange(block.id, v)} />
        <input
          value={block.label}
          onChange={(e) => onLabelChange(block.id, e.target.value)}
          placeholder="Nome da atividade"
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: COLORS.textSecondary, padding: '2px 0', outline: 'none' }}
        />
        <div onClick={() => onRemove(block.id)} style={{ width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: COLORS.borderDashed, cursor: 'pointer', flexShrink: 0 }}>
          ×
        </div>
      </div>
      {block.notes && (
        <div style={{ marginLeft: 84, marginRight: 4, marginTop: 4, background: COLORS.notesBg, borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: COLORS.notesText, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {block.notes}
        </div>
      )}
    </div>
  );
}

function MealBlockRow({ block, options, selectedId, onTimeChange, onSelect }: {
  block: DayBlock; options: { id: string; name: string }[]; selectedId: string | null;
  onTimeChange: (id: string, v: string) => void; onSelect: (mealType: MealType, id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <TimeInput value={block.time} onChange={(v) => onTimeChange(block.id, v)} style={{ marginTop: 16, height: 20 }} />
      <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: SHADOW_CARD }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>
          {block.mealType ? MEAL_TYPE_LABELS[block.mealType] : ''}
        </div>
        {options.length > 0 ? options.map((opt) => {
          const sel = opt.id === selectedId;
          return (
            <div key={opt.id} onClick={() => block.mealType && onSelect(block.mealType, opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sel ? COLORS.orange : COLORS.borderDashed}`, background: sel ? COLORS.orange : '#fff', flexShrink: 0 }} />
              <div style={{ fontSize: 14, color: sel ? COLORS.textPrimary : COLORS.optionInactiveText, fontWeight: sel ? 600 : 400 }}>{opt.name}</div>
            </div>
          );
        }) : (
          <div style={{ fontSize: 13, color: COLORS.textTertiary }}>Nenhuma opção cadastrada ainda.</div>
        )}
      </div>
    </div>
  );
}

function LunchBlockRow({ block, checked, onTimeChange, onToggle }: {
  block: DayBlock; checked: boolean; onTimeChange: (id: string, v: string) => void; onToggle: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <TimeInput value={block.time} onChange={(v) => onTimeChange(block.id, v)} style={{ marginTop: 16, height: 20 }} />
      <div onClick={onToggle} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 20, padding: '16px 18px', boxShadow: SHADOW_CARD, cursor: 'pointer' }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${checked ? COLORS.orange : COLORS.borderDashed}`, background: checked ? COLORS.orange : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>
          {checked ? '✓' : ''}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Almoço</div>
      </div>
    </div>
  );
}

function WorkoutBlockRow({ time, name, subtitle, onTimeChange, onOpen }: {
  time: string; name: string; subtitle: string; onTimeChange: (v: string) => void; onOpen: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <TimeInput value={time} onChange={onTimeChange} style={{ marginTop: 16, height: 20 }} />
      <div onClick={onOpen} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 20, padding: '14px 18px', boxShadow: SHADOW_CARD, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: COLORS.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: COLORS.orange, flexShrink: 0 }}>
          {name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{name}</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 1 }}>{subtitle}</div>
        </div>
        <div style={{ color: COLORS.chevron, fontSize: 18 }}>›</div>
      </div>
    </div>
  );
}
