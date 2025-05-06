import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationAF from '../public/locales/af/translation.json';
import translationBG from '../public/locales/bg/translation.json';
import translationBN from '../public/locales/bn/translation.json';
import translationCA from '../public/locales/ca/translation.json';
import translationCS from '../public/locales/cs/translation.json';
import translationDE from '../public/locales/de/translation.json';
import translationEL from '../public/locales/el/translation.json';
import translationEN from '../public/locales/en/translation.json';
import translationES from '../public/locales/es/translation.json';
import translationFI from '../public/locales/fi/translation.json';
import translationFIL from '../public/locales/fil/translation.json';
import translationFR from '../public/locales/fr/translation.json';
import translationHI from '../public/locales/hi/translation.json';
import translationHR from '../public/locales/hr/translation.json';
import translationHU from '../public/locales/hu/translation.json';
import translationID from '../public/locales/id/translation.json';
import translationIT from '../public/locales/it/translation.json';
import translationJA from '../public/locales/ja/translation.json';
import translationKO from '../public/locales/ko/translation.json';
import translationMS from '../public/locales/ms/translation.json';
import translationNL from '../public/locales/nl/translation.json';
import translationNO from '../public/locales/no/translation.json';
import translationPL from '../public/locales/pl/translation.json';
import translationPT from '../public/locales/pt/translation.json';
import translationRO from '../public/locales/ro/translation.json';
import translationRU from '../public/locales/ru/translation.json';
import translationSK from '../public/locales/sk/translation.json';
import translationSL from '../public/locales/sl/translation.json';
import translationSV from '../public/locales/sv/translation.json';
import translationTA from '../public/locales/ta/translation.json';
import translationTH from '../public/locales/th/translation.json';
import translationUK from '../public/locales/uk/translation.json';
import translationVI from '../public/locales/vi/translation.json';
import translationZH from '../public/locales/zh/translation.json';
import translationZHTX from '../public/locales/zh_TW/translation.json';

import { LANGUAGES_DATA } from '@Components/LanguageSelector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: Object.keys(LANGUAGES_DATA),
    interpolation: {
      escapeValue: false,
    },
    resources: {
      af: { translation: translationAF },
      bg: { translation: translationBG },
      bn: { translation: translationBN },
      ca: { translation: translationCA },
      cs: { translation: translationCS },
      de: { translation: translationDE },
      el: { translation: translationEL },
      en: { translation: translationEN },
      es: { translation: translationES },
      fi: { translation: translationFI },
      fil: { translation: translationFIL },
      fr: { translation: translationFR },
      hi: { translation: translationHI },
      hr: { translation: translationHR },
      hu: { translation: translationHU },
      id: { translation: translationID },
      it: { translation: translationIT },
      ja: { translation: translationJA },
      ko: { translation: translationKO },
      ms: { translation: translationMS },
      nl: { translation: translationNL },
      no: { translation: translationNO },
      pl: { translation: translationPL },
      pt: { translation: translationPT },
      ro: { translation: translationRO },
      ru: { translation: translationRU },
      sk: { translation: translationSK },
      sl: { translation: translationSL },
      sv: { translation: translationSV },
      ta: { translation: translationTA },
      th: { translation: translationTH },
      uk: { translation: translationUK },
      vi: { translation: translationVI },
      zh: { translation: translationZH },
      zh_TW: { translation: translationZHTX },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
