import React, { useId } from 'react';

interface SidoarjoBatikPatternProps {
  variant?: 'hero' | 'subtle' | 'ribbon';
  className?: string;
}

/**
 * Motif Batik Tulis Khas Jetis Sidoarjo:
 * Menggabungkan ornamen Sekardjagad/Kawung Delta, siluet Udang & Bandeng,
 * Kembang Tebu, dan titik-titik Beras Wutah secara presisi.
 */
export const SidoarjoBatikPattern: React.FC<SidoarjoBatikPatternProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const patternId = `batik-sidoarjo-${variant}-${uid}`;

  if (variant === 'ribbon') {
    return (
      <svg
        aria-hidden="true"
        className={`w-full h-3 block ${className}`}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={patternId} width="72" height="12" patternUnits="userSpaceOnUse">
            <rect width="72" height="12" fill="#0B1F3A" />
            <path d="M0 6 L9 0 L18 6 L9 12 Z" fill="#06B6D4" fillOpacity="0.85" />
            <path d="M18 6 L27 0 L36 6 L27 12 Z" fill="#84CC16" fillOpacity="0.85" />
            <path d="M36 6 L45 0 L54 6 L45 12 Z" fill="#F97316" fillOpacity="0.85" />
            <path d="M54 6 L63 0 L72 6 L63 12 Z" fill="#FBBF24" fillOpacity="0.85" />
            <circle cx="9" cy="6" r="1.5" fill="#0B1F3A" />
            <circle cx="27" cy="6" r="1.5" fill="#0B1F3A" />
            <circle cx="45" cy="6" r="1.5" fill="#0B1F3A" />
            <circle cx="63" cy="6" r="1.5" fill="#0B1F3A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    );
  }

  const strokePrimary = variant === 'hero' ? '#38BDF8' : '#0B1F3A';
  const strokeAccent = variant === 'hero' ? '#FBBF24' : '#0284C7';
  const strokeLime = variant === 'hero' ? '#A3E635' : '#0D9488';

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={patternId}
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Kawung & Sekardjagad Diamond Grid */}
          <path
            d="M60 6 L114 60 L60 114 L6 60 Z"
            fill="none"
            stroke={strokePrimary}
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
          <path
            d="M60 22 L98 60 L60 98 L22 60 Z"
            fill="none"
            stroke={strokeAccent}
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.55"
          />

          {/* 4-Petal Kembang Tebu / Sekardjagad Center */}
          <path
            d="M60 40 C66 50, 70 54, 80 60 C70 66, 66 70, 60 80 C54 70, 50 66, 40 60 C50 54, 54 50, 60 40 Z"
            fill={strokeAccent}
            fillOpacity="0.16"
            stroke={strokeAccent}
            strokeWidth="1.1"
            strokeOpacity="0.65"
          />
          <circle cx="60" cy="60" r="4" fill={strokeLime} fillOpacity="0.7" />

          {/* Stylized Bandeng (Milkfish) Motif - Top Left & Bottom Right */}
          <path
            d="M18 28 C26 20, 38 22, 43 28 C38 34, 26 36, 18 28 Z M18 28 L12 23 M18 28 L12 33"
            fill="none"
            stroke={strokeLime}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
          <path
            d="M77 92 C85 84, 97 86, 102 92 C97 98, 85 100, 77 92 Z M102 92 L108 87 M102 92 L108 97"
            fill="none"
            stroke={strokeLime}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />

          {/* Stylized Udang (Shrimp Curve) Motif - Top Right & Bottom Left */}
          <path
            d="M84 22 C93 17, 101 23, 98 32 C95 38, 88 37, 86 33 M98 24 C103 20, 107 20, 109 22"
            fill="none"
            stroke={strokePrimary}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
          <path
            d="M36 98 C27 103, 19 97, 22 88 C25 82, 32 83, 34 87 M22 96 C17 100, 13 100, 11 98"
            fill="none"
            stroke={strokePrimary}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />

          {/* Beras Wutah (Scattered Rice Stipple Dots) */}
          <circle cx="60" cy="14" r="1.5" fill={strokeAccent} fillOpacity="0.6" />
          <circle cx="106" cy="60" r="1.5" fill={strokeAccent} fillOpacity="0.6" />
          <circle cx="60" cy="106" r="1.5" fill={strokeAccent} fillOpacity="0.6" />
          <circle cx="14" cy="60" r="1.5" fill={strokeAccent} fillOpacity="0.6" />
          <circle cx="34" cy="46" r="1.1" fill={strokePrimary} fillOpacity="0.5" />
          <circle cx="86" cy="46" r="1.1" fill={strokePrimary} fillOpacity="0.5" />
          <circle cx="34" cy="74" r="1.1" fill={strokePrimary} fillOpacity="0.5" />
          <circle cx="86" cy="74" r="1.1" fill={strokePrimary} fillOpacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};
