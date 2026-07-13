import { Router } from 'express';
import { nanoid } from 'nanoid';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';
import type { BlockType, DaySelections } from '../types.js';

export const dayPlanRouter = Router();
dayPlanRouter.use(requireAuth);

async function ensureSelectionsRow(userId: string, dow: number) {
  const { error } = await supabase
    .from('day_selections')
    .upsert({ user_id: userId, day_of_week: dow }, { onConflict: 'user_id,day_of_week', ignoreDuplicates: true });
  if (error) throw error;
}

dayPlanRouter.get('/:dow/blocks', wrap<AuthedRequest>(async (req, res) => {
  const dow = Number(req.params.dow);
  const { data, error } = await supabase
    .from('day_blocks')
    .select('id, time, type, label, meal_type')
    .eq('user_id', req.userId).eq('day_of_week', dow)
    .order('time', { ascending: true });
  if (error) throw error;
  res.json((data || []).map((r) => ({ id: r.id, time: r.time, type: r.type, label: r.label, mealType: r.meal_type })));
}));

dayPlanRouter.post('/:dow/blocks', wrap<AuthedRequest>(async (req, res) => {
  const dow = Number(req.params.dow);
  const time = String(req.body?.time || '12:00');
  const label = String(req.body?.label || '');
  const id = nanoid();
  const { error } = await supabase.from('day_blocks').insert({
    id, user_id: req.userId, day_of_week: dow, time, type: 'plain', label, meal_type: null,
  });
  if (error) throw error;
  res.json({ id, time, type: 'plain' as BlockType, label, mealType: null });
}));

dayPlanRouter.patch('/blocks/:id', wrap<AuthedRequest>(async (req, res) => {
  const patch: Record<string, string> = {};
  if (req.body?.time !== undefined) patch.time = String(req.body.time);
  if (req.body?.label !== undefined) patch.label = String(req.body.label);

  const { data, error } = await supabase
    .from('day_blocks').update(patch)
    .eq('id', req.params.id).eq('user_id', req.userId)
    .select('id').maybeSingle();
  if (error) throw error;
  if (!data) { res.status(404).json({ error: 'Atividade não encontrada.' }); return; }
  res.json({ ok: true });
}));

dayPlanRouter.delete('/blocks/:id', wrap<AuthedRequest>(async (req, res) => {
  const { error } = await supabase.from('day_blocks').delete().eq('id', req.params.id).eq('user_id', req.userId);
  if (error) throw error;
  res.json({ ok: true });
}));

dayPlanRouter.get('/:dow/selections', wrap<AuthedRequest>(async (req, res) => {
  const dow = Number(req.params.dow);
  await ensureSelectionsRow(req.userId!, dow);
  const { data, error } = await supabase
    .from('day_selections')
    .select('cafe_selected_id, lanche_manha_selected_id, lanche_tarde_selected_id, jantar_selected_id, almoco_checked')
    .eq('user_id', req.userId).eq('day_of_week', dow).single();
  if (error) throw error;
  res.json({
    cafeSelectedId: data.cafe_selected_id,
    lancheManhaSelectedId: data.lanche_manha_selected_id,
    lancheTardeSelectedId: data.lanche_tarde_selected_id,
    jantarSelectedId: data.jantar_selected_id,
    almocoChecked: !!data.almoco_checked,
  });
}));

const SELECTION_COLUMNS: Record<keyof Omit<DaySelections, 'almocoChecked'>, string> = {
  cafeSelectedId: 'cafe_selected_id',
  lancheManhaSelectedId: 'lanche_manha_selected_id',
  lancheTardeSelectedId: 'lanche_tarde_selected_id',
  jantarSelectedId: 'jantar_selected_id',
};

dayPlanRouter.patch('/:dow/selections', wrap<AuthedRequest>(async (req, res) => {
  const dow = Number(req.params.dow);
  await ensureSelectionsRow(req.userId!, dow);

  const body = req.body as Partial<DaySelections>;
  const patch: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(SELECTION_COLUMNS)) {
    if (key in body) patch[col] = (body as any)[key];
  }
  if ('almocoChecked' in body) patch.almoco_checked = !!body.almocoChecked;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('day_selections').update(patch).eq('user_id', req.userId).eq('day_of_week', dow);
    if (error) throw error;
  }
  res.json({ ok: true });
}));
