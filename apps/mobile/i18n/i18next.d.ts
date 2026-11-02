import type { Translation } from '@app-fit/shared/i18n';

// Makes `t('tabs.home')` type-checked against the Spanish copy.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}
