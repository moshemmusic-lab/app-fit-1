import { defaultLocale, resources } from '@app-fit/shared/i18n';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const i18n = createInstance();

// Resources are bundled, so initialization is effectively synchronous.
void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
});
