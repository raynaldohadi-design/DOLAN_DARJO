import React from 'react';

interface PesonaDeltaLogoProps {
  variant?: 'light' | 'dark' | 'compact';
  className?: string;
}

/**
 * Logo Pesona Delta — Kabupaten Sidoarjo
 * Menggabungkan siluet tugu Jayandaru, ombak Delta Sungai Brantas-Porong,
 * dan lengkung Udang-Bandeng dalam palet warna Gen Z Kota Delta.
 */
export const PesonaDeltaLogo: React.FC<PesonaDeltaLogoProps> = ({
  variant = 'light',
  className = '',
}) => {
  const isLightText = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className={variant === 'compact' ? 'h-9 w-9 shrink-0' : 'h-11 w-11 shrink-0'}
        role="img"
        aria-label="Logo Pesona Delta Kabupaten Sidoarjo"
      >
        <defs>
          <linearGradient id="pesonaDeltaCrest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="55%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
          <linearGradient id="pesonaDeltaWarm" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
        </defs>

        {/* Rounded Delta Shield */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="#0B1F3A"
          stroke="url(#pesonaDeltaCrest)"
          strokeWidth="2"
        />

        {/* Dynamic Delta River Waves */}
        <path
          d="M8 34 C14 30, 20 38, 26 33 C32 28, 36 35, 40 31"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M10 39 C16 36, 22 41, 28 37 C34 34, 37 38, 40 36"
          fill="none"
          stroke="#84CC16"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Stylized Jayandaru Spire + Twin Udang & Bandeng Arcs */}
        <path
          d="M24 9 L27.5 28 L20.5 28 Z"
          fill="url(#pesonaDeltaWarm)"
        />
        <path
          d="M20 27 C13 24, 12 15, 19 11"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M28 27 C35 24, 36 15, 29 11"
          fill="none"
          stroke="#A3E635"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="24" cy="9" r="2.2" fill="#FDE68A" />
      </svg>

      {variant !== 'compact' && (
        <div className="leading-none">
          <div
            className={`font-display text-[13px] font-extrabold tracking-tight ${
              isLightText ? 'text-white' : 'text-[#0B1F3A]'
            }`}
          >
            PESONA <span className={isLightText ? 'text-lime-300' : 'text-cyan-600'}>DELTA</span>
          </div>
          <div
            className={`mt-0.5 text-[10px] font-semibold tracking-wider ${
              isLightText ? 'text-sky-200' : 'text-slate-600'
            }`}
          >
            Kabupaten Sidoarjo
          </div>
        </div>
      )}
    </div>
  );
};
