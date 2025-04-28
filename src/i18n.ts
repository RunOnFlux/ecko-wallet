import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from '../public/locales/en/translation.json';
import translationIT from '../public/locales/it/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'it'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: translationEN },
      it: { translation: translationIT },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
