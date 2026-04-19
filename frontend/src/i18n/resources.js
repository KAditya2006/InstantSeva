import en from './locales/en.json';

export const resources = {
  en: { translation: en }
};

const localeLoaders = {
  hi: () => import('./locales/hi.json'),
  bn: () => import('./locales/bn.json'),
  te: () => import('./locales/te.json'),
  mr: () => import('./locales/mr.json'),
  ta: () => import('./locales/ta.json'),
  ur: () => import('./locales/ur.json'),
  gu: () => import('./locales/gu.json'),
  kn: () => import('./locales/kn.json'),
  or: () => import('./locales/or.json'),
  ml: () => import('./locales/ml.json'),
  pa: () => import('./locales/pa.json'),
  as: () => import('./locales/as.json'),
  mai: () => import('./locales/mai.json'),
  sat: () => import('./locales/sat.json'),
  ks: () => import('./locales/ks.json'),
  ne: () => import('./locales/ne.json'),
  kok: () => import('./locales/kok.json'),
  sd: () => import('./locales/sd.json'),
  doi: () => import('./locales/doi.json'),
  mni: () => import('./locales/mni.json'),
  brx: () => import('./locales/brx.json')
};

export const loadLocale = async (languageCode) => {
  const language = String(languageCode || 'en').split('-')[0];
  if (resources[language]) return resources[language];

  const loader = localeLoaders[language];
  if (!loader) return resources.en;

  const module = await loader();
  resources[language] = { translation: module.default };
  return resources[language];
};

export default resources;
