export type MealType = 'cafe' | 'lancheManha' | 'lancheTarde' | 'jantar';
export const MEAL_TYPES: MealType[] = ['cafe', 'lancheManha', 'lancheTarde', 'jantar'];

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
  sortOrder: number;
}

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

export interface DayBlock {
  id: string;
  time: string;
  type: BlockType;
  label: string;
  mealType: MealType | null;
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
