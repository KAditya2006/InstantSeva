import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await forgotPassword({ email });
      toast.success(data.message);
      setCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || t('forgotPassword.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ email, token, password });
      toast.success(t('forgotPassword.updated'));
      setToken('');
      setPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || t('forgotPassword.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-8 space-y-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600">
          <ArrowLeft size={16} /> {t('forgotPassword.backToLogin')}
        </Link>

        <div>
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">{t('forgotPassword.title')}</h1>
          <p className="text-slate-500 mt-2">{t('forgotPassword.subtitle')}</p>
        </div>

        <form onSubmit={codeSent ? handleReset : handleRequest} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.email')} className="w-full bg-slate-50 rounded-2xl pl-12 pr-4 py-4 outline-none" />
          </div>

          {codeSent && (
            <>
              <input required value={token} onChange={(e) => setToken(e.target.value)} placeholder={t('forgotPassword.resetCode')} className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('forgotPassword.newPassword')} className="w-full bg-slate-50 rounded-2xl px-4 py-4 outline-none" />
            </>
          )}

          <button disabled={loading} className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50">
            {loading ? t('forgotPassword.pleaseWait') : codeSent ? t('forgotPassword.updatePassword') : t('forgotPassword.sendResetCode')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
