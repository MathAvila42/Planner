import { nanoid } from 'nanoid';
import { db } from './db.js';
import type { MealType } from './types.js';

const existingUsers = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
if (existingUsers.c > 0) {
  console.log('Banco de dados já contém usuários — seed ignorado. Apague server/data/app.sqlite para reiniciar do zero.');
  process.exit(0);
}

const insertUser = db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)');
const moniqueId = nanoid();
const matheusId = nanoid();
insertUser.run(moniqueId, 'Monique', 'moniquebeck1996@gmail.com');
insertUser.run(matheusId, 'Matheus', 'e.matheus.avila@gmail.com');

// ---------------------------------------------------------------------------
// Monique — populated from her real planner (see design/project/uploads/Planner Monique Beck.pdf
// and the design handoff in design/chats/chat1.md)
// ---------------------------------------------------------------------------

const mealLibrary: Record<MealType, { key: string; name: string }[]> = {
  cafe: [
    { key: 'cafe1', name: 'Ovos mexidos + pão integral' },
    { key: 'cafe2', name: 'Iogurte grego + aveia + frutas' },
    { key: 'cafe3', name: 'Tapioca + queijo + peito de peru' },
    { key: 'cafe4', name: 'Panqueca proteica de banana' },
    { key: 'cafe5', name: 'Overnight oats' },
    { key: 'cafe6', name: 'Crepioca + queijo' },
    { key: 'cafe7', name: 'Omelete mediterrâneo' },
  ],
  lancheManha: [
    { key: 'lm1', name: 'Banana + 10 castanhas' },
    { key: 'lm2', name: '1 fruta da estação' },
    { key: 'lm3', name: 'Mix de castanhas' },
    { key: 'lm4', name: '1 maçã' },
    { key: 'lm5', name: 'Smoothie verde' },
    { key: 'lm6', name: 'Muffin de banana' },
    { key: 'lm7', name: 'Frutas + granola' },
  ],
  lancheTarde: [
    { key: 'lt1', name: 'Iogurte + morangos' },
    { key: 'lt2', name: 'Banana + pasta de amendoim' },
    { key: 'lt3', name: 'Iogurte + granola' },
    { key: 'lt4', name: 'Torradas + ricota' },
    { key: 'lt5', name: 'Fruta + 10 castanhas' },
    { key: 'lt6', name: 'Fruta' },
    { key: 'lt7', name: 'Iogurte + aveia' },
  ],
  jantar: [
    { key: 'jt1', name: 'Omelete + salada verde' },
    { key: 'jt2', name: 'Tilápia + abobrinha + arroz' },
    { key: 'jt3', name: 'Wrap integral com frango' },
    { key: 'jt4', name: 'Frango oriental + legumes' },
    { key: 'jt5', name: 'Sopa de legumes com frango' },
    { key: 'jt6', name: 'Refeição livre' },
    { key: 'jt7', name: 'Sopa leve ou omelete' },
  ],
};

const mealIdByKey: Record<string, string> = {};
const insertMealOption = db.prepare('INSERT INTO meal_options (id, user_id, meal_type, name, sort_order) VALUES (?, ?, ?, ?, ?)');
(Object.keys(mealLibrary) as MealType[]).forEach((mealType) => {
  mealLibrary[mealType].forEach((opt, i) => {
    const id = nanoid();
    mealIdByKey[opt.key] = id;
    insertMealOption.run(id, moniqueId, mealType, opt.name, i);
  });
});

interface ExerciseSeed { name: string; sets: string; reps: string; load?: string; note?: string }
const ex = (name: string, sets: string, reps: string, load = '', note = ''): ExerciseSeed => ({ name, sets, reps, load, note });

interface WorkoutSeed {
  key: string; name: string; subtitle: string; day: number; time: string;
  warmup: string[]; stretches: string[]; exercises: ExerciseSeed[]; core: string[];
  cardio: { modality: string; duration: string; extra: string }; notes: string;
}

