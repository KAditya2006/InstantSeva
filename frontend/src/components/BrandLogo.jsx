import React from 'react';

const BrandLogo = ({ light = false, compact = false, className = '' }) => {
  const textColor = light ? 'text-white' : 'text-slate-900';
  const subTextColor = light ? 'text-primary-100' : 'text-primary-600';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary-900/10 ring-1 ring-primary-100">
        <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
          <path fill="#7c3aed" d="M32 7c-10 0-18 7.8-18 17.4 0 13 18 32.6 18 32.6s18-19.6 18-32.6C50 14.8 42 7 32 7Z" />
          <path fill="#ffffff" d="M21 27.2 32 18l11 9.2v14.3a2.5 2.5 0 0 1-2.5 2.5h-17a2.5 2.5 0 0 1-2.5-2.5V27.2Z" />
          <path fill="#14b8a6" d="M25 31.8h14v3.8H25z" />
          <path fill="#f59e0b" d="M30.1 27.7h3.8v13.8h-3.8z" />
          <path fill="#312e81" d="M32 20.5 19 31.3l-2.3-2.8L32 15.7l15.3 12.8-2.3 2.8L32 20.5Z" />
          <circle cx="32" cy="24" r="3.2" fill="#14b8a6" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-heading text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>
            Hyperlocal
          </span>
          <span className={`block font-heading text-xs font-bold uppercase tracking-[0.18em] ${subTextColor}`}>
            Market
          </span>
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
