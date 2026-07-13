import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import type { BlockType } from '../types.js';

export const dayPlanRouter = Router();
dayPlanRouter.use(requireAuth);

function ensureSelectionsRow(userId: string, dow: number) {
  const existing = db.prepare('SELECT 1 FROM day_selections WHERE user_id = ? AND day_of_week = ?').get(userId, dow);
  if (!existing) {
    db.prepare('INSERT INTO day_selections (user_id, day_of_week) VALUES (?, ?)').run(userId, dow);
  }
}

dayPlanRouter.get('/:dow/blocks', (req: AuthedRequest, res) => {
  const dow = Number(req.params.dow);
  const rows = db.prepare(`SELECT id, time, type, label, meal_type as mealType FROM day_blocks
                            WHERE user_id = ? AND day_of_week = ? ORDER BY time ASC`).all(req.userId, dow);
  res.json(rows);
});

dayPlanRouter.post('/:dow/blocks', (req: AuthedRequest, res) => {
  const dow = Number(req.params.dow);
  const time = String(req.body?.time || '12:00');
  const label = String(req.body?.label || '');
  const id = nanoid();
  db.prepare(`INSERT INTO day_blocks (id, user_id, day_of_week, time, type, label, meal_type)
              VALUES (?, ?, ?, ?, 'plain', ?, NULL)`).run(id, req.userId, dow, time, label);
  res.json({ id, time, type: 'plain' as BlockType, label, mealType: null });
});

dayPlanRouter.patch('/blocks/:id', (req: AuthedRequest, res) => {
  const existing = db.prepare('SELECT * FROM day_blocks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    { id: string; time: string; label: string } | undefined;
  if (!existing) { res.status(404).json({ error: 'Atividade não encontrada.' }); return; }
  const time = req.body?.time !== undefined ? String(req.body.time) : existing.time;
  const label = req.body?.label !== undefined ? String(req.body.label) : existing.label;
  db.prepare('UPDATE day_blocks SET time = ?, label = ? WHERE id = ?').run(time, label, existing.id);
  res.json({ ok: true });
});

dayPlanRouter.delete('/blocks/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM day_blocks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

dayPlanRouter.get('/:dow/selections', (req: AuthedRequest, res) => {
  const dow = Number(req.params.dow);
  ensureSelectionsRow(req.userId!, dow);
  const row = db.prepare(`SELECT cafe_selected_id as cafeSelectedId, lanche_manha_selected_id as lancheManhaSelectedId,
                                  lanche_tarde_selected_id as lancheTardeSelectedId, jantar_selected_id as jantarSelectedId,
                                  almoco_checked as almocoChecked
                           FROM day_selections WHERE user_id = ? AND day_of_week = ?`).get(req.userId, dow) as any;
  row.almocoChecked = !!row.almocoChecked;
  res.json(row);
});

const SELECTION_COLUMNS: Record<string, string> = {
  cafeSelectedId: 'cafe_selected_id',
  lancheManhaSelectedId: 'lanche_manha_selected_id',
  lancheTardeSelectedId: 'lanche_tarde_selected_id',
  jantarSelectedId: 'jantar_selected_id',
};

dayPlanRouter.patch('/:dow/selections', (req: AuthedRequest, res) => {
  const dow = Number(req.params.dow);
  ensureSelectionsRow(req.userId!, dow);
  const body = req.body as Partial<{ cafeSelectedId: string; lancheManhaSelectedId: string; lancheTardeSelectedId: string; jantarSelectedId: string; almocoChecked: boolean }>;
  for (const [key, col] of Object.entries(SELECTION_COLUMNS)) {
    if (key in body) {
      db.prepare(`UPDATE day_selections SET ${col} = ? WHERE user_id = ? AND day_of_week = ?`).run((body as any)[key], req.userId, dow);
    }
  }
  if ('almocoChecked' in body) {
    db.prepare('UPDATE day_selections SET almoco_checked = ? WHERE user_id = ? AND day_of_week = ?')
      .run(body.almocoChecked ? 1 : 0, req.userId, dow);
  }
  res.json({ ok: true });
});