const workouts: WorkoutSeed[] = [
  { key: 'wA', name: 'Inferiores A', subtitle: 'Pernas (Quadríceps)', day: 0, time: '07:00',
    warmup: ['10 min bicicleta', 'Mobilidade de quadril — 8 rep cada lado', 'Ativação de glúteos com miniband — 20 rep'],
    stretches: ['Alongamento Psoas — 30 seg cada', 'Alongamento Isquiotibiais — 30 seg cada', 'Rotação de Quadril — 8 rep cada'],
    exercises: [
      ex('Leg Press 45°', '4', '12', '', 'Não deixar a lombar arredondar'),
      ex('Cadeira Extensora', '3', '15', '', 'Movimento controlado'),
      ex('Afundo no Smith', '3', '12', '', 'Mais estável que barra livre'),
      ex('Cadeira Abdutora', '4', '20', '', 'Foco no quadril e glúteo médio'),
      ex('Panturrilha Sentada', '4', '20', '', 'Sobe e desce devagar'),
    ],
    core: ['Prancha — 3×30 seg', 'Bird Dog — 3×12 cada', 'Dead Bug — 3×12 cada'],
    cardio: { modality: 'Esteira inclinada', duration: '20 min', extra: 'Velocidade confortável' },
    notes: 'Amplitude parcial nos exercícios de joelho. Se sentir dor irradiando para a perna, interrompa e avise o professor.' },
  { key: 'wB', name: 'Superiores A', subtitle: 'Costas + Peito + Ombros', day: 1, time: '07:00',
    warmup: ['5 min bicicleta', 'Rotação de ombros com elástico — 10 rep', 'Retração escapular — 10 rep'],
    stretches: ['Alongamento peitoral na porta — 30 seg', 'Alongamento cervical leve — 20 seg cada', 'Rotação de ombros — 10 rep'],
    exercises: [
      ex('Pulldown (puxada frente)', '4', '12', '', 'Puxar até o queixo, coluna ereta'),
      ex('Remada Máquina (apoio no peito)', '4', '12', '', 'Evita sobrecarregar a lombar'),
      ex('Supino Máquina', '3', '12', '', 'Cotovelos levemente abaixo dos ombros'),
      ex('Crucifixo Máquina', '3', '15', '', 'Abertura controlada'),
      ex('Elevação Lateral', '3', '15', '', 'Sem balançar o corpo'),
      ex('Tríceps Corda', '3', '15', '', 'Abrir pontas no final'),
      ex('Rosca Scott Máquina', '3', '12', '', 'Cotovelo fixo, descida lenta'),
    ],
    core: [],
    cardio: { modality: 'Bicicleta ergométrica', duration: '30 min', extra: '' },
    notes: '' },
  { key: 'wRest', name: 'Pilates', subtitle: 'Descanso Ativo', day: 2, time: '07:00',
    warmup: [],
    stretches: ['Gato/Vaca — 10 rep', 'Mobilidade de Tornozelo — 10 círculos cada', 'Alongamento global leve — 5 min'],
    exercises: [],
    core: [],
    cardio: { modality: 'Caminhada leve (opcional)', duration: '30 min', extra: '' },
    notes: 'Dia de recuperação — crucial para o resultado. Pilates a reagendar como aula semanal fixa.' },
  { key: 'wC', name: 'Inferiores B', subtitle: 'Posterior + Glúteos', day: 3, time: '07:00',
    warmup: ['8 min elíptico', 'Ativação de glúteos com miniband — 15 rep cada', 'Mobilidade de quadril'],
    stretches: ['Alongamento Isquiotibiais — 30 seg cada', 'Alongamento Piriforme — 30 seg cada', 'Rotação de Quadril — 8 rep cada'],
    exercises: [
      ex('Mesa Flexora', '4', '12', '', 'Contração máxima, descida controlada'),
      ex('Cadeira Flexora', '3', '15', '', 'Sem arredondar a lombar'),
      ex('Elevação Pélvica Máquina', '4', '12', '', 'Melhor que com barra livre'),
      ex('Abdução Máquina', '4', '20', '', 'Foco no glúteo médio'),
      ex('Glúteo Máquina (extensão)', '3', '15', '', 'Contração no topo, core ativado'),
      ex('Panturrilha', '4', '20', '', 'Em pé ou sentada'),
    ],
    core: ['Prancha Lateral — 3×30 seg cada', 'Bird Dog — 3×12'],
    cardio: { modality: 'Elíptico', duration: '20 min', extra: '' },
    notes: '' },
  { key: 'wD', name: 'Superiores B', subtitle: 'Membros Superiores', day: 4, time: '07:00',
    warmup: ['5 min bicicleta', 'Rotação de ombros'],
    stretches: ['Alongamento peitoral — 30 seg', 'Alongamento tríceps — 30 seg cada', 'Rotação de ombros — 10 rep'],
    exercises: [
      ex('Puxada Frente', '4', '12', '', 'Variação da terça'),
      ex('Remada Sentada', '4', '12', '', 'Coluna ereta'),
      ex('Desenvolvimento Máquina', '3', '12', '', 'Cotovelos não descer abaixo de 90°'),
      ex('Peck Deck', '3', '15', '', 'Leve flexão dos cotovelos'),
      ex('Rosca Martelo', '3', '12', '', 'Alternado, cotovelo fixo'),
      ex('Tríceps Máquina', '3', '15', '', 'Extensão completa'),
      ex('Abdominal Máquina', '3', '15', '', 'Pouca carga, foco na contração'),
    ],
    core: [],
    cardio: { modality: 'Bicicleta ou elíptico', duration: '30 min', extra: '' },
    notes: '' },
  { key: 'wSab', name: 'Cardio + Core', subtitle: 'Circuito de Sábado', day: 5, time: '09:30',
    warmup: [],
    stretches: ['Alongamentos gerais — 10 min'],
    exercises: [],
    core: ['Agachamento sem peso — 15 rep', 'Step baixo — 20 rep', 'Abdução com elástico — 20 rep', 'Prancha — 30 seg', 'Dead Bug — 15 rep'],
    cardio: { modality: 'Caminhada ao ar livre', duration: '40 min', extra: '' },
    notes: 'Circuito — repetir 3 voltas. Finalizar com 10 min de alongamentos.' },
];

