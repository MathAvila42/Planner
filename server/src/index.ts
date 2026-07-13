import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app } from './app.js';

// Local-only: serves the built web/dist next to the API on one port, for
// `npm run build:web && npm run build --workspace=server && npm start --workspace=server`.
// On Vercel the frontend is served as static output directly, not through Express.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
