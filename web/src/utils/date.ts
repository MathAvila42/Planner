export const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DAY_LABELS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/** 0 = Monday .. 6 = Sunday, matching the day_of_week convention used across the app. */
export function getTodayIdx(): number {
  return (new Date().getDay() + 6) % 7;
}

/**
 * Local calendar date as YYYY-MM-DD (not UTC — toISOString() would roll over
 * to "tomorrow" hours before local midnight in timezones behind UTC, like
 * Brazil's, splitting a single evening workout's checks across two dates).
 */
export function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
