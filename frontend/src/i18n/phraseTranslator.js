import resources from './resources';

const normalizePhrase = (value) => String(value || '').replace(/\s+/g, ' ').trim();

export const translatePhrase = (value, languageCode) => {
  const phrase = normalizePhrase(value);
  if (!phrase) return value;

  const language = String(languageCode || 'en').split('-')[0];
  const translation =
    resources[language]?.translation?.phrases?.[phrase] ||
    resources.en.translation.phrases?.[phrase];

  return translation || value;
};

export const hasPhraseTranslation = (value, languageCode) => {
  const phrase = normalizePhrase(value);
  const language = String(languageCode || 'en').split('-')[0];
  return Boolean(resources[language]?.translation?.phrases?.[phrase]);
};
