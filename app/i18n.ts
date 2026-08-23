import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from '../locales/es.json';
import en from '../locales/en.json';
import ca from '../locales/ca.json';

const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  const languageCode = locales[0]?.languageCode;

  if (!languageCode) return 'es';

  if (languageCode.startsWith('es')) return 'es';
  if (languageCode.startsWith('ca')) return 'ca';

  return 'es';
};

// eslint-disable-next-line import/no-named-as-default-member -- default i18n instance is the intended API
void i18n.use(initReactI18next).init({
  lng: getDeviceLanguage(),
  fallbackLng: 'es',
  resources: {
    es: { translation: es },
    en: { translation: en },
    ca: { translation: ca },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
