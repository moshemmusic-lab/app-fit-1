import { z } from 'zod';

// Allowed values. They mirror the check constraints in
// supabase/migrations/*_create_profiles_and_settings.sql.
export const trainingGoals = ['strength', 'cardio', 'both'] as const;
export type TrainingGoal = (typeof trainingGoals)[number];

export const experienceLevels = ['beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof experienceLevels)[number];

export const weightUnits = ['kg', 'lb'] as const;
export type WeightUnit = (typeof weightUnits)[number];

export const workoutVisibilities = ['public', 'followers', 'private'] as const;
export type WorkoutVisibility = (typeof workoutVisibilities)[number];

export const accountLimits = {
  usernameMin: 3,
  usernameMax: 24,
  displayNameMax: 50,
  bioMax: 160,
  signInCodeLength: 6,
} as const;

/**
 * Validation errors are i18n keys (`validation.<key>`), never user-facing text,
 * so the same schemas work in the app, the web and Edge Functions.
 */
export const validationErrorKeys = [
  'usernameTooShort',
  'usernameTooLong',
  'usernameInvalidChars',
  'displayNameRequired',
  'displayNameTooLong',
  'bioTooLong',
  'emailInvalid',
  'signInCodeInvalid',
  'consentRequired',
] as const;
export type ValidationErrorKey = (typeof validationErrorKeys)[number];

function isValidationErrorKey(value: string): value is ValidationErrorKey {
  return (validationErrorKeys as readonly string[]).includes(value);
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(accountLimits.usernameMin, { error: 'usernameTooShort' })
  .max(accountLimits.usernameMax, { error: 'usernameTooLong' })
  .regex(/^[a-z0-9_]+$/, { error: 'usernameInvalidChars' });

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'displayNameRequired' })
  .max(accountLimits.displayNameMax, { error: 'displayNameTooLong' });

export const bioSchema = z.string().trim().max(accountLimits.bioMax, { error: 'bioTooLong' });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'emailInvalid' }));

export const signInCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${String(accountLimits.signInCodeLength)}}$`), {
    error: 'signInCodeInvalid',
  });

export const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  trainingGoal: z.enum(trainingGoals),
  experienceLevel: z.enum(experienceLevels),
  units: z.enum(weightUnits),
  healthDataConsent: z.literal(true, { error: 'consentRequired' }),
});
export type OnboardingAnswers = z.infer<typeof onboardingSchema>;

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  isPrivate: z.boolean(),
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** First validation error of a single value, or null when it is valid. */
export function validationErrorOf(schema: z.ZodType, value: unknown): ValidationErrorKey | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  const message = result.error.issues[0]?.message ?? '';
  // Every schema above uses a key as its message; anything else is a programming error.
  if (!isValidationErrorKey(message)) {
    throw new Error(`Validation message "${message}" is not a validation error key`);
  }
  return message;
}
