import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';

export const progressRouter = Router();
progressRouter.use(requireAuth);

progressRouter.get('/summary', wrap<AuthedRequest>(async (req, res) => {
  const month = String(req.query.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) { res.status(400).json({ error: 'month deve ser YYYY-MM.' }); return; }

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const from = `${month}-01`;
  const to = `${month}-${String(daysInMonth).padStart(2, '0')}`;

  const { data: completionRows, error: completionsError } = await supabase
    .from('completions')
    .select('date')
    .eq('user_id', req.userId)
    .gte('date', from).lte('date', to);
  if (completionsError) throw completionsError;
  const trainedDays = Array.from(new Set((completionRows || []).map((r) => Number(r.date.slice(8, 10))))).sort((a, b) => a - b);

  const { data: historyRows, error: historyError } = await supabase
    .from('exercise_load_log')
    .select('workout_id, exercise_name, load, recorded_at, workouts(name)')
    .eq('user_id', req.userId)
    .order('recorded_at', { ascending: true });
  if (historyError) throw historyError;

  const byExercise = new Map<string, { workoutId: string; workoutName: string; exerciseName: string; history: { load: string; recordedAt: string }[] }>();
  for (const r of (historyRows || []) as any[]) {
    const key = `${r.workout_id}::${r.exercise_name}`;
    if (!byExercise.has(key)) {
      byExercise.set(key, { workoutId: r.workout_id, workoutName: r.workouts?.name || '', exerciseName: r.exercise_name, history: [] });
    }
    byExercise.get(key)!.history.push({ load: r.load, recordedAt: r.recorded_at });
  }

  res.json({ trainedDays, exercises: Array.from(byExercise.values()) });
}));
