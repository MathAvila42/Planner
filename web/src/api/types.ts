export type MealType = 'cafe' | 'lancheManha' | 'lancheTarde' | 'jantar';
export const MEAL_TYPES: MealType[] = ['cafe', 'lancheManha', 'lancheTarde', 'jantar'];
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe: 'Café da manhã',
  lancheManha: 'Lanche da manhã',
  lancheTarde: 'Lanche da tarde',
  jantar: 'Jantar',
};

export type BlockType = 'plain' | 'meal' | 'lunch';
export type CompletionSection = 'stretches' | 'exercises';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface MealOption {
  id: string;
  name: string;
}

export type MealLibrary = Record<MealType, MealOption[]>;

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  load: string;
  note: string;
  photoUrl: string | null;
}

export interface Cardio {
  modality: string;
  duration: string;
  extra: string;
}

export interface TextPhotoItem {
  id: string;
  text: string;
  photoUrl: string | null;
}

export interface Workout {
  id: string;
  name: string;
  subtitle: string;
  day: number | null;
  time: string;
  warmup: string[];
  stretches: TextPhotoItem[];
  exercises: Exercise[];
  core: TextPhotoItem[];
  cardio: Cardio;
  notes: string;
}

export interface WorkoutDraft {
  id: string | null;
  name: string;
  subtitle: string;
  day: string; // '' or '0'..'6'
  time: string;
  warmup: string[];
  stretches: string[];
  core: string[];
  exercises: { name: string; sets: string; reps: string; load: string; note: string }[];
  cardio: Cardio;
  notes: string;
}

export interface DayBlock {
  id: string;
  time: string;
  type: BlockType;
  label: string;
  mealType: MealType | null;
  notes: string;
}

export interface DaySelections {
  cafeSelectedId: string | null;
  lancheManhaSelectedId: string | null;
  lancheTardeSelectedId: string | null;
  jantarSelectedId: string | null;
  almocoChecked: boolean;
}

export interface GoalsTimelineEntry {
  month: string;
  foco: string;
}

export interface Goals {
  project: string;
  water: string;
  protein: string;
  timeline: GoalsTimelineEntry[];
}

export type CompletionsMap = Record<string, { stretches: Record<string, true>; exercises: Record<string, true> }>;

export interface ExerciseLoadHistory {
  workoutId: string;
  workoutName: string;
  exerciseName: string;
  history: { load: string; recordedAt: string }[];
}

export interface ProgressSummary {
  trainedDays: number[];
  exercises: ExerciseLoadHistory[];
}
