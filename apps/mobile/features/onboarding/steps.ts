import {
  displayNameSchema,
  usernameSchema,
  type ExperienceLevel,
  type TrainingGoal,
  type WeightUnit,
} from '@app-fit/shared/schemas';

export const onboardingSteps = ['profile', 'goal', 'level', 'units', 'consent'] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

export interface OnboardingDraft {
  username: string;
  displayName: string;
  trainingGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  units: WeightUnit;
  healthDataConsent: boolean;
}

/** Whether the answers on this step are enough to move on. */
export function isStepComplete(step: OnboardingStep, draft: OnboardingDraft): boolean {
  switch (step) {
    case 'profile':
      return (
        usernameSchema.safeParse(draft.username).success &&
        displayNameSchema.safeParse(draft.displayName).success
      );
    case 'goal':
      return draft.trainingGoal !== null;
    case 'level':
      return draft.experienceLevel !== null;
    case 'units':
      return true;
    case 'consent':
      return draft.healthDataConsent;
  }
}
