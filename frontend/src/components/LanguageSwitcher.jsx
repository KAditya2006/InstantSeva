import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LanguageSwitcher = ({ compact = false, className = '' }) => {
  const { t, i18n } = useTranslation();
  const { token, setUser } = useAuth();
  const [saving, setSaving] = React.useState(false);

  const handleChange = async (event) => {
    const preferredLanguage = event.target.value;
    await i18n.changeLanguage(preferredLanguage);

    if (!token) return;

    setSaving(true);
    try {
      const { data } = await updateProfile({ preferredLanguage });
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // Local language persistence already succeeded; profile sync can retry later.
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ${className}`}>
      <Languages size={16} className="text-primary-600" />
      {!compact && <span className="hidden sm:inline">{t('common.language')}</span>}
      <select
        value={i18n.resolvedLanguage || i18n.language}
        onChange={handleChange}
        disabled={saving}
        className="min-w-0 bg-transparent outline-none"
        aria-label={t('common.language')}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
