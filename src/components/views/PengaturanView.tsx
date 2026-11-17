import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Shield,
  Smartphone,
  Sliders,
} from 'lucide-react';
import { AuditLogEntry, UserRole } from '../../types/dolandarjo';
import { PWAInstallButton } from '../PWAInstallButton';

interface PengaturanViewProps {
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  auditLogs: AuditLogEntry[];
  onNotifyToast: (msg: string) => void;
}

const ROLES: { role: UserRole; scope: string }[] = [
  {
    role: 'Super Admin (Pranata Komputer)',
    scope: 'Konfigurasi sistem, manajemen user & role, master armada, kurasi paket rute ODL, dan audit log.',
  },
  {
    role: 'Approver (Pimpinan Disporapar)',
    scope: 'Persetujuan akhir permohonan, monitoring dashboard eksekutif, analitik tren wisata, dan management brief.',
  },
  {
    role: 'Operator / Verifikator',
    scope: 'Verifikasi berkas administrasi, penjadwalan armada & kru, reschedule rute, dan tiket maintenance.',
  },
  {
    role: 'Kru / Pengemudi Bus',
    scope: 'Akses jadwal tugas harian, pemindaian QR Check-in/Check-out, checklist ramp check, dan lapor kendala.',
  },
  {
    role: 'Pemohon Masyarakat',
    scope: 'Cek kalender kosong, simulasi rute ODL, ajukan booking digital, unggah surat/manifest, dan E-Ticket QR.',
  },
];

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  activeRole,
  onChangeRole,
  auditLogs,
  onNotifyToast,
}) => {
  const [waReminderH1, setWaReminderH1] = useState(true);
  const [waAutoEticket, setWaAutoEticket] = useState(true);
  const [waIkmSurvey, setWaIkmSurvey] = useState(true);
  const [minAdvanceDays, setMinAdvanceDays] = useState(7);
  const [urgentThresholdDays, setUrgentThresholdDays] = useState(3);
  const [noShowLimitHours, setNoShowLimitHours] = useState(48);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    onNotifyToast(
      `Konfigurasi aturan operasional disimpan (Ideal H-${minAdvanceDays}, Mendesak < H-${urgentThresholdDays}, Batas Batal ${noShowLimitHours} jam).`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Sistem, RBAC, Notifikasi &amp; PWA
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manajemen hak akses peran (Role-Based Access Control), gateway notifikasi WhatsApp, aturan prioritisasi booking, serta status aplikasi PWA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Left Column: RBAC & Operational Rules */}
        <div className="xl:col-span-7 space-y-6">
          {/* Role Switcher */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Simulasi &amp; Matriks Hak Akses (RBAC)
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih peran aktif untuk meninjau konteks otorisasi operasional di DOLAN DARJO.
                </p>
              </div>
              <Shield className="h-4 w-4 text-[#0B1F3A]" />
            </div>

            <div className="space-y-2.5">
              {ROLES.map((item) => {
                const isCurrent = activeRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      onChangeRole(item.role);
                      onNotifyToast(`Peran aktif beralih ke ${item.role}.`);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isCurrent
                        ? 'border-[#0B1F3A] bg-sky-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.role}</span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{item.scope}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Operational Priority Rules */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Aturan Prioritisasi &amp; Deteksi No-Show
                </h2>
                <p className="text-xs text-slate-500">
                  Parameter penandaan pengajuan mendesak dan kepatuhan jadwal pemohon.
                </p>
              </div>
              <Sliders className="h-4 w-4 text-[#0B1F3A]" />
            </div>

            <form onSubmit={handleSaveRules} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Pengajuan Ideal (H-Hari)
                </label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={minAdvanceDays}
                  onChange={(e) => setMinAdvanceDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Batas Prioritas Mendesak
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={urgentThresholdDays}
                  onChange={(e) => setUrgentThresholdDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Batas Pembatalan (Jam)
                </label>
                <input
                  type="number"
                  min={12}
                  max={72}
                  value={noShowLimitHours}
                  onChange={(e) => setNoShowLimitHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
                >
                  Simpan Parameter Operasional
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: WA Gateway, PWA Status, Audit Log */}
        <div className="xl:col-span-5 space-y-6">
          {/* WhatsApp Gateway */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  WhatsApp Notification Gateway
                </h2>
                <p className="text-xs text-slate-500">
                  Otomasi status permohonan, pengiriman E-Ticket QR, dan pengingat H-1.
                </p>
              </div>
              <Bell className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="font-medium text-slate-800">
                  Kirim E-Ticket QR otomatis saat approval
                </span>
                <input
                  type="checkbox"
                  checked={waAutoEticket}
                  onChange={(e) => setWaAutoEticket(e.target.checked)}
                  className="h-4 w-4 accent-[#0B1F3A]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="font-medium text-slate-800">
                  Pengingat jadwal keberangkatan H-1 (08.00 WIB)
                </span>
                <input
                  type="checkbox"
                  checked={waReminderH1}
                  onChange={(e) => setWaReminderH1(e.target.checked)}
                  className="h-4 w-4 accent-[#0B1F3A]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="font-medium text-slate-800">
                  Tautan Survei IKM otomatis setelah Check-out
                </span>
                <input
                  type="checkbox"
                  checked={waIkmSurvey}
                  onChange={(e) => setWaIkmSurvey(e.target.checked)}
                  className="h-4 w-4 accent-[#0B1F3A]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                onNotifyToast(
                  'Uji coba pesan WhatsApp Gateway berhasil dikirim ke nomor koordinator uji coba.'
                )
              }
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Uji Kirim Pesan WhatsApp Gateway
            </button>
          </section>

          {/* PWA Install & Offline Readiness */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Progressive Web App (PWA)
                </h2>
                <p className="text-xs text-slate-500">
                  Dukungan pemasangan layar utama dan cache operasional offline.
                </p>
              </div>
              <Smartphone className="h-4 w-4 text-[#0B1F3A]" />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Service Worker &amp; Manifest: <strong>Aktif (Standalone Ready)</strong></div>
              <div>Ikon PWA 192px, 512px, &amp; Maskable: <strong>Terkonfigurasi</strong></div>
            </div>

            <div className="pt-1">
              <PWAInstallButton variant="settings" />
            </div>
          </section>

          {/* Audit Log */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Audit Log Transaksi Terbaru
            </h2>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {log.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{log.detail}</div>
                  <div className="text-[10px] text-slate-400">
                    Oleh: {log.actor} ({log.entity})
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
