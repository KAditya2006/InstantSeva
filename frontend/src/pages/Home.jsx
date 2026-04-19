import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_METADATA } from '../constants/professions';
import { useTranslation } from 'react-i18next';
import VoiceSearchButton from '../components/VoiceSearchButton';
import { normalizeServiceSearch } from '../utils/multilingualSearch';
import { 
  Search, 
  MapPin, 
  Droplets, 
  Zap, 
  BookOpen, 
  Hammer, 
  Palette, 
  Wind, 
  Settings, 
  Sparkles, 
  Laptop, 
  Wifi, 
  Utensils, 
  Car, 
  Briefcase 
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const ICON_MAP = {
  Droplets,
  Zap,
  BookOpen,
  Hammer,
  Palette,
  Wind,
  Settings,
  Sparkles,
  Laptop,
  Wifi,
  Utensils,
  Car,
  Briefcase
};

const CATEGORIES = Object.entries(CATEGORY_METADATA).slice(0, 10).map(([name, meta]) => {
  const Icon = ICON_MAP[meta.iconName] || ICON_MAP.Briefcase;
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    icon: <Icon className={meta.iconColor} />,
    color: meta.color,
    slug: name
  };
});

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const normalizedQuery = normalizeServiceSearch(query);
    navigate(`/search${normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[calc(100svh-72px)] sm:min-h-[650px] flex items-center justify-center overflow-hidden bg-white py-12 sm:py-16">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] h-[min(500px,80vw)] w-[min(500px,80vw)] bg-primary-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[min(500px,80vw)] w-[min(500px,80vw)] bg-indigo-50 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-heading tracking-tight text-slate-900 leading-[1.08] sm:leading-[1.1] mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base sm:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('home.heroSubtitle')}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl premium-shadow flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-3xl mx-auto border border-slate-100 min-w-0">
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-3">
                <Search className="text-slate-400 shrink-0" size={20} />
                <input 
                  type="text" 
                  placeholder="What service do you need?" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full text-slate-900 outline-none text-base sm:text-lg font-medium min-w-0"
                />
              </div>
              <VoiceSearchButton
                onTranscript={(text) => setQuery(text)}
                speakText={t('voice.searchingFor', { text: query || t('common.searchServices') })}
              />
              <div className="w-[2px] h-8 bg-slate-100 hidden md:block" />
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-3">
                <MapPin className="text-slate-400 shrink-0" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter location" 
                  className="w-full text-slate-900 outline-none text-base sm:text-lg font-medium min-w-0"
                />
              </div>
              <button className="w-full md:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                {t('common.search')}
              </button>
            </form>
          </Motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold font-heading text-slate-900 mb-2">{t('home.categoryGrid')}</h2>
          <p className="text-slate-500 text-lg">{t('home.categorySubtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {CATEGORIES.map((cat, i) => (
            <Motion.div
              key={i}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/search?q=${encodeURIComponent(cat.slug)}`)}
              className={`${cat.color} p-5 sm:p-8 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border border-transparent hover:border-white hover:premium-shadow group min-h-32`}
            >
              <div className="p-4 bg-white rounded-2xl premium-shadow transform group-hover:scale-110 transition-transform">
                {React.cloneElement(cat.icon, { size: 32 })}
              </div>
              <span className="text-center font-bold text-slate-800 tracking-tight leading-snug">{t(`services.${cat.slug}`, { defaultValue: cat.name })}</span>
            </Motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-24 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 items-center gap-12 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-6 leading-tight">
              {t('home.heroTitle')}
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-white font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                {t('home.verifiedPros')}
              </div>
              <div className="flex items-center gap-3 text-white font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                {t('home.upfrontPricing')}
              </div>
            </div>
          </div>
          <div className="relative max-w-xl mx-auto lg:max-w-none w-full">
            <div className="aspect-square bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-[32px] sm:rounded-[60px] sm:rotate-3 relative z-10 overflow-hidden premium-shadow">
              <img 
                src="/marketplace-pro.svg" 
                className="w-full h-full object-cover sm:-rotate-3 scale-110 bg-white" 
                alt="Professional Service"
              />
            </div>
            <div className="hidden sm:block absolute top-[-20px] left-[-20px] w-full h-full border-2 border-primary-500/30 rounded-[60px]" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
