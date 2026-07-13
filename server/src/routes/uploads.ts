import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${nanoid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) { cb(new Error('Tipo de arquivo não suportado.')); return; }
    cb(null, true);
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado.' }); return; }
  res.json({ url: `/uploads/${req.file.filename}` });
});
