const SERVICE_KEYWORDS = require('../../shared/serviceKeywords.json');

const normalize = (value) => String(value || '').trim().toLowerCase();

const normalizeServiceSearch = (query) => {
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

module.exports = {
  normalizeServiceSearch,
  SERVICE_KEYWORDS
};
