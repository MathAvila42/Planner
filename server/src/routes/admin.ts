import crypto from 'node:crypto';
import { Router } from 'express';
import type { Request } from 'express';
import { wrap } from '../wrap.js';
import { runSeed } from '../seedData.js';

export const adminRouter = Router();

function tokenMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function providedToken(req: Request): string {
  return req.get('x-admin-token') || String(req.query.token || '');
}

// Temporary, token-gated one-off route to run the initial seed against a
// freshly-deployed Supabase project without needing a local Node setup.
// Accepts the token via header or query string (so it can be triggered by
// just visiting the URL) and via GET or POST. Fails closed: with no
// ADMIN_SEED_TOKEN configured, every request is rejected regardless of what
// token is supplied. Meant to be removed once the seed has run once in production.
const handler = wrap(async (req: Request, res) => {
  const expected = process.env.ADMIN_SEED_TOKEN;
  const provided = providedToken(req);
  if (!expected || !provided || !tokenMatches(expected, provided)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const result = await runSeed();
  res.json(result);
});

adminRouter.get('/seed', handler);
adminRouter.post('/seed', handler);
