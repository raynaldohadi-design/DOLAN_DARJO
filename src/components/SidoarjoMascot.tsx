import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SidoarjoMascotProps {
  tipText: string;
  destinationName?: string;
}

export const SidoarjoMascot: React.FC<SidoarjoMascotProps> = ({
  tipText,
  destinationName,
}) => {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0"
      >
        {/* Cak Darjo — Maskot Lokal Sidoarjo (Udeng Batik + Ikon Udang-Bandeng) */}
        <svg
          width="54"
          height="54"
          viewBox="0 0 64 64"
          fill="none"
          aria-label="Maskot Lokal Sidoarjo Cak Darjo"
          className="drop-shadow-xs"
        >
          {/* Base circle */}
          <circle cx="32" cy="34" r="26" fill="#0B1F3A" />
          <circle cx="32" cy="34" r="23" fill="#E0F2FE" />
          {/* Udeng Khas Jawa Timur / Sidoarjo */}
          <path
            d="M12 28C12 18 20 12 32 12C44 12 52 18 52 28L46 30C38 26 26 26 18 30L12 28Z"
            fill="#0B1F3A"
          />
          <path
            d="M22 15L32 9L42 15"
            stroke="#D97706"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Batik motif dots on Udeng */}
          <circle cx="24" cy="21" r="1.6" fill="#38BDF8" />
          <circle cx="32" cy="19" r="1.8" fill="#D97706" />
          <circle cx="40" cy="21" r="1.6" fill="#38BDF8" />
          {/* Face */}
          <circle cx="32" cy="37" r="14" fill="#FDE68A" />
          {/* Friendly eyes */}
          <circle cx="27" cy="35" r="2.1" fill="#0F172A" />
          <circle cx="37" cy="35" r="2.1" fill="#0F172A" />
          <circle cx="27.7" cy="34.3" r="0.7" fill="#FFFFFF" />
          <circle cx="37.7" cy="34.3" r="0.7" fill="#FFFFFF" />
          {/* Warm cheeks */}
          <ellipse cx="23.5" cy="38.5" rx="2.2" ry="1.2" fill="#F59E0B" opacity="0.45" />
          <ellipse cx="40.5" cy="38.5" rx="2.2" ry="1.2" fill="#F59E0B" opacity="0.45" />
          {/* Smile */}
          <path
            d="M27.5 41C29 43.2 35 43.2 36.5 41"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Delta Scarf / Pin Bandeng */}
          <path d="M21 50C25 53 39 53 43 50L40 57H24L21 50Z" fill="#0284C7" />
          <circle cx="32" cy="53" r="2.2" fill="#16A34A" />
        </svg>
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Cak Darjo · Pemandu Wisata Kota Delta</span>
        </div>
        {destinationName && (
          <div className="mt-0.5 text-[11px] font-semibold text-sky-800">
            Sorotan: {destinationName}
          </div>
        )}
        <p className="mt-1 text-xs leading-relaxed text-slate-700">{tipText}</p>
      </div>
    </div>
  );
};
