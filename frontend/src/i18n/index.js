import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources, { loadLocale } from './resources';
import { getInitialLanguage, getLanguageMeta, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGE_CODES } from './languages';

const applyDocumentLanguage = (languageCode) => {
  const meta = getLanguageMeta(languageCode);
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
  document.body?.setAttribute('dir', meta.dir);
  document.body?.classList.toggle('is-rtl', meta.dir === 'rtl');
};

const initialLanguage = getInitialLanguage();

export const loadI18nLanguage = async (languageCode) => {
  const meta = getLanguageMeta(languageCode);
  const resource = await loadLocale(meta.code);

  if (!i18n.hasResourceBundle(meta.code, 'translation')) {
    i18n.addResourceBundle(meta.code, 'translation', resource.translation, true, true);
  }

  return meta.code;
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    returnNull: false
  });

applyDocumentLanguage(initialLanguage);

loadI18nLanguage(initialLanguage)
  .then((languageCode) => {
    if (i18n.language !== languageCode) {
      return i18n.changeLanguage(languageCode);
    }
    return undefined;
  })
  .catch(() => {
    applyDocumentLanguage('en');
  });

i18n.on('languageChanged', (languageCode) => {
  const meta = getLanguageMeta(languageCode);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, meta.code);
  applyDocumentLanguage(meta.code);
});

export { applyDocumentLanguage };
export default i18n;
