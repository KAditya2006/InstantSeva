import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updateAvatar } from '../services/api';
import { User, Mail, Phone, MapPin, Home, ArrowLeft, Save, Camera, Loader2 } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';
import { getDashboardPath } from '../utils/onboarding';

const toStoredCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  const [lat, lng] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return [lng, lat];
};

const EditProfile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    homeNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        homeNumber: user.location?.homeNumber || '',
      });
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('editProfile.imageTooLarge'));
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const { data } = await updateAvatar(uploadData);
      if (data.success) {
        toast.success(t('backend.avatarUpdated'));
        setUser({ ...user, avatar: data.avatar });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('editProfile.imageUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await updateProfile(formData);
      if (data.success) {
        toast.success(t('backend.profileUpdated'));
        setUser(data.user);

        if (data.user?.canAccessDashboard && data.user?.role !== 'admin') {
          navigate(getDashboardPath(data.user), { replace: true });
        } else {
          navigate('/profile', { state: { onboarding: true } });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('editProfile.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> {t('editProfile.backToProfile')}
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 premium-shadow p-6 sm:p-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold font-heading text-slate-900">{t('profile.editProfile')}</h1>
              <p className="text-slate-500 mt-1">{t('editProfile.subtitle')}</p>
            </div>

            {/* Avatar Section */}
            <div className="relative group self-center sm:self-auto">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-50 premium-shadow bg-white flex items-center justify-center relative">
                <img 
                  src={user?.avatar || '/avatar.svg'} 
                  alt={user?.name}
                  className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'opacity-100'}`}
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-primary-600 animate-spin" size={24} />
                  </div>
                )}
              </div>
              <label 
                className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-all premium-shadow group-hover:scale-110 active:scale-95"
                title={t('editProfile.changePhoto')}
              >
                <Camera size={16} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={t('editProfile.phonePlaceholder')}
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.location')}</label>
                  <AddressAutocomplete 
                    value={formData.address}
                    onChange={({ address, coordinates }) => setFormData({
                      ...formData, 
                      address,
                      coordinates: toStoredCoordinates(coordinates)
                    })}
                    placeholder={t('editProfile.locationPlaceholder')}
                  />
                </div>
              </div>

              {user?.role === 'user' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">{t('editProfile.homeAptNumber')}</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.homeNumber}
                      onChange={(e) => setFormData({...formData, homeNumber: e.target.value})}
                      placeholder={t('editProfile.homePlaceholder')}
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? t('editProfile.savingChanges') : (
                  <>
                    <Save size={20} /> {t('editProfile.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
