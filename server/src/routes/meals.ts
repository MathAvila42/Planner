import { Router } from 'express';
import { nanoid } from 'nanoid';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';
import { MEAL_TYPES, type MealType } from '../types.js';

export const mealsRouter = Router();
mealsRouter.use(requireAuth);

function isMealType(v: string): v is MealType {
  return (MEAL_TYPES as string[]).includes(v);
}

const SELECTION_COLUMNS: Record<MealType, string> = {
  cafe: 'cafe_selected_id',
  lancheManha: 'lanche_manha_selected_id',
  lancheTarde: 'lanche_tarde_selected_id',
  jantar: 'jantar_selected_id',
};

mealsRouter.get('/', wrap<AuthedRequest>(async (req, res) => {
  const { data, error } = await supabase
    .from('meal_options')
    .select('id, meal_type, name')
    .eq('user_id', req.userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;

  const library: Record<MealType, { id: string; name: string }[]> = { cafe: [], lancheManha: [], lancheTarde: [], jantar: [] };
  for (const r of data || []) library[r.meal_type as MealType].push({ id: r.id, name: r.name });
  res.json(library);
}));

mealsRouter.post('/:mealType', wrap<AuthedRequest>(async (req, res) => {
  const { mealType } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }
  const name = String(req.body?.name || '').trim();
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório.' }); return; }

  const { data: maxRow, error: maxError } = await supabase
    .from('meal_options').select('sort_order')
    .eq('user_id', req.userId).eq('meal_type', mealType)
    .order('sort_order', { ascending: false }).limit(1).maybeSingle();
  if (maxError) throw maxError;

  const id = nanoid();
  const { error } = await supabase.from('meal_options').insert({
    id, user_id: req.userId, meal_type: mealType, name, sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) throw error;
  res.json({ id, name });
}));

mealsRouter.patch('/:mealType/:id', wrap<AuthedRequest>(async (req, res) => {
  const { mealType, id } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }
  const name = String(req.body?.name || '').trim();
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório.' }); return; }

  const { data, error } = await supabase
    .from('meal_options').update({ name })
    .eq('id', id).eq('user_id', req.userId).eq('meal_type', mealType)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data) { res.status(404).json({ error: 'Opção não encontrada.' }); return; }
  res.json({ id, name });
}));

mealsRouter.delete('/:mealType/:id', wrap<AuthedRequest>(async (req, res) => {
  const { mealType, id } = req.params;
  if (!isMealType(mealType)) { res.status(400).json({ error: 'Tipo de refeição inválido.' }); return; }

  const { error } = await supabase.from('meal_options').delete().eq('id', id).eq('user_id', req.userId).eq('meal_type', mealType);
  if (error) throw error;

  // clear any day selections pointing at the deleted option
  const col = SELECTION_COLUMNS[mealType];
  const { error: clearError } = await supabase.from('day_selections').update({ [col]: null }).eq('user_id', req.userId).eq(col, id);
  if (clearError) throw clearError;

  res.json({ ok: true });
}));
