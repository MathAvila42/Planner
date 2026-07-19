import type {
  Cardio, CompletionsMap, DayBlock, DaySelections, Goals, MealLibrary, MealType, ProgressSummary, User, Workout, WorkoutDraft,
} from './types';

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string) => request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/api/auth/me'),

  getMeals: () => request<MealLibrary>('/api/meals'),
  addMealOption: (mealType: MealType, name: string) =>
    request<{ id: string; name: string }>(`/api/meals/${mealType}`, { method: 'POST', body: JSON.stringify({ name }) }),
  renameMealOption: (mealType: MealType, id: string, name: string) =>
    request<{ id: string; name: string }>(`/api/meals/${mealType}/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteMealOption: (mealType: MealType, id: string) =>
    request<{ ok: true }>(`/api/meals/${mealType}/${id}`, { method: 'DELETE' }),

  getWorkouts: () => request<Workout[]>('/api/workouts'),
  getWorkout: (id: string) => request<Workout>(`/api/workouts/${id}`),
  createWorkout: (draft: WorkoutDraft) => request<Workout>('/api/workouts', { method: 'POST', body: JSON.stringify(draftToPayload(draft)) }),
  saveWorkout: (id: string, draft: WorkoutDraft) => request<Workout>(`/api/workouts/${id}`, { method: 'PUT', body: JSON.stringify(draftToPayload(draft)) }),
  updateWorkoutTime: (id: string, time: string) => request<Workout>(`/api/workouts/${id}`, { method: 'PATCH', body: JSON.stringify({ time }) }),
  deleteWorkout: (id: string) => request<{ ok: true }>(`/api/workouts/${id}`, { method: 'DELETE' }),

  updateExercise: (workoutId: string, exerciseId: string, patch: { load?: string; photoUrl?: string | null }) =>
    request<{ ok: true }>(`/api/workouts/${workoutId}/exercises/${exerciseId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateStretchItem: (workoutId: string, itemId: string, patch: { photoUrl?: string | null }) =>
    request<{ ok: true }>(`/api/workouts/${workoutId}/stretch-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateCoreItem: (workoutId: string, itemId: string, patch: { photoUrl?: string | null }) =>
    request<{ ok: true }>(`/api/workouts/${workoutId}/core-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  getDayBlocks: (dow: number) => request<DayBlock[]>(`/api/day-plan/${dow}/blocks`),
  addDayBlock: (dow: number, time: string, label: string) =>
    request<DayBlock>(`/api/day-plan/${dow}/blocks`, { method: 'POST', body: JSON.stringify({ time, label }) }),
  patchDayBlock: (id: string, patch: { time?: string; label?: string }) =>
    request<{ ok: true }>(`/api/day-plan/blocks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteDayBlock: (id: string) => request<{ ok: true }>(`/api/day-plan/blocks/${id}`, { method: 'DELETE' }),

  getDaySelections: (dow: number) => request<DaySelections>(`/api/day-plan/${dow}/selections`),
  patchDaySelections: (dow: number, patch: Partial<DaySelections>) =>
    request<{ ok: true }>(`/api/day-plan/${dow}/selections`, { method: 'PATCH', body: JSON.stringify(patch) }),

  getGoals: () => request<Goals | null>('/api/goals'),

  getProgressSummary: (month: string) => request<ProgressSummary>(`/api/progress/summary?month=${encodeURIComponent(month)}`),

  getCompletions: (date: string) => request<CompletionsMap>(`/api/completions?date=${encodeURIComponent(date)}`),
  toggleCompletion: (workoutId: string, section: 'stretches' | 'exercises', itemId: string, date: string) =>
    request<{ done: boolean }>('/api/completions/toggle', { method: 'POST', body: JSON.stringify({ workoutId, section, itemId, date }) }),

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/uploads', { method: 'POST', credentials: 'include', body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data?.error || 'Falha ao enviar imagem.');
    }
    return res.json();
  },
};

function draftToPayload(draft: WorkoutDraft) {
  return {
    name: draft.name,
    subtitle: draft.subtitle,
    day: draft.day === '' ? null : parseInt(draft.day, 10),
    time: draft.time || '07:00',
    warmup: draft.warmup,
    stretches: draft.stretches,
    core: draft.core,
    exercises: draft.exercises,
    cardio: draft.cardio as Cardio,
    notes: draft.notes,
  };
}
