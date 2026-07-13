export const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DAY_LABELS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/** 0 = Monday .. 6 = Sunday, matching the day_of_week convention used across the app. */
export function getTodayIdx(): number {
  return (new Date().getDay() + 6) % 7;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatTodayLabel(): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

export function mondayOfThisWeek(): Date {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - getTodayIdx());
  return monday;
}
