import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUser, uploadKYC as uploadWorkerKYC, uploadUserKYC } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, XCircle, ShieldCheck, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { fallbackAvatar, withImageFallback } from '../utils/images';
import { getDashboardPath, getOnboardingMessage, getVerificationSource } from '../utils/onboarding';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [kycFiles, setKycFiles] = useState({ idProof: null });
  const [uploading, setUploading] = useState(false);
  const verification = getVerificationSource(user);
  const verificationStatus = user?.verificationStatus || verification?.status || 'none';
  const onboardingMessage = location.state?.notice || getOnboardingMessage(user);
  const isOnboardingVisit = Boolean(location.state?.onboarding || location.state?.notice);

  const refreshUserStatus = useCallback(async ({ silent = false } = {}) => {
    try {
      const { data } = await getCurrentUser();
      setUser(data.user);

      if (data.user?.canAccessDashboard) {
        if (!silent) toast.success(t('profile.verificationApproved'));
        navigate(getDashboardPath(data.user), { replace: true });
        return;
      }

      if (!silent) toast.success(t('profile.statusRefreshed'));
    } catch {
      if (!silent) toast.error(t('profile.refreshFailed'));
    }
  }, [navigate, setUser, t]);

  useEffect(() => {
    if (user?.canAccessDashboard && isOnboardingVisit) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [isOnboardingVisit, navigate, user]);

  useEffect(() => {
    if (user?.canAccessDashboard || user?.role === 'admin') return undefined;

    const interval = setInterval(() => {
      refreshUserStatus({ silent: true });
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshUserStatus, user?.canAccessDashboard, user?.role]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!kycFiles.idProof) {
      return toast.error(t('profile.selectIdProof'));
    }

    const formData = new FormData();
    formData.append('idProof', kycFiles.idProof);

    setUploading(true);
    try {
      const uploadIdentity = user?.role === 'worker' ? uploadWorkerKYC : uploadUserKYC;
      const { data } = await uploadIdentity(formData);

      toast.success(data.message || t('profile.kycSubmitted'));

      const refreshed = await getCurrentUser();
      setUser(refreshed.data.user);

    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.verificationUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8 min-w-0">
        <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-4 sm:p-8 flex flex-col md:flex-row gap-5 sm:gap-6 md:items-center justify-between min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            <img src={user?.avatar || fallbackAvatar} onError={withImageFallback()} alt={user?.name || t('common.profile')} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl sm:rounded-3xl object-cover" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 break-words">{user?.name}</h1>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{user?.role}</span>
                {user?.phone && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Phone size={12} /> {user.phone}
                  </span>
                )}
                {user?.location?.city && (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <MapPin size={12} /> {user.location.city} {user.location.pincode && `(${user.location.pincode})`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/profile/edit')}
            className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all premium-shadow"
          >
            {t('profile.editProfile')}
          </button>
          <LanguageSwitcher className="w-full justify-between md:w-auto" />
        </section>

        {user?.role !== 'admin' && (
          <section className={`rounded-3xl border p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 ${
            user?.canAccessDashboard
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex min-w-0 items-start gap-4">
              <div className={`p-3 rounded-2xl ${user?.canAccessDashboard ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {user?.canAccessDashboard ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${user?.canAccessDashboard ? 'text-emerald-950' : 'text-amber-950'}`}>
                  {user?.canAccessDashboard ? t('profile.dashboardUnlocked') : t('profile.dashboardLocked')}
                </h2>
                <p className={`font-medium ${user?.canAccessDashboard ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {onboardingMessage}
                </p>
              </div>
            </div>
            {user?.canAccessDashboard && user?.role !== 'admin' && (
              <button
                onClick={() => navigate(getDashboardPath(user))}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
              >
                {t('profile.openDashboard')}
              </button>
            )}
            {!user?.canAccessDashboard && (
              <button
                onClick={refreshUserStatus}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-white border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-colors"
              >
                {t('profile.refreshStatus')}
              </button>
            )}
          </section>
        )}

        <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-8">
           <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-primary-600" />
              <h2 className="text-2xl font-bold font-heading text-slate-900">{t('profile.accountVerification')}</h2>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${
                    verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-600' : 
                    verificationStatus === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {verificationStatus === 'verified' ? <CheckCircle2 size={24} /> : 
                     verificationStatus === 'rejected' ? <XCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {user?.canAccessDashboard ? t('profile.dashboardApproved') :
                       verificationStatus === 'verified' ? t('profile.adminApprovalPending') : 
                       verificationStatus === 'pending' ? t('profile.verificationPending') : 
                       verificationStatus === 'rejected' ? t('profile.verificationRejected') : t('profile.verificationRequired')}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                       {user?.canAccessDashboard
                          ? t('profile.verifiedOpenDashboard')
                          : verificationStatus === 'verified' 
                          ? t('profile.documentVerifiedAdminPending') 
                          : verificationStatus === 'pending' 
                             ? t('profile.reviewingDocuments') 
                             : verificationStatus === 'rejected'
                                ? t('profile.rejectionReason', { reason: verification?.rejectionReason || t('profile.clearerDocuments') })
                                : t('profile.uploadProofToUnlock')}
                    </p>
                  </div>
                </div>
              </div>

              {(!verificationStatus || verificationStatus === 'none' || verificationStatus === 'rejected') && (
                <form onSubmit={handleKycSubmit} className="space-y-6">
                   <div>
                      <label className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${kycFiles.idProof ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-primary-400'}`}>
                        <div className={`p-3 rounded-xl ${kycFiles.idProof ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {kycFiles.idProof ? <CheckCircle2 size={24} /> : <CalendarDays size={24} />}
                        </div>
                        <span className={`text-sm font-bold ${kycFiles.idProof ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {kycFiles.idProof ? kycFiles.idProof.name : t('profile.chooseIdProof')}
                        </span>
                        <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" onChange={(e) => setKycFiles({...kycFiles, idProof: e.target.files[0]})} />
                      </label>
                   </div>
                   <button 
                     type="submit" 
                     disabled={uploading}
                     className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 premium-shadow"
                   >
                     {uploading ? t('profile.uploadingDocuments') : t('profile.submitVerificationDocuments')}
                   </button>
                </form>
              )}
           </div>
        </section>

        {!user?.canAccessDashboard && user?.role !== 'admin' && (
          <section className="bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 mb-2">{t('profile.dashboardWaiting')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              {t('profile.dashboardWaitingCopy')}
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Profile;
