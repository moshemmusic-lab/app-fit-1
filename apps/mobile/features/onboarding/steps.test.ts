import { onboardingSchema } from '@app-fit/shared/schemas';
import { describe, expect, it } from 'vitest';

import { isStepComplete, onboardingSteps, type OnboardingDraft } from './steps';

const empty: OnboardingDraft = {
  username: '',
  displayName: '',
  trainingGoal: null,
  experienceLevel: null,
  units: 'kg',
  healthDataConsent: false,
};

const complete: OnboardingDraft = {
  username: 'ana_fit',
  displayName: 'Ana',
  trainingGoal: 'strength',
  experienceLevel: 'beginner',
  units: 'kg',
  healthDataConsent: true,
};

describe('onboarding steps', () => {
  it('blocks every step that needs an answer', () => {
    expect(isStepComplete('profile', empty)).toBe(false);
    expect(isStepComplete('goal', empty)).toBe(false);
    expect(isStepComplete('level', empty)).toBe(false);
    expect(isStepComplete('consent', empty)).toBe(false);
  });

  it('has kg preselected, so units never block', () => {
    expect(isStepComplete('units', empty)).toBe(true);
  });

  it('requires a valid username and name on the first step', () => {
    expect(isStepComplete('profile', { ...empty, username: 'ana_fit' })).toBe(false);
    expect(isStepComplete('profile', { ...empty, username: 'a!', displayName: 'Ana' })).toBe(false);
    expect(isStepComplete('profile', { ...empty, username: 'ana_fit', displayName: 'Ana' })).toBe(
      true,
    );
  });

  it('only lets onboarding finish with answers the server accepts', () => {
    for (const step of onboardingSteps) {
      expect(isStepComplete(step, complete)).toBe(true);
    }
    expect(onboardingSchema.safeParse(complete).success).toBe(true);
  });
});
