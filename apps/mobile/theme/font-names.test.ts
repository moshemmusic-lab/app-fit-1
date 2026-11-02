import { typography, type TypographyVariant } from '@app-fit/shared/theme';
import { describe, expect, it } from 'vitest';

import { fontNameFor, fontNameForVariant } from './font-names';

describe('font names', () => {
  it('every typography variant uses a loaded font', () => {
    for (const variant of Object.keys(typography) as TypographyVariant[]) {
      expect(() => fontNameForVariant(variant)).not.toThrow();
    }
  });

  it('numbers use Barlow Condensed and text uses Inter', () => {
    expect(fontNameForVariant('metric')).toBe('BarlowCondensed_700Bold');
    expect(fontNameForVariant('body')).toBe('Inter_400Regular');
  });

  it('fails loudly for a weight that is not loaded', () => {
    expect(() => fontNameFor('display', 300)).toThrow();
  });
});
