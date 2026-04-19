const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'or', 'ml', 'pa',
  'as', 'mai', 'sat', 'ks', 'ne', 'kok', 'sd', 'doi', 'mni', 'brx'
];

const normalizeLanguage = (language = 'en') => {
  const exact = String(language || '').trim().toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(exact)) return exact;

  const base = exact.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
};

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage
};
