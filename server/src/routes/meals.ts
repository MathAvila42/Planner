import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { MEAL_TYPES, type MealType } from '../types.js';

export const mealsRouter = Router();
mealsRouter.use(requireAuth);

function isMealType(v: string): v is MealType {
  return (MEAL_TYPES as string[]).includes(v);
}

mealsRouter.get('/', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT id, meal_type as mealType, name FROM meal_options WHERE user_id = ? ORDER BY sort_order ASC')
    .all(req.userId) as { id: string; mealType: MealType; name: string }[];
  const library: Record<MealType, { id: string; name: string }[]> = {
    cafe: [], lancheManha: [], lancheTarde: [], jantar: [],
  };
  for (const r of rows) library[r.mealType].push({ id: r.id, name: r.name });
  res.json(library);
});

mealsRouter.post('/:mealType', (req: AuthedRequest, res) => {
  const { mealType } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }
  const name = String(req.body?.name || '').trim();
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório.' }); return; }
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM meal_options WHERE user_id = ? AND meal_type = ?')
    .get(req.userId, mealType) as { m: number };
  const id = nanoid();
  db.prepare('INSERT INTO meal_options (id, user_id, meal_type, name, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, mealType, name, maxOrder.m + 1);
  res.json({ id, name });
});

mealsRouter.patch('/:mealType/:id', (req: AuthedRequest, res) => {
  const { mealType, id } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }
  const name = String(req.body?.name || '').trim();
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório.' }); return; }
  const info = db
    .prepare('UPDATE meal_options SET name = ? WHERE id = ? AND user_id = ? AND meal_type = ?')
    .run(name, id, req.userId, mealType);
  if (info.changes === 0) { res.status(404).json({ error: 'Opção não encontrada.' }); return; }
  res.json({ id, name });
});

mealsRouter.delete('/:mealType/:id', (req: AuthedRequest, res) => {
  const { mealType, id } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }
  db.prepare('DELETE FROM meal_options WHERE id = ? AND user_id = ? AND meal_type = ?').run(id, req.userId, mealType);
  // clear any day selections pointing at the deleted option
  const columnMap: Record<MealType, string> = {
    cafe: 'cafe_selected_id',
    lancheManha: 'lanche_manha_selected_id',
    lancheTarde: 'lanche_tarde_selected_id',
    jantar: 'jantar_selected_id',
  };
  db.prepare(`UPDATE day_selections SET ${columnMap[mealType]} = NULL WHERE user_id = ? AND ${columnMap[mealType]} = ?`)
    .run(req.userId, id);
  res.json({ ok: true });
});
