import { Router } from 'express';
import { db } from '../db.js';
import { COOKIE_NAME, requireAuth, signSession, type AuthedRequest, getUserById } from '../auth.js';
import type { User } from '../types.js';

export const authRouter = Router();

const isProd = process.env.NODE_ENV === 'production';

authRouter.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'E-mail é obrigatório.' });
    return;
  }
  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user) {
    res.status(401).json({ error: 'E-mail não reconhecido. Tente novamente.' });
    return;
  }
  const token = signSession(user.id);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 180 * 24 * 60 * 60 * 1000,
  });
  res.json({ user });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  const user = getUserById(req.userId!);
  res.json({ user });
});