const insertWorkout = db.prepare(`INSERT INTO workouts (id, user_id, name, subtitle, day_of_week, time, cardio_modality, cardio_duration, cardio_extra, notes, sort_order)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertWarmup = db.prepare('INSERT INTO workout_warmup_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
const insertStretch = db.prepare('INSERT INTO workout_stretch_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
const insertCore = db.prepare('INSERT INTO workout_core_items (id, workout_id, text, sort_order) VALUES (?, ?, ?, ?)');
const insertExercise = db.prepare('INSERT INTO workout_exercises (id, workout_id, name, sets, reps, load, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

workouts.forEach((w, i) => {
  const id = nanoid();
  insertWorkout.run(id, moniqueId, w.name, w.subtitle, w.day, w.time, w.cardio.modality, w.cardio.duration, w.cardio.extra, w.notes, i);
  w.warmup.forEach((t, idx) => insertWarmup.run(nanoid(), id, t, idx));
  w.stretches.forEach((t, idx) => insertStretch.run(nanoid(), id, t, idx));
  w.core.forEach((t, idx) => insertCore.run(nanoid(), id, t, idx));
  w.exercises.forEach((e, idx) => insertExercise.run(nanoid(), id, e.name, e.sets, e.reps, e.load || '', e.note || '', idx));
});

// Daily schedule blocks, one array per weekday (0=Segunda .. 6=Domingo)
const baseBlocks: { time: string; type: 'plain' | 'meal' | 'lunch'; label?: string; mealType?: MealType }[][] = [
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:30', type: 'plain', label: 'Banho + preparo' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '18:45', type: 'plain', label: 'Faculdade' }, { time: '22:15', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída — noite livre' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '23:00', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:45', type: 'meal', mealType: 'cafe' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '18:45', type: 'plain', label: 'Faculdade' }, { time: '22:15', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '20:00', type: 'plain', label: 'Terapia' }, { time: '21:30', type: 'plain', label: 'Descanso' }, { time: '23:00', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída — tempo livre' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '07:30', type: 'plain', label: 'Acordar com calma' }, { time: '08:00', type: 'meal', mealType: 'cafe' }, { time: '11:00', type: 'plain', label: 'Pilates (a reagendar)' }, { time: '12:30', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '19:00', type: 'meal', mealType: 'jantar' } ],
  [ { time: '08:30', type: 'meal', mealType: 'cafe' }, { time: '10:00', type: 'meal', mealType: 'lancheManha' }, { time: '12:30', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '16:30', type: 'plain', label: 'Lista de compras + autocuidado' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '22:00', type: 'plain', label: 'Dormir bem' } ],
];

const cafeSel = ['cafe1', 'cafe2', 'cafe3', 'cafe4', 'cafe5', 'cafe6', 'cafe7'];
const lmSel = ['lm1', 'lm2', 'lm3', 'lm4', 'lm5', 'lm6', 'lm7'];
const ltSel = ['lt1', 'lt2', 'lt3', 'lt4', 'lt5', 'lt6', 'lt7'];
const jtSel = ['jt1', 'jt2', 'jt3', 'jt4', 'jt5', 'jt6', 'jt7'];

const insertBlock = db.prepare(`INSERT INTO day_blocks (id, user_id, day_of_week, time, type, label, meal_type) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertSelections = db.prepare(`INSERT INTO day_selections (user_id, day_of_week, cafe_selected_id, lanche_manha_selected_id, lanche_tarde_selected_id, jantar_selected_id, almoco_checked)
                                      VALUES (?, ?, ?, ?, ?, ?, 0)`);

baseBlocks.forEach((blocks, dow) => {
  blocks.forEach((b) => {
    insertBlock.run(nanoid(), moniqueId, dow, b.time, b.type, b.label || '', b.mealType || null);
  });
  insertSelections.run(moniqueId, dow, mealIdByKey[cafeSel[dow]], mealIdByKey[lmSel[dow]], mealIdByKey[ltSel[dow]], mealIdByKey[jtSel[dow]]);
});

db.prepare('INSERT INTO goals (user_id, project, water, protein) VALUES (?, ?, ?, ?)')
  .run(moniqueId, 'Projeto Bem-estar', '2,5 – 3 L', '120 – 140 g');

const timeline = [
  { month: 'Julho', foco: 'Adaptar rotina, estabelecer hábitos' },
  { month: 'Agosto', foco: 'Consolidar treinos, marmitas consistentes' },
  { month: 'Setembro', foco: 'Aumentar cardio, progredir cargas' },
  { month: 'Outubro', foco: 'Manter ritmo, avaliar medidas' },
  { month: 'Novembro', foco: 'Intensificar, ajustes finos' },
  { month: 'Dezembro', foco: 'Celebrar a consistência do ano!' },
];
const insertTimeline = db.prepare('INSERT INTO goals_timeline (id, user_id, month, foco, sort_order) VALUES (?, ?, ?, ?, ?)');
timeline.forEach((t, i) => insertTimeline.run(nanoid(), moniqueId, t.month, t.foco, i));

// ---------------------------------------------------------------------------
// Matheus — starts empty; he registers everything himself from scratch.
// day_selections rows for all 7 weekdays so PATCH updates have a row to hit.
// ---------------------------------------------------------------------------
for (let dow = 0; dow < 7; dow++) {
  db.prepare('INSERT INTO day_selections (user_id, day_of_week) VALUES (?, ?)').run(matheusId, dow);
}

console.log('Seed concluído: Monique (dados completos do planner) e Matheus (em branco).');
