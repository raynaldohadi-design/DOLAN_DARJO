import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  Camera,
  CheckCircle2,
  Compass,
  Crosshair,
  Globe,
  MapPin,
  Navigation,
  Share2,
  Sparkles,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Destination } from '../../types/dolandarjo';
import { SIDOARJO_PHOTOS } from '../../data/mockSidoarjoData';
import { PickupOrigin, SidoarjoLeafletMap } from '../SidoarjoLeafletMap';
import { SidoarjoMascot } from '../SidoarjoMascot';
import { ResilientImage } from '../ResilientImage';

interface PetaWebArViewProps {
  destinations: Destination[];
  initialSelectedPoiId?: string;
  onNotifyToast: (msg: string) => void;
}

type ArFrameTheme = 'none' | 'jayandaru' | 'candi-pari' | 'delta-kriya';
type ViewDisplayMode = 'split' | 'webgis' | 'webar';

const PICKUP_ORIGINS: PickupOrigin[] = [
  {
    id: 'orig-alun',
    name: 'Alun-Alun & Monumen Jayandaru',
    latitude: -7.4461,
    longitude: 112.7181,
  },
  {
    id: 'orig-gor',
    name: 'Stadion GOR Delta Sidoarjo',
    latitude: -7.4472,
    longitude: 112.7052,
  },
  {
    id: 'orig-pendopo',
    name: 'Pendopo Delta Wibawa Sidoarjo',
    latitude: -7.4482,
    longitude: 112.7176,
  },
  {
    id: 'orig-umsida',
    name: 'Kampus 1 UMSIDA (Jl. Mojopahit)',
    latitude: -7.4562,
    longitude: 112.7118,
  },
  {
    id: 'orig-purabaya',
    name: 'Terminal Purabaya / Bungurasih',
    latitude: -7.3514,
    longitude: 112.7248,
  },
];

function calcHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLam = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLam) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

function formatMetersOrKm(km: number): string {
  const meters = Math.round(km * 1000);
  if (meters < 1000) return `${meters} m`;
  return `${km.toFixed(2)} km`;
}

