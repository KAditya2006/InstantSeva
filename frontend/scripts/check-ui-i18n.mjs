import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const projectRoot = path.resolve(root, '..');

const failures = [];

const read = (relativePath) => fs.readFileSync(path.resolve(root, relativePath), 'utf8');

const pageFiles = [
  'src/pages/WorkerDashboard.jsx',
  'src/pages/Profile.jsx',
  'src/pages/EditProfile.jsx',
  'src/pages/WorkerProfile.jsx',
  'src/pages/ForgotPassword.jsx'
];

pageFiles.forEach((file) => {
  const source = read(file);
  if (!source.includes('useTranslation')) {
    failures.push(`${file} must use react-i18next directly`);
  }
  if (/toast\.(success|error|loading)\(\s*['"`]/.test(source)) {
    failures.push(`${file} still has a hardcoded toast message`);
  }
  if (/placeholder="[^"]*[A-Za-z]/.test(source)) {
    failures.push(`${file} still has a hardcoded placeholder`);
  }
});

const resources = read('src/i18n/resources.js');
if (/import\s+\w+\s+from\s+['"]\.\/locales\/(hi|bn|te|mr|ta|ur|gu|kn|or|ml|pa|as|mai|sat|ks|ne|kok|sd|doi|mni|brx)\.json/.test(resources)) {
  failures.push('Non-English locale files should be lazy-loaded, not imported eagerly');
}
if (!resources.includes('loadLocale')) {
  failures.push('resources.js must expose loadLocale for lazy translation loading');
}

const runtimeTranslator = read('src/i18n/RuntimeTranslator.jsx');
if (!runtimeTranslator.includes("language === 'en'")) {
  failures.push('RuntimeTranslator should skip DOM observation for English');
}

const adminDashboard = read('src/pages/AdminDashboard.jsx');
if (!adminDashboard.includes('DocumentPreview') || !adminDashboard.includes('resolveAssetUrl')) {
  failures.push('AdminDashboard must resolve and preview uploaded KYC documents safely');
}

const frontendSearch = read('src/utils/multilingualSearch.js');
const backendSearch = fs.readFileSync(path.resolve(projectRoot, 'backend/utils/serviceKeywords.js'), 'utf8');
if (!frontendSearch.includes('shared/serviceKeywords.json') || !backendSearch.includes('shared/serviceKeywords.json')) {
  failures.push('Frontend and backend service search must use shared/serviceKeywords.json');
}

if (failures.length) {
  console.error(failures.map((failure) => `fail - ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`ok - ${pageFiles.length} translated pages and shared UI safeguards passed`);
