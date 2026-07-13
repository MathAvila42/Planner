import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { mealsRouter } from './routes/meals.js';
import { workoutsRouter } from './routes/workouts.js';
import { dayPlanRouter } from './routes/dayPlan.js';
import { goalsRouter } from './routes/goals.js';
import { completionsRouter } from './routes/completions.js';
import { uploadsRouter } from './routes/uploads.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

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
