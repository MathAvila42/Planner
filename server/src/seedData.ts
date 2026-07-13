import { nanoid } from 'nanoid';
import { supabase } from './supabaseClient.js';
import type { MealType } from './types.js';

interface ExerciseSeed { name: string; sets: string; reps: string; load?: string; note?: string }
const ex = (name: string, sets: string, reps: string, load = '', note = ''): ExerciseSeed => ({ name, sets, reps, load, note });

interface WorkoutSeed {
  name: string; subtitle: string; day: number; time: string;
  warmup: string[]; stretches: string[]; exercises: ExerciseSeed[]; core: string[];
  cardio: { modality: string; duration: string; extra: string }; notes: string;
}

const MEAL_LIBRARY: Record<MealType, { key: string; name: string }[]> = {
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

const WORKOUTS: WorkoutSeed[] = [
  { name: 'Inferiores A', subtitle: 'Pernas (Quadríceps)', day: 0, time: '07:00',
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
  { name: 'Superiores A', subtitle: 'Costas + Peito + Ombros', day: 1, time: '07:00',
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
  { name: 'Pilates', subtitle: 'Descanso Ativo', day: 2, time: '07:00',
    warmup: [],
    stretches: ['Gato/Vaca — 10 rep', 'Mobilidade de Tornozelo — 10 círculos cada', 'Alongamento global leve — 5 min'],
    exercises: [],
    core: [],
    cardio: { modality: 'Caminhada leve (opcional)', duration: '30 min', extra: '' },
    notes: 'Dia de recuperação — crucial para o resultado. Pilates a reagendar como aula semanal fixa.' },
  { name: 'Inferiores B', subtitle: 'Posterior + Glúteos', day: 3, time: '07:00',
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
  { name: 'Superiores B', subtitle: 'Membros Superiores', day: 4, time: '07:00',
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
  { name: 'Cardio + Core', subtitle: 'Circuito de Sábado', day: 5, time: '09:30',
    warmup: [],
    stretches: ['Alongamentos gerais — 10 min'],
    exercises: [],
    core: ['Agachamento sem peso — 15 rep', 'Step baixo — 20 rep', 'Abdução com elástico — 20 rep', 'Prancha — 30 seg', 'Dead Bug — 15 rep'],
    cardio: { modality: 'Caminhada ao ar livre', duration: '40 min', extra: '' },
    notes: 'Circuito — repetir 3 voltas. Finalizar com 10 min de alongamentos.' },
];

// Blocos diários, um array por dia da semana (0=Segunda .. 6=Domingo)
const BASE_BLOCKS: { time: string; type: 'plain' | 'meal' | 'lunch'; label?: string; mealType?: MealType }[][] = [
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:30', type: 'plain', label: 'Banho + preparo' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '18:45', type: 'plain', label: 'Faculdade' }, { time: '22:15', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída — noite livre' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '23:00', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:45', type: 'meal', mealType: 'cafe' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '18:45', type: 'plain', label: 'Faculdade' }, { time: '22:15', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '20:00', type: 'plain', label: 'Terapia' }, { time: '21:30', type: 'plain', label: 'Descanso' }, { time: '23:00', type: 'plain', label: 'Dormir' } ],
  [ { time: '06:15', type: 'plain', label: 'Acordar' }, { time: '06:30', type: 'meal', mealType: 'cafe' }, { time: '08:40', type: 'plain', label: 'Banho' }, { time: '09:00', type: 'plain', label: 'Trabalho' }, { time: '10:30', type: 'meal', mealType: 'lancheManha' }, { time: '12:00', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '18:00', type: 'plain', label: 'Saída — tempo livre' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '23:30', type: 'plain', label: 'Dormir' } ],
  [ { time: '07:30', type: 'plain', label: 'Acordar com calma' }, { time: '08:00', type: 'meal', mealType: 'cafe' }, { time: '11:00', type: 'plain', label: 'Pilates (a reagendar)' }, { time: '12:30', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '19:00', type: 'meal', mealType: 'jantar' } ],
  [ { time: '08:30', type: 'meal', mealType: 'cafe' }, { time: '10:00', type: 'meal', mealType: 'lancheManha' }, { time: '12:30', type: 'lunch' }, { time: '15:30', type: 'meal', mealType: 'lancheTarde' }, { time: '16:30', type: 'plain', label: 'Lista de compras + autocuidado' }, { time: '19:00', type: 'meal', mealType: 'jantar' }, { time: '22:00', type: 'plain', label: 'Dormir bem' } ],
];

const CAFE_SEL = ['cafe1', 'cafe2', 'cafe3', 'cafe4', 'cafe5', 'cafe6', 'cafe7'];
const LM_SEL = ['lm1', 'lm2', 'lm3', 'lm4', 'lm5', 'lm6', 'lm7'];
const LT_SEL = ['lt1', 'lt2', 'lt3', 'lt4', 'lt5', 'lt6', 'lt7'];
const JT_SEL = ['jt1', 'jt2', 'jt3', 'jt4', 'jt5', 'jt6', 'jt7'];

const TIMELINE = [
  { month: 'Julho', foco: 'Adaptar rotina, estabelecer hábitos' },
  { month: 'Agosto', foco: 'Consolidar treinos, marmitas consistentes' },
  { month: 'Setembro', foco: 'Aumentar cardio, progredir cargas' },
  { month: 'Outubro', foco: 'Manter ritmo, avaliar medidas' },
  { month: 'Novembro', foco: 'Intensificar, ajustes finos' },
  { month: 'Dezembro', foco: 'Celebrar a consistência do ano!' },
];

function insertOrThrow(table: string) {
  return async (rows: unknown[] | Record<string, unknown>) => {
    const { error } = await supabase.from(table).insert(rows as any);
    if (error) throw new Error(`insert em "${table}" falhou: ${error.message} (${error.code ?? ''}) ${error.details ?? ''} ${error.hint ?? ''}`.trim());
  };
}

/**
 * Populates Monique (real planner data) and Matheus (blank) in as few round
 * trips as possible — every table is a single batched insert — so the whole
 * thing comfortably fits inside a serverless function's time budget.
 */
export async function runSeed(): Promise<{ skipped: boolean }> {
  const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (countError) throw new Error(`checagem de usuários falhou: ${countError.message}`);
  if ((count || 0) > 0) return { skipped: true };

  const moniqueId = nanoid();
  const matheusId = nanoid();
  await insertOrThrow('users')([
    { id: moniqueId, name: 'Monique', email: 'moniquebeck1996@gmail.com' },
    { id: matheusId, name: 'Matheus', email: 'e.matheus.avila@gmail.com' },
  ]);

  const mealIdByKey: Record<string, string> = {};
  const mealOptionRows = (Object.keys(MEAL_LIBRARY) as MealType[]).flatMap((mealType) =>
    MEAL_LIBRARY[mealType].map((opt, i) => {
      const id = nanoid();
      mealIdByKey[opt.key] = id;
      return { id, user_id: moniqueId, meal_type: mealType, name: opt.name, sort_order: i };
    }),
  );
  await insertOrThrow('meal_options')(mealOptionRows);

  const workoutIds = WORKOUTS.map(() => nanoid());
  await insertOrThrow('workouts')(
    WORKOUTS.map((w, i) => ({
      id: workoutIds[i], user_id: moniqueId, name: w.name, subtitle: w.subtitle, day_of_week: w.day, time: w.time,
      cardio_modality: w.cardio.modality, cardio_duration: w.cardio.duration, cardio_extra: w.cardio.extra,
      notes: w.notes, sort_order: i,
    })),
  );

  const warmupRows = WORKOUTS.flatMap((w, wi) => w.warmup.map((text, i) => ({ id: nanoid(), workout_id: workoutIds[wi], text, sort_order: i })));
  const stretchRows = WORKOUTS.flatMap((w, wi) => w.stretches.map((text, i) => ({ id: nanoid(), workout_id: workoutIds[wi], text, sort_order: i })));
  const coreRows = WORKOUTS.flatMap((w, wi) => w.core.map((text, i) => ({ id: nanoid(), workout_id: workoutIds[wi], text, sort_order: i })));
  const exerciseRows = WORKOUTS.flatMap((w, wi) => w.exercises.map((e, i) => ({
    id: nanoid(), workout_id: workoutIds[wi], name: e.name, sets: e.sets, reps: e.reps, load: e.load || '', note: e.note || '', sort_order: i,
  })));
  await Promise.all([
    warmupRows.length ? insertOrThrow('workout_warmup_items')(warmupRows) : Promise.resolve(),
    stretchRows.length ? insertOrThrow('workout_stretch_items')(stretchRows) : Promise.resolve(),
    coreRows.length ? insertOrThrow('workout_core_items')(coreRows) : Promise.resolve(),
    exerciseRows.length ? insertOrThrow('workout_exercises')(exerciseRows) : Promise.resolve(),
  ]);

  const dayBlockRows = BASE_BLOCKS.flatMap((blocks, dow) =>
    blocks.map((b) => ({ id: nanoid(), user_id: moniqueId, day_of_week: dow, time: b.time, type: b.type, label: b.label || '', meal_type: b.mealType || null })),
  );
  const daySelectionRows = BASE_BLOCKS.map((_, dow) => ({
    user_id: moniqueId, day_of_week: dow,
    cafe_selected_id: mealIdByKey[CAFE_SEL[dow]], lanche_manha_selected_id: mealIdByKey[LM_SEL[dow]],
    lanche_tarde_selected_id: mealIdByKey[LT_SEL[dow]], jantar_selected_id: mealIdByKey[JT_SEL[dow]],
    almoco_checked: false,
  }));
  const matheusSelectionRows = Array.from({ length: 7 }, (_, dow) => ({ user_id: matheusId, day_of_week: dow }));

  await Promise.all([
    insertOrThrow('day_blocks')(dayBlockRows),
    insertOrThrow('day_selections')(daySelectionRows),
    insertOrThrow('day_selections')(matheusSelectionRows),
    insertOrThrow('goals')({ user_id: moniqueId, project: 'Projeto Bem-estar', water: '2,5 – 3 L', protein: '120 – 140 g' }),
    insertOrThrow('goals_timeline')(TIMELINE.map((t, i) => ({ id: nanoid(), user_id: moniqueId, month: t.month, foco: t.foco, sort_order: i }))),
  ]);

  return { skipped: false };
}
