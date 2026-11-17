import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Plus,
  Route,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ApplicantSegment, Destination, OdlPackage } from '../../types/dolandarjo';
import { ResilientImage } from '../ResilientImage';

interface RuteOdlViewProps {
  destinations: Destination[];
  packages: OdlPackage[];
  onUseRouteForBooking: (routeStopIds: string[]) => void;
}

export const RuteOdlView: React.FC<RuteOdlViewProps> = ({
  destinations,
  packages,
  onUseRouteForBooking,
}) => {
  const [mode, setMode] = useState<'curated' | 'custom'>('curated');
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [customStopIds, setCustomStopIds] = useState<string[]>([
    'dest-jayandaru',
    'dest-mpu-tantular',
    'dest-batik-jetis',
  ]);
  const [targetSegment, setTargetSegment] = useState<ApplicantSegment>('SD');
  const [focusedDestId, setFocusedDestId] = useState<string>('dest-jayandaru');

  const activePackage = useMemo(
    () => packages.find((p) => p.id === selectedPkgId) || packages[0],
    [packages, selectedPkgId]
  );

  const activeStopIds = mode === 'curated' ? activePackage.stopIds : customStopIds;

  const activeStops = useMemo(
    () =>
      activeStopIds
        .map((id) => destinations.find((d) => d.id === id))
        .filter((d): d is Destination => !!d),
    [activeStopIds, destinations]
  );

  const restrictedStops = useMemo(
    () => activeStops.filter((d) => !d.busAccessible),
    [activeStops]
  );

  const focusedDestination = useMemo(
    () => destinations.find((d) => d.id === focusedDestId) || activeStops[0] || destinations[0],
    [destinations, focusedDestId, activeStops]
  );

  const routeMetrics = useMemo(() => {
    const visitMins = activeStops.reduce((sum, s) => sum + s.avgDurationMins, 0);
    // Estimate transit time between consecutive stops + loop return
    let transitKm = 0;
    for (let i = 0; i < activeStops.length; i++) {
      const a = activeStops[i];
      const b = activeStops[(i + 1) % activeStops.length];
      if (a && b && a.id !== b.id) {
        const dx = (a.mapX - b.mapX) * 0.28;
        const dy = (a.mapY - b.mapY) * 0.28;
        transitKm += Math.sqrt(dx * dx + dy * dy);
      }
    }
    const travelMins = Math.round((transitKm / 28) * 60);
    const totalHours = ((visitMins + travelMins) / 60).toFixed(1);
    return {
      visitMins,
      travelMins,
      totalHours,
      totalKm: transitKm.toFixed(1),
    };
  }, [activeStops]);

  const handleToggleCustomStop = (destId: string) => {
    setCustomStopIds((prev) =>
      prev.includes(destId) ? prev.filter((id) => id !== destId) : [...prev, destId]
    );
    setFocusedDestId(destId);
  };

  // Smart ODL Route Curator recommendation based on segment
  const handleAutoCurateForSegment = () => {
    setMode('custom');
    if (targetSegment === 'TK/PAUD' || targetSegment === 'SD') {
      setCustomStopIds(['dest-jayandaru', 'dest-perpusda', 'dest-taman-abhirama', 'dest-mpu-tantular']);
    } else if (targetSegment === 'Mitra UMKM' || targetSegment === 'Komunitas') {
      setCustomStopIds(['dest-jayandaru', 'dest-tanggulangin', 'dest-batik-jetis', 'dest-kalanganyar']);
    } else {
      setCustomStopIds(['dest-jayandaru', 'dest-mpu-tantular', 'dest-candi-pari', 'dest-candi-sumur']);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Smart ODL (One Day Loop) Route Planner &amp; Validasi Jalan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kurasi paket rute wisata tematik Sidoarjo serta validasi spasial aksesibilitas jalan bagi bus pariwisata berbadan besar.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('curated')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                mode === 'curated' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paket Terkurasi
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                mode === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Susun Rute Custom
            </button>
          </div>
        </div>
      </div>

      {/* Curated Packages Strip or Custom Curator Bar */}
      {mode === 'curated' ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((pkg) => {
            const isSelected = pkg.id === activePackage.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`text-left rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isSelected
                    ? 'border-[#0B1F3A] bg-sky-50/50'
                    : 'border-slate-200 bg-white hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-700">{pkg.totalDurationHours} Jam Loop</span>
                  <span className="font-mono text-slate-500 tabular-nums">{pkg.popularityPercent}% minat</span>
                </div>
                <h2 className="mt-1.5 font-display text-sm font-bold text-slate-900">
                  {pkg.packageName}
                </h2>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{pkg.theme}</p>
                <div className="mt-2.5 text-[11px] text-slate-500">
                  {pkg.stopIds.length} Titik · {pkg.targetSegments.join(', ')}
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-800">
              Rekomendasi Otomatis Berdasarkan Segmen:
            </span>
            <select
              aria-label="Pilih segmen peserta"
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value as ApplicantSegment)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="TK/PAUD">TK / PAUD</option>
              <option value="SD">Sekolah Dasar (SD)</option>
              <option value="SMP/SMA">SMP / SMA</option>
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Komunitas">Komunitas Pemuda/Olahraga</option>
              <option value="Mitra UMKM">Mitra Binaan UMKM</option>
            </select>
            <button
              type="button"
              onClick={handleAutoCurateForSegment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Susun Loop Optimal</span>
            </button>
          </div>
          <div className="text-xs text-slate-500">
            Klik titik pada peta atau daftar destinasi untuk menambah/menghapus perhentian.
          </div>
        </section>
      )}

      {/* Main Spatial Split: Sidoarjo ODL Map + Route Validator & Stops */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Interactive Sidoarjo Map Canvas */}
        <section className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Peta Spasial Rute ODL &amp; Zona Akses Bus Besar Sidoarjo
              </h2>
              <p className="text-xs text-slate-500">
                Jalur melingkar otomatis menghubungkan titik keberangkatan hingga kembali ke titik awal.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span>Akses Bus Besar</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Jalan Sempit (Drop-off)</span>
              </span>
            </div>
          </div>

          {/* Interactive SVG Spatial Map of Kabupaten Sidoarjo */}
          <div className="mt-4 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <svg
              viewBox="0 0 800 500"
              className="w-full h-auto block select-none"
              role="img"
              aria-label="Peta Spasial Destinasi Wisata dan Akses Bus Kabupaten Sidoarjo"
            >
              {/* Subtle regional grid & Sidoarjo Delta geometry */}
              <defs>
                <pattern id="sidoarjoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="500" fill="#F8FAFC" />
              <rect width="800" height="500" fill="url(#sidoarjoGrid)" />

              {/* Sidoarjo administrative silhouette */}
              <path
                d="M 85 170 L 240 110 L 450 95 L 650 115 L 725 220 L 690 360 L 620 465 L 330 470 L 245 415 L 110 310 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              {/* Eastern coastal Tambak / Selat Madura water shading */}
              <path
                d="M 650 115 L 800 115 L 800 500 L 620 465 L 690 360 L 725 220 Z"
                fill="#E0F2FE"
                opacity="0.55"
              />
              <text x="695" y="160" fontSize="11" fill="#0369A1" fontWeight="600">
                Kawasan Pesisir
              </text>
              <text x="695" y="175" fontSize="10" fill="#0284C7">
                &amp; Tambak Timur
              </text>

              {/* Major Arterial Roads (Bus-Friendly Corridors) */}
              <path
                d="M 410 40 L 405 230 L 370 360 L 335 470"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 110 240 L 405 230 L 670 190"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text x="416" y="132" fontSize="10" fill="#64748B">
                Koridor Raya Buduran–Sidoarjo–Porong
              </text>

              {/* Active ODL Loop Polyline */}
              {activeStops.length > 1 && (
                <polygon
                  points={activeStops
                    .map((s) => `${s.mapX * 8},${s.mapY * 5}`)
                    .join(' ')}
                  fill="#0284C7"
                  fillOpacity="0.08"
                  stroke="#0B1F3A"
                  strokeWidth="3"
                  strokeDasharray="8 5"
                  strokeLinejoin="round"
                />
              )}

              {/* Destination Nodes */}
              {destinations.map((dest) => {
                const cx = dest.mapX * 8;
                const cy = dest.mapY * 5;
                const stopIndex = activeStops.findIndex((s) => s.id === dest.id);
                const isInRoute = stopIndex !== -1;
                const isFocused = focusedDestination?.id === dest.id;
                const nodeFill = dest.busAccessible ? '#16A34A' : '#D97706';

                return (
                  <g
                    key={dest.id}
                    onClick={() =>
                      mode === 'custom' ? handleToggleCustomStop(dest.id) : setFocusedDestId(dest.id)
                    }
                    className="cursor-pointer"
                  >
                    {isFocused && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={18}
                        fill="#0284C7"
                        fillOpacity="0.18"
                        stroke="#0284C7"
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isInRoute ? 11 : 7}
                      fill={isInRoute ? '#0B1F3A' : nodeFill}
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    {isInRoute && (
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        {stopIndex + 1}
                      </text>
                    )}
                    {!isInRoute && !dest.busAccessible && (
                      <circle cx={cx + 6} cy={cy - 6} r={3.5} fill="#DC2626" stroke="#FFF" strokeWidth="1" />
                    )}
                    <text
                      x={cx}
                      y={cy + (isInRoute ? 23 : 19)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isInRoute || isFocused ? '700' : '500'}
                      fill={isInRoute || isFocused ? '#0F172A' : '#475569'}
                    >
                      {dest.name.length > 22 ? `${dest.name.slice(0, 20)}…` : dest.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Focused Destination Card */}
          {focusedDestination && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                {focusedDestination.imageUrl && (
                  <div className="sm:w-36 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 aspect-4/3 sm:aspect-auto sm:h-24">
                    <ResilientImage
                      src={focusedDestination.imageUrl}
                      alt={focusedDestination.name}
                      fallbackLabel={focusedDestination.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">
                        {focusedDestination.category} · {focusedDestination.district} ·{' '}
                        <span className="tabular-nums">{focusedDestination.avgDurationMins} mnt kunjungan</span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                        {focusedDestination.name}
                      </h3>
                    </div>
                    {focusedDestination.busAccessible ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Akses Bus Besar Terverifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Jalan Sempit / Perlu Drop-Off</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {focusedDestination.shortNarrative}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-700">
                    <strong>Catatan Parkir:</strong> {focusedDestination.parkingNote}
                  </div>
                  {!focusedDestination.busAccessible && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      <strong>Kendala Akses:</strong> {focusedDestination.roadConstraintNote} <br />
                      <strong>Titik Drop-Off Terdekat:</strong> {focusedDestination.recommendedDropOff}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Panel: Route Timeline, Metrics & Road Validator */}
        <aside className="xl:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-medium text-sky-700">
                  {mode === 'curated' ? 'Paket Rute ODL Terkurasi' : 'Rute ODL Custom'}
                </div>
                <h2 className="font-display text-base font-bold text-slate-900 mt-0.5">
                  {mode === 'curated' ? activePackage.packageName : `Rute Custom (${activeStops.length} Perhentian)`}
                </h2>
              </div>
              <Route className="h-5 w-5 text-[#0B1F3A] shrink-0" />
            </div>

            {/* Summary metrics */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <div>
                <div className="text-[11px] text-slate-500">Total Durasi</div>
                <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                  {routeMetrics.totalHours} Jam
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Estimasi Jarak</div>
                <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                  {routeMetrics.totalKm} km
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Titik Kunjungan</div>
                <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                  {activeStops.length} Lokasi
                </div>
              </div>
            </div>

            {/* Road & Bus Access Validation Result */}
            {restrictedStops.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{restrictedStops.length} Titik Terkendala Akses Bus Besar</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px]">
                  {restrictedStops.map((rs) => (
                    <li key={rs.id}>
                      • <strong>{rs.name}:</strong> Dialihkan ke <em>{rs.recommendedDropOff}</em>.
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Seluruh titik rute aman dan tervalidasi untuk bus pariwisata berbadan besar.</span>
              </div>
            )}

            {/* Ordered Stops */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Urutan Perhentian Rute Melingkar (One Day Loop)
              </div>
              {activeStops.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Pilih destinasi di bawah untuk menyusun rute.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      onClick={() => setFocusedDestId(stop.id)}
                      className="flex items-center justify-between gap-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded px-1"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-[11px] font-bold text-white tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {stop.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span className="tabular-nums">{stop.avgDurationMins} mnt</span>
                            <span aria-hidden="true">·</span>
                            <span className={stop.busAccessible ? 'text-emerald-700' : 'text-amber-700 font-medium'}>
                              {stop.busAccessible ? 'Bus Masuk' : 'Drop-off Terdekat'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {mode === 'custom' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCustomStop(stop.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                          aria-label={`Hapus ${stop.name} dari rute`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={activeStops.length === 0}
              onClick={() => onUseRouteForBooking(activeStopIds)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#13315C] disabled:opacity-40 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Gunakan Rute Ini untuk Peminjaman Bus</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* All Destinations Catalog Picker (especially useful in Custom Mode) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Direktori Destinasi Sidoarjo ({destinations.length} Titik Terpetakan)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'custom'
                ? 'Klik + untuk menambahkan atau mengeluarkan titik dari rute custom.'
                : 'Klik lokasi untuk melihat profil wisata dan catatan akses jalan bus.'}
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
              {destinations.map((dest) => {
                const inRoute = activeStopIds.includes(dest.id);
                return (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between gap-2 py-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setFocusedDestId(dest.id)}
                      className="text-left min-w-0 flex-1 hover:text-sky-700"
                    >
                      <div className="font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{dest.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-4.5">
                        {dest.category} · {dest.district} ·{' '}
                        <span className={dest.busAccessible ? 'text-emerald-700' : 'text-amber-700'}>
                          {dest.busAccessible ? 'Bus Besar OK' : 'Jalan Sempit'}
                        </span>
                      </div>
                    </button>
                    {mode === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleToggleCustomStop(dest.id)}
                        className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${
                          inRoute
                            ? 'bg-slate-200 text-slate-800 hover:bg-red-100 hover:text-red-700'
                            : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                        }`}
                      >
                        {inRoute ? 'Terpilih' : (
                          <span className="inline-flex items-center gap-0.5">
                            <Plus className="h-3 w-3" /> Tambah
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
