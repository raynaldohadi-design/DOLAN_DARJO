import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  ApplicantSegment,
  Booking,
  BookingStatus,
  BusUnit,
  Destination,
  OdlPackage,
} from '../../types/dolandarjo';
import { TODAY_STR } from '../../data/mockSidoarjoData';
import { QrCodeSvg } from '../QrCodeSvg';
import { BusPhotoPreviewCard } from '../BusPhotoPreviewCard';

interface PeminjamanViewProps {
  buses: BusUnit[];
  bookings: Booking[];
  destinations: Destination[];
  packages: OdlPackage[];
  initialCreateOpen: boolean;
  preselectedDate: string;
  preselectedRouteIds: string[] | null;
  selectedInspectBookingId: string | null;
  onClearPreselected: () => void;
  onCreateBooking: (booking: Omit<Booking, 'id' | 'bookingCode' | 'createdAt'>) => Booking;
  onUpdateBookingStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    extra?: Partial<Booking>
  ) => void;
  onSendWhatsAppToast: (message: string) => void;
}

const SEGMENTS: { value: ApplicantSegment; groupLabel: string }[] = [
  { value: 'TK/PAUD', groupLabel: 'Sekolah · TK / PAUD' },
  { value: 'SD', groupLabel: 'Sekolah · SD / MI' },
  { value: 'SMP/SMA', groupLabel: 'Sekolah · SMP / SMA / SMK' },
  { value: 'Mahasiswa', groupLabel: 'Perguruan Tinggi · Mahasiswa' },
  { value: 'Komunitas', groupLabel: 'Komunitas Pemuda / Olahraga' },
  { value: 'Mitra UMKM', groupLabel: 'Mitra Binaan UMKM' },
];

const PICKUP_PRESETS = [
  'Alun-Alun Sidoarjo (Depan Monumen Jayandaru)',
  'Stadion GOR Delta Sidoarjo (Pintu Timur)',
  'Pendopo Delta Wibawa Kabupaten Sidoarjo',
  'Kantor Disporapar Kab. Sidoarjo, Jl. Sultan Agung',
];

