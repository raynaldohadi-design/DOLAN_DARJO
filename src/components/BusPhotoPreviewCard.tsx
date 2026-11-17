import React, { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { Bus, CheckCircle2, Info, ShieldCheck, Users, Wrench } from 'lucide-react';
import { BusUnit } from '../types/dolandarjo';
import { ResilientImage } from './ResilientImage';

interface BusPhotoPreviewCardProps {
  bus: BusUnit;
  compact?: boolean;
}

export const BusPhotoPreviewCard: React.FC<BusPhotoPreviewCardProps> = ({
  bus,
  compact = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPinned, setTooltipPinned] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [5, -5]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-6, 6]),
    springConfig
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(px);
    mouseY.set(py);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const showTooltip = isHovered || tooltipPinned;

  const statusMeta =
    bus.status === 'Beroperasi'
      ? { color: 'text-emerald-300', icon: CheckCircle2 }
      : bus.status === 'Maintenance'
      ? { color: 'text-red-300', icon: Wrench }
      : { color: 'text-sky-300', icon: ShieldCheck };
  const StatusIcon = statusMeta.icon;

  return (
    <div
      className={`relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/90 ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      {/* Tilt + Zoom Bus Photo Container (overflow-visible outer wrapper for tooltip) */}
      <div
        ref={cardRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ perspective: 900 }}
        className="relative sm:w-48 shrink-0"
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="group relative overflow-hidden rounded-lg border border-slate-200 bg-[#0B1F3A] aspect-16/9 shadow-sm transition-shadow duration-300 hover:shadow-md cursor-pointer"
          onClick={() => setTooltipPinned((prev) => !prev)}
        >
          <ResilientImage
            src={bus.imageUrl}
            alt={`${bus.unitName} — Armada Wisata Gen Z & Milenial Sidoarjo`}
            fallbackLabel={bus.unitName}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out ${
              isHovered && !prefersReducedMotion ? 'scale-110' : 'scale-100'
            }`}
          />

          {/* Subtle dynamic sheen gradient on hover */}
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0B1F3A]/65 via-transparent to-sky-300/20 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-65'
            }`}
          />

          {/* Bottom-left unit label */}
          <div className="pointer-events-none absolute bottom-1.5 left-2 right-9 text-white">
            <div className="font-mono text-[10px] font-semibold text-sky-200 leading-none tabular-nums">
              {bus.code}
            </div>
            <div className="text-[11px] font-bold leading-tight truncate mt-0.5">
              {bus.unitName}
            </div>
          </div>

          {/* Interactive Info Tooltip Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTooltipPinned((prev) => !prev);
            }}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            aria-label={`Lihat info spesifikasi ${bus.unitName}`}
            aria-expanded={showTooltip}
            className={`absolute top-1.5 right-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              showTooltip
                ? 'border-sky-300 bg-sky-500 text-white'
                : 'border-white/30 bg-[#0B1F3A]/80 text-sky-100 hover:bg-sky-500 hover:text-white'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* Interactive Bus Specification Info Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              role="tooltip"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 bottom-full mb-2.5 z-40 w-72 sm:w-80 rounded-xl border border-sky-400/30 bg-[#0B1F3A] p-3.5 text-white shadow-2xl pointer-events-auto"
            >
              {/* Arrow */}
              <div
                aria-hidden="true"
                className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b border-sky-400/30 bg-[#0B1F3A]"
              />

              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                <div>
                  <div className="font-mono text-[10px] font-semibold text-sky-300 tabular-nums">
                    {bus.code} · {bus.plateNumber}
                  </div>
                  <div className="font-display text-xs font-bold text-white mt-0.5">
                    {bus.unitName}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${statusMeta.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{bus.status}</span>
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                <div>
                  <div className="text-slate-400">Kapasitas</div>
                  <div className="font-mono font-semibold text-white tabular-nums flex items-center gap-1">
                    <Users className="h-3 w-3 text-sky-300" />
                    <span>{bus.seatCapacity} Kursi</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Tahun / Odometer</div>
                  <div className="font-mono font-semibold text-white tabular-nums">
                    {bus.year} · {bus.odometerKm.toLocaleString('id-ID')} km
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Kru Pengemudi</div>
                  <div className="font-medium text-slate-100 truncate">
                    {bus.driverName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Ramp Check Terakhir</div>
                  <div className="font-mono font-medium text-emerald-300 tabular-nums">
                    {bus.lastInspectionDate}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 border-t border-white/10 pt-2 text-[11px]">
                <span className="text-slate-400">Fasilitas Kabin: </span>
                <span className="text-sky-100 leading-relaxed">
                  {bus.facilities.join(' · ')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Summary Text Beside Photo */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-display text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Bus className="h-3.5 w-3.5 text-[#0B1F3A] shrink-0" />
            <span>
              {bus.code} · {bus.unitName} ({bus.plateNumber})
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-sky-700 tabular-nums">
            {bus.seatCapacity} Kursi · Tahun {bus.year}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Kru: {bus.driverName} ({bus.driverPhone}) · Fasilitas: {bus.facilities.join(', ')}.
        </p>
        <div className="text-[10px] font-medium text-sky-700">
          Arahkan kursor atau klik ikon info pada foto bus untuk melihat spesifikasi lengkap armada.
        </div>
      </div>
    </div>
  );
};
