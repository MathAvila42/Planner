import crypto from 'node:crypto';
import { Router } from 'express';
import { wrap } from '../wrap.js';
import { runSeed } from '../seedData.js';

export const adminRouter = Router();

function tokenMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Temporary, token-gated one-off route to run the initial seed against a
// freshly-deployed Supabase project without needing a local Node setup.
// Fails closed: with no ADMIN_SEED_TOKEN configured, every request is rejected,
// regardless of what token is supplied. Meant to be removed once the seed has
// run once in production.
adminRouter.post('/seed', wrap(async (req, res) => {
  const expected = process.env.ADMIN_SEED_TOKEN;
  const provided = req.get('x-admin-token');
  if (!expected || !provided || !tokenMatches(expected, provided)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  const result = await runSeed();
  res.json(result);
}));
