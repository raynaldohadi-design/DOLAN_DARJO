import React, { useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Image as ImageIcon,
  Info,
  Navigation,
  Pause,
  Play,
  Plus,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Booking,
  BusUnit,
  MaintenanceTicket,
  NavTabId,
} from '../../types/dolandarjo';
import {
  formatLocalDate,
  SIDOARJO_PHOTOS,
  SIDOARJO_VISUAL_GALLERY,
  TODAY_STR,
} from '../../data/mockSidoarjoData';
import { ResilientImage } from '../ResilientImage';
import { PesonaDeltaLogo } from '../PesonaDeltaLogo';
import { SidoarjoBatikPattern } from '../SidoarjoBatikPattern';

interface DashboardViewProps {
  buses: BusUnit[];
  bookings: Booking[];
  tickets: MaintenanceTicket[];
  activeBackdropId: string;
  autoCycleBackdrop: boolean;
  onSelectBackdrop: (id: string) => void;
  onToggleAutoCycleBackdrop: () => void;
  onExploreDestination: (destId: string) => void;
  onNavigate: (tab: NavTabId) => void;
  onOpenNewBookingForDate: (dateStr: string) => void;
  onSelectBookingToInspect: (bookingId: string) => void;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_NAMES_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  buses,
  bookings,
  tickets,
  activeBackdropId,
  autoCycleBackdrop,
  onSelectBackdrop,
  onToggleAutoCycleBackdrop,
  onExploreDestination,
  onNavigate,
  onOpenNewBookingForDate,
  onSelectBookingToInspect,
}) => {
  const initialDate = useMemo(() => {
    const [y, m, d] = TODAY_STR.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, []);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [busFilterId, setBusFilterId] = useState<string>('all');

  // Interactive Hero Bus Photo Tilt/Zoom & Info Tooltip State
  const prefersReducedMotion = useReducedMotion();
  const heroCardRef = useRef<HTMLDivElement | null>(null);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroInfoOpen, setHeroInfoOpen] = useState(false);
  const [tooltipBusId, setTooltipBusId] = useState<string>(buses[0]?.id || 'bus-01');

  const heroMouseX = useMotionValue(0);
  const heroMouseY = useMotionValue(0);
  const heroTiltX = useSpring(
    useTransform(heroMouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [2.5, -2.5]),
    { stiffness: 200, damping: 24, mass: 0.6 }
  );
  const heroTiltY = useSpring(
    useTransform(heroMouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-3, 3]),
    { stiffness: 200, damping: 24, mass: 0.6 }
  );

  const activeTooltipBus = useMemo(
    () => buses.find((b) => b.id === tooltipBusId) || buses[0],
    [buses, tooltipBusId]
  );

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    heroMouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    heroMouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleHeroPointerLeave = () => {
    setHeroHovered(false);
    heroMouseX.set(0);
    heroMouseY.set(0);
  };

  // KPI computations (matches 4 Unit, 2 Unit, 5 Trip, 82%, 1 Ticket on initial load)
  const totalArmada = buses.length;
  const operatingCount = buses.filter((b) => b.status === 'Beroperasi').length;
  const todayTrips = useMemo(
    () => bookings.filter((b) => b.tripDate === TODAY_STR && b.status !== 'Ditolak'),
    [bookings]
  );
  const openTickets = useMemo(
    () => tickets.filter((t) => t.status !== 'Selesai'),
    [tickets]
  );

  // Compute monthly utilization baseline (starts at 82% with initial 12 bookings)
  const monthlyUtilization = useMemo(() => {
    const extraApproved = Math.max(0, bookings.length - 12);
    return Math.min(98, 82 + extraApproved * 2);
  }, [bookings.length]);

  const pendingVerification = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'Diajukan' || b.status === 'Verifikasi Berkas'
      ),
    [bookings]
  );

  // Calendar grid days (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0 .. Sun = 6
    const cells: { dateStr: string; dayNum: number; inMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      cells.push({
        dateStr: formatLocalDate(d),
        dayNum: d.getDate(),
        inMonth: false,
      });
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(viewYear, viewMonth, day);
      cells.push({
        dateStr: formatLocalDate(d),
        dayNum: day,
        inMonth: true,
      });
    }
    while (cells.length % 7 !== 0) {
      const nextIdx = cells.length - (startOffset + lastDay.getDate()) + 1;
      const d = new Date(viewYear, viewMonth + 1, nextIdx);
      cells.push({
        dateStr: formatLocalDate(d),
        dayNum: d.getDate(),
        inMonth: false,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (b.status === 'Ditolak') return;
      if (busFilterId !== 'all' && b.busId !== busFilterId) return;
      if (!map[b.tripDate]) map[b.tripDate] = [];
      map[b.tripDate].push(b);
    });
    return map;
  }, [bookings, busFilterId]);

  const maintenanceBuses = useMemo(
    () => buses.filter((b) => b.status === 'Maintenance'),
    [buses]
  );

  const selectedDayBookings = bookingsByDate[selectedDate] || [];
  const activeBookableBuses = buses.filter((b) => b.status !== 'Maintenance');
  const busyBusIdsOnSelectedDate = new Set(selectedDayBookings.map((b) => b.busId));
  const availableUnitsCountOnSelected = activeBookableBuses.filter(
    (b) => !busyBusIdsOnSelectedDate.has(b.id)
  ).length;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetToday = () => {
    setViewYear(initialDate.getFullYear());
    setViewMonth(initialDate.getMonth());
    setSelectedDate(TODAY_STR);
  };

  const getBusStatusStyle = (status: BusUnit['status']) => {
    switch (status) {
      case 'Beroperasi':
        return { text: 'text-emerald-700', label: 'Sedang Beroperasi', icon: Navigation };
      case 'Tersedia':
        return { text: 'text-sky-700', label: 'Tersedia Siap Tugas', icon: CheckCircle2 };
      case 'Terjadwal':
        return { text: 'text-sky-700', label: 'Terjadwal', icon: Clock };
      case 'Maintenance':
        return { text: 'text-red-700', label: 'Maintenance / Stop', icon: Wrench };
    }
  };

  return (
    <div className="space-y-6">
      {/* Gen Z Pesona Delta & Batik Khas Sidoarjo Header Banner */}
      <section
        aria-label="Pesona Delta Sidoarjo Header Dashboard"
        className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0B1F3A] via-[#0E3A5E] to-[#0891B2] text-white shadow-sm"
      >
        {/* Continuous Batik Jetis Ribbon Top */}
        <SidoarjoBatikPattern variant="ribbon" />

        {/* Subtle Sidoarjo Batik Background Overlay (Udang-Bandeng, Kembang Tebu & Beras Wutah) */}
        <SidoarjoBatikPattern variant="hero" className="absolute inset-0 opacity-35" />

        {/* Soft Gen Z Atmospheric Color Orbs (Coastal Cyan & Pandan Lime) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-lime-400/15 blur-3xl"
        />

        <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <div className="shrink-0 rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 backdrop-blur-xs self-start">
              <PesonaDeltaLogo variant="light" />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-lime-300 tracking-wide">
                Batik Jetis &amp; Pesona Delta · Dinas Kepemudaan, Olahraga, dan Pariwisata
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Dashboard Operasional Angkutan Wisata Sidoarjo
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-cyan-100/90 max-w-2xl">
                Pantau armada bus city tour, ketersediaan slot rute ODL, dan tiket pemeliharaan dengan sentuhan budaya Kota Delta yang segar untuk generasi muda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('peta-webar')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-xs px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              <Compass className="h-4 w-4 text-lime-300" />
              <span>Jelajah Peta WebAR</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNewBookingForDate(selectedDate)}
              className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-bold text-[#0B1F3A] hover:bg-lime-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
            >
              <Plus className="h-4 w-4" />
              <span>Ajukan Peminjaman Bus</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5 KPI Summary Cards — Gen Z Coastal Delta Accents + Subtle Sidoarjo Batik Watermark */}
      <section aria-label="Ringkasan Indikator Kinerja Utama" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-4">
          <SidoarjoBatikPattern variant="subtle" className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Total Armada Bus</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B1F3A] text-cyan-300">
                <Bus className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#0B1F3A] tabular-nums">
              {totalArmada} Unit
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Kapasitas 30–40 kursi per armada
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-lime-300/80 bg-white/95 p-4">
          <SidoarjoBatikPattern variant="subtle" className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Sedang Beroperasi</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-500 text-[#0B1F3A]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-lime-700 tabular-nums">
              {operatingCount} Unit
            </div>
            <div className="mt-1.5 text-xs font-medium text-lime-700">
              Aktif di rute ODL tervalidasi
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-cyan-300/80 bg-white/95 p-4">
          <SidoarjoBatikPattern variant="subtle" className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Jadwal Hari Ini</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 text-white">
                <CalendarIcon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-cyan-700 tabular-nums">
              {todayTrips.length} Trip
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Sesi pagi &amp; sesi siang terjadwal
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-300/80 bg-white/95 p-4">
          <SidoarjoBatikPattern variant="subtle" className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Utilisasi Bulanan</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-[#0B1F3A]">
                <Navigation className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#0B1F3A] tabular-nums">
              {monthlyUtilization}%
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-lime-500 transition-all duration-300"
                style={{ width: `${monthlyUtilization}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('maintenance')}
          className="relative overflow-hidden text-left rounded-xl border border-orange-300/90 bg-white/95 p-4 hover:border-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <SidoarjoBatikPattern variant="subtle" className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Tiket Masalah</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-red-600 tabular-nums">
              {openTickets.length} Ticket
            </div>
            <div className="mt-1.5 text-xs font-medium text-orange-700">
              {openTickets.length > 0 ? 'Unit DARJO-04 dalam perbaikan' : 'Seluruh armada laik jalan'}
            </div>
          </div>
        </button>
      </section>

      {/* Visual Showcase: Gen Z City Tour Bus + Pesona Wisata & Kuliner Sidoarjo Web Backdrop */}
      <section
        aria-label="Pesona Wisata Sidoarjo dan Armada Bus Generasi Muda"
        className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch"
      >
        {/* Left: Attractive Millennial & Gen Z City Tour Bus Showcase with Hover Tilt/Zoom + Spec Info Tooltip */}
        <div
          ref={heroCardRef}
          onPointerEnter={() => setHeroHovered(true)}
          onPointerMove={handleHeroPointerMove}
          onPointerLeave={handleHeroPointerLeave}
          style={{ perspective: 1100 }}
          className="lg:col-span-7 relative min-h-[270px] flex"
        >
          <motion.div
            style={{
              rotateX: heroTiltX,
              rotateY: heroTiltY,
              transformStyle: 'preserve-3d',
            }}
            className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-[#0B1F3A] flex flex-col justify-end shadow-sm transition-shadow duration-300 hover:shadow-xl"
          >
            <ResilientImage
              src={SIDOARJO_PHOTOS.busGenZ}
              alt="Bus Wisata DOLAN DARJO bersama wisatawan milenial dan Gen Z Sidoarjo"
              fallbackLabel="Armada Bus Wisata DOLAN DARJO"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out ${
                heroHovered && !prefersReducedMotion ? 'scale-[1.06]' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/95 via-[#0B1F3A]/55 to-[#0B1F3A]/20" />

            <div className="relative z-10 p-5 sm:p-6 pt-14 text-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-cyan-200">
                <span>Armada City Tour Milenial &amp; Gen Z · Pesona Delta Sidoarjo</span>
                <span className="font-mono tabular-nums text-lime-300">Gratis via E-Ticket</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold leading-snug tracking-tight">
                Jelajah Monumen Jayandaru hingga Kelepon Bulang Lebih Seru Bersama DOLAN DARJO
              </h2>
              <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                Kabin panorama ber-AC, Audio Guide QR, colokan USB di setiap kursi, dan integrasi Peta WebAR Cak Darjo untuk pengalaman wisata edukasi dan kuliner khas Kota Delta.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenNewBookingForDate(selectedDate)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-cyan-400 transition-colors"
                >
                  <Bus className="h-3.5 w-3.5" />
                  <span>Booking Bus Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('peta-webar')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 backdrop-blur-xs px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5 text-lime-300" />
                  <span>Buka Peta &amp; Kamera WebAR</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Interactive Info Tooltip Trigger & Floating Fleet Specification Popover (unclipped outside overflow-hidden) */}
          <div
            onMouseEnter={() => setHeroInfoOpen(true)}
            onMouseLeave={() => setHeroInfoOpen(false)}
            className="absolute top-3.5 right-3.5 z-30"
          >
            <button
              type="button"
              onClick={() => setHeroInfoOpen((prev) => !prev)}
              onFocus={() => setHeroInfoOpen(true)}
              aria-expanded={heroInfoOpen}
              aria-label="Info Spesifikasi Armada Bus DOLAN DARJO"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                heroInfoOpen
                  ? 'border-sky-300 bg-sky-500 text-white shadow-lg'
                  : 'border-white/30 bg-[#0B1F3A]/80 text-sky-100 hover:bg-sky-500 hover:text-white'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>Info Spesifikasi Bus</span>
            </button>

            <AnimatePresence>
              {heroInfoOpen && activeTooltipBus && (
                <motion.div
                  role="tooltip"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-sky-400/35 bg-[#0B1F3A] p-4 text-white shadow-2xl"
                >
                  {/* Unit Switcher Tabs */}
                  <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                    {buses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setTooltipBusId(b.id)}
                        className={`flex-1 rounded-md px-2 py-1 font-mono text-[10px] font-semibold transition-colors tabular-nums ${
                          activeTooltipBus.id === b.id
                            ? 'bg-sky-500 text-white'
                            : 'text-sky-100 hover:bg-white/10'
                        }`}
                      >
                        {b.code}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <div className="font-mono text-[10px] font-semibold text-sky-300 tabular-nums">
                        {activeTooltipBus.code} · {activeTooltipBus.plateNumber}
                      </div>
                      <div className="font-display text-sm font-bold text-white mt-0.5">
                        {activeTooltipBus.unitName}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        activeTooltipBus.status === 'Beroperasi'
                          ? 'text-emerald-300'
                          : activeTooltipBus.status === 'Maintenance'
                          ? 'text-red-300'
                          : 'text-sky-300'
                      }`}
                    >
                      {activeTooltipBus.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                    <div>
                      <div className="text-slate-400">Kapasitas Penumpang</div>
                      <div className="font-mono font-semibold text-white tabular-nums flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3 text-sky-300" />
                        <span>{activeTooltipBus.seatCapacity} Kursi</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Tahun &amp; Odometer</div>
                      <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                        {activeTooltipBus.year} · {activeTooltipBus.odometerKm.toLocaleString('id-ID')} km
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Kru Pengemudi</div>
                      <div className="font-medium text-slate-100 mt-0.5 truncate">
                        {activeTooltipBus.driverName}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Ramp Check Terakhir</div>
                      <div className="font-mono font-medium text-emerald-300 tabular-nums mt-0.5">
                        {activeTooltipBus.lastInspectionDate}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-2.5 text-[11px]">
                    <div className="text-slate-400 mb-1">Fasilitas Armada</div>
                    <div className="text-sky-100 leading-relaxed">
                      {activeTooltipBus.facilities.join(' · ')}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Interactive Sidoarjo Landmark & Culinary Web Background Gallery */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Latar Web &amp; Galeri Pesona Delta</span>
              </div>
              <h2 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                Destinasi Wisata &amp; Kuliner Khas Sidoarjo
              </h2>
            </div>
            <button
              type="button"
              onClick={onToggleAutoCycleBackdrop}
              className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50/70 px-2.5 py-1 text-[11px] font-semibold text-[#0B1F3A] hover:bg-cyan-100 shrink-0"
              title="Putar otomatis latar belakang web"
            >
              {autoCycleBackdrop ? (
                <>
                  <Pause className="h-3 w-3 text-cyan-700" />
                  <span>Auto Slide</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 text-slate-600" />
                  <span>Manual</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SIDOARJO_VISUAL_GALLERY.map((item) => {
              const isActive = item.id === activeBackdropId;
              return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-lg border transition-all ${
                    isActive
                      ? 'border-cyan-600 ring-2 ring-cyan-400/50'
                      : 'border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBackdrop(item.id)}
                    className="block w-full text-left focus-visible:outline-none"
                    title={`Jadikan ${item.title} sebagai latar web`}
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackLabel={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                        <div className="text-[10px] font-medium text-lime-300 leading-none">
                          {item.category}
                        </div>
                        <div className="mt-0.5 text-[11px] font-bold leading-tight line-clamp-1">
                          {item.title}
                        </div>
                      </div>
                    </div>
                  </button>

                  {item.destinationId && (
                    <button
                      type="button"
                      onClick={() => onExploreDestination(item.destinationId!)}
                      className="w-full border-t border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-[#0B1F3A] hover:bg-cyan-50 hover:text-cyan-800 transition-colors flex items-center justify-between"
                    >
                      <span>Buka WebAR</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Split: Real-time Bus Availability Calendar + Live Selected Date & Fleet Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Real-time Availability Calendar Widget */}
        <section
          aria-label="Kalender Ketersediaan Bus Real-Time"
          className="xl:col-span-8 overflow-hidden rounded-xl border border-slate-200/90 bg-white/95"
        >
          <SidoarjoBatikPattern variant="ribbon" />
          <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Kalender Ketersediaan Bus Real-Time
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik tanggal untuk melihat slot unit tersedia, trip terjadwal, dan blokir jadwal servis.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter unit bus pada kalender"
                value={busFilterId}
                onChange={(e) => setBusFilterId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="all">Semua Unit (4 Armada)</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.code} · {bus.unitName}
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-l-lg"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {MONTH_NAMES_ID[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-r-lg"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetToday}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
              <span>Tersedia penuh</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
              <span>Terjadwal / Beroperasi</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span>Menunggu verifikasi</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-600" />
              <span>Penuh / Maintenance unit</span>
            </span>
          </div>

          {/* Calendar Grid */}
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 pb-2">
              {DAY_NAMES_ID.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell) => {
                const dayBookings = bookingsByDate[cell.dateStr] || [];
                const isToday = cell.dateStr === TODAY_STR;
                const isSelected = cell.dateStr === selectedDate;
                const hasPending = dayBookings.some(
                  (b) => b.status === 'Diajukan' || b.status === 'Verifikasi Berkas'
                );
                const busyCount = new Set(dayBookings.map((b) => b.busId)).size;
                const usableTotal = busFilterId === 'all' ? activeBookableBuses.length : (
                  buses.find((b) => b.id === busFilterId)?.status === 'Maintenance' ? 0 : 1
                );
                const freeSlots = Math.max(0, usableTotal - busyCount);

                let statusBarColor = 'bg-emerald-500';
                if (usableTotal === 0 || (freeSlots === 0 && dayBookings.length > 0)) {
                  statusBarColor = 'bg-red-500';
                } else if (hasPending) {
                  statusBarColor = 'bg-amber-500';
                } else if (dayBookings.length > 0) {
                  statusBarColor = 'bg-sky-600';
                }

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`group relative flex min-h-[72px] flex-col justify-between rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      !cell.inMonth
                        ? 'border-slate-100 bg-slate-50/60 text-slate-400'
                        : isSelected
                        ? 'border-[#0B1F3A] bg-sky-50/70 text-slate-900'
                        : 'border-slate-200 bg-white hover:border-sky-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isToday
                            ? 'rounded bg-[#0B1F3A] px-1.5 py-0.5 text-white'
                            : ''
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="font-mono text-[10px] font-semibold text-slate-600 tabular-nums">
                          {dayBookings.length}T
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-medium text-slate-600 truncate tabular-nums">
                        {cell.inMonth
                          ? usableTotal === 0
                            ? 'Unit Servis'
                            : `${freeSlots} kosong`
                          : ''}
                      </div>
                      <div className={`h-1 w-full rounded-full ${cell.inMonth ? statusBarColor : 'bg-slate-200'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </section>

        {/* Right Panel: Selected Date Slot Inspector & Fleet Status */}
        <aside className="xl:col-span-4 space-y-5">
          {/* Selected Day Availability */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Ketersediaan Tanggal Dipilih
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 tabular-nums mt-0.5">
                  {selectedDate === TODAY_STR ? `Hari Ini (${selectedDate})` : selectedDate}
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                {availableUnitsCountOnSelected}/{activeBookableBuses.length} Siap
              </span>
            </div>

            {maintenanceBuses.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <strong>Catatan Armada:</strong> {maintenanceBuses.map((b) => b.code).join(', ')} diblokir otomatis karena sedang dalam perbaikan.
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {selectedDayBookings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-600">
                    Belum ada jadwal peminjaman pada tanggal ini. Seluruh armada laik jalan ({activeBookableBuses.length} unit) tersedia.
                  </p>
                </div>
              ) : (
                selectedDayBookings.map((bk) => {
                  const bus = buses.find((u) => u.id === bk.busId);
                  return (
                    <button
                      key={bk.id}
                      type="button"
                      onClick={() => onSelectBookingToInspect(bk.id)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-left hover:border-sky-300 hover:bg-sky-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                          {bk.pickupTime}–{bk.endTime}
                        </span>
                        <span
                          className={`font-medium ${
                            bk.status === 'Sedang Berjalan'
                              ? 'text-emerald-700'
                              : bk.status === 'Terbit E-Ticket'
                              ? 'text-sky-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-900 truncate">
                        {bk.organizationName}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{bus?.code || 'Armada'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{bk.participantCount} org</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{bk.segment}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenNewBookingForDate(selectedDate)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#13315C] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Booking untuk {selectedDate}</span>
            </button>
          </div>

          {/* Live 4-Unit Fleet Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Status Armada Real-Time (4 Unit)
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('maintenance')}
                className="text-xs font-medium text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
              >
                <span>Detail</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {buses.map((bus) => {
                const st = getBusStatusStyle(bus.status);
                const StIcon = st.icon;
                return (
                  <div key={bus.id} className="py-2.5 first:pt-1 last:pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {bus.code} — {bus.unitName}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {bus.plateNumber} · {bus.seatCapacity} Kursi
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${st.text}`}>
                        <StIcon className="h-3.5 w-3.5" />
                        <span>{bus.status}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Split: Today's 5 Trips Table + Verification Queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Today's Trips Table */}
        <section className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Jadwal Operasional Hari Ini ({todayTrips.length} Trip)
              </h2>
              <p className="text-xs text-slate-500">
                Realisasi keberangkatan, penugasan armada, dan verifikasi QR Check-in/Check-out.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('peminjaman')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 whitespace-nowrap"
            >
              Kelola Semua Peminjaman
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Kode &amp; Jam</th>
                  <th className="py-2.5 px-3 font-semibold">Pemohon / Instansi</th>
                  <th className="py-2.5 px-3 font-semibold">Armada &amp; Rute ODL</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Peserta</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayTrips.map((trip) => {
                  const bus = buses.find((b) => b.id === trip.busId);
                  return (
                    <tr
                      key={trip.id}
                      onClick={() => onSelectBookingToInspect(trip.id)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 pr-3 align-top whitespace-nowrap">
                        <div className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                          {trip.bookingCode}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {trip.pickupTime}–{trip.endTime} WIB
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-slate-900">
                          {trip.organizationName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {trip.segment} · PIC: {trip.applicantName}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-medium text-slate-800">
                          {bus?.code} ({bus?.plateNumber})
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[240px] truncate">
                          {trip.routeName}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top text-right font-mono font-medium text-slate-900 tabular-nums">
                        {trip.participantCount} org
                      </td>
                      <td className="py-3 pl-3 align-top text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            trip.status === 'Sedang Berjalan'
                              ? 'text-emerald-700'
                              : trip.status === 'Terbit E-Ticket'
                              ? 'text-sky-700'
                              : trip.status === 'Rute Disetujui'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verification & Priority Queue */}
        <section className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Antrean Verifikasi
              </h2>
              <p className="text-xs text-slate-500">
                Pengajuan baru menunggu telaah berkas &amp; rute.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-amber-700 tabular-nums">
              {pendingVerification.length} Antre
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {pendingVerification.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Tidak ada antrean verifikasi tertunda.
              </p>
            ) : (
              pendingVerification.map((bk) => (
                <div
                  key={bk.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                      {bk.bookingCode}
                    </span>
                    {bk.isUrgentH3 ? (
                      <span className="font-semibold text-red-700">
                        Prioritas Mendesak (&lt; H-3)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">{bk.status}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-900">
                    {bk.organizationName}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
                    Tanggal: {bk.tripDate} · {bk.participantCount} Peserta ({bk.segment})
                  </div>
                  <div className="mt-2.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectBookingToInspect(bk.id)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
                    >
                      <span>Tinjau &amp; Proses</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
