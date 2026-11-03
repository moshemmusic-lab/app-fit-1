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
