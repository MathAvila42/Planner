import 'dotenv/config';
import { runSeed } from './seedData.js';

runSeed()
  .then(({ skipped }) => {
    if (skipped) {
      console.log('Banco de dados já contém usuários — seed ignorado. Apague as tabelas no Supabase (ou o projeto) para reiniciar do zero.');
    } else {
      console.log('Seed concluído: Monique (dados completos do planner) e Matheus (em branco).');
    }
  })
  .catch((err) => {
    console.error('Seed falhou:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
