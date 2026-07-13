export const queryKeys = {
  me: ['me'] as const,
  meals: ['meals'] as const,
  workouts: ['workouts'] as const,
  workout: (id: string) => ['workouts', id] as const,
  dayBlocks: (dow: number) => ['dayBlocks', dow] as const,
  daySelections: (dow: number) => ['daySelections', dow] as const,
  goals: ['goals'] as const,
  completions: (date: string) => ['completions', date] as const,
};
