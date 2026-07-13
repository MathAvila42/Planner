import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

goalsRouter.get('/', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT project, water, protein FROM goals WHERE user_id = ?').get(req.userId) as
    { project: string; water: string; protein: string } | undefined;
  if (!row) { res.json(null); return; }
  const timeline = db.prepare('SELECT month, foco FROM goals_timeline WHERE user_id = ? ORDER BY sort_order ASC').all(req.userId);
  res.json({ ...row, timeline });
});
