import { describe, expect, it } from 'vitest';

import { equipmentTypes, muscleGroups, trackingTypes } from '../exercises';
import { validationErrorKeys } from '../schemas';
import { es } from './locales/es';

describe('Spanish copy', () => {
  it('has a message for every validation error key', () => {
    for (const key of validationErrorKeys) {
      expect(es.validation[key]).toBeTypeOf('string');
    }
  });

  it('names every muscle, piece of equipment and tracking type in the database', () => {
    for (const muscle of muscleGroups) {
      expect(es.muscles[muscle]).toBeTypeOf('string');
    }
    for (const equipment of equipmentTypes) {
      expect(es.equipment[equipment]).toBeTypeOf('string');
    }
    for (const trackingType of trackingTypes) {
      expect(es.trackingTypes[trackingType]).toBeTypeOf('string');
    }
  });
});
