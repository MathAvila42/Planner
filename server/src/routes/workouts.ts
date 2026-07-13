import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import type { Workout } from '../types.js';

export const workoutsRouter = Router();
workoutsRouter.use(requireAuth);

interface WorkoutRow {
  id: string; name: string; subtitle: string; day_of_week: number | null; time: string;
  cardio_modality: string; cardio_duration: string; cardio_extra: string; notes: string;
}

function serializeWorkout(row: WorkoutRow): Workout {
  const warmup = (db.prepare('SELECT text FROM workout_warmup_items WHERE workout_id = ? ORDER BY sort_order ASC').all(row.id) as { text: string }[]).map((r) => r.text);
  const stretches = db.prepare('SELECT id, text, photo_url as photoUrl FROM workout_stretch_items WHERE workout_id = ? ORDER BY sort_order ASC').all(row.id) as { id: string; text: string; photoUrl: string | null }[];
  const core = db.prepare('SELECT id, text, photo_url as photoUrl FROM workout_core_items WHERE workout_id = ? ORDER BY sort_order ASC').all(row.id) as { id: string; text: string; photoUrl: string | null }[];
  const exercises = db.prepare('SELECT id, name, sets, reps, load, note, photo_url as photoUrl FROM workout_exercises WHERE workout_id = ? ORDER BY sort_order ASC').all(row.id) as Workout['exercises'];
  return {
    id: row.id, name: row.name, subtitle: row.subtitle, day: row.day_of_week, time: row.time,
    warmup, stretches, core, exercises,
    cardio: { modality: row.cardio_modality, duration: row.cardio_duration, extra: row.cardio_extra },
    notes: row.notes,
  };
}

function ownedWorkoutRow(userId: string, id: string): WorkoutRow | undefined {
  return db.prepare('SELECT * FROM workouts WHERE id = ? AND user_id = ?').get(id, userId) as WorkoutRow | undefined;
}

workoutsRouter.get('/', (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY sort_order ASC').all(req.userId) as WorkoutRow[];
  res.json(rows.map(serializeWorkout));
});

workoutsRouter.get('/:id', (req: AuthedRequest, res) => {
  const row = ownedWorkoutRow(req.userId!, req.params.id);
  if (!row) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  res.json(serializeWorkout(row));
});

interface WorkoutPayload {
  name?: string; subtitle?: string; day?: number | null; time?: string; notes?: string;
  cardio?: { modality?: string; duration?: string; extra?: string };
  warmup?: string[]; stretches?: string[]; core?: string[];
  exercises?: { name: string; sets?: string; reps?: string; load?: string; note?: string }[];
}

