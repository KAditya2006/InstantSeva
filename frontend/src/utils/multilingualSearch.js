import SERVICE_KEYWORDS from '../../../shared/serviceKeywords.json';

const normalize = (value) => String(value || '').trim().toLowerCase();

export const normalizeServiceSearch = (query) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return '';

  const match = Object.entries(SERVICE_KEYWORDS).find(([, keywords]) => (
    keywords.some((keyword) => {
      const normalizedKeyword = normalize(keyword);
      return normalizedQuery === normalizedKeyword ||
        normalizedQuery.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedQuery);
    })
  ));

  return match?.[0] || query;
};

export const getServiceKeywords = () => SERVICE_KEYWORDS;
