import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { supabase } from './supabaseClient.js';
import { wrap } from './wrap.js';
import type { User } from './types.js';

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) {
  throw new Error('SESSION_SECRET é obrigatório (defina uma string aleatória longa no .env local ou nas variáveis de ambiente do Vercel).');
}
const secret: string = rawSecret;

export const COOKIE_NAME = 'rotina_session';

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '180d' });
}

export interface AuthedRequest extends Request {
  userId?: string;
}

export const requireAuth = wrap<AuthedRequest>(async (req, res, next: NextFunction) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) { res.status(401).json({ error: 'not_authenticated' }); return; }
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, secret) as { sub: string };
  } catch {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }
  const user = await getUserById(payload.sub);
  if (!user) { res.status(401).json({ error: 'not_authenticated' }); return; }
  req.userId = user.id;
  next();
});

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('id, name, email').eq('id', id).maybeSingle();
  return data ?? undefined;
}