function replaceNested(workoutId: string, body: WorkoutPayload) {
  if (body.warmup) {
    db.prepare('DELETE FROM workout_warmup_items WHERE workout_id = ?').run(workoutId);
    const stmt = db.prepare('INSERT INTO workout_warmup_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
    body.warmup.filter((t) => t && t.trim()).forEach((t, i) => stmt.run(nanoid(), workoutId, t.trim(), i));
  }
  if (body.stretches) {
    db.prepare('DELETE FROM workout_stretch_items WHERE workout_id = ?').run(workoutId);
    const stmt = db.prepare('INSERT INTO workout_stretch_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
    body.stretches.filter((t) => t && t.trim()).forEach((t, i) => stmt.run(nanoid(), workoutId, t.trim(), i));
  }
  if (body.core) {
    db.prepare('DELETE FROM workout_core_items WHERE workout_id = ?').run(workoutId);
    const stmt = db.prepare('INSERT INTO workout_core_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
    body.core.filter((t) => t && t.trim()).forEach((t, i) => stmt.run(nanoid(), workoutId, t.trim(), i));
  }
  if (body.exercises) {
    db.prepare('DELETE FROM workout_exercises WHERE workout_id = ?').run(workoutId);
    const stmt = db.prepare('INSERT INTO workout_exercises (id, workout_id, name, sets, reps, load, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    body.exercises.filter((e) => e.name && e.name.trim()).forEach((e, i) =>
      stmt.run(nanoid(), workoutId, e.name.trim(), e.sets || '', e.reps || '', e.load || '', e.note || '', i));
  }
}

workoutsRouter.post('/', (req: AuthedRequest, res) => {
  const body = req.body as WorkoutPayload;
  const name = (body.name || '').trim() || 'Treino sem nome';
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM workouts WHERE user_id = ?').get(req.userId) as { m: number };
  const id = nanoid();
  db.prepare(`INSERT INTO workouts (id, user_id, name, subtitle, day_of_week, time, cardio_modality, cardio_duration, cardio_extra, notes, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.userId, name, (body.subtitle || '').trim(), body.day ?? null, body.time || '07:00',
      body.cardio?.modality || '', body.cardio?.duration || '', body.cardio?.extra || '', body.notes || '', maxOrder.m + 1);
  replaceNested(id, body);
  res.json(serializeWorkout(ownedWorkoutRow(req.userId!, id)!));
});

// Edits keep each item's existing row (and therefore its uploaded photo) as long as it
// stays at the same position — only text/order changes; only added/removed rows are
// inserted/deleted. A full delete-and-reinsert would wipe every photo on every save.
function upsertTextItemsByPosition(table: 'workout_stretch_items' | 'workout_core_items', workoutId: string, texts: string[]) {
  const clean = texts.filter((t) => t && t.trim()).map((t) => t.trim());
  const existing = db.prepare(`SELECT id FROM ${table} WHERE workout_id = ? ORDER BY sort_order ASC`).all(workoutId) as { id: string }[];
  const updateStmt = db.prepare(`UPDATE ${table} SET text = ?, sort_order = ? WHERE id = ?`);
  const insertStmt = db.prepare(`INSERT INTO ${table} (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)`);
  const deleteStmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
  clean.forEach((text, i) => {
    if (existing[i]) updateStmt.run(text, i, existing[i].id);
    else insertStmt.run(nanoid(), workoutId, text, i);
  });
  existing.slice(clean.length).forEach((row) => deleteStmt.run(row.id));
}

function upsertExercisesByPosition(workoutId: string, exercises: NonNullable<WorkoutPayload['exercises']>) {
  const clean = exercises.filter((e) => e.name && e.name.trim());
  const existing = db.prepare('SELECT id FROM workout_exercises WHERE workout_id = ? ORDER BY sort_order ASC').all(workoutId) as { id: string }[];
  const updateStmt = db.prepare('UPDATE workout_exercises SET name = ?, sets = ?, reps = ?, load = ?, note = ?, sort_order = ? WHERE id = ?');
  const insertStmt = db.prepare('INSERT INTO workout_exercises (id, workout_id, name, sets, reps, load, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const deleteStmt = db.prepare('DELETE FROM workout_exercises WHERE id = ?');
  clean.forEach((e, i) => {
    if (existing[i]) updateStmt.run(e.name.trim(), e.sets || '', e.reps || '', e.load || '', e.note || '', i, existing[i].id);
    else insertStmt.run(nanoid(), workoutId, e.name.trim(), e.sets || '', e.reps || '', e.load || '', e.note || '', i);
  });
  existing.slice(clean.length).forEach((row) => deleteStmt.run(row.id));
}

workoutsRouter.put('/:id', (req: AuthedRequest, res) => {
  const existing = ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  const body = req.body as WorkoutPayload;
  const name = (body.name || '').trim() || 'Treino sem nome';
  db.prepare(`UPDATE workouts SET name = ?, subtitle = ?, day_of_week = ?, time = ?, cardio_modality = ?, cardio_duration = ?, cardio_extra = ?, notes = ? WHERE id = ?`)
    .run(name, (body.subtitle || '').trim(), body.day ?? null, body.time || '07:00',
      body.cardio?.modality || '', body.cardio?.duration || '', body.cardio?.extra || '', body.notes || '', existing.id);
  if (body.warmup) {
    db.prepare('DELETE FROM workout_warmup_items WHERE workout_id = ?').run(existing.id);
    const stmt = db.prepare('INSERT INTO workout_warmup_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
    body.warmup.filter((t) => t && t.trim()).forEach((t, i) => stmt.run(nanoid(), existing.id, t.trim(), i));
  }
  upsertTextItemsByPosition('workout_stretch_items', existing.id, body.stretches ?? []);
  upsertTextItemsByPosition('workout_core_items', existing.id, body.core ?? []);
  upsertExercisesByPosition(existing.id, body.exercises ?? []);
  res.json(serializeWorkout(ownedWorkoutRow(req.userId!, existing.id)!));
});

workoutsRouter.patch('/:id', (req: AuthedRequest, res) => {
  const existing = ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  const body = req.body as Partial<WorkoutPayload>;
  const next = {
    name: body.name !== undefined ? body.name : existing.name,
    subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
    day_of_week: body.day !== undefined ? body.day : existing.day_of_week,
    time: body.time !== undefined ? body.time : existing.time,
  };
  db.prepare('UPDATE workouts SET name = ?, subtitle = ?, day_of_week = ?, time = ? WHERE id = ?')
    .run(next.name, next.subtitle, next.day_of_week, next.time, existing.id);
  res.json(serializeWorkout(ownedWorkoutRow(req.userId!, existing.id)!));
});

workoutsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const existing = ownedWorkoutRow(req.userId!, req.params.id);
  if (!existing) { res.status(404).json({ error: 'Treino não encontrado.' }); return; }
  db.prepare('DELETE FROM workouts WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

// --- quick nested-item updates (used from the workout detail screen) ---

workoutsRouter.patch('/:workoutId/exercises/:id', (req: AuthedRequest, res) => {
  const row = db.prepare(`SELECT we.id FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id
                           WHERE we.id = ? AND we.workout_id = ? AND w.user_id = ?`)
    .get(req.params.id, req.params.workoutId, req.userId) as { id: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Exercício não encontrado.' }); return; }
  const body = req.body as { load?: string; photoUrl?: string | null };
  if (body.load !== undefined) db.prepare('UPDATE workout_exercises SET load = ? WHERE id = ?').run(body.load, row.id);
  if (body.photoUrl !== undefined) db.prepare('UPDATE workout_exercises SET photo_url = ? WHERE id = ?').run(body.photoUrl, row.id);
  res.json({ ok: true });
});

workoutsRouter.patch('/:workoutId/stretch-items/:id', (req: AuthedRequest, res) => {
  const row = db.prepare(`SELECT si.id FROM workout_stretch_items si JOIN workouts w ON w.id = si.workout_id
                           WHERE si.id = ? AND si.workout_id = ? AND w.user_id = ?`)
    .get(req.params.id, req.params.workoutId, req.userId) as { id: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Alongamento não encontrado.' }); return; }
  const body = req.body as { photoUrl?: string | null };
  if (body.photoUrl !== undefined) db.prepare('UPDATE workout_stretch_items SET photo_url = ? WHERE id = ?').run(body.photoUrl, row.id);
  res.json({ ok: true });
});

workoutsRouter.patch('/:workoutId/core-items/:id', (req: AuthedRequest, res) => {
  const row = db.prepare(`SELECT ci.id FROM workout_core_items ci JOIN workouts w ON w.id = ci.workout_id
                           WHERE ci.id = ? AND ci.workout_id = ? AND w.user_id = ?`)
    .get(req.params.id, req.params.workoutId, req.userId) as { id: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Item de core não encontrado.' }); return; }
  const body = req.body as { photoUrl?: string | null };
  if (body.photoUrl !== undefined) db.prepare('UPDATE workout_core_items SET photo_url = ? WHERE id = ?').run(body.photoUrl, row.id);
  res.json({ ok: true });
});
