export const LANGUAGE_STORAGE_KEY = 'instantseva.language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', speech: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', speech: 'hi-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', speech: 'bn-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', speech: 'te-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', speech: 'mr-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', speech: 'ta-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', speech: 'ur-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', speech: 'gu-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', speech: 'kn-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr', speech: 'or-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', speech: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr', speech: 'pa-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', dir: 'ltr', speech: 'as-IN' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', dir: 'ltr', speech: 'hi-IN' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'ltr', speech: 'hi-IN' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', dir: 'ltr', speech: 'ur-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', dir: 'ltr', speech: 'ne-NP' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', dir: 'ltr', speech: 'hi-IN' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', dir: 'ltr', speech: 'hi-IN' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', dir: 'ltr', speech: 'hi-IN' },
  { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', dir: 'ltr', speech: 'hi-IN' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', dir: 'ltr', speech: 'hi-IN' }
];

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((language) => language.code);

export const getLanguageMeta = (code) => {
  const exact = SUPPORTED_LANGUAGES.find((language) => language.code === code);
  if (exact) return exact;

  const base = String(code || '').split('-')[0];
  return SUPPORTED_LANGUAGES.find((language) => language.code === base) || SUPPORTED_LANGUAGES[0];
};

export const resolveSupportedLanguage = (code) => getLanguageMeta(code).code;

export const getInitialLanguage = () => {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) return resolveSupportedLanguage(saved);

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const matchedLanguage = browserLanguages
    .map(resolveSupportedLanguage)
    .find((languageCode) => SUPPORTED_LANGUAGE_CODES.includes(languageCode));

  return matchedLanguage || 'en';
};
