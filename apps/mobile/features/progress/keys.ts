/** Query keys of the progress data, per user. Invalidating `all` refreshes every one. */
export const progressKeys = {
  all: (userId: string) => ['progress', userId] as const,
  stats: (userId: string) => ['progress', userId, 'stats'] as const,
  workout: (userId: string, workoutId: string) =>
    ['progress', userId, 'workout', workoutId] as const,
  bests: (userId: string) => ['progress', userId, 'bests'] as const,
  exercise: (userId: string, exerciseId: string) =>
    ['progress', userId, 'exercise', exerciseId] as const,
  bodyWeight: (userId: string) => ['progress', userId, 'body-weight'] as const,
  recentExercises: (userId: string) => ['progress', userId, 'recent-exercises'] as const,
};
