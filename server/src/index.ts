import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './db.js';
import { authRouter } from './routes/auth.js';
import { mealsRouter } from './routes/meals.js';
import { workoutsRouter } from './routes/workouts.js';
import { dayPlanRouter } from './routes/dayPlan.js';
import { goalsRouter } from './routes/goals.js';
import { completionsRouter } from './routes/completions.js';
import { uploadsRouter, uploadsDir } from './routes/uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/day-plan', dayPlanRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/completions', completionsRouter);
app.use('/api/uploads', uploadsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err?.status || 500).json({ error: err?.message || 'Erro interno do servidor.' });
});

const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
