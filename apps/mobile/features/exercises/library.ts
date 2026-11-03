import type { Database } from '@app-fit/shared/database';
import {
  defaultExerciseLocale,
  type EquipmentType,
  type MuscleGroup,
  type TrackingType,
} from '@app-fit/shared/exercises';

type ExerciseTableRow = Database['public']['Tables']['exercises']['Row'];
type TranslationTableRow = Database['public']['Tables']['exercise_translations']['Row'];

type TranslationRow = Pick<TranslationTableRow, 'locale' | 'name' | 'aliases' | 'instructions'>;

/** What the library query returns: an exercise with all its translations. */
export type ExerciseRow = Pick<
  ExerciseTableRow,
  'id' | 'tracking_type' | 'primary_muscle' | 'secondary_muscles' | 'equipment'
> & { exercise_translations: TranslationRow[] };

export interface LibraryExercise {
  id: string;
  trackingType: TrackingType;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  name: string;
  aliases: string[];
  /** One string per step. */
  instructions: string[];
}

/** The translation for the user's locale, else Spanish (Spain), else none. */
export function pickTranslation(
  translations: readonly TranslationRow[],
  locale: string,
): TranslationRow | null {
  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === defaultExerciseLocale) ??
    null
  );
}

/** Exercises without a usable translation are left out instead of showing an empty name. */
export function toLibraryExercises(
  rows: readonly ExerciseRow[],
  locale: string,
): LibraryExercise[] {
  return rows.flatMap((row) => {
    const translation = pickTranslation(row.exercise_translations, locale);
    if (!translation) return [];
    return [
      {
        id: row.id,
        trackingType: row.tracking_type,
        primaryMuscle: row.primary_muscle,
        secondaryMuscles: row.secondary_muscles,
        equipment: row.equipment,
        name: translation.name,
        aliases: translation.aliases,
        instructions: translation.instructions,
      },
    ];
  });
}
