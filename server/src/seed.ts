import 'dotenv/config';
import { nanoid } from 'nanoid';
import { supabase } from './supabaseClient.js';
import type { MealType } from './types.js';

async function main() {
  const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (countError) throw countError;
  if ((count || 0) > 0) {
    console.log('Banco de dados já contém usuários — seed ignorado. Apague as tabelas no Supabase (ou o projeto) para reiniciar do zero.');
    return;
  }

  const moniqueId = nanoid();
  const matheusId = nanoid();
  const { error: usersError } = await supabase.from('users').insert([
    { id: moniqueId, name: 'Monique', email: 'moniquebeck1996@gmail.com' },
    { id: matheusId, name: 'Matheus', email: 'e.matheus.avila@gmail.com' },
  ]);
  if (usersError) throw usersError;

  // -------------------------------------------------------------------------
  // Monique — populada com o planner real (ver design/project/uploads/Planner
  // Monique Beck.pdf e o handoff em design/chats/chat1.md)
  // -------------------------------------------------------------------------

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
  const mealOptionRows: { id: string; user_id: string; meal_type: MealType; name: string; sort_order: number }[] = [];
  (Object.keys(mealLibrary) as MealType[]).forEach((mealType) => {
    mealLibrary[mealType].forEach((opt, i) => {
      const id = nanoid();
      mealIdByKey[opt.key] = id;
      mealOptionRows.push({ id, user_id: moniqueId, meal_type: mealType, name: opt.name, sort_order: i });
    });
  });
  const { error: mealOptionsError } = await supabase.from('meal_options').insert(mealOptionRows);
  if (mealOptionsError) throw mealOptionsError;

  interface ExerciseSeed { name: string; sets: string; reps: string; load?: string; note?: string }
  const ex = (name: string, sets: string, reps: string, load = '', note = ''): ExerciseSeed => ({ name, sets, reps, load, note });

  interface WorkoutSeed {
    name: string; subtitle: string; day: number; time: string;
    warmup: string[]; stretches: string[]; exercises: ExerciseSeed[]; core: string[];
    cardio: { modality: string; duration: string; extra: string }; notes: string;
  }

  const workouts: WorkoutSeed[] = [
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

  for (let i = 0; i < workouts.length; i++) {
    const w = workouts[i];
    const workoutId = nanoid();
    const { error: workoutError } = await supabase.from('workouts').insert({
      id: workoutId, user_id: moniqueId, name: w.name, subtitle: w.subtitle, day_of_week: w.day, time: w.time,
      cardio_modality: w.cardio.modality, cardio_duration: w.cardio.duration, cardio_extra: w.cardio.extra,
      notes: w.notes, sort_order: i,
    });
    if (workoutError) throw workoutError;

    if (w.warmup.length) {
      const { error } = await supabase.from('workout_warmup_items').insert(
        w.warmup.map((text, idx) => ({ id: nanoid(), workout_id: workoutId, text, sort_order: idx })),
      );
      if (error) throw error;
    }
    if (w.stretches.length) {
      const { error } = await supabase.from('workout_stretch_items').insert(
        w.stretches.map((text, idx) => ({ id: nanoid(), workout_id: workoutId, text, sort_order: idx })),
      );
      if (error) throw error;
    }
    if (w.core.length) {
      const { error } = await supabase.from('workout_core_items').insert(
        w.core.map((text, idx) => ({ id: nanoid(), workout_id: workoutId, text, sort_order: idx })),
      );
      if (error) throw error;
    }
    if (w.exercises.length) {
      const { error } = await supabase.from('workout_exercises').insert(
        w.exercises.map((e, idx) => ({ id: nanoid(), workout_id: workoutId, name: e.name, sets: e.sets, reps: e.reps, load: e.load || '', note: e.note || '', sort_order: idx })),
      );
      if (error) throw error;
    }
  }

  // Blocos diários, um array por dia da semana (0=Segunda .. 6=Domingo)
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

  for (let dow = 0; dow < baseBlocks.length; dow++) {
    const blocks = baseBlocks[dow];
    const { error: blocksError } = await supabase.from('day_blocks').insert(
      blocks.map((b) => ({ id: nanoid(), user_id: moniqueId, day_of_week: dow, time: b.time, type: b.type, label: b.label || '', meal_type: b.mealType || null })),
    );
    if (blocksError) throw blocksError;

    const { error: selectionsError } = await supabase.from('day_selections').insert({
      user_id: moniqueId, day_of_week: dow,
      cafe_selected_id: mealIdByKey[cafeSel[dow]], lanche_manha_selected_id: mealIdByKey[lmSel[dow]],
      lanche_tarde_selected_id: mealIdByKey[ltSel[dow]], jantar_selected_id: mealIdByKey[jtSel[dow]],
      almoco_checked: false,
    });
    if (selectionsError) throw selectionsError;
  }

  const { error: goalsError } = await supabase.from('goals').insert({
    user_id: moniqueId, project: 'Projeto Bem-estar', water: '2,5 – 3 L', protein: '120 – 140 g',
  });
  if (goalsError) throw goalsError;

  const timeline = [
    { month: 'Julho', foco: 'Adaptar rotina, estabelecer hábitos' },
    { month: 'Agosto', foco: 'Consolidar treinos, marmitas consistentes' },
    { month: 'Setembro', foco: 'Aumentar cardio, progredir cargas' },
    { month: 'Outubro', foco: 'Manter ritmo, avaliar medidas' },
    { month: 'Novembro', foco: 'Intensificar, ajustes finos' },
    { month: 'Dezembro', foco: 'Celebrar a consistência do ano!' },
  ];
  const { error: timelineError } = await supabase.from('goals_timeline').insert(
    timeline.map((t, i) => ({ id: nanoid(), user_id: moniqueId, month: t.month, foco: t.foco, sort_order: i })),
  );
  if (timelineError) throw timelineError;

  // -------------------------------------------------------------------------
  // Matheus — começa em branco; ele cadastra tudo do zero.
  // Linhas de day_selections para os 7 dias, para os PATCHs terem o que atualizar.
  // -------------------------------------------------------------------------
  const { error: matheusSelectionsError } = await supabase.from('day_selections').insert(
    Array.from({ length: 7 }, (_, dow) => ({ user_id: matheusId, day_of_week: dow })),
  );
  if (matheusSelectionsError) throw matheusSelectionsError;

  console.log('Seed concluído: Monique (dados completos do planner) e Matheus (em branco).');
}

main().catch((err) => {
  console.error('Seed falhou:', err);
  process.exit(1);
});