export const PetaWebArView: React.FC<PetaWebArViewProps> = ({
  destinations,
  initialSelectedPoiId,
  onNotifyToast,
}) => {
  const [displayMode, setDisplayMode] = useState<ViewDisplayMode>('split');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pickupOrigin, setPickupOrigin] = useState<PickupOrigin>(PICKUP_ORIGINS[0]);
  const [selectedPoiId, setSelectedPoiId] = useState<string>(
    initialSelectedPoiId || 'dest-gor-delta'
  );

  const [headingDeg, setHeadingDeg] = useState<number>(265);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [collectedStamps, setCollectedStamps] = useState<string[]>([
    'dest-jayandaru',
    'dest-mpu-tantular',
  ]);
  const [activeFrame, setActiveFrame] = useState<ArFrameTheme>('jayandaru');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter destinations by category
  const filteredDestinations = useMemo(() => {
    if (categoryFilter === 'all') return destinations;
    return destinations.filter((d) => d.category === categoryFilter);
  }, [destinations, categoryFilter]);

  // Compute real-time distance & bearing from current pickupOrigin to every destination
  const geoStatsMap = useMemo(() => {
    const map: Record<string, { distanceKm: number; distanceLabel: string; bearingDeg: number; etaMins: number }> = {};
    destinations.forEach((d) => {
      const distanceKm = calcHaversineKm(
        pickupOrigin.latitude,
        pickupOrigin.longitude,
        d.latitude,
        d.longitude
      );
      const bearingDeg = calcBearingDeg(
        pickupOrigin.latitude,
        pickupOrigin.longitude,
        d.latitude,
        d.longitude
      );
      const etaMins = Math.max(2, Math.round((distanceKm / 30) * 60));
      map[d.id] = {
        distanceKm,
        distanceLabel: formatMetersOrKm(distanceKm),
        bearingDeg,
        etaMins,
      };
    });
    return map;
  }, [destinations, pickupOrigin]);

  const distanceLabelMap = useMemo(() => {
    const labels: Record<string, string> = {};
    Object.entries(geoStatsMap).forEach(([id, val]) => {
      labels[id] = val.distanceLabel;
    });
    return labels;
  }, [geoStatsMap]);

  const selectedPoi = useMemo(
    () => destinations.find((d) => d.id === selectedPoiId) || destinations[0],
    [destinations, selectedPoiId]
  );

  // When selecting a destination from map or list, orient AR heading smoothly toward it
  const handleSelectPoi = (destId: string) => {
    setSelectedPoiId(destId);
    const stats = geoStatsMap[destId];
    if (stats) {
      setHeadingDeg(stats.bearingDeg);
    }
  };

  useEffect(() => {
    if (initialSelectedPoiId) {
      setSelectedPoiId(initialSelectedPoiId);
      const stats = geoStatsMap[initialSelectedPoiId];
      if (stats) {
        setHeadingDeg(stats.bearingDeg);
      }
    }
  }, [initialSelectedPoiId, geoStatsMap]);

  // Visible POIs in current AR camera FOV (130-degree cone)
  const visiblePois = useMemo(() => {
    return filteredDestinations
      .map((dest) => {
        const stats = geoStatsMap[dest.id];
        const bearing = stats ? stats.bearingDeg : dest.bearingDeg;
        const delta = ((bearing - headingDeg + 540) % 360) - 180;
        return { dest, stats, delta };
      })
      .filter((item) => Math.abs(item.delta) <= 65)
      .sort((a, b) => a.stats.distanceKm - b.stats.distanceKm)
      .slice(0, 6);
  }, [filteredDestinations, geoStatsMap, headingDeg]);

  // Camera control
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
      return;
    }
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Peramban tidak mendukung akses kamera langsung; menampilkan Mode Simulator WebAR interaktif.'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(
        'Izin kamera tidak aktif; menampilkan Mode Simulator WebAR interaktif Kota Sidoarjo.'
      );
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Device GPS button for real-time origin
  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      onNotifyToast('Geolocation tidak didukung pada peramban ini.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupOrigin({
          id: 'orig-gps',
          name: 'Lokasi GPS Perangkat Saat Ini',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        onNotifyToast('Koordinat GPS perangkat diterapkan sebagai titik asal pengukuran jarak.');
      },
      () => {
        onNotifyToast('Izin lokasi GPS tidak tersedia; tetap menggunakan titik jemput bus Sidoarjo.');
      }
    );
  };

  // Audio Guide Narrative (Web Speech API)
  const handleToggleAudioNarrative = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onNotifyToast(`Narasi: ${selectedPoi.shortNarrative}`);
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${selectedPoi.name}, berjarak ${geoStatsMap[selectedPoi.id]?.distanceLabel || ''} dari titik jemput. ${selectedPoi.shortNarrative}`
    );
    utterance.lang = 'id-ID';
    utterance.rate = 1.02;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCollectStamp = (destId: string, name: string) => {
    if (!collectedStamps.includes(destId)) {
      setCollectedStamps((prev) => [...prev, destId]);
      onNotifyToast(`e-Stamp "${name}" berhasil dikoleksi ke Darjo Digital Passport!`);
    }
  };

  const frameOverlayLabel: Record<ArFrameTheme, { title: string; subtitle: string; border: string }> = {
    none: { title: '', subtitle: '', border: '' },
    jayandaru: {
      title: 'DOLAN DARJO · MONUMEN JAYANDARU',
      subtitle: 'Bangga Wisata Kota Delta Sidoarjo',
      border: 'border-4 border-sky-400/80',
    },
    'candi-pari': {
      title: 'JEJAK JENGGALA · CANDI PARI 1371 M',
      subtitle: 'Heritage City Tour Disporapar Sidoarjo',
      border: 'border-4 border-amber-400/80',
    },
    'delta-kriya': {
      title: 'KRIYA & RASA DELTA · UMKM SIDOARJO',
      subtitle: 'Batik Jetis · Kerupuk Pagerwojo · Bandeng Asap',
      border: 'border-4 border-emerald-400/80',
    },
  };

  const selectedStats = geoStatsMap[selectedPoi.id];

  const mascotTip = selectedPoi.busAccessible
    ? `Halo Rek! Dari ${pickupOrigin.name}, ${selectedPoi.name} berjarak ${
        selectedStats?.distanceLabel || '-'
      } (±${selectedStats?.etaMins || 5} menit bus). Parkir bus besar aman, jangan lupa foto di ${
        selectedPoi.photoSpotTip
      }`
    : `Waspada jalan sempit, Rek! Untuk ke ${selectedPoi.name} (${
        selectedStats?.distanceLabel || '-'
      }), bus besar turun di ${selectedPoi.recommendedDropOff}. ${
        selectedPoi.umkmHighlight ? `Produk wajib dicoba: ${selectedPoi.umkmHighlight}.` : ''
      }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Peta WebAR &amp; Destinasi Wisata Sidoarjo
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Peta WebGIS Leaflet interaktif dengan jarak real-time dari titik jemput bus serta Mode Kamera WebAR Simulator berpandu Maskot Cak Darjo.
          </p>
        </div>

        {/* Display Mode Switcher + Camera Trigger */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs">
            {[
              { id: 'split', label: 'WebGIS + WebAR' },
              { id: 'webgis', label: 'Peta Leaflet' },
              { id: 'webar', label: 'Kamera WebAR' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setDisplayMode(m.id as ViewDisplayMode)}
                className={`rounded-md px-3 py-1.5 font-semibold transition-colors whitespace-nowrap ${
                  displayMode === m.id
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleCamera}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              cameraActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            {cameraActive ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
            <span>{cameraActive ? 'Matikan Kamera' : 'Buka Kamera AR'}</span>
          </button>
        </div>
      </div>

      {/* Pickup Point Origin Selector & Category Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Navigation className="h-3.5 w-3.5 text-[#0B1F3A]" />
            <span>Titik Jemput Bus (Asal):</span>
          </span>
          <select
            aria-label="Pilih titik jemput bus untuk hitung jarak real-time"
            value={pickupOrigin.id}
            onChange={(e) => {
              const found = PICKUP_ORIGINS.find((p) => p.id === e.target.value);
              if (found) setPickupOrigin(found);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
          >
            {PICKUP_ORIGINS.map((orig) => (
              <option key={orig.id} value={orig.id}>
                {orig.name}
              </option>
            ))}
            {pickupOrigin.id === 'orig-gps' && (
              <option value="orig-gps">Lokasi GPS Perangkat Saat Ini</option>
            )}
          </select>
          <button
            type="button"
            onClick={handleUseDeviceGps}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>GPS Saya</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {['all', 'Sejarah', 'Edukasi', 'UMKM', 'Alam', 'Olahraga'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {cameraError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          {cameraError}
        </div>
      )}

      {/* Main WebGIS + WebAR Workspace */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* 1. LEAFLET WEBGIS MAP */}
        {(displayMode === 'split' || displayMode === 'webgis') && (
          <section
            aria-label="Peta WebGIS Destinasi Wisata Sidoarjo"
            className={`${
              displayMode === 'webgis' ? 'xl:col-span-12' : 'xl:col-span-6'
            } rounded-xl border border-slate-200 bg-white p-5 space-y-4`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0B1F3A]" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Peta Interaktif WebGIS (Leaflet · Sidoarjo)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik pin lokasi untuk melihat jarak real-time dari {pickupOrigin.name}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0B1F3A]" />
                  <span>Titik Jemput</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span>Bus Besar</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Drop-off</span>
                </span>
              </div>
            </div>

            <SidoarjoLeafletMap
              destinations={filteredDestinations}
              pickupOrigin={pickupOrigin}
              selectedDestId={selectedPoi.id}
              onSelectDestination={handleSelectPoi}
              distanceLabelMap={distanceLabelMap}
            />

            {/* Nearest Destinations Quick Picker Strip */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Destinasi Terdekat dari Titik Jemput ({filteredDestinations.length} Lokasi)
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                {[...filteredDestinations]
                  .sort(
                    (a, b) =>
                      (geoStatsMap[a.id]?.distanceKm || 0) -
                      (geoStatsMap[b.id]?.distanceKm || 0)
                  )
                  .map((dest) => {
                    const stats = geoStatsMap[dest.id];
                    const active = selectedPoi.id === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => handleSelectPoi(dest.id)}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          active
                            ? 'border-[#0B1F3A] bg-sky-50/70 text-slate-900'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{dest.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {dest.category} · {dest.district}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                            {stats?.distanceLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 tabular-nums">
                            ±{stats?.etaMins} mnt
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* 2. WEBAR CAMERA SIMULATOR + FLOATING POI MARKERS + GEN Z HUB */}
        {(displayMode === 'split' || displayMode === 'webar') && (
          <section
            aria-label="Simulator Kamera Augmented Reality WebAR"
            className={`${
              displayMode === 'webar' ? 'xl:col-span-12' : 'xl:col-span-6'
            } rounded-xl border border-slate-200 bg-white p-5 space-y-4`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-600" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    WebAR Camera Simulator (Gen Z Radar)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Putar arah kompas untuk melihat label POI melayang secara real-time.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Utara', deg: 0 },
                  { label: 'Timur', deg: 90 },
                  { label: 'Selatan', deg: 185 },
                  { label: 'Barat', deg: 268 },
                ].map((dir) => (
                  <button
                    key={dir.label}
                    type="button"
                    onClick={() => setHeadingDeg(dir.deg)}
                    className={`rounded border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      Math.abs(headingDeg - dir.deg) < 25
                        ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compass Bearing Slider */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700 whitespace-nowrap">
                Arah Pandang Kamera: <span className="font-mono text-[#0B1F3A] tabular-nums">{headingDeg}°</span>
              </span>
              <input
                type="range"
                min={0}
                max={359}
                value={headingDeg}
                onChange={(e) => setHeadingDeg(Number(e.target.value))}
                aria-label="Geser arah pandang kamera WebAR"
                className="w-full max-w-[220px] accent-[#0B1F3A]"
              />
            </div>

            {/* AR Camera Viewfinder */}
            <div
              className={`relative h-[420px] w-full overflow-hidden rounded-xl bg-slate-900 ${frameOverlayLabel[activeFrame].border}`}
            >
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#07162B] via-[#0F294A] to-[#1E3A5F]">
                  <ResilientImage
                    src={selectedPoi.imageUrl || SIDOARJO_PHOTOS.monumenJayandaru}
                    alt={`Simulasi pemandangan WebAR ${selectedPoi.name}`}
                    className="absolute inset-0 h-full w-full object-cover opacity-35 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#07162B]/80 via-[#0F294A]/55 to-[#07162B]/85" />
                  <svg
                    viewBox="0 0 800 420"
                    className="relative h-full w-full opacity-45"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* Animated sky grid lines & Sidoarjo iconic silhouettes */}
                    <path
                      d="M0 330 L80 330 L105 275 L130 330 L215 330 L245 245 L265 245 L280 190 L295 245 L315 245 L345 330 L470 330 L500 260 L540 260 L565 330 L670 330 L700 285 L735 285 L760 330 L800 330 L800 420 L0 420 Z"
                      fill="#38BDF8"
                      fillOpacity="0.22"
                    />
                    <line
                      x1="0"
                      y1="330"
                      x2="800"
                      y2="330"
                      stroke="#38BDF8"
                      strokeOpacity="0.35"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}

              {/* Top AR HUD Strip */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-slate-950/70 px-3.5 py-2 text-[11px] text-sky-100 backdrop-blur-xs">
                <span className="truncate font-mono">
                  Asal: {pickupOrigin.name}
                </span>
                <span className="font-mono font-semibold text-sky-300 tabular-nums shrink-0">
                  {visiblePois.length} POI dalam lensa
                </span>
              </div>

              {/* Center AR Target Reticle */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border border-sky-300/45 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-sky-300" />
                </div>
              </div>

              {/* Animated Floating POI Markers */}
              {visiblePois.map(({ dest, stats, delta }, idx) => {
                const leftPct = 50 + (delta / 65) * 38;
                const topPct = 24 + (idx % 3) * 18;
                const isSelected = selectedPoi.id === dest.id;
                const DirectionIcon =
                  delta < -12 ? ArrowLeft : delta > 12 ? ArrowRight : ArrowUp;

                return (
                  <motion.button
                    key={dest.id}
                    type="button"
                    onClick={() => handleSelectPoi(dest.id)}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{
                      opacity: 1,
                      scale: isSelected ? 1.04 : 1,
                      y: [0, -5, 0],
                    }}
                    transition={{
                      y: { duration: 2.6 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                    }}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left shadow-xl backdrop-blur-sm ${
                      isSelected
                        ? 'z-20 border-sky-300 bg-[#0B1F3A]/95 text-white ring-2 ring-sky-400/50'
                        : 'z-10 border-white/30 bg-slate-900/80 text-slate-100 hover:bg-slate-900/95'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap">
                      <DirectionIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span>{dest.name}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-mono tabular-nums">
                      <span className="text-sky-300 font-semibold">
                        {stats.distanceLabel} ({stats.bearingDeg}°)
                      </span>
                      <span className={dest.busAccessible ? 'text-emerald-300' : 'text-amber-300'}>
                        {dest.busAccessible ? 'Bus OK' : 'Drop-off'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}

              {/* Mini Radar Bottom-Left */}
              <div className="absolute bottom-3.5 left-3.5 h-20 w-20 rounded-full border border-sky-400/50 bg-slate-950/80 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border border-sky-400/25" />
                {visiblePois.map(({ dest, stats, delta }) => {
                  const rad = (delta * Math.PI) / 180;
                  const r = Math.min(30, stats.distanceKm * 2.5 + 8);
                  const x = Math.sin(rad) * r;
                  const y = -Math.cos(rad) * r;
                  return (
                    <span
                      key={dest.id}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className={`absolute h-2 w-2 rounded-full ${
                        selectedPoi.id === dest.id ? 'bg-amber-400' : 'bg-sky-400'
                      }`}
                    />
                  );
                })}
                <span className="absolute h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              {/* AR Frame Overlay */}
              {activeFrame !== 'none' && (
                <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 ml-24 rounded-lg bg-[#0B1F3A]/90 px-3 py-2 text-white border border-white/25">
                  <div className="font-display text-xs font-bold tracking-wide">
                    {frameOverlayLabel[activeFrame].title}
                  </div>
                  <div className="text-[10px] text-sky-200">
                    {frameOverlayLabel[activeFrame].subtitle}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Gen Z Info Card + Mascot Guide */}
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {selectedPoi.imageUrl && (
                    <div className="sm:w-40 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 aspect-4/3 sm:aspect-auto sm:h-28">
                      <ResilientImage
                        src={selectedPoi.imageUrl}
                        alt={selectedPoi.name}
                        fallbackLabel={selectedPoi.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-sky-700">
                          {selectedPoi.category} · {selectedPoi.district} ·{' '}
                          <span className="font-mono tabular-nums">
                            {selectedStats?.distanceLabel} (±{selectedStats?.etaMins} mnt bus)
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                          {selectedPoi.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleAudioNarrative}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5 text-[#0B1F3A]" />
                          )}
                          <span>{isSpeaking ? 'Hentikan Suara' : 'Narasi Suara'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCollectStamp(selectedPoi.id, selectedPoi.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#13315C]"
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span>
                            {collectedStamps.includes(selectedPoi.id)
                              ? 'e-Stamp Terkoleksi'
                              : 'Klaim e-Stamp'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                      {selectedPoi.shortNarrative}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        <strong>Spot Foto Estetik:</strong> {selectedPoi.photoSpotTip}
                      </span>
                      {selectedPoi.umkmHighlight && (
                        <span>
                          <strong>UMKM Unggulan:</strong> {selectedPoi.umkmHighlight}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Friendly Sidoarjo Mascot Component */}
              <SidoarjoMascot
                destinationName={selectedPoi.name}
                tipText={mascotTip}
              />
            </div>
          </section>
        )}
      </div>

      {/* Bottom Gen Z & Millennial Interactive Hub: Darjo Digital Passport + AR Photo Frames */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Darjo Digital Passport (Koleksi e-Stamp Wisata Sidoarjo)
              </h2>
              <p className="text-xs text-slate-500">
                Ketuk destinasi setelah berkunjung untuk mengumpulkan lencana wisata resmi Disporapar.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#0B1F3A] tabular-nums">
              {collectedStamps.length}/{destinations.slice(0, 8).length} Lencana
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {destinations
              .filter((d) =>
                [
                  'dest-jayandaru',
                  'dest-candi-pari',
                  'dest-pulau-lusi',
                  'dest-gor-delta',
                  'dest-kelepon-bulang',
                  'dest-mpu-tantular',
                  'dest-batik-jetis',
                  'dest-pagerwojo',
                ].includes(d.id)
              )
              .map((dest) => {
                const earned = collectedStamps.includes(dest.id);
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => {
                      handleCollectStamp(dest.id, dest.name);
                      handleSelectPoi(dest.id);
                    }}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      earned
                        ? 'border-emerald-300 bg-emerald-50/70'
                        : 'border-slate-200 bg-slate-50 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Award
                        className={`h-4 w-4 ${earned ? 'text-emerald-600' : 'text-slate-400'}`}
                      />
                      {earned && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-900 line-clamp-1">
                      {dest.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {earned ? 'Terkoleksi' : 'Klaim lencana'}
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Bingkai Foto AR &amp; Rekap Cerita Gen Z
              </h2>
              <p className="text-xs text-slate-500">
                Pilih tema bingkai khas Sidoarjo untuk kamera WebAR.
              </p>
            </div>
            <Camera className="h-4 w-4 text-[#0B1F3A]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'jayandaru', label: 'Monumen Jayandaru' },
              { id: 'candi-pari', label: 'Candi Pari Heritage' },
              { id: 'delta-kriya', label: 'Kriya Bandeng-Batik' },
              { id: 'none', label: 'Tanpa Bingkai' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFrame(f.id as ArFrameTheme)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  activeFrame === f.id
                    ? 'border-[#0B1F3A] bg-sky-50 text-[#0B1F3A]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>1-Tap Story Recap (IG / TikTok)</span>
            </div>
            <p className="text-xs text-slate-600">
              Saya sudah menjelajahi {collectedStamps.length} destinasi wisata Sidoarjo bersama DOLAN DARJO Disporapar!
            </p>
            <button
              type="button"
              onClick={() =>
                onNotifyToast(
                  `Kartu Rekap Story (${collectedStamps.length} e-Stamp, Bingkai: ${activeFrame}) siap dibagikan.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Buat Rekap Perjalanan</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
