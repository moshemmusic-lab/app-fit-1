import { describe, expect, it } from 'vitest';

import {
  bioSchema,
  displayNameSchema,
  emailSchema,
  onboardingSchema,
  signInCodeSchema,
  usernameSchema,
  validationErrorOf,
} from './account';

describe('usernameSchema', () => {
  it('normalizes to lowercase without surrounding spaces', () => {
    expect(usernameSchema.parse('  Ana_Fit ')).toBe('ana_fit');
  });

  it.each([
    ['ab', 'usernameTooShort'],
    ['a'.repeat(25), 'usernameTooLong'],
    ['ana.fit', 'usernameInvalidChars'],
    ['ana fit', 'usernameInvalidChars'],
    ['añadir', 'usernameInvalidChars'],
  ])('rejects "%s" with %s', (value, error) => {
    expect(validationErrorOf(usernameSchema, value)).toBe(error);
  });

  it('accepts letters, numbers and underscores (3–24)', () => {
    expect(validationErrorOf(usernameSchema, 'ana_fit_92')).toBeNull();
    expect(validationErrorOf(usernameSchema, 'a'.repeat(24))).toBeNull();
  });

  it('matches the database rule (^[a-z0-9_]{3,24}$)', () => {
    const databaseRule = /^[a-z0-9_]{3,24}$/;
    for (const value of ['ana', 'ANA_FIT', 'x_9', 'a'.repeat(24)]) {
      expect(databaseRule.test(usernameSchema.parse(value))).toBe(true);
    }
  });
});

describe('displayNameSchema and bioSchema', () => {
  it('requires a name and trims it', () => {
    expect(validationErrorOf(displayNameSchema, '   ')).toBe('displayNameRequired');
    expect(displayNameSchema.parse('  Ana  ')).toBe('Ana');
  });

  it('limits name and bio length', () => {
    expect(validationErrorOf(displayNameSchema, 'a'.repeat(51))).toBe('displayNameTooLong');
    expect(validationErrorOf(bioSchema, 'a'.repeat(161))).toBe('bioTooLong');
    expect(validationErrorOf(bioSchema, '')).toBeNull();
  });
});

describe('sign-in schemas', () => {
  it('normalizes emails and rejects invalid ones', () => {
    expect(emailSchema.parse(' Ana@Example.com ')).toBe('ana@example.com');
    expect(validationErrorOf(emailSchema, 'ana@')).toBe('emailInvalid');
  });

  it('accepts only 6-digit codes', () => {
    expect(validationErrorOf(signInCodeSchema, '123456')).toBeNull();
    expect(validationErrorOf(signInCodeSchema, '12345')).toBe('signInCodeInvalid');
    expect(validationErrorOf(signInCodeSchema, '12a456')).toBe('signInCodeInvalid');
  });
});

describe('onboardingSchema', () => {
  const answers = {
    username: 'ana_fit',
    displayName: 'Ana',
    trainingGoal: 'strength',
    experienceLevel: 'beginner',
    units: 'kg',
    healthDataConsent: true,
  };

  it('accepts complete answers with consent', () => {
    expect(onboardingSchema.safeParse(answers).success).toBe(true);
  });

  it('requires explicit health data consent', () => {
    const result = onboardingSchema.safeParse({ ...answers, healthDataConsent: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('consentRequired');
  });

  it('rejects values outside the allowed lists', () => {
    expect(onboardingSchema.safeParse({ ...answers, trainingGoal: 'yoga' }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...answers, units: 'st' }).success).toBe(false);
  });
});
