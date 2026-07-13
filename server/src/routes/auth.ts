import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { COOKIE_NAME, requireAuth, signSession, type AuthedRequest, getUserById } from '../auth.js';
import { wrap } from '../wrap.js';
import type { User } from '../types.js';

export const authRouter = Router();

const isProd = process.env.NODE_ENV === 'production';

authRouter.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) { res.status(400).json({ error: 'E-mail é obrigatório.' }); return; }

  const { data: user } = await supabase.from('users').select('id, name, email').eq('email', email).maybeSingle<User>();
  if (!user) { res.status(401).json({ error: 'E-mail não reconhecido. Tente novamente.' }); return; }

  const token = signSession(user.id);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 180 * 24 * 60 * 60 * 1000,
  });
  res.json({ user });
}));

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, wrap<AuthedRequest>(async (req, res) => {
  const user = await getUserById(req.userId!);
  res.json({ user });
}));
