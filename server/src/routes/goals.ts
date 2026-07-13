import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { wrap } from '../wrap.js';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

goalsRouter.get('/', wrap<AuthedRequest>(async (req, res) => {
  const { data: row, error } = await supabase
    .from('goals').select('project, water, protein')
    .eq('user_id', req.userId).maybeSingle();
  if (error) throw error;
  if (!row) { res.json(null); return; }

  const { data: timeline, error: timelineError } = await supabase
    .from('goals_timeline').select('month, foco')
    .eq('user_id', req.userId).order('sort_order', { ascending: true });
  if (timelineError) throw timelineError;

  res.json({ ...row, timeline: timeline || [] });
}));
