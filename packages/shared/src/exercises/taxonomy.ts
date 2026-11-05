import { Constants, type Database } from '../database.types';

// The database enums are the source of truth: these lists follow them automatically
// (packages/shared/src/database.types.ts is regenerated after every schema change).
type Enums = Database['public']['Enums'];

export type MuscleGroup = Enums['muscle_group'];
export type EquipmentType = Enums['equipment_type'];
export type TrackingType = Enums['exercise_tracking_type'];

export const muscleGroups: readonly MuscleGroup[] = Constants.public.Enums.muscle_group;
export const equipmentTypes: readonly EquipmentType[] = Constants.public.Enums.equipment_type;
export const trackingTypes: readonly TrackingType[] = Constants.public.Enums.exercise_tracking_type;

/** Exercise names and instructions are stored per language and country (es-ES, es-MX…). */
export const defaultExerciseLocale = 'es-ES';

export type MuscleRegion = 'upper' | 'core' | 'lower' | 'other';

/** How the muscle filter groups the muscles (every muscle in exactly one region). */
export const muscleRegions: Readonly<Record<MuscleRegion, readonly MuscleGroup[]>> = {
  upper: ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'upper_back', 'lats', 'traps'],
  core: ['abs', 'obliques', 'lower_back'],
  lower: ['glutes', 'quadriceps', 'hamstrings', 'adductors', 'abductors', 'calves'],
  other: ['full_body', 'cardio'],
};

export const muscleRegionOrder: readonly MuscleRegion[] = ['upper', 'core', 'lower', 'other'];
