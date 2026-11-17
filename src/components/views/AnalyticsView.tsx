import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Lock,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  Booking,
  BusUnit,
  Destination,
  OdlPackage,
  UserRole,
} from '../../types/dolandarjo';
import {
  APPLICANT_TREND_SERIES,
  BUS_OTP_SERIES,
  DAY_OF_WEEK_UTILIZATION,
  MONTHLY_OCCUPANCY_SERIES,
  PEAK_HOURS_SERIES,
  TODAY_STR,
} from '../../data/mockSidoarjoData';
import type { ManagementBriefInsight } from '../../utils/reportExporter';

interface AnalyticsViewProps {
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  bookings: Booking[];
  buses: BusUnit[];
  destinations: Destination[];
  packages: OdlPackage[];
  onNotifyToast: (msg: string) => void;
}

type PeriodFilter = 'semester' | 'triwulan' | 'bulan-ini';

const CATEGORY_SERIES_META: Array<{
  key: 'TK' | 'SD' | 'SMP' | 'SMA' | 'Mahasiswa' | 'Umum';
  label: string;
  color: string;
}> = [
  { key: 'TK', label: 'TK', color: '#38BDF8' },
  { key: 'SD', label: 'SD', color: '#0284C7' },
  { key: 'SMP', label: 'SMP', color: '#0B1F3A' },
  { key: 'SMA', label: 'SMA', color: '#1E3A8A' },
  { key: 'Mahasiswa', label: 'Mahasiswa', color: '#16A34A' },
  { key: 'Umum', label: 'Umum', color: '#D97706' },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activeRole,
  onSwitchRole,
  bookings,
  buses,
  destinations,
  packages,
  onNotifyToast,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('semester');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedBrief, setAiGeneratedBrief] = useState<ManagementBriefInsight | null>(null);
  const [showKopPreview, setShowKopPreview] = useState(false);

  const isAuthorized =
    activeRole === 'Super Admin (Pranata Komputer)' ||
    activeRole === 'Approver (Pimpinan Disporapar)';

  const periodLabel = useMemo(() => {
    if (period === 'bulan-ini') return 'Bulan Berjalan (November 2026)';
    if (period === 'triwulan') return 'Triwulan IV (September – November 2026)';
    return 'Semester II (Juni – November 2026)';
  }, [period]);

  const filteredMonthly = useMemo(() => {
    if (period === 'bulan-ini') return MONTHLY_OCCUPANCY_SERIES.slice(-1);
    if (period === 'triwulan') return MONTHLY_OCCUPANCY_SERIES.slice(-3);
    return MONTHLY_OCCUPANCY_SERIES;
  }, [period]);

  const filteredApplicantTrend = useMemo(() => {
    if (period === 'bulan-ini') return APPLICANT_TREND_SERIES.slice(-1);
    if (period === 'triwulan') return APPLICANT_TREND_SERIES.slice(-3);
    return APPLICANT_TREND_SERIES;
  }, [period]);

  const aggregatedKpis = useMemo(() => {
    const count = filteredMonthly.length || 1;
    const avgUtil = Math.round(
      filteredMonthly.reduce((acc, m) => acc + m.occupancy, 0) / count
    );
    const avgOtp = Number(
      (filteredMonthly.reduce((acc, m) => acc + m.onTimeRate, 0) / count).toFixed(1)
    );
    const avgDelay = Number(
      (filteredMonthly.reduce((acc, m) => acc + m.avgDelayMins, 0) / count).toFixed(1)
    );
    const totalTrips = filteredMonthly.reduce((acc, m) => acc + m.trips, 0);
    const totalPassengers = filteredMonthly.reduce((acc, m) => acc + m.passengers, 0);
    const avgNoShow = Number(
      (filteredMonthly.reduce((acc, m) => acc + m.noShowRate, 0) / count).toFixed(1)
    );
    const avgWeekend = Math.round(
      filteredMonthly.reduce((acc, m) => acc + m.weekendOccupancy, 0) / count
    );
    const avgWeekday = Math.round(
      filteredMonthly.reduce((acc, m) => acc + m.weekdayOccupancy, 0) / count
    );

    return {
      utilizationPercent: period === 'bulan-ini' ? 82 : avgUtil,
      onTimePercent: avgOtp,
      avgDelayMins: avgDelay,
      totalTrips,
      totalPassengers,
      ikmScore: 4.7,
      noShowPercent: avgNoShow,
      weekendOccupancy: avgWeekend,
      weekdayOccupancy: avgWeekday,
    };
  }, [filteredMonthly, period]);

  const categoryTotals = useMemo(() => {
    const totals = { TK: 0, SD: 0, SMP: 0, SMA: 0, Mahasiswa: 0, Umum: 0 };
    filteredApplicantTrend.forEach((row) => {
      totals.TK += row.TK;
      totals.SD += row.SD;
      totals.SMP += row.SMP;
      totals.SMA += row.SMA;
      totals.Mahasiswa += row.Mahasiswa;
      totals.Umum += row.Umum;
    });
    const grandTotal =
      totals.TK + totals.SD + totals.SMP + totals.SMA + totals.Mahasiswa + totals.Umum || 1;

    return CATEGORY_SERIES_META.map((meta) => ({
      ...meta,
      trips: totals[meta.key],
      percentage: Math.round((totals[meta.key] / grandTotal) * 100),
    }));
  }, [filteredApplicantTrend]);

  const topDestinations = useMemo(
    () => [...destinations].sort((a, b) => b.visitCountMonth - a.visitCountMonth).slice(0, 6),
    [destinations]
  );

  const accessConstrainedDests = useMemo(
    () => destinations.filter((d) => !d.busAccessible),
    [destinations]
  );

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => b.popularityPercent - a.popularityPercent),
    [packages]
  );

  const maintenanceBuses = useMemo(
    () => buses.filter((b) => b.status === 'Maintenance'),
    [buses]
  );

  // Operational baseline brief derived from live datasets (used until Gemini synthesis updates it)
  const baselineBrief: ManagementBriefInsight = useMemo(() => {
    const topRoute = sortedPackages[0];
    const secondRoute = sortedPackages[1];
    const weekendUnmet = DAY_OF_WEEK_UTILIZATION.filter(
      (d) => d.day === 'Sabtu' || d.day === 'Minggu'
    ).reduce((sum, d) => sum + d.unmetRequests, 0);

    return {
      executiveSummary: `Pada ${periodLabel}, utilisasi armada bus city tour mencapai rata-rata ${aggregatedKpis.utilizationPercent}% dengan ${aggregatedKpis.totalTrips} perjalanan (${aggregatedKpis.totalPassengers.toLocaleString('id-ID')} peserta terlayani) dan On-Time Performance ${aggregatedKpis.onTimePercent}% (IKM 4,7/5,0).`,
      peakHoursAnalysis:
        'Jam puncak keberangkatan terkonsentrasi pada pukul 06:30–10:00 WIB (60% dari total trip harian) yang didominasi rombongan TK/SD dan SMP/SMA pada hari Selasa–Kamis, sedangkan sesi siang 12:00–14:00 WIB banyak diisi mahasiswa dan komunitas.',
      weekendFleetRecommendation: `Okupansi akhir pekan mencapai ${aggregatedKpis.weekendOccupancy}% (Sabtu 98%, Minggu 95%) dibanding hari kerja ${aggregatedKpis.weekdayOccupancy}%, disertai ${weekendUnmet} permohonan akhir pekan yang belum terakomodasi. Disarankan penambahan minimal 1 unit armada cadangan (atau pengaktifan penuh DARJO-04 pasca-servis) khusus slot Sabtu–Minggu.`,
      topRoutesAnalysis: `${topRoute ? `${topRoute.packageName} (${topRoute.popularityPercent}%)` : 'Rute Jejak Jenggala'} dan ${secondRoute ? `${secondRoute.packageName} (${secondRoute.popularityPercent}%)` : 'Rute Kriya & Rasa Delta'} menjadi rute paling diminati masyarakat Sidoarjo, dengan Museum Mpu Tantular (${topDestinations[0]?.visitCountMonth ?? 54} kunjungan) dan Kampung Batik Jetis (${topDestinations[1]?.visitCountMonth ?? 49} kunjungan) sebagai magnet utama.`,
      actionItems: [
        'Prioritaskan penyelesaian tiket maintenance DARJO-04 dan siapkan 1 unit armada pengumpan/tambahan untuk merespons lonjakan permintaan akhir pekan (96%+).',
        'Terapkan insentif slot keberangkatan sesi siang (10:30–13:00 WIB) bagi instansi SMA/Mahasiswa untuk mengurai kepadatan jam puncak pagi 07:00–09:00 WIB.',
        `Koordinasikan dengan Dinas Perhubungan terkait ${accessConstrainedDests.length} destinasi akses jalan sempit (Batik Jetis, Kalanganyar, Kampung Lali Gadget, Kedungrejo, Balongdowo) guna penyediaan rambu drop-off resmi bus wisata.`,
      ],
    };
  }, [
    accessConstrainedDests.length,
    aggregatedKpis,
    periodLabel,
    sortedPackages,
    topDestinations,
  ]);

  const activeBrief = aiGeneratedBrief || baselineBrief;

  const handleGenerateGeminiBrief = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/analytics/management-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel,
          occupancyPercent: aggregatedKpis.utilizationPercent,
          onTimePerformancePercent: aggregatedKpis.onTimePercent,
          totalTrips: aggregatedKpis.totalTrips,
          totalPassengers: aggregatedKpis.totalPassengers,
          ikmScore: aggregatedKpis.ikmScore,
          noShowRatePercent: aggregatedKpis.noShowPercent,
          peakHoursSummary: '06:30–10:00 WIB (60% trip pagi), Selasa–Kamis puncak sekolah, Sabtu–Minggu puncak komunitas/UMKM',
          weekendDemandPercent: aggregatedKpis.weekendOccupancy,
          weekdayDemandPercent: aggregatedKpis.weekdayOccupancy,
          segmentBreakdown: categoryTotals.map((c) => ({
            segment: c.label,
            percentage: c.percentage,
            trips: c.trips,
          })),
          topRoutes: sortedPackages.map((p) => ({
            routeName: p.packageName,
            percentage: p.popularityPercent,
          })),
          accessConstrainedCount: accessConstrainedDests.length,
          maintenanceStopCount: maintenanceBuses.length,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan Management Brief dari layanan AI.');
      }

      setAiGeneratedBrief(data as ManagementBriefInsight);
      onNotifyToast('Management Brief berhasil disintesis oleh AI Insight Engine.');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Layanan AI Insight Engine sedang tidak dapat diakses.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const buildReportPayload = () => ({
    periodLabel,
    activeRole,
    printedDate: TODAY_STR,
    kpis: {
      utilizationPercent: aggregatedKpis.utilizationPercent,
      onTimePercent: aggregatedKpis.onTimePercent,
      totalTrips: aggregatedKpis.totalTrips,
      totalPassengers: aggregatedKpis.totalPassengers,
      ikmScore: aggregatedKpis.ikmScore,
      noShowPercent: aggregatedKpis.noShowPercent,
    },
    monthlySeries: filteredMonthly,
    applicantTrend: filteredApplicantTrend,
    busOtpSeries: BUS_OTP_SERIES,
    topDestinations,
    bookings,
    buses,
    brief: activeBrief,
  });

  const handleExportPdf = async () => {
    const { exportOfficialPdfReport } = await import('../../utils/reportExporter');
    const filename = exportOfficialPdfReport(buildReportPayload());
    onNotifyToast(`Laporan PDF ber-kop resmi (${filename}) berhasil diunduh.`);
  };

  const handleExportExcel = async () => {
    const { exportOfficialExcelReport } = await import('../../utils/reportExporter');
    const filename = exportOfficialExcelReport(buildReportPayload());
    onNotifyToast(`Laporan Excel multi-sheet ber-kop resmi (${filename}) berhasil diunduh.`);
  };

  // RBAC Restriction Screen for non-Admin / non-Pimpinan roles
  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Otoritas Akses Terbatas (RBAC Disporapar)
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              Halaman Analytics &amp; Management Brief Khusus Admin &amp; Pimpinan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Peran Anda saat ini (<strong>{activeRole}</strong>) hanya memiliki otorisasi operasional lapangan/pemohon. Laporan utilisasi strategis, AI Management Brief, serta ekspor dokumen ber-kop resmi hanya dapat diakses oleh <strong>Super Admin (Pranata Komputer)</strong> dan <strong>Approver (Pimpinan Disporapar)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onSwitchRole('Approver (Pimpinan Disporapar)');
                onNotifyToast('Beralih ke peran Approver (Pimpinan Disporapar).');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Masuk sebagai Pimpinan Disporapar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchRole('Super Admin (Pranata Komputer)');
                onNotifyToast('Beralih ke peran Super Admin (Pranata Komputer).');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span>Masuk sebagai Admin Disporapar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute SVG polyline coordinates for On-Time Performance trend
  const otpChartSeries = MONTHLY_OCCUPANCY_SERIES;
  const otpPoints = otpChartSeries
    .map((m, idx) => {
      const x = 35 + idx * 78;
      const y = 120 - ((m.onTimeRate - 85) / 15) * 90;
      return { x, y, ...m };
    });
  const otpPolyline = otpPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Header + Period Filter + Official PDF/Excel Export */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Akses Eksekutif Aktif · {activeRole}</span>
          </div>
          <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Analytics &amp; Management Brief Pimpinan Disporapar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Evaluasi utilisasi bulanan bus city tour, ketepatan waktu (OTP), tren 6 kategori pemohon, sintesis AI Management Brief, serta ekspor laporan ber-kop resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label="Pilih periode laporan analytics"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
          >
            <option value="semester">Semester II (Jun–Nov 2026)</option>
            <option value="triwulan">Triwulan IV (Sep–Nov 2026)</option>
            <option value="bulan-ini">Bulan Berjalan (Nov 2026)</option>
          </select>

          <button
            type="button"
            onClick={() => setShowKopPreview((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{showKopPreview ? 'Tutup Kop Surat' : 'Pratinjau Kop'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Ekspor PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Optional Official Institutional Kop Surat Print/Preview Banner */}
      {showKopPreview && (
        <div className="rounded-xl border border-slate-300 bg-white p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b-4 border-double border-[#0B1F3A] pb-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#0B1F3A] text-white border-2 border-amber-500">
              <span className="text-[10px] font-bold tracking-wider">PEMKAB</span>
              <span className="text-xs font-extrabold text-amber-400">SDA</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-700">
                Pemerintah Kabupaten Sidoarjo
              </div>
              <div className="font-display text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                DINAS KEPEMUDAAN, OLAHRAGA, DAN PARIWISATA
              </div>
              <div className="text-[11px] text-slate-600">
                Jl. Sultan Agung No. 32 Sidoarjo, Jawa Timur 61212 • Telp. (031) 8941234 • disporapar.sidoarjokab.go.id
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 shrink-0 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Halaman</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              <strong>Perihal:</strong> Laporan Analytics &amp; Management Brief DOLAN DARJO ({periodLabel})
            </span>
            <span className="font-mono tabular-nums">Tanggal Cetak: {TODAY_STR}</span>
          </div>
        </div>
      )}

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Utilisasi Bulanan Bus</span>
            <Bus className="h-4 w-4 text-[#0B1F3A]" />
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#0B1F3A] tabular-nums">
            {aggregatedKpis.utilizationPercent}%
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-medium tabular-nums">
            Akhir pekan {aggregatedKpis.weekendOccupancy}% · Hari kerja {aggregatedKpis.weekdayOccupancy}%
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>On-Time Performance (OTP)</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {aggregatedKpis.onTimePercent}%
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Rata-rata deviasi ±{aggregatedKpis.avgDelayMins} menit (Target 90%)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Masyarakat Terlayani</span>
            <Users className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {aggregatedKpis.totalPassengers.toLocaleString('id-ID')} Org
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {aggregatedKpis.totalTrips} perjalanan ODL ({periodLabel.split(' ')[0]})
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Indeks Kepuasan (IKM)</span>
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            4,7 / 5,0
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            No-show mendadak {aggregatedKpis.noShowPercent}% · Target IKM 4,5
          </div>
        </div>
      </div>

      {/* ROW 1 CHARTS: Monthly Utilization + On-Time Performance (OTP) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 1: Monthly Utilization (Weekday vs Weekend) */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Utilisasi Bulanan Bus City Tour (Hari Kerja vs Akhir Pekan)
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan tingkat keterisian rata-rata bulanan terhadap kapasitas akhir pekan.
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-sky-600 shrink-0" />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#0B1F3A]" />
              <span>Rata-rata Bulanan</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" />
              <span>Hari Kerja</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
              <span>Akhir Pekan (Peak)</span>
            </span>
          </div>

          <div className="relative pt-4">
            {/* Target 80% Dashed Line */}
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-500/70 flex justify-end"
              style={{ bottom: '122px' }}
            >
              <span className="bg-white px-1 text-[10px] font-mono font-semibold text-emerald-700 -mt-2">
                Target 80%
              </span>
            </div>

            <div className="flex items-end justify-between gap-3 h-48 px-1">
              {MONTHLY_OCCUPANCY_SERIES.map((item) => (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <div className="font-mono text-[11px] font-bold text-[#0B1F3A] tabular-nums">
                    {item.occupancy}%
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      title={`${item.fullMonth} Rata-rata: ${item.occupancy}%`}
                      className="w-3 sm:w-4 rounded-t bg-[#0B1F3A] transition-all"
                      style={{ height: `${item.occupancy}%` }}
                    />
                    <div
                      title={`${item.fullMonth} Hari Kerja: ${item.weekdayOccupancy}%`}
                      className="w-3 sm:w-4 rounded-t bg-sky-500 transition-all"
                      style={{ height: `${item.weekdayOccupancy}%` }}
                    />
                    <div
                      title={`${item.fullMonth} Akhir Pekan: ${item.weekendOccupancy}%`}
                      className="w-3 sm:w-4 rounded-t bg-amber-500 transition-all"
                      style={{ height: `${item.weekendOccupancy}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-800">{item.month}</div>
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                      {item.trips} trip
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chart 2: On-Time Performance (OTP) Trend + Unit Breakdown */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Tingkat Ketepatan Waktu (On-Time Performance)
              </h2>
              <p className="text-xs text-slate-500">
                Kepatuhan jam jemput &amp; tiba berdasarkan log QR Check-in/Check-out armada.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
              Nov: 93,8%
            </span>
          </div>

          {/* SVG OTP Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 460 150"
              className="w-full h-36 min-w-[360px]"
              aria-label="Grafik tren ketepatan waktu armada"
            >
              {/* Grid lines for 85%, 90%, 95%, 100% */}
              {[
                { val: '100%', y: 30 },
                { val: '95%', y: 60 },
                { val: '90%', y: 90 },
                { val: '85%', y: 120 },
              ].map((g) => (
                <g key={g.val}>
                  <line
                    x1="30"
                    y1={g.y}
                    x2="445"
                    y2={g.y}
                    stroke="#E2E8F0"
                    strokeDasharray={g.val === '90%' ? '4 4' : undefined}
                  />
                  <text x="2" y={g.y + 3} fontSize="9" fill="#64748B" fontFamily="monospace">
                    {g.val}
                  </text>
                </g>
              ))}
              <polyline
                fill="none"
                stroke="#16A34A"
                strokeWidth="2.5"
                strokeLinejoin="round"
                points={otpPolyline}
              />
              {otpPoints.map((pt) => (
                <g key={pt.month}>
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2.5" />
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#0B1F3A"
                    fontFamily="monospace"
                  >
                    {pt.onTimeRate}%
                  </text>
                  <text
                    x={pt.x}
                    y="142"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#334155"
                    fontWeight="600"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Per-Unit OTP Compact Table */}
          <div className="overflow-x-auto border-t border-slate-100 pt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  <th className="pb-1.5">Armada</th>
                  <th className="pb-1.5 text-right">Trip</th>
                  <th className="pb-1.5 text-right">OTP (%)</th>
                  <th className="pb-1.5 text-right">Rata Delay</th>
                  <th className="pb-1.5 text-right">Ramp Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BUS_OTP_SERIES.map((unit) => (
                  <tr key={unit.code}>
                    <td className="py-1.5 font-semibold text-slate-900">
                      {unit.code} · <span className="font-normal text-slate-600">{unit.unitName}</span>
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                      {unit.tripsCompleted}
                    </td>
                    <td
                      className={`py-1.5 text-right font-mono font-bold tabular-nums ${
                        unit.onTimePercent >= 92 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {unit.onTimePercent.toFixed(1)}%
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-600">
                      {unit.avgDelayMins.toFixed(1)} mnt
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                      {unit.rampCheckPassRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ROW 2 CHARTS: Tren Kategori Pemohon (TK, SD, SMP, SMA, Mahasiswa, Umum) + Peak Hours & Weekend Gap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 3: Applicant Category Trend (TK, SD, SMP, SMA, Mahasiswa, Umum) */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Tren Kategori Pemohon (TK, SD, SMP, SMA, Mahasiswa, Umum)
              </h2>
              <p className="text-xs text-slate-500">
                Proporsi pemanfaatan bus city tour lintas jenjang pendidikan dan masyarakat umum/UMKM.
              </p>
            </div>
            <Users className="h-4 w-4 text-[#0B1F3A] shrink-0" />
          </div>

          {/* 6 Category Legend Strip */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-700">
            {categoryTotals.map((cat) => (
              <span key={cat.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold">{cat.label}:</span>
                <span className="font-mono tabular-nums text-slate-500">
                  {cat.trips} trip ({cat.percentage}%)
                </span>
              </span>
            ))}
          </div>

          {/* Stacked Monthly Bar Chart */}
          <div className="flex items-end justify-between gap-3 h-48 pt-3 px-1">
            {APPLICANT_TREND_SERIES.map((row) => {
              const total = row.TK + row.SD + row.SMP + row.SMA + row.Mahasiswa + row.Umum;
              const maxScale = 52;
              return (
                <div
                  key={row.month}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="font-mono text-[11px] font-bold text-slate-800 tabular-nums">
                    {total}
                  </span>
                  <div
                    className="w-full max-w-[44px] flex flex-col-reverse overflow-hidden rounded-t-md border border-slate-200/60"
                    style={{ height: `${Math.min(100, Math.round((total / maxScale) * 100))}%` }}
                  >
                    {CATEGORY_SERIES_META.map((meta) => {
                      const val = row[meta.key];
                      const segPct = (val / total) * 100;
                      return (
                        <div
                          key={meta.key}
                          title={`${row.month} · ${meta.label}: ${val} trip`}
                          style={{ height: `${segPct}%`, backgroundColor: meta.color }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{row.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Chart 4: Peak Hours & Weekend Fleet Capacity Pressure */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Analisis Jam Puncak (Peak Hours) &amp; Beban Harian
              </h2>
              <p className="text-xs text-slate-500">
                Sebaran slot keberangkatan &amp; antrean permintaan akhir pekan.
              </p>
            </div>
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          </div>

          <div className="space-y-2">
            {PEAK_HOURS_SERIES.map((slot) => (
              <div key={slot.slot} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    {slot.slot}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                    {slot.note}
                  </span>
                  <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                    {slot.trips} trip ({slot.sharePercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      slot.sharePercent >= 25 ? 'bg-amber-500' : 'bg-sky-600'
                    }`}
                    style={{ width: `${slot.sharePercent * 2.2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Day-of-Week Utilization Strip */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-2">
              Okupansi Harian &amp; Permintaan Akhir Pekan Belum Terlayani
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {DAY_OF_WEEK_UTILIZATION.map((d) => {
                const isWeekend = d.day === 'Sabtu' || d.day === 'Minggu';
                return (
                  <div
                    key={d.day}
                    className={`rounded-lg border px-1 py-2 text-[11px] ${
                      isWeekend
                        ? 'border-amber-300 bg-amber-50/80 text-amber-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{d.day.slice(0, 3)}</div>
                    <div className="mt-0.5 font-mono font-bold tabular-nums">
                      {d.occupancy}%
                    </div>
                    {d.unmetRequests > 0 && (
                      <div className="mt-0.5 text-[9px] font-semibold text-red-700 tabular-nums">
                        +{d.unmetRequests} antre
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ROW 3: AI Insight & Recommendation Engine + Popular Routes/Destinations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* AI Insight & Recommendation Engine */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-sky-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  AI Insight &amp; Recommendation Engine (Management Brief)
                </h2>
                <p className="text-xs text-slate-500">
                  Sintesis otomatis jam puncak, penambahan armada akhir pekan, dan rute terfavorit untuk Kepala Disporapar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateGeminiBrief}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13315C] disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'Menyintesis AI...' : 'Generate Brief (Gemini AI)'}</span>
            </button>
          </div>

          {aiError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Pemberitahuan Layanan AI Engine</div>
                <p className="mt-0.5">{aiError}</p>
              </div>
            </div>
          )}

          {aiGeneratedBrief && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Brief Eksekutif disintesis langsung oleh AI ({aiGeneratedBrief.model || 'gemini-4-hydrogen'})</span>
              </span>
              {aiGeneratedBrief.generatedAt && (
                <span className="font-mono text-[10px] tabular-nums">
                  {new Date(aiGeneratedBrief.generatedAt).toLocaleTimeString('id-ID')}
                </span>
              )}
            </div>
          )}

          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="font-bold text-[#0B1F3A]">1. Ringkasan Eksekutif Periode ({periodLabel})</div>
              <p className="mt-1">{activeBrief.executiveSummary}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="font-bold text-[#0B1F3A]">2. Analisis Jam Puncak (Peak Hours)</div>
              <p className="mt-1">{activeBrief.peakHoursAnalysis}</p>
            </div>

            <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3.5 text-slate-800">
              <div className="font-bold text-[#0B1F3A]">
                3. Rekomendasi Penambahan Armada di Akhir Pekan
              </div>
              <p className="mt-1">{activeBrief.weekendFleetRecommendation}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="font-bold text-[#0B1F3A]">
                4. Identifikasi Rute ODL Paling Diminati Masyarakat Sidoarjo
              </div>
              <p className="mt-1">{activeBrief.topRoutesAnalysis}</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-amber-950">
              <div className="font-bold">5. Rekomendasi Tindak Lanjut Kebijakan Pimpinan</div>
              <ul className="mt-1.5 list-disc pl-4 space-y-1">
                {activeBrief.actionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right Column: Top Routes & Destinations */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Rute ODL Paling Diminati Masyarakat
            </h2>
            <div className="mt-3 space-y-3">
              {sortedPackages.map((pkg) => (
                <div key={pkg.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-900 truncate">
                      {pkg.packageName}
                    </span>
                    <span className="font-mono font-bold text-[#0B1F3A] tabular-nums shrink-0">
                      {pkg.popularityPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0B1F3A]"
                      style={{ width: `${pkg.popularityPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Segmen: {pkg.targetSegments.join(', ')} · {pkg.totalDurationHours} jam
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-display text-sm font-bold text-slate-900 mb-2">
              Destinasi Wisata &amp; UMKM Terpopuler Bulan Ini
            </h3>
            <div className="divide-y divide-slate-100">
              {topDestinations.map((dest, idx) => (
                <div
                  key={dest.id}
                  className="py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-slate-400 tabular-nums">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{dest.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {dest.category} · {dest.district}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-[#0B1F3A] tabular-nums shrink-0">
                    {dest.visitCountMonth} kunj.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
