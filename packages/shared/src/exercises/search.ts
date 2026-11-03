import type { EquipmentType, MuscleGroup } from './taxonomy';

export interface SearchableExercise {
  name: string;
  /** Other words that should find it: aliases, muscle and equipment names. */
  keywords: readonly string[];
  primaryMuscle: MuscleGroup;
  equipment: EquipmentType;
}

export interface ExerciseFilters {
  query: string;
  muscle: MuscleGroup | null;
  equipment: EquipmentType | null;
}

/** Lowercase, without accents and with single spaces: "Bíceps  " → "biceps". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lower is better: the name starts with the query, then contains it, then another name
 * (alias) starts with it ("press banca" → bench press), then only scattered words match.
 */
function rank(name: string, keywords: readonly string[], query: string): number {
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  if (keywords.some((keyword) => keyword.startsWith(query))) return 2;
  return 3;
}

/**
 * Exercises matching every word of the query (in the name or keywords) and the filters.
 * Sorted by relevance when there is a query, alphabetically otherwise.
 */
export function filterExercises<T extends SearchableExercise>(
  exercises: readonly T[],
  { query, muscle, equipment }: ExerciseFilters,
): T[] {
  const normalizedQuery = normalizeForSearch(query);
  const words = normalizedQuery === '' ? [] : normalizedQuery.split(' ');

  const matches = exercises
    .filter((exercise) => muscle === null || exercise.primaryMuscle === muscle)
    .filter((exercise) => equipment === null || exercise.equipment === equipment)
    .map((exercise) => {
      const name = normalizeForSearch(exercise.name);
      const keywords = exercise.keywords.map(normalizeForSearch);
      const haystack = [name, ...keywords].join(' ');
      return { exercise, name, keywords, haystack };
    })
    .filter(({ haystack }) => words.every((word) => haystack.includes(word)));

  return matches
    .sort((a, b) => {
      const byRank =
        words.length > 0
          ? rank(a.name, a.keywords, normalizedQuery) - rank(b.name, b.keywords, normalizedQuery)
          : 0;
      if (byRank !== 0) return byRank;
      // Names are already lowercase and without accents, so a plain comparison is alphabetical.
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    })
    .map(({ exercise }) => exercise);
}
