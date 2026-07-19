import { Router } from 'express';
import { nanoid } from 'nanoid';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';
import type { Workout } from '../types.js';

export const workoutsRouter = Router();
workoutsRouter.use(requireAuth);

// Keeps a dated history of load changes per exercise (by workout + exercise name, not the
// row id — edits can recreate the row at the same position, and identity-by-name is what
// actually matches the user's mental model of "this exercise's progression over time").
async function logLoadIfChanged(userId: string, workoutId: string, exerciseName: string, oldLoad: string, newLoad: string) {
  const trimmed = (newLoad || '').trim();
  if (!trimmed || trimmed === (oldLoad || '').trim()) return;
  const { error } = await supabase.from('exercise_load_log').insert({
    id: nanoid(), user_id: userId, workout_id: workoutId, exercise_name: exerciseName, load: trimmed,
  });
  if (error) throw error;
}

interface WorkoutRow {
  id: string; name: string; subtitle: string; day_of_week: number | null; time: string;
  cardio_modality: string; cardio_duration: string; cardio_extra: string; notes: string;
}

async function ownedWorkoutRow(userId: string, id: string): Promise<WorkoutRow | undefined> {
  const { data, error } = await supabase.from('workouts').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

async function serializeWorkout(row: WorkoutRow): Promise<Workout> {
  const [warmupRes, stretchesRes, coreRes, exercisesRes] = await Promise.all([
    supabase.from('workout_warmup_items').select('text').eq('workout_id', row.id).order('sort_order', { ascending: true }),
    supabase.from('workout_stretch_items').select('id, text, photo_url').eq('workout_id', row.id).order('sort_order', { ascending: true }),
    supabase.from('workout_core_items').select('id, text, photo_url').eq('workout_id', row.id).order('sort_order', { ascending: true }),
    supabase.from('workout_exercises').select('id, name, sets, reps, load, note, photo_url').eq('workout_id', row.id).order('sort_order', { ascending: true }),
  ]);
  if (warmupRes.error) throw warmupRes.error;
  if (stretchesRes.error) throw stretchesRes.error;
  if (coreRes.error) throw coreRes.error;
  if (exercisesRes.error) throw exercisesRes.error;

  return {
    id: row.id, name: row.name, subtitle: row.subtitle, day: row.day_of_week, time: row.time,
    warmup: (warmupRes.data || []).map((r) => r.text),
    stretches: (stretchesRes.data || []).map((r) => ({ id: r.id, text: r.text, photoUrl: r.photo_url })),
    core: (coreRes.data || []).map((r) => ({ id: r.id, text: r.text, photoUrl: r.photo_url })),
    exercises: (exercisesRes.data || []).map((r) => ({ id: r.id, name: r.name, sets: r.sets, reps: r.reps, load: r.load, note: r.note, photoUrl: r.photo_url })),
    cardio: { modality: row.cardio_modality, duration: row.cardio_duration, extra: row.cardio_extra },
    notes: row.notes,
  };
}

workoutsRouter.get('/', wrap<AuthedRequest>(async (req, res) => {
  const { data, error } = await supabase.from('workouts').select('*').eq('user_id', req.userId).order('sort_order', { ascending: true });
  if (error) throw error;
  res.json(await Promise.all((data || []).map((row) => serializeWorkout(row as WorkoutRow))));
}));

workoutsRouter.get('/:id', wrap<AuthedRequest>(async (req, res) => {
  const row = await ownedWorkoutRow(req.userId!, req.params.id);
  if (!row) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  res.json(await serializeWorkout(row));
}));

interface WorkoutPayload {
  name?: string; subtitle?: string; day?: number | null; time?: string; notes?: string;
  cardio?: { modality?: string; duration?: string; extra?: string };
  warmup?: string[]; stretches?: string[]; core?: string[];
  exercises?: { name: string; sets?: string; reps?: string; load?: string; note?: string }[];
}

function workoutFields(body: WorkoutPayload) {
  return {
    name: (body.name || '').trim() || 'Treino sem nome',
    subtitle: (body.subtitle || '').trim(),
    day_of_week: body.day ?? null,
    time: body.time || '07:00',
    cardio_modality: body.cardio?.modality || '',
    cardio_duration: body.cardio?.duration || '',
    cardio_extra: body.cardio?.extra || '',
    notes: body.notes || '',
  };
}

async function insertNestedFresh(userId: string, workoutId: string, body: WorkoutPayload) {
  const warmup = (body.warmup || []).filter((t) => t && t.trim());
  if (warmup.length) {
    const { error } = await supabase.from('workout_warmup_items').insert(
      warmup.map((text, i) => ({ id: nanoid(), workout_id: workoutId, text: text.trim(), sort_order: i })),
    );
    if (error) throw error;
  }
  const stretches = (body.stretches || []).filter((t) => t && t.trim());
  if (stretches.length) {
    const { error } = await supabase.from('workout_stretch_items').insert(
      stretches.map((text, i) => ({ id: nanoid(), workout_id: workoutId, text: text.trim(), sort_order: i })),
    );
    if (error) throw error;
  }
  const core = (body.core || []).filter((t) => t && t.trim());
  if (core.length) {
    const { error } = await supabase.from('workout_core_items').insert(
      core.map((text, i) => ({ id: nanoid(), workout_id: workoutId, text: text.trim(), sort_order: i })),
    );
    if (error) throw error;
  }
  const exercises = (body.exercises || []).filter((e) => e.name && e.name.trim());
  if (exercises.length) {
    const { error } = await supabase.from('workout_exercises').insert(
      exercises.map((e, i) => ({ id: nanoid(), workout_id: workoutId, name: e.name.trim(), sets: e.sets || '', reps: e.reps || '', load: e.load || '', note: e.note || '', sort_order: i })),
    );
    if (error) throw error;
    await Promise.all(exercises.map((e) => logLoadIfChanged(userId, workoutId, e.name.trim(), '', e.load || '')));
  }
}

workoutsRouter.post('/', wrap<AuthedRequest>(async (req, res) => {
  const body = req.body as WorkoutPayload;
  const { data: maxRow, error: maxError } = await supabase
    .from('workouts').select('sort_order').eq('user_id', req.userId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  if (maxError) throw maxError;

  const id = nanoid();
  const { error } = await supabase.from('workouts').insert({
    id, user_id: req.userId, sort_order: (maxRow?.sort_order ?? -1) + 1, ...workoutFields(body),
  });
  if (error) throw error;

  await insertNestedFresh(req.userId!, id, body);
  res.json(await serializeWorkout((await ownedWorkoutRow(req.userId!, id))!));
}));

// Edits keep each item's existing row (and therefore its uploaded photo) as long as it stays
// at the same position — only text/order changes; only added/removed rows are inserted/deleted.
// A full delete-and-reinsert would wipe every photo on every save.
async function upsertTextItemsByPosition(table: 'workout_stretch_items' | 'workout_core_items', workoutId: string, texts: string[]) {
  const clean = texts.filter((t) => t && t.trim()).map((t) => t.trim());
  const { data: existing, error: fetchError } = await supabase.from(table).select('id').eq('workout_id', workoutId).order('sort_order', { ascending: true });
  if (fetchError) throw fetchError;
  const rows = existing || [];

  for (let i = 0; i < clean.length; i++) {
    if (rows[i]) {
      const { error } = await supabase.from(table).update({ text: clean[i], sort_order: i }).eq('id', rows[i].id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(table).insert({ id: nanoid(), workout_id: workoutId, text: clean[i], sort_order: i });
      if (error) throw error;
    }
  }
  const toDelete = rows.slice(clean.length).map((r) => r.id);
  if (toDelete.length) {
    const { error } = await supabase.from(table).delete().in('id', toDelete);
    if (error) throw error;
  }
}

async function upsertExercisesByPosition(userId: string, workoutId: string, exercises: NonNullable<WorkoutPayload['exercises']>) {
  const clean = exercises.filter((e) => e.name && e.name.trim());
  const { data: existing, error: fetchError } = await supabase.from('workout_exercises').select('id, load').eq('workout_id', workoutId).order('sort_order', { ascending: true });
  if (fetchError) throw fetchError;
  const rows = existing || [];

  for (let i = 0; i < clean.length; i++) {
    const e = clean[i];
    const name = e.name.trim();
    const load = e.load || '';
    const fields = { name, sets: e.sets || '', reps: e.reps || '', load, note: e.note || '', sort_order: i };
    if (rows[i]) {
      const { error } = await supabase.from('workout_exercises').update(fields).eq('id', rows[i].id);
      if (error) throw error;
      await logLoadIfChanged(userId, workoutId, name, rows[i].load || '', load);
    } else {
      const { error } = await supabase.from('workout_exercises').insert({ id: nanoid(), workout_id: workoutId, ...fields });
      if (error) throw error;
      await logLoadIfChanged(userId, workoutId, name, '', load);
    }
  }
  const toDelete = rows.slice(clean.length).map((r) => r.id);
  if (toDelete.length) {
    const { error } = await supabase.from('workout_exercises').delete().in('id', toDelete);
    if (error) throw error;
  }
}

workoutsRouter.put('/:id', wrap<AuthedRequest>(async (req, res) => {
  const existing = await ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  const body = req.body as WorkoutPayload;

  const { error } = await supabase.from('workouts').update(workoutFields(body)).eq('id', existing.id);
  if (error) throw error;

  const { error: warmupDeleteError } = await supabase.from('workout_warmup_items').delete().eq('workout_id', existing.id);
  if (warmupDeleteError) throw warmupDeleteError;
  const warmup = (body.warmup || []).filter((t) => t && t.trim());
  if (warmup.length) {
    const { error: warmupInsertError } = await supabase.from('workout_warmup_items').insert(
      warmup.map((text, i) => ({ id: nanoid(), workout_id: existing.id, text: text.trim(), sort_order: i })),
    );
    if (warmupInsertError) throw warmupInsertError;
  }

  await upsertTextItemsByPosition('workout_stretch_items', existing.id, body.stretches ?? []);
  await upsertTextItemsByPosition('workout_core_items', existing.id, body.core ?? []);
  await upsertExercisesByPosition(req.userId!, existing.id, body.exercises ?? []);

  res.json(await serializeWorkout((await ownedWorkoutRow(req.userId!, existing.id))!));
}));

workoutsRouter.patch('/:id', wrap<AuthedRequest>(async (req, res) => {
  const existing = await ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  const body = req.body as Partial<WorkoutPayload>;

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
  if (body.day !== undefined) patch.day_of_week = body.day;
  if (body.time !== undefined) patch.time = body.time;

  if (Object.keys(patch).length) {
    const { error } = await supabase.from('workouts').update(patch).eq('id', existing.id);
    if (error) throw error;
  }
  res.json(await serializeWorkout((await ownedWorkoutRow(req.userId!, existing.id))!));
}));

workoutsRouter.delete('/:id', wrap<AuthedRequest>(async (req, res) => {
  const existing = await ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  const { error } = await supabase.from('workouts').delete().eq('id', existing.id);
  if (error) throw error;
  res.json({ ok: true });
}));

// --- quick nested-item updates (used from the workout detail screen) ---

workoutsRouter.patch('/:workoutId/exercises/:id', wrap<AuthedRequest>(async (req, res) => {
  const owned = await ownedWorkoutRow(req.userId!, req.params.workoutId);
  if (!owned) { res.status(404).json({ error: 'Exercício não encontrado.' }); return; }
  const body = req.body as { load?: string; photoUrl?: string | null };

  const { data: current, error: currentError } = await supabase
    .from('workout_exercises').select('name, load')
    .eq('id', req.params.id).eq('workout_id', owned.id).maybeSingle();
  if (currentError) throw currentError;
  if (!current) { res.status(404).json({ error: 'Exercício não encontrado.' }); return; }

  const patch: Record<string, unknown> = {};
  if (body.load !== undefined) patch.load = body.load;
  if (body.photoUrl !== undefined) patch.photo_url = body.photoUrl;

  const { data, error } = await supabase
    .from('workout_exercises').update(patch)
    .eq('id', req.params.id).eq('workout_id', owned.id)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data) { res.status(404).json({ error: 'Exercício não encontrado.' }); return; }
  if (body.load !== undefined) await logLoadIfChanged(req.userId!, owned.id, current.name, current.load || '', body.load);
  res.json({ ok: true });
}));

workoutsRouter.patch('/:workoutId/stretch-items/:id', wrap<AuthedRequest>(async (req, res) => {
  const owned = await ownedWorkoutRow(req.userId!, req.params.workoutId);
  if (!owned) { res.status(404).json({ error: 'Alongamento não encontrado.' }); return; }
  const body = req.body as { photoUrl?: string | null };
  if (body.photoUrl === undefined) { res.json({ ok: true }); return; }

  const { data, error } = await supabase
    .from('workout_stretch_items').update({ photo_url: body.photoUrl })
    .eq('id', req.params.id).eq('workout_id', owned.id)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data) { res.status(404).json({ error: 'Alongamento não encontrado.' }); return; }
  res.json({ ok: true });
}));

workoutsRouter.patch('/:workoutId/core-items/:id', wrap<AuthedRequest>(async (req, res) => {
  const owned = await ownedWorkoutRow(req.userId!, req.params.workoutId);
  if (!owned) { res.status(404).json({ error: 'Item de core não encontrado.' }); return; }
  const body = req.body as { photoUrl?: string | null };
  if (body.photoUrl === undefined) { res.json({ ok: true }); return; }

  const { data, error } = await supabase
    .from('workout_core_items').update({ photo_url: body.photoUrl })
    .eq('id', req.params.id).eq('workout_id', owned.id)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data) { res.status(404).json({ error: 'Item de core não encontrado.' }); return; }
  res.json({ ok: true });
}));
