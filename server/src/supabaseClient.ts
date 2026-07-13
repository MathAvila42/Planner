import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios (defina no .env local ou nas variáveis de ambiente do Vercel).');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const PHOTOS_BUCKET = 'workout-photos';

let bucketReady: Promise<void> | null = null;

/** Creates the public photos bucket on first use if it doesn't exist yet. Idempotent. */
export function ensurePhotosBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await supabase.storage.getBucket(PHOTOS_BUCKET);
      if (!data) {
        const { error } = await supabase.storage.createBucket(PHOTOS_BUCKET, { public: true });
        if (error && !/already exists/i.test(error.message)) throw error;
      }
    })();
  }
  return bucketReady;
}
