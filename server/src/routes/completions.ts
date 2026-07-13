import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import type { CompletionSection } from '../types.js';

export const completionsRouter = Router();
completionsRouter.use(requireAuth);

completionsRouter.get('/', (req: AuthedRequest, res) => {
  const date = String(req.query.date || '');
  if (!date) { res.status(400).json({ error: 'date é obrigatório.' }); return; }
  const rows = db.prepare('SELECT workout_id as workoutId, section, item_id as itemId FROM completions WHERE user_id = ? AND date = ?')
    .all(req.userId, date) as { workoutId: string; section: CompletionSection; itemId: string }[];
  const result: Record<string, { stretches: Record<string, true>; exercises: Record<string, true> }> = {};
  for (const r of rows) {
    if (!result[r.workoutId]) result[r.workoutId] = { stretches: {}, exercises: {} };
    result[r.workoutId][r.section][r.itemId] = true;
  }
  res.json(result);
});

completionsRouter.post('/toggle', (req: AuthedRequest, res) => {
  const { workoutId, section, itemId, date } = req.body as { workoutId: string; section: CompletionSection; itemId: string; date: string };
  if (!workoutId || !section || !itemId || !date) { res.status(400).json({ error: 'Campos obrigatórios ausentes.' }); return; }
  const existing = db.prepare('SELECT 1 FROM completions WHERE user_id = ? AND workout_id = ? AND section = ? AND item_id = ? AND date = ?')
    .get(req.userId, workoutId, section, itemId, date);
  let done: boolean;
  if (existing) {
    db.prepare('DELETE FROM completions WHERE user_id = ? AND workout_id = ? AND section = ? AND item_id = ? AND date = ?')
      .run(req.userId, workoutId, section, itemId, date);
    done = false;
  } else {
    db.prepare('INSERT INTO completions (user_id, workout_id, section, item_id, date) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, workoutId, section, itemId, date);
    done = true;
  }
  res.json({ done });
});
