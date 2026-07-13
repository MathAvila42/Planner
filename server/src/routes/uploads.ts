import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { requireAuth } from '../auth.js';
import { wrap } from '../wrap.js';
import { supabase, PHOTOS_BUCKET, ensurePhotosBucket } from '../supabaseClient.js';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) { cb(new Error('Tipo de arquivo não suportado.')); return; }
    cb(null, true);
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post('/', upload.single('file'), wrap(async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado.' }); return; }
  await ensurePhotosBucket();

  const ext = ALLOWED_TYPES[req.file.mimetype];
  const filename = `${nanoid()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(filename, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(filename);
  res.json({ url: data.publicUrl });
}));
