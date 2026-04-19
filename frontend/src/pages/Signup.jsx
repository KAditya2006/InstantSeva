import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { User, Mail, Lock, Phone, Briefcase, ArrowRight, Home, Clock } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { PROFESSIONS } from '../constants/professions';
import { useTranslation } from 'react-i18next';

const toStoredCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  const [lat, lng] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return [lng, lat];
};

const Signup = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '',
    role: 'user',
    address: '',
    homeNumber: '',
    professions: [],
    experience: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser({ ...formData, preferredLanguage: i18n.resolvedLanguage || i18n.language });
      if (data.success) {
        toast.success(data.message);
        navigate('/verify-otp', { state: { email: formData.email } });
      }
    } catch (error) {
      console.error('Registration error detail:', error);
      const msg = error.response?.data?.message || error.message || t('auth.registrationFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex" aria-label="InstantSeva home">
            <BrandLogo light />
          </Link>
          <div className="mt-24 max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white font-heading leading-tight mb-6">
              {t('auth.createAccount')}
            </h2>
            <p className="text-primary-100 text-xl leading-relaxed">
              {t('auth.joinText')}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-8">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <h4 className="text-white font-bold text-2xl">5000+</h4>
            <p className="text-primary-100/80 text-sm">{t('home.verifiedPros')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <h4 className="text-white font-bold text-2xl">10k+</h4>
            <p className="text-primary-100/80 text-sm">{t('dashboard.customerDashboard')}</p>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 sm:mb-10 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mb-2">{t('auth.createAccount')}</h3>
            <p className="text-slate-500">{t('auth.joinText')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200 gap-1">
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'user'})}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.role === 'user' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {t('auth.customerRole')}
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'worker'})}
                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${formData.role === 'worker' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {t('auth.workerRole')}
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t('auth.fullName')}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  placeholder={t('auth.email')}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  placeholder={t('auth.password')}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  placeholder={t('auth.phone')}
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <AddressAutocomplete 
                    value={formData.address}
                    onChange={({ address, coordinates }) => setFormData({
                      ...formData, 
                      address,
                      location: { ...formData.location, coordinates: toStoredCoordinates(coordinates) }
                    })}
                    placeholder={t('auth.location')}
                  />
                </div>
              </div>

              {formData.role === 'user' && (
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={t('auth.homeNumber')}
                    required={formData.role === 'user'}
                    value={formData.homeNumber}
                    onChange={(e) => setFormData({...formData, homeNumber: e.target.value})}
                    className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                  />
                </div>
              )}

              {formData.role === 'worker' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                      <Briefcase size={16} /> {t('auth.chooseProfessions')}
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                      {PROFESSIONS.map((prof) => {
                        const isSelected = formData.professions.includes(prof);
                        return (
                          <button
                            key={prof}
                            type="button"
                            onClick={() => {
                              const newProfs = isSelected
                                ? formData.professions.filter(p => p !== prof)
                                : [...formData.professions, prof];
                              setFormData({ ...formData, professions: newProfs });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              isSelected 
                                ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105' 
                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-primary-300 hover:bg-white'
                            }`}
                          >
                            {t(`services.${prof}`, { defaultValue: prof.charAt(0).toUpperCase() + prof.slice(1) })}
                          </button>
                        );
                      })}
                    </div>
                    {formData.professions.length === 0 && (
                      <p className="text-[10px] text-rose-500 font-bold ml-1">{t('auth.selectProfession')}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" 
                        placeholder={t('auth.experience')}
                        required={formData.role === 'worker'}
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea 
                      placeholder={t('auth.bio')}
                      required={formData.role === 'worker'}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={3}
                      className="w-full bg-white border border-slate-200 p-4 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? t('auth.creatingAccount') : (
                <>
                  {t('auth.registerNow')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            {t('auth.alreadyAccount')} <Link to="/login" className="text-primary-600 font-bold hover:underline">{t('auth.logIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
