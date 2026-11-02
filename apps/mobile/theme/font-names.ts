import type { FontFamilyToken, TypographyVariant } from '@app-fit/shared/theme';
import { typography } from '@app-fit/shared/theme';

// Each weight of a Google Font is loaded as its own family name, so the font
// family already encodes the weight (no `fontWeight` needed, which keeps Android correct).
export const fontNames = {
  display: {
    600: 'BarlowCondensed_600SemiBold',
    700: 'BarlowCondensed_700Bold',
  },
  sans: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
} as const satisfies Record<FontFamilyToken, Record<number, string>>;

type FontNames = typeof fontNames;
export type FontName = {
  [F in keyof FontNames]: FontNames[F][keyof FontNames[F]];
}[keyof FontNames];

export function fontNameFor(family: FontFamilyToken, weight: number): FontName {
  const weights: Record<number, FontName | undefined> = fontNames[family];
  const name = weights[weight];
  if (!name) throw new Error(`Font ${family} ${weight} is not loaded (see theme/font-names.ts)`);
  return name;
}

export function fontNameForVariant(variant: TypographyVariant): FontName {
  const style = typography[variant];
  return fontNameFor(style.family, style.fontWeight);
}
