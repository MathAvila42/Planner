import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';
import type { CompletionSection } from '../types.js';

export const completionsRouter = Router();
completionsRouter.use(requireAuth);

completionsRouter.get('/', wrap<AuthedRequest>(async (req, res) => {
  const date = String(req.query.date || '');
  if (!date) { res.status(400).json({ error: 'date é obrigatório.' }); return; }

  const { data, error } = await supabase
    .from('completions')
    .select('workout_id, section, item_id')
    .eq('user_id', req.userId).eq('date', date);
  if (error) throw error;

  const result: Record<string, { stretches: Record<string, true>; exercises: Record<string, true> }> = {};
  for (const r of data || []) {
    if (!result[r.workout_id]) result[r.workout_id] = { stretches: {}, exercises: {} };
    result[r.workout_id][r.section as CompletionSection][r.item_id] = true;
  }
  res.json(result);
}));

completionsRouter.post('/toggle', wrap<AuthedRequest>(async (req, res) => {
  const { workoutId, section, itemId, date } = req.body as { workoutId: string; section: CompletionSection; itemId: string; date: string };
  if (!workoutId || !section || !itemId || !date) { res.status(400).json({ error: 'Campos obrigatórios ausentes.' }); return; }

  const { data: existing, error: findError } = await supabase
    .from('completions').select('user_id')
    .eq('user_id', req.userId).eq('workout_id', workoutId).eq('section', section).eq('item_id', itemId).eq('date', date)
    .maybeSingle();
  if (findError) throw findError;

  let done: boolean;
  if (existing) {
    const { error } = await supabase
      .from('completions').delete()
      .eq('user_id', req.userId).eq('workout_id', workoutId).eq('section', section).eq('item_id', itemId).eq('date', date);
    if (error) throw error;
    done = false;
  } else {
    const { error } = await supabase
      .from('completions').insert({ user_id: req.userId, workout_id: workoutId, section, item_id: itemId, date });
    if (error) throw error;
    done = true;
  }
  res.json({ done });
}));
