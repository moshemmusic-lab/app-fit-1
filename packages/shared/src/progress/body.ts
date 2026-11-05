/** Body weight the app accepts, in kg (the database checks the same range). */
export const bodyWeightLimitsKg = { min: 20, max: 500 } as const;

export function isValidBodyWeightKg(kg: number): boolean {
  return kg >= bodyWeightLimitsKg.min && kg <= bodyWeightLimitsKg.max;
}
