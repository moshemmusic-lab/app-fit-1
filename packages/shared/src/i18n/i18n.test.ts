import { describe, expect, it } from 'vitest';

import { validationErrorKeys } from '../schemas';
import { es } from './locales/es';

describe('Spanish copy', () => {
  it('has a message for every validation error key', () => {
    for (const key of validationErrorKeys) {
      expect(es.validation[key]).toBeTypeOf('string');
    }
  });
});
