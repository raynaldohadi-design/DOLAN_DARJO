import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Menu, Plus, X } from 'lucide-react';
import {
  AuditLogEntry,
  Booking,
  BookingStatus,
  BusUnit,
  InspectionRecord,
  MaintenanceTicket,
  NavTabId,
  PartnerOrganization,
  UserRole,
} from './types/dolandarjo';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BOOKINGS,
  INITIAL_BUSES,
  INITIAL_DESTINATIONS,
  INITIAL_INSPECTIONS,
  INITIAL_ODL_PACKAGES,
  INITIAL_PARTNERS,
  INITIAL_TICKETS,
  SIDOARJO_VISUAL_GALLERY,
  TODAY_STR,
} from './data/mockSidoarjoData';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/PWAInstallButton';
import { ResilientImage } from './components/ResilientImage';
import { DashboardView } from './components/views/DashboardView';
import { PeminjamanView } from './components/views/PeminjamanView';
import { RuteOdlView } from './components/views/RuteOdlView';
import { PetaWebArView } from './components/views/PetaWebArView';
import { MitraKomunitasView } from './components/views/MitraKomunitasView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { PengaturanView } from './components/views/PengaturanView';

const TAB_TITLES: Record<NavTabId, string> = {
  dashboard: 'Dashboard',
  peminjaman: 'Peminjaman Bus',
  'rute-odl': 'Rute ODL (One Day Loop)',
  'peta-webar': 'Peta WebAR & Destinasi Sidoarjo',
  mitra: 'Manajemen Mitra/Komunitas',
  maintenance: 'Maintenance',
  analytics: 'Analytics & Management Brief',
  pengaturan: 'Pengaturan',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('Super Admin (Pranata Komputer)');

  const [buses, setBuses] = useState<BusUnit[]>(INITIAL_BUSES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);
  const [partners, setPartners] = useState<PartnerOrganization[]>(INITIAL_PARTNERS);
  const [inspections, setInspections] = useState<InspectionRecord[]>(INITIAL_INSPECTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const [openCreateBooking, setOpenCreateBooking] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string>(TODAY_STR);
  const [preselectedRouteIds, setPreselectedRouteIds] = useState<string[] | null>(null);
  const [inspectBookingId, setInspectBookingId] = useState<string | null>(null);
  const [focusedWebArPoiId, setFocusedWebArPoiId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ambient Sidoarjo Tourism & Culinary Web Background State
  const [activeBackdropId, setActiveBackdropId] = useState<string>(SIDOARJO_VISUAL_GALLERY[0].id);
  const [autoCycleBackdrop, setAutoCycleBackdrop] = useState<boolean>(true);

  const activeBackdrop = useMemo(
    () =>
      SIDOARJO_VISUAL_GALLERY.find((item) => item.id === activeBackdropId) ||
      SIDOARJO_VISUAL_GALLERY[0],
    [activeBackdropId]
  );

  useEffect(() => {
    if (!autoCycleBackdrop) return;
    const interval = setInterval(() => {
      setActiveBackdropId((prev) => {
        const idx = SIDOARJO_VISUAL_GALLERY.findIndex((item) => item.id === prev);
        const nextIdx = (idx + 1) % SIDOARJO_VISUAL_GALLERY.length;
        return SIDOARJO_VISUAL_GALLERY[nextIdx].id;
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [autoCycleBackdrop]);

  const handleSelectBackdrop = useCallback((backdropId: string) => {
    setActiveBackdropId(backdropId);
    setAutoCycleBackdrop(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const appendAudit = useCallback(
    (action: string, entity: string, detail: string) => {
      const nowTime = new Date().toTimeString().slice(0, 5);
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: `${TODAY_STR} ${nowTime}`,
          actor: activeRole.split(' ')[0],
          role: activeRole,
          action,
          entity,
          detail,
        },
        ...prev,
      ]);
    },
    [activeRole]
  );

  const pendingBookingCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'Diajukan' || b.status === 'Verifikasi Berkas'
      ).length,
    [bookings]
  );

  const openTicketCount = useMemo(
    () => tickets.filter((t) => t.status !== 'Selesai').length,
    [tickets]
  );

  // Handlers
  const handleOpenNewBookingForDate = (dateStr: string, routeIds?: string[]) => {
    setPreselectedDate(dateStr);
    setPreselectedRouteIds(routeIds || null);
    setOpenCreateBooking(true);
    setActiveTab('peminjaman');
  };

  const handleClearPreselected = useCallback(() => {
    setOpenCreateBooking(false);
  }, []);

  const handleSelectBookingToInspect = (bookingId: string) => {
    setInspectBookingId(bookingId);
    setActiveTab('peminjaman');
  };

  const handleExploreDestinationInWebAr = (destId: string) => {
    setFocusedWebArPoiId(destId);
    setActiveTab('peta-webar');
  };

  const handleCreateBooking = (
    newBk: Omit<Booking, 'id' | 'bookingCode' | 'createdAt'>
  ): Booking => {
    const seq = String(bookings.length + 1).padStart(3, '0');
    const bookingCode = `DD-2611-${seq}`;
    const created: Booking = {
      ...newBk,
      id: `bk-${Date.now()}`,
      bookingCode,
      createdAt: TODAY_STR,
    };
    setBookings((prev) => [created, ...prev]);
    setInspectBookingId(created.id);
    appendAudit(
      'Pengajuan Peminjaman Baru',
      bookingCode,
      `${created.organizationName} mengajukan ${created.routeName} untuk ${created.tripDate}.`
    );
    showToast(`Pengajuan ${bookingCode} berhasil dikirim dan notifikasi WhatsApp Gateway dipicu.`);
    return created;
  };

  const handleUpdateBookingStatus = (
    bookingId: string,
    newStatus: BookingStatus,
    extra?: Partial<Booking>
  ) => {
    let targetCode = '';
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        targetCode = b.bookingCode;
        return { ...b, ...extra, status: newStatus };
      })
    );
    if (targetCode) {
      appendAudit(
        `Status Diubah: ${newStatus}`,
        targetCode,
        `Status transaksi ${targetCode} diperbarui menjadi ${newStatus}.`
      );
      showToast(`Status ${targetCode} diperbarui menjadi "${newStatus}".`);
    }
  };

  const handleCreateTicket = (
    ticketData: Omit<MaintenanceTicket, 'id' | 'ticketCode' | 'startDate' | 'status'>
  ) => {
    const code = `MNT-2026-0${tickets.length + 15}`;
    const created: MaintenanceTicket = {
      ...ticketData,
      id: `mnt-${Date.now()}`,
      ticketCode: code,
      startDate: TODAY_STR,
      status: 'Dalam Perbaikan',
    };
    setTickets((prev) => [created, ...prev]);

    if (ticketData.priority === 'Kritis / Stop Operasi') {
      setBuses((prev) =>
        prev.map((b) =>
          b.id === ticketData.busId ? { ...b, status: 'Maintenance' } : b
        )
      );
    }

    appendAudit(
      'Terbit Tiket Maintenance',
      code,
      `${ticketData.issueDesc} (Prioritas: ${ticketData.priority}).`
    );
    showToast(`Tiket pemeliharaan ${code} berhasil diterbitkan.`);
  };

  const handleResolveTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: 'Selesai', endDate: TODAY_STR } : t
      )
    );

    const remainingCriticalForBus = tickets.some(
      (t) =>
        t.id !== ticketId &&
        t.busId === target.busId &&
        t.status !== 'Selesai' &&
        t.priority === 'Kritis / Stop Operasi'
    );

    if (!remainingCriticalForBus) {
      setBuses((prev) =>
        prev.map((b) =>
          b.id === target.busId && b.status === 'Maintenance'
            ? { ...b, status: 'Tersedia', lastInspectionDate: TODAY_STR }
            : b
        )
      );
    }

    appendAudit(
      'Selesai Maintenance',
      target.ticketCode,
      `Perbaikan selesai dan armada kembali berstatus Tersedia.`
    );
    showToast(`Tiket ${target.ticketCode} selesai; unit kembali tersedia di kalender.`);
  };

  const handleAddInspection = (
    rec: Omit<InspectionRecord, 'id' | 'inspectedAt'>
  ) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const created: InspectionRecord = {
      ...rec,
      id: `ins-${Date.now()}`,
      inspectedAt: `${TODAY_STR} ${nowTime}`,
    };
    setInspections((prev) => [created, ...prev]);
    if (rec.conditionStatus === 'Tidak Laik') {
      setBuses((prev) =>
        prev.map((b) => (b.id === rec.busId ? { ...b, status: 'Maintenance' } : b))
      );
    }
    appendAudit(
      'Ramp Check Harian',
      rec.busId.toUpperCase(),
      `Inspeksi oleh ${rec.inspectorName} — Hasil: ${rec.conditionStatus}.`
    );
    showToast(`Checklist Ramp Check disimpan (${rec.conditionStatus}).`);
  };

  const handleAddPartner = (partner: Omit<PartnerOrganization, 'id'>) => {
    const created: PartnerOrganization = {
      ...partner,
      id: `ptr-${Date.now()}`,
    };
    setPartners((prev) => [created, ...prev]);
    appendAudit('Registrasi Mitra', created.name, `Mitra baru ${created.type} terdaftar.`);
    showToast(`Mitra "${created.name}" berhasil ditambahkan ke direktori.`);
  };

  const handleToggleVerifyPartner = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              verifiedStatus:
                p.verifiedStatus === 'Terverifikasi'
                  ? 'Menunggu Verifikasi'
                  : 'Terverifikasi',
            }
          : p
      )
    );
    showToast('Status verifikasi mitra diperbarui.');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      {/* Ambient Sidoarjo Tourism & Culinary Web Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden lg:pl-68"
      >
        <ResilientImage
          key={activeBackdrop.id}
          src={activeBackdrop.imageUrl}
          alt={activeBackdrop.title}
          className="h-full w-full object-cover opacity-30 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/88 via-slate-50/82 to-sky-50/86 backdrop-blur-[2px]" />
      </div>

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activeRole={activeRole}
        onChangeRole={(role) => {
          setActiveRole(role);
          showToast(`Peran aktif beralih ke ${role}.`);
        }}
        pendingCount={pendingBookingCount}
        openTicketCount={openTicketCount}
      />

      {/* Right Main Content Area */}
      <div className="relative z-10 lg:pl-68 flex min-h-screen flex-col">
        {/* Clean Institutional Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/90 bg-white/90 backdrop-blur-sm px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <span className="font-semibold text-[#0B1F3A] hidden sm:inline">
                Disporapar Sidoarjo
              </span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-slate-900 truncate">
                {TAB_TITLES[activeTab]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline font-mono text-xs text-slate-500 tabular-nums">
              Operasional: {TODAY_STR}
            </span>
            <button
              type="button"
              onClick={() => handleOpenNewBookingForDate(TODAY_STR)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13315C] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Booking Baru</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              buses={buses}
              bookings={bookings}
              tickets={tickets}
              activeBackdropId={activeBackdropId}
              autoCycleBackdrop={autoCycleBackdrop}
              onSelectBackdrop={handleSelectBackdrop}
              onToggleAutoCycleBackdrop={() => setAutoCycleBackdrop((prev) => !prev)}
              onExploreDestination={handleExploreDestinationInWebAr}
              onNavigate={setActiveTab}
              onOpenNewBookingForDate={handleOpenNewBookingForDate}
              onSelectBookingToInspect={handleSelectBookingToInspect}
            />
          )}

          {activeTab === 'peminjaman' && (
            <PeminjamanView
              buses={buses}
              bookings={bookings}
              destinations={INITIAL_DESTINATIONS}
              packages={INITIAL_ODL_PACKAGES}
              initialCreateOpen={openCreateBooking}
              preselectedDate={preselectedDate}
              preselectedRouteIds={preselectedRouteIds}
              selectedInspectBookingId={inspectBookingId}
              onClearPreselected={handleClearPreselected}
              onCreateBooking={handleCreateBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onSendWhatsAppToast={showToast}
            />
          )}

          {activeTab === 'rute-odl' && (
            <RuteOdlView
              destinations={INITIAL_DESTINATIONS}
              packages={INITIAL_ODL_PACKAGES}
              onUseRouteForBooking={(routeStopIds) => {
                handleOpenNewBookingForDate(TODAY_STR, routeStopIds);
                showToast('Rute ODL berhasil dimuat ke formulir Peminjaman Bus (Mode Custom Rute).');
              }}
            />
          )}

          {activeTab === 'peta-webar' && (
            <PetaWebArView
              destinations={INITIAL_DESTINATIONS}
              initialSelectedPoiId={focusedWebArPoiId}
              onNotifyToast={showToast}
            />
          )}

          {activeTab === 'mitra' && (
            <MitraKomunitasView
              partners={partners}
              onAddPartner={handleAddPartner}
              onToggleVerifyPartner={handleToggleVerifyPartner}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              buses={buses}
              tickets={tickets}
              inspections={inspections}
              onCreateTicket={handleCreateTicket}
              onResolveTicket={handleResolveTicket}
              onAddInspection={handleAddInspection}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              activeRole={activeRole}
              onSwitchRole={setActiveRole}
              bookings={bookings}
              buses={buses}
              destinations={INITIAL_DESTINATIONS}
              packages={INITIAL_ODL_PACKAGES}
              onNotifyToast={showToast}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              activeRole={activeRole}
              onChangeRole={setActiveRole}
              auditLogs={auditLogs}
              onNotifyToast={showToast}
            />
          )}
        </main>

        {/* Quiet Institutional Footer with Active Backdrop Switcher */}
        <footer className="border-t border-slate-200/90 bg-white/90 backdrop-blur-sm px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-slate-700">
                DOLAN DARJO — Disporapar Kabupaten Sidoarjo
              </span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                <ImageIcon className="h-3.5 w-3.5 text-sky-700" />
                <span>Latar Web: <strong className="text-slate-800">{activeBackdrop.title}</strong></span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SIDOARJO_VISUAL_GALLERY.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectBackdrop(item.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeBackdropId === item.id
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {item.title.replace('Stadion ', '').replace('Sidoarjo', '').trim()}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-50 flex max-w-md items-center justify-between gap-3 rounded-lg border border-emerald-700 bg-[#0B1F3A] px-4 py-3 text-xs font-medium text-white shadow-xl"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-300 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Offline PWA Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
