import resources from './resources';

const normalizePhrase = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const findPhraseTranslation = (phrases = {}, phrase) => {
  if (phrases[phrase]) return phrases[phrase];

  const normalizedPhrase = phrase.toLowerCase();
  const matchingKey = Object.keys(phrases).find((key) => key.toLowerCase() === normalizedPhrase);
  return matchingKey ? phrases[matchingKey] : undefined;
};

export const translatePhrase = (value, languageCode) => {
  const phrase = normalizePhrase(value);
  if (!phrase) return value;

  const language = String(languageCode || 'en').split('-')[0];
  const translation =
    findPhraseTranslation(resources[language]?.translation?.phrases, phrase) ||
    findPhraseTranslation(resources.en.translation.phrases, phrase);

  return translation || value;
};

export const hasPhraseTranslation = (value, languageCode) => {
  const phrase = normalizePhrase(value);
  const language = String(languageCode || 'en').split('-')[0];
  return Boolean(findPhraseTranslation(resources[language]?.translation?.phrases, phrase));
};
