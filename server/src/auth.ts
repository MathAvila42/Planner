import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import type { User } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const secretPath = path.join(dataDir, 'session-secret.txt');

let secret: string;
if (fs.existsSync(secretPath)) {
  secret = fs.readFileSync(secretPath, 'utf8').trim();
} else {
  secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
}

export const COOKIE_NAME = 'rotina_session';

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '180d' });
}

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.sub) as { id: string } | undefined;
    if (!user) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'not_authenticated' });
  }
}

export function getUserById(id: string): User | undefined {
  return db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as User | undefined;
}
