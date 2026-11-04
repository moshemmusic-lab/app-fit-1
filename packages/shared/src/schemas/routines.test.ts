import { describe, expect, it } from 'vitest';

import { validationErrorOf } from './account';
import { exerciseNameSchema, folderNameSchema, routineNameSchema } from './routines';

describe('routine and folder names', () => {
  it('trims and accepts normal names', () => {
    expect(routineNameSchema.parse('  Torso A ')).toBe('Torso A');
    expect(validationErrorOf(folderNameSchema, 'Fuerza')).toBeNull();
  });

  it('requires a name', () => {
    expect(validationErrorOf(routineNameSchema, '   ')).toBe('nameRequired');
    expect(validationErrorOf(folderNameSchema, '')).toBe('nameRequired');
  });

  it('limits the length like the database', () => {
    expect(validationErrorOf(routineNameSchema, 'a'.repeat(81))).toBe('nameTooLong');
    expect(validationErrorOf(folderNameSchema, 'a'.repeat(51))).toBe('nameTooLong');
    expect(validationErrorOf(routineNameSchema, 'a'.repeat(80))).toBeNull();
    expect(validationErrorOf(exerciseNameSchema, 'a'.repeat(81))).toBe('nameTooLong');
    expect(validationErrorOf(exerciseNameSchema, ' ')).toBe('nameRequired');
  });
});
