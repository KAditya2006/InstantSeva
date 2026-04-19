import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LANGUAGE_CODES } from '../src/i18n/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localeDir = path.resolve(__dirname, '../src/i18n/locales');
const requiredSections = ['common', 'navbar', 'home', 'auth', 'search', 'voice', 'services', 'phrases'];
const requiredCommonKeys = ['language', 'search', 'login', 'logout', 'profile', 'dashboard'];

const failures = [];
const warnings = [];

const readLocale = (code) => {
  const filePath = path.join(localeDir, `${code}.json`);
  if (!fs.existsSync(filePath)) {
    failures.push(`Missing locale file: ${code}.json`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    failures.push(`${code}.json is not valid JSON: ${error.message}`);
    return null;
  }
};

const checkCaseInsensitivePhraseDuplicates = (code, phrases = {}) => {
  const seen = new Map();
  Object.keys(phrases).forEach((key) => {
    const normalizedKey = key.toLowerCase();
    const previousKey = seen.get(normalizedKey);
    if (previousKey && previousKey !== key) {
      failures.push(`${code}.json has duplicate phrase keys that differ only by case: "${previousKey}" and "${key}"`);
      return;
    }
    seen.set(normalizedKey, key);
  });
};

SUPPORTED_LANGUAGE_CODES.forEach((code) => {
  const locale = readLocale(code);
  if (!locale) return;

  requiredSections.forEach((section) => {
    if (!locale[section] || typeof locale[section] !== 'object') {
      failures.push(`${code}.json is missing required section "${section}"`);
    }
  });

  requiredCommonKeys.forEach((key) => {
    if (!locale.common?.[key]) {
      failures.push(`${code}.json is missing common.${key}`);
    }
  });

  checkCaseInsensitivePhraseDuplicates(code, locale.phrases);
});

const existingLocaleCodes = fs.readdirSync(localeDir)
  .filter((fileName) => fileName.endsWith('.json'))
  .map((fileName) => path.basename(fileName, '.json'))
  .sort();

const supportedCodes = [...SUPPORTED_LANGUAGE_CODES].sort();
const extraLocaleCodes = existingLocaleCodes.filter((code) => !supportedCodes.includes(code));
if (extraLocaleCodes.length) {
  warnings.push(`Extra locale files not listed in SUPPORTED_LANGUAGES: ${extraLocaleCodes.join(', ')}`);
}

if (warnings.length) {
  console.warn(warnings.map((warning) => `warn - ${warning}`).join('\n'));
}

if (failures.length) {
  console.error(failures.map((failure) => `fail - ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`ok - ${SUPPORTED_LANGUAGE_CODES.length} locale files passed i18n integrity checks`);
