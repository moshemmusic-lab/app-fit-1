import { es } from './locales/es';

export type { Translation } from './locales/es';

export const supportedLocales = ['es'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'es';

/** i18next-compatible resources: `{ es: { translation: {...} } }`. */
export const resources = {
  es: { translation: es },
} as const;

export { es };
