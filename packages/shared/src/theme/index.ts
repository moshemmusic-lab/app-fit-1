import {
  colorTokens,
  fontFamilies,
  radius,
  sizes,
  spacing,
  themeModes,
  typeScale,
} from './tokens.generated';

export { contrastRatio } from './contrast';
export { themeStylesheet, themeToCssVariables } from './css';
export { fontFamilies, themeModes };

export type ThemeMode = (typeof themeModes)[number];
/** Dark is the default theme (docs/DESIGN.md). */
export const defaultThemeMode: ThemeMode = 'dark';

export type ColorToken = keyof (typeof colorTokens)['dark'];
export type ThemeColors = Record<ColorToken, string>;

/**
 * Colors allowed for text and icons. `lime` is deliberately missing: it is a fill
 * color only and fails contrast as text on light backgrounds (docs/DESIGN.md).
 */
export const textColorTokens = [
  'text',
  'textMuted',
  'textSubtle',
  'accentText',
  'inkOnLime',
  'textOnSlab',
  'warm',
] as const satisfies readonly ColorToken[];
export type TextColorToken = (typeof textColorTokens)[number];

export const typography = {
  ...typeScale,
  // "label" is always written in uppercase via text-transform (design-tokens.json).
  label: { ...typeScale.label, textTransform: 'uppercase' },
} as const;
export type TypographyVariant = keyof typeof typography;
export type FontFamilyToken = keyof typeof fontFamilies;

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  sizes: typeof sizes;
}

export const themes: Record<ThemeMode, Theme> = {
  dark: { mode: 'dark', colors: colorTokens.dark, typography, spacing, radius, sizes },
  light: { mode: 'light', colors: colorTokens.light, typography, spacing, radius, sizes },
};
