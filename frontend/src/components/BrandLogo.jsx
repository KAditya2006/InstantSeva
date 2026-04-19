import React from 'react';
import { Zap, Heart } from 'lucide-react';

const BrandLogo = ({ light = false, compact = false, className = '' }) => {
  const textColor = light ? 'text-white' : 'text-slate-900';
  const subTextColor = light ? 'text-primary-100' : 'text-primary-600';

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary-900/10 ring-1 ring-primary-100 overflow-hidden group">
        {/* Animated Background Polish */}
        <div className="absolute inset-0 bg-linear-to-tr from-primary-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative">
          <Zap size={22} className="text-primary-600 absolute -top-1 -right-1 fill-primary-600/20" />
          <Heart size={20} className="text-emerald-500 fill-emerald-500/20" />
        </div>
      </span>
      {!compact && (
        <span className="min-w-0 leading-none max-[380px]:hidden">
          <span className={`block font-heading text-lg sm:text-2xl font-bold tracking-tight ${textColor}`}>
            Instant<span className="text-primary-600">Seva</span>
          </span>
          <span className={`hidden sm:block font-heading text-[10px] font-bold uppercase tracking-[0.2em] ${subTextColor} opacity-80`}>
            Speedy Local Services
          </span>
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
