import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources';
import { getInitialLanguage, getLanguageMeta, LANGUAGE_STORAGE_KEY } from './languages';

const applyDocumentLanguage = (languageCode) => {
  const meta = getLanguageMeta(languageCode);
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.body?.setAttribute('dir', meta.dir);
  document.body?.classList.toggle('is-rtl', meta.dir === 'rtl');
};

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    returnNull: false
  });

applyDocumentLanguage(initialLanguage);

i18n.on('languageChanged', (languageCode) => {
  const meta = getLanguageMeta(languageCode);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, meta.code);
  applyDocumentLanguage(meta.code);
});

export { applyDocumentLanguage };
export default i18n;