export const PeminjamanView: React.FC<PeminjamanViewProps> = ({
  buses,
  bookings,
  destinations,
  packages,
  initialCreateOpen,
  preselectedDate,
  preselectedRouteIds,
  selectedInspectBookingId,
  onClearPreselected,
  onCreateBooking,
  onUpdateBookingStatus,
  onSendWhatsAppToast,
}) => {
  // Two sub-tabs inside Peminjaman Bus: Interactive Submission & Curation vs Verification Queue
  const [workspaceTab, setWorkspaceTab] = useState<'form' | 'list'>(
    selectedInspectBookingId && !initialCreateOpen ? 'list' : 'form'
  );

  // List & verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [inspectedId, setInspectedId] = useState<string | null>(selectedInspectBookingId);
  const [showQrModalId, setShowQrModalId] = useState<string | null>(null);

  // WhatsApp Gateway Receipt Modal after form submit
  const [waReceipt, setWaReceipt] = useState<{
    booking: Booking;
    waMessage: string;
    sentAt: string;
  } | null>(null);

  // Interactive Digital Form State
  const [applicantName, setApplicantName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneWa, setPhoneWa] = useState('');
  const [segment, setSegment] = useState<ApplicantSegment>('SD');
  const [busId, setBusId] = useState<string>('bus-03');
  const [tripDate, setTripDate] = useState<string>(preselectedDate || TODAY_STR);
  const [pickupTime, setPickupTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('14:00');
  const [pickupAddress, setPickupAddress] = useState('');
  const [participantCount, setParticipantCount] = useState<number>(28);
  const [routeMode, setRouteMode] = useState<'package' | 'custom'>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || '');
  const [customStopIds, setCustomStopIds] = useState<string[]>([
    'dest-jayandaru',
    'dest-mpu-tantular',
    'dest-pagerwojo',
  ]);
  const [letterFile, setLetterFile] = useState<{ name: string; sizeLabel: string } | null>(null);
  const [manifestFile, setManifestFile] = useState<{ name: string; sizeLabel: string } | null>(null);
  const [notes, setNotes] = useState('');

  const letterInputRef = useRef<HTMLInputElement | null>(null);
  const manifestInputRef = useRef<HTMLInputElement | null>(null);

  // Sync external triggers (from Dashboard Calendar / Top Bar / Rute ODL)
  React.useEffect(() => {
    if (initialCreateOpen) {
      setTripDate(preselectedDate || TODAY_STR);
      if (preselectedRouteIds && preselectedRouteIds.length > 0) {
        setRouteMode('custom');
        setCustomStopIds(preselectedRouteIds);
      }
      setWorkspaceTab('form');
      onClearPreselected();
    }
  }, [initialCreateOpen, preselectedDate, preselectedRouteIds, onClearPreselected]);

  React.useEffect(() => {
    if (selectedInspectBookingId && !initialCreateOpen) {
      setInspectedId(selectedInspectBookingId);
      setWorkspaceTab('list');
    }
  }, [selectedInspectBookingId, initialCreateOpen]);

  // Conflict & Capacity Detection Engine (PRD FR-08 + Road/Bridge Access Validation)
  const selectedBus = useMemo(() => buses.find((b) => b.id === busId), [buses, busId]);

  const activeStopIds = useMemo(() => {
    if (routeMode === 'package') {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      return pkg ? pkg.stopIds : [];
    }
    return customStopIds;
  }, [routeMode, selectedPackageId, packages, customStopIds]);

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

  const scheduleConflict = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          b.busId === busId &&
          b.tripDate === tripDate &&
          b.status !== 'Ditolak' &&
          !(endTime <= b.pickupTime || pickupTime >= b.endTime)
      ) || null
    );
  }, [bookings, busId, tripDate, pickupTime, endTime]);

  const isMaintenanceBlocked = selectedBus?.status === 'Maintenance';
  const isOverCapacity = !!selectedBus && participantCount > selectedBus.seatCapacity;

  const conflictIssues = useMemo(() => {
    const issues: string[] = [];
    if (isMaintenanceBlocked && selectedBus) {
      issues.push(
        `Armada ${selectedBus.code} sedang berstatus Maintenance / Stop Operasi dan diblokir otomatis.`
      );
    }
    if (isOverCapacity && selectedBus) {
      issues.push(
        `Jumlah peserta (${participantCount} org) melebihi kapasitas kursi ${selectedBus.code} (${selectedBus.seatCapacity} kursi).`
      );
    }
    if (scheduleConflict) {
      issues.push(
        `Bentrok jadwal dengan ${scheduleConflict.bookingCode} (${scheduleConflict.organizationName}, ${scheduleConflict.pickupTime}–${scheduleConflict.endTime} WIB).`
      );
    }
    if (activeStopIds.length === 0) {
      issues.push('Pilih minimal 1 destinasi pada Rute ODL.');
    }
    return issues;
  }, [
    isMaintenanceBlocked,
    isOverCapacity,
    scheduleConflict,
    selectedBus,
    participantCount,
    activeStopIds.length,
  ]);

  const isUrgentH3 = useMemo(() => {
    const today = new Date(TODAY_STR);
    const target = new Date(tripDate);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 3 && diffDays >= 0;
  }, [tripDate]);

  const routeDurationEstimate = useMemo(() => {
    const visitMins = activeStops.reduce((acc, s) => acc + s.avgDurationMins, 0);
    const transitMins = Math.max(0, activeStops.length) * 20;
    return ((visitMins + transitMins) / 60).toFixed(1);
  }, [activeStops]);

  const selectedRouteTitle = useMemo(() => {
    if (routeMode === 'package') {
      return packages.find((p) => p.id === selectedPackageId)?.packageName || 'Paket Rute ODL';
    }
    return `Rute Custom (${activeStops.length} Titik ODL)`;
  }, [routeMode, packages, selectedPackageId, activeStops.length]);

  const previewWaMessage = useMemo(() => {
    const org = organizationName.trim() || '[Nama Instansi/Komunitas/UMKM]';
    const pic = applicantName.trim() || '[Nama PIC]';
    const pickup = pickupAddress.trim() || '[Titik Jemput]';
    const busLabel = selectedBus ? `${selectedBus.code} (${selectedBus.plateNumber})` : 'Armada';
    const accessNote =
      restrictedStops.length > 0
        ? `\nCatatan Akses Jalan: ${restrictedStops.length} titik dialihkan ke area drop-off bus besar terdekat.`
        : '\nValidasi Akses Jalan: Seluruh rute aman dilalui bus besar.';
    return `[DOLAN DARJO · DISPORAPAR SIDOARJO]\nYth. ${pic} (${org}),\nPengajuan peminjaman Bus City Tour Anda telah kami terima.\n• Tanggal: ${tripDate} (${pickupTime}–${endTime} WIB)\n• Armada: ${busLabel} (${participantCount} peserta)\n• Titik Jemput: ${pickup}\n• Rute ODL: ${selectedRouteTitle}${accessNote}\nStatus: Menunggu Verifikasi Berkas (Maks. 1x24 jam).`;
  }, [
    organizationName,
    applicantName,
    pickupAddress,
    selectedBus,
    tripDate,
    pickupTime,
    endTime,
    participantCount,
    selectedRouteTitle,
    restrictedStops.length,
  ]);

  const handleToggleCustomStop = (destId: string) => {
    setCustomStopIds((prev) =>
      prev.includes(destId) ? prev.filter((id) => id !== destId) : [...prev, destId]
    );
  };

  const handleMoveStop = (index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= customStopIds.length) return;
    setCustomStopIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIdx];
      copy[nextIdx] = temp;
      return copy;
    });
  };

  const handleFilePick = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'letter' | 'manifest'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const info = { name: file.name, sizeLabel: `${sizeKb} KB` };
    if (target === 'letter') setLetterFile(info);
    else setManifestFile(info);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictIssues.length > 0) return;

    const created = onCreateBooking({
      applicantName: applicantName.trim() || 'Koordinator Rombongan',
      organizationName: organizationName.trim() || 'Instansi Pemohon Sidoarjo',
      phoneWa: phoneWa.trim() || '0812-3000-0000',
      segment,
      busId,
      odlPackageId: routeMode === 'package' ? selectedPackageId : null,
      routeName: selectedRouteTitle,
      stopIds: activeStopIds,
      tripDate,
      pickupTime,
      endTime,
      pickupAddress: pickupAddress.trim() || PICKUP_PRESETS[0],
      participantCount,
      letterFileName: letterFile?.name || 'Surat_Pengantar_Resmi.pdf',
      manifestFileName: manifestFile?.name || 'Manifest_Daftar_Peserta.xlsx',
      status: 'Diajukan',
      isUrgentH3,
      hasAccessWarning: restrictedStops.length > 0,
      accessWarningNote:
        restrictedStops.length > 0
          ? restrictedStops
              .map((d) => `${d.name} → ${d.recommendedDropOff}`)
              .join('; ')
          : undefined,
      notes,
    });

    const sentAt = new Date().toTimeString().slice(0, 5);
    setWaReceipt({
      booking: created,
      waMessage: previewWaMessage.replace(
        'telah kami terima.',
        `telah tercatat dengan Kode Registrasi ${created.bookingCode}.`
      ),
      sentAt,
    });
    setInspectedId(created.id);
    onSendWhatsAppToast(
      `Pengajuan ${created.bookingCode} terkirim & notifikasi WhatsApp Gateway otomatis dikirim ke ${created.phoneWa}.`
    );

    setApplicantName('');
    setOrganizationName('');
    setPhoneWa('');
    setPickupAddress('');
    setNotes('');
    setLetterFile(null);
    setManifestFile(null);
  };

  // List Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesQuery =
        !searchQuery.trim() ||
        b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesSegment = segmentFilter === 'all' || b.segment === segmentFilter;
      return matchesQuery && matchesStatus && matchesSegment;
    });
  }, [bookings, searchQuery, statusFilter, segmentFilter]);

  const inspectedBooking = useMemo(
    () => bookings.find((b) => b.id === inspectedId) || null,
    [bookings, inspectedId]
  );

  const qrModalBooking = useMemo(
    () => bookings.find((b) => b.id === showQrModalId) || null,
    [bookings, showQrModalId]
  );

  const getStatusColorClass = (status: BookingStatus) => {
    switch (status) {
      case 'Sedang Berjalan':
      case 'Selesai':
        return 'text-emerald-700';
      case 'Terbit E-Ticket':
      case 'Rute Disetujui':
        return 'text-sky-700';
      case 'Diajukan':
      case 'Verifikasi Berkas':
        return 'text-amber-700';
      case 'Ditolak':
      case 'No-Show':
        return 'text-red-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Workspace Sub-Navigation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Peminjaman Bus &amp; Kurasi Rute ODL (One Day Loop)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pengajuan digital untuk Mitra Binaan, Sekolah TK–Mahasiswa, dan Komunitas dengan deteksi bentrok jadwal, kapasitas armada, validasi akses jalan, serta notifikasi WhatsApp Gateway.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs shrink-0 self-start">
          <button
            type="button"
            onClick={() => setWorkspaceTab('form')}
            className={`rounded-md px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
              workspaceTab === 'form'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Ajukan Peminjaman &amp; Kurasi ODL
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('list')}
            className={`rounded-md px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
              workspaceTab === 'list'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Daftar Pengajuan &amp; Verifikasi ({bookings.length})
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE SUBMISSION & ROUTE CURATION WORKSPACE */}
      {workspaceTab === 'form' && (
        <form onSubmit={handleSubmitForm} className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
          {/* Left Column: 4-Step Digital Submission & 2-Mode Route Curation */}
          <div className="xl:col-span-8 space-y-6">
            {/* Step 1: Data Pemohon */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    01. Identitas Pemohon &amp; Segmen Rombongan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Diperuntukkan bagi Mitra Binaan UMKM, Sekolah TK–Mahasiswa, dan Komunitas Sidoarjo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori / Segmen Pemohon
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as ApplicantSegment)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  >
                    {SEGMENTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.groupLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Sekolah / Komunitas / Mitra Binaan
                  </label>
                  <input
                    required
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Contoh: SDN Pucang 1 / Karang Taruna / Paguyuban UMKM"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Penanggung Jawab (PIC)
                  </label>
                  <input
                    required
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Contoh: Dra. Siti Aminah"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      No. WhatsApp Aktif
                    </label>
                    <input
                      required
                      type="tel"
                      value={phoneWa}
                      onChange={(e) => setPhoneWa(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Jumlah Peserta
                    </label>
                    <input
                      required
                      type="number"
                      min={5}
                      max={60}
                      value={participantCount}
                      onChange={(e) => setParticipantCount(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Tanggal, Jam, Armada & Titik Jemput (Pickup Point) */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    02. Jadwal Keberangkatan, Pilihan Bus &amp; Titik Jemput (Pickup Point)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemilihan armada terhubung langsung dengan deteksi bentrok jadwal dan kapasitas kursi.
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-[#0B1F3A]" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Armada Bus Wisata
                  </label>
                  <select
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.unitName} ({b.seatCapacity} Kursi · {b.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanggal Kegiatan
                  </label>
                  <input
                    required
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Jam Jemput</label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs tabular-nums focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Selesai</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs tabular-nums focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Titik Jemput (Pickup Point)
                </label>
                <input
                  required
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap sekolah/kantor atau pilih titik jemput populer di bawah..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PICKUP_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPickupAddress(preset)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        pickupAddress === preset
                          ? 'border-[#0B1F3A] bg-sky-50 text-[#0B1F3A]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBus && <BusPhotoPreviewCard bus={selectedBus} />}
            </section>

            {/* Step 3: Dua Mode Kurasi Rute ODL (One Day Loop) */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    03. Kurasi Rute ODL (One Day Loop)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilih paket tematik siap pakai atau susun rute custom dengan validasi akses jalan otomatis.
                  </p>
                </div>

                {/* Two-Mode Switcher */}
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => setRouteMode('package')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-colors whitespace-nowrap ${
                      routeMode === 'package'
                        ? 'bg-white text-[#0B1F3A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Paket Tematik Siap Pakai
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMode('custom')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition-colors whitespace-nowrap ${
                      routeMode === 'custom'
                        ? 'bg-white text-[#0B1F3A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Mode Custom Rute
                  </button>
                </div>
              </div>

              {routeMode === 'package' ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {packages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    const stops = pkg.stopIds
                      .map((id) => destinations.find((d) => d.id === id))
                      .filter((d): d is Destination => !!d);
                    const hasNarrowRoad = stops.some((s) => !s.busAccessible);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                          isSelected
                            ? 'border-[#0B1F3A] bg-sky-50/60'
                            : 'border-slate-200 bg-white hover:border-sky-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-sky-700 tabular-nums">
                            {pkg.totalDurationHours} Jam · {stops.length} Titik
                          </span>
                          {hasNarrowRoad ? (
                            <span className="font-semibold text-amber-700">Ada Titik Drop-Off</span>
                          ) : (
                            <span className="font-semibold text-emerald-700">Akses Bus Penuh</span>
                          )}
                        </div>
                        <div className="mt-1 font-display text-sm font-bold text-slate-900">
                          {pkg.packageName}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                          {pkg.description}
                        </p>
                        <div className="mt-2.5 text-[11px] font-medium text-slate-500">
                          Titik: {stops.map((s) => s.name).join(' → ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  {/* Available Sidoarjo Destinations Picker */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Pilih Titik Destinasi di Kab. Sidoarjo
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {destinations.map((dest) => {
                        const checked = customStopIds.includes(dest.id);
                        return (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={() => handleToggleCustomStop(dest.id)}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                              checked
                                ? 'border-[#0B1F3A] bg-sky-50/70 text-slate-900'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{dest.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {dest.category} · {dest.district} ·{' '}
                                <span className={dest.busAccessible ? 'text-emerald-700' : 'text-amber-700 font-medium'}>
                                  {dest.busAccessible ? 'Akses Bus Besar' : 'Jalan/Jembatan Terbatas'}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-[11px] font-semibold ${
                                checked ? 'text-[#0B1F3A]' : 'text-sky-700'
                              }`}
                            >
                              {checked ? 'Terpilih' : '+ Tambah'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ordered Custom Loop Sequence */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        Urutan Rute Melingkar ({activeStops.length} Lokasi)
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        Est. {routeDurationEstimate} Jam
                      </span>
                    </div>

                    {activeStops.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                        Belum ada destinasi terpilih. Pilih minimal 1 lokasi dari daftar sebelah kiri.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {activeStops.map((stop, idx) => (
                          <div
                            key={stop.id}
                            className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs ${
                              stop.busAccessible
                                ? 'border-slate-200 bg-slate-50/70'
                                : 'border-amber-300 bg-amber-50/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-[10px] font-bold text-white tabular-nums">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                  {stop.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {stop.avgDurationMins} mnt ·{' '}
                                  {stop.busAccessible
                                    ? 'Bus Masuk Langsung'
                                    : `Drop-off: ${stop.recommendedDropOff}`}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveStop(idx, -1)}
                                disabled={idx === 0}
                                className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30"
                                aria-label={`Naikkan urutan ${stop.name}`}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStop(idx, 1)}
                                disabled={idx === activeStops.length - 1}
                                className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30"
                                aria-label={`Turunkan urutan ${stop.name}`}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCustomStop(stop.id)}
                                className="rounded p-1 text-slate-400 hover:text-red-600"
                                aria-label={`Hapus ${stop.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Step 4: Unggah Surat Pengantar Resmi & Manifest */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-display text-base font-bold text-slate-900">
                  04. Unggah Surat Pengantar Resmi &amp; Manifest Peserta
                </h2>
                <p className="text-xs text-slate-500">
                  Lampirkan surat permohonan bertanda tangan kepala instansi/komunitas (PDF/Gambar) dan daftar nama peserta.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Surat Pengantar Upload */}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input
                    ref={letterInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFilePick(e, 'letter')}
                    className="hidden"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Surat Pengantar Resmi
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Format PDF / JPG / PNG (Maks. 5 MB)
                      </div>
                    </div>
                    <FileUp className="h-4 w-4 text-[#0B1F3A] shrink-0" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => letterInputRef.current?.click()}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Pilih Berkas Surat
                    </button>
                    {letterFile ? (
                      <span className="text-[11px] font-medium text-emerald-700 truncate max-w-[180px]">
                        {letterFile.name} ({letterFile.sizeLabel})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setLetterFile({ name: 'Surat_Pengantar_Resmi_2026.pdf', sizeLabel: '420 KB' })
                        }
                        className="text-[11px] font-medium text-sky-700 hover:underline"
                      >
                        Gunakan contoh PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Manifest Upload */}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input
                    ref={manifestInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    onChange={(e) => handleFilePick(e, 'manifest')}
                    className="hidden"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Daftar Manifest Penumpang
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Format XLSX / CSV / PDF
                      </div>
                    </div>
                    <FileText className="h-4 w-4 text-sky-700 shrink-0" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => manifestInputRef.current?.click()}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Pilih Berkas Manifest
                    </button>
                    {manifestFile ? (
                      <span className="text-[11px] font-medium text-emerald-700 truncate max-w-[180px]">
                        {manifestFile.name} ({manifestFile.sizeLabel})
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setManifestFile({ name: 'Manifest_Peserta_Rombongan.xlsx', sizeLabel: '185 KB' })
                        }
                        className="text-[11px] font-medium text-sky-700 hover:underline"
                      >
                        Gunakan contoh XLSX
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Catatan Tambahan untuk Verifikator &amp; Kru Bus
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Rombongan anak TK membutuhkan pemberhentian toilet setiap 90 menit..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </section>
          </div>

          {/* Right Sticky Column: Live Conflict Detection, Road Access Validation & WhatsApp Gateway Submit */}
          <aside className="xl:col-span-4 space-y-5 xl:sticky xl:top-20">
            {/* Live Validation Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Validasi Otomatis (Conflict Detection)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemeriksaan jadwal, kapasitas &amp; akses jalan secara real-time.
                  </p>
                </div>
                <ShieldAlert className="h-4 w-4 text-[#0B1F3A]" />
              </div>

              {/* 1. Schedule & Maintenance Check */}
              <div className="space-y-2.5 text-xs">
                <div
                  className={`rounded-lg border p-3 ${
                    isMaintenanceBlocked || scheduleConflict
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {isMaintenanceBlocked || scheduleConflict ? (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {isMaintenanceBlocked
                        ? 'Armada Dalam Maintenance'
                        : scheduleConflict
                        ? 'Bentrok Jadwal Terdeteksi'
                        : 'Jadwal Armada Tersedia'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    {isMaintenanceBlocked
                      ? `${selectedBus?.code} sedang dalam tiket perbaikan aktif. Pilih DARJO-01, DARJO-02, atau DARJO-03.`
                      : scheduleConflict
                      ? `Bentrok dengan ${scheduleConflict.bookingCode} (${scheduleConflict.organizationName}) pukul ${scheduleConflict.pickupTime}–${scheduleConflict.endTime} WIB.`
                      : `${selectedBus?.code} kosong pada ${tripDate} pukul ${pickupTime}–${endTime} WIB.`}
                  </p>
                </div>

                {/* 2. Capacity Check */}
                <div
                  className={`rounded-lg border p-3 ${
                    isOverCapacity
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {isOverCapacity ? (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    ) : (
                      <Bus className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {isOverCapacity ? 'Melebihi Kapasitas Bus' : 'Kapasitas Kursi Memenuhi'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums">
                    Peserta: {participantCount} org / Kapasitas {selectedBus?.code}: {selectedBus?.seatCapacity} kursi.
                  </p>
                </div>

                {/* 3. Road & Bridge Accessibility Check */}
                <div
                  className={`rounded-lg border p-3 ${
                    restrictedStops.length > 0
                      ? 'border-amber-300 bg-amber-50 text-amber-950'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {restrictedStops.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {restrictedStops.length > 0
                        ? `Peringatan Akses Jalan/Jembatan (${restrictedStops.length} Titik)`
                        : 'Akses Jalan Raya & Jembatan Aman'}
                    </span>
                  </div>
                  {restrictedStops.length > 0 ? (
                    <ul className="mt-1.5 space-y-1.5 text-[11px]">
                      {restrictedStops.map((rs) => (
                        <li key={rs.id} className="leading-snug">
                          <strong>{rs.name}:</strong> {rs.roadConstraintNote}{' '}
                          <span className="font-semibold underline">
                            Titik Drop-off: {rs.recommendedDropOff}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px]">
                      Seluruh titik destinasi pada rute ODL terverifikasi ramah bus pariwisata besar.
                    </p>
                  )}
                </div>

                {/* 4. Submission Lead-Time Indicator */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                  <span>
                    {isUrgentH3
                      ? 'Pengajuan < H-3: ditandai otomatis sebagai Prioritas Mendesak.'
                      : 'Waktu pengajuan memenuhi standar operasional layanan Disporapar.'}
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Gateway Preview & Submit Trigger */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Pratinjau Notifikasi WhatsApp Gateway
                  </h3>
                </div>
              </div>

              <pre className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 font-sans text-[11px] leading-relaxed text-slate-800">
                {previewWaMessage}
              </pre>

              <button
                type="submit"
                disabled={conflictIssues.length > 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-3 text-xs font-semibold text-white hover:bg-[#13315C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Ajukan Peminjaman &amp; Kirim Notifikasi WA</span>
              </button>

              {conflictIssues.length > 0 && (
                <p className="text-[11px] font-medium text-red-700 text-center">
                  Perbaiki {conflictIssues.length} kendala validasi di atas sebelum mengirim pengajuan.
                </p>
              )}
            </div>
          </aside>
        </form>
      )}

      {/* TAB 2: DAFTAR PENGAJUAN, APPROVAL & QR CHECK-IN/OUT */}
      {workspaceTab === 'list' && (
        <div className="space-y-5">
          {/* Filters Toolbar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode booking, instansi, atau nama PIC..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {['all', 'Diajukan', 'Verifikasi Berkas', 'Terbit E-Ticket', 'Sedang Berjalan'].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                        statusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'all' ? 'Semua' : st}
                    </button>
                  )
                )}
              </div>

              <select
                aria-label="Filter segmen pemohon"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Semua Segmen</option>
                {SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.value}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setWorkspaceTab('form')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#13315C] whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Pengajuan</span>
              </button>
            </div>
          </div>

          {/* Main Split: Bookings Table + Detail / Approval Inspector */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
            <div className="xl:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <th className="py-3 px-4 font-semibold">Kode &amp; Tanggal</th>
                      <th className="py-3 px-3 font-semibold">Pemohon</th>
                      <th className="py-3 px-3 font-semibold">Armada &amp; Rute</th>
                      <th className="py-3 px-3 font-semibold text-right">Kursi</th>
                      <th className="py-3 px-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          Tidak ada pengajuan yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((bk) => {
                        const bus = buses.find((b) => b.id === bk.busId);
                        const isSelected = inspectedId === bk.id;
                        return (
                          <tr
                            key={bk.id}
                            onClick={() => setInspectedId(bk.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 align-top whitespace-nowrap">
                              <div className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                                {bk.bookingCode}
                              </div>
                              <div className="text-[11px] text-slate-500 tabular-nums">
                                {bk.tripDate} · {bk.pickupTime}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <div className="font-semibold text-slate-900">
                                {bk.organizationName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {bk.segment} · {bk.applicantName}
                              </div>
                              {bk.isUrgentH3 && (
                                <div className="mt-0.5 text-[11px] font-semibold text-red-700">
                                  Prioritas Mendesak (&lt; H-3)
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 align-top">
                              <div className="font-medium text-slate-800">{bus?.code}</div>
                              <div className="text-[11px] text-slate-500 max-w-[180px] truncate">
                                {bk.routeName}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top text-right font-mono font-medium text-slate-900 tabular-nums">
                              {bk.participantCount}
                            </td>
                            <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                              <span className={`font-semibold ${getStatusColorClass(bk.status)}`}>
                                {bk.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspector & Approval Disposition Panel */}
            <aside className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-5">
              {!inspectedBooking ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <div className="text-sm font-semibold text-slate-800">
                    Pilih Pengajuan untuk Telaah &amp; Approval
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Klik salah satu baris pengajuan di tabel sebelah kiri untuk memeriksa surat pengantar, validasi akses jalan, menerbitkan E-Ticket QR, atau melakukan Check-in kru.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs font-mono font-semibold text-[#0B1F3A] tabular-nums">
                        {inspectedBooking.bookingCode} · {inspectedBooking.segment}
                      </div>
                      <h2 className="font-display text-base font-bold text-slate-900 mt-0.5">
                        {inspectedBooking.organizationName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        PIC: {inspectedBooking.applicantName} · WA: {inspectedBooking.phoneWa}
                      </p>
                    </div>
                    <span className={`text-xs font-bold whitespace-nowrap ${getStatusColorClass(inspectedBooking.status)}`}>
                      {inspectedBooking.status}
                    </span>
                  </div>

                  {/* Trip Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Jadwal &amp; Jam Jemput</div>
                      <div className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        {inspectedBooking.tripDate} · {inspectedBooking.pickupTime}–{inspectedBooking.endTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Armada &amp; Jumlah Peserta</div>
                      <div className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        {buses.find((b) => b.id === inspectedBooking.busId)?.code} · {inspectedBooking.participantCount} Orang
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500">Titik Jemput (Pickup Point)</div>
                      <div className="font-medium text-slate-800 mt-0.5">
                        {inspectedBooking.pickupAddress}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500">Rute ODL &amp; Dokumen Terlampir</div>
                      <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                        <span>{inspectedBooking.routeName}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-sky-700">
                        {inspectedBooking.letterFileName} · {inspectedBooking.manifestFileName}
                      </div>
                    </div>
                  </div>

                  {/* Access Road Alert if any */}
                  {inspectedBooking.hasAccessWarning && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Catatan Validasi Akses Jalan Bus Besar</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        {inspectedBooking.accessWarningNote}
                      </p>
                    </div>
                  )}

                  {/* Check-in / Check-out Log */}
                  {(inspectedBooking.checkedInAt || inspectedBooking.checkedOutAt) && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                      <div className="font-semibold">Realisasi Lapangan (QR Check-in/out)</div>
                      <div className="mt-1 text-[11px] tabular-nums">
                        Check-in: {inspectedBooking.checkedInAt || '-'} WIB · Check-out:{' '}
                        {inspectedBooking.checkedOutAt || 'Belum selesai'} · Peserta Aktual:{' '}
                        {inspectedBooking.actualParticipants || inspectedBooking.participantCount} org
                      </div>
                    </div>
                  )}

                  {/* Workflow Actions */}
                  <div className="border-t border-slate-100 pt-4 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-700">
                      Tindakan Alur Persetujuan &amp; Operasional
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inspectedBooking.status === 'Diajukan' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBookingStatus(inspectedBooking.id, 'Verifikasi Berkas')
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Verifikasi Berkas</span>
                        </button>
                      )}

                      {(inspectedBooking.status === 'Diajukan' ||
                        inspectedBooking.status === 'Verifikasi Berkas' ||
                        inspectedBooking.status === 'Rute Disetujui') && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBookingStatus(inspectedBooking.id, 'Terbit E-Ticket')
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Setujui &amp; Terbitkan E-Ticket</span>
                        </button>
                      )}

                      {inspectedBooking.status === 'Terbit E-Ticket' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBookingStatus(inspectedBooking.id, 'Sedang Berjalan', {
                              checkedInAt: new Date().toTimeString().slice(0, 5),
                              actualParticipants: inspectedBooking.participantCount,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Scan QR Check-in Kru</span>
                        </button>
                      )}

                      {inspectedBooking.status === 'Sedang Berjalan' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBookingStatus(inspectedBooking.id, 'Selesai', {
                              checkedOutAt: new Date().toTimeString().slice(0, 5),
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Scan QR Check-out Selesai</span>
                        </button>
                      )}

                      {(inspectedBooking.status === 'Terbit E-Ticket' ||
                        inspectedBooking.status === 'Sedang Berjalan' ||
                        inspectedBooking.status === 'Selesai') && (
                        <button
                          type="button"
                          onClick={() => setShowQrModalId(inspectedBooking.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <QrCode className="h-3.5 w-3.5 text-[#0B1F3A]" />
                          <span>Lihat E-Ticket QR</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onSendWhatsAppToast(
                            `Notifikasi WhatsApp terkirim ke ${inspectedBooking.phoneWa} (${inspectedBooking.organizationName}) — Status: ${inspectedBooking.status}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Kirim Notifikasi WA</span>
                      </button>

                      {inspectedBooking.status !== 'Selesai' &&
                        inspectedBooking.status !== 'Ditolak' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateBookingStatus(inspectedBooking.id, 'Ditolak')
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* WhatsApp Gateway Receipt Confirmation Modal */}
      {waReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wa-receipt-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="wa-receipt-title" className="font-display text-base font-bold text-slate-900">
                    Pengajuan Tercatat &amp; WhatsApp Gateway Terkirim
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kode Registrasi: <span className="font-mono font-bold text-[#0B1F3A]">{waReceipt.booking.bookingCode}</span> · Terkirim pukul {waReceipt.sentAt} WIB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaReceipt(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup konfirmasi WhatsApp"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs font-medium text-slate-700">
                Tujuan: <strong>{waReceipt.booking.phoneWa}</strong> ({waReceipt.booking.applicantName})
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 font-sans text-xs leading-relaxed text-slate-800">
                {waReceipt.waMessage}
              </pre>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWaReceipt(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Buat Pengajuan Lain
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaReceipt(null);
                  setWorkspaceTab('list');
                }}
                className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
              >
                Lihat di Daftar Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-Ticket & Surat Jalan Digital Ber-QR Modal */}
      {qrModalBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eticket-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[11px] font-semibold text-sky-700">
                  DISPORAPAR KABUPATEN SIDOARJO
                </div>
                <h3 id="eticket-modal-title" className="font-display text-lg font-bold text-slate-900">
                  E-Ticket &amp; Surat Jalan Digital
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModalId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup E-Ticket"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center text-center">
              <QrCodeSvg value={`${qrModalBooking.bookingCode}|${qrModalBooking.busId}|${qrModalBooking.tripDate}`} size={148} />
              <div className="mt-2 font-mono text-sm font-bold text-[#0B1F3A] tabular-nums">
                {qrModalBooking.bookingCode}
              </div>
              <div className="text-xs text-slate-500">
                Pindai QR saat penjemputan (Check-in) &amp; kepulangan (Check-out)
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Rombongan</span>
                <span className="font-semibold text-slate-900 text-right">{qrModalBooking.organizationName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Unit &amp; Nopol</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {buses.find((b) => b.id === qrModalBooking.busId)?.code} ·{' '}
                  {buses.find((b) => b.id === qrModalBooking.busId)?.plateNumber}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Pengemudi</span>
                <span className="font-medium text-slate-800">
                  {buses.find((b) => b.id === qrModalBooking.busId)?.driverName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Tanggal &amp; Jam</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {qrModalBooking.tripDate} · {qrModalBooking.pickupTime} WIB
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Peserta</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {qrModalBooking.participantCount} Orang ({qrModalBooking.segment})
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cetak Surat Jalan
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendWhatsAppToast(`E-Ticket QR ${qrModalBooking.bookingCode} dikirim via WhatsApp ke ${qrModalBooking.phoneWa}`);
                  setShowQrModalId(null);
                }}
                className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
              >
                Kirim ke WhatsApp Pemohon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
