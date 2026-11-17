import React, { useState } from 'react';
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Wrench,
  X,
} from 'lucide-react';
import {
  BusUnit,
  InspectionRecord,
  MaintenanceTicket,
  TicketPriority,
} from '../../types/dolandarjo';
import { TODAY_STR } from '../../data/mockSidoarjoData';

interface MaintenanceViewProps {
  buses: BusUnit[];
  tickets: MaintenanceTicket[];
  inspections: InspectionRecord[];
  onCreateTicket: (
    ticket: Omit<MaintenanceTicket, 'id' | 'ticketCode' | 'startDate' | 'status'>
  ) => void;
  onResolveTicket: (ticketId: string) => void;
  onAddInspection: (record: Omit<InspectionRecord, 'id' | 'inspectedAt'>) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  buses,
  tickets,
  inspections,
  onCreateTicket,
  onResolveTicket,
  onAddInspection,
}) => {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Ticket Form State
  const [ticketBusId, setTicketBusId] = useState('bus-03');
  const [reportedBy, setReportedBy] = useState('Ahmad Fauzi (Kru DARJO-03)');
  const [issueDesc, setIssueDesc] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Sedang');
  const [workshopName, setWorkshopName] = useState('Bengkel Resmi Hino Delta Surya');
  const [estimatedCostRp, setEstimatedCostRp] = useState<number>(1500000);
  const [repairNote, setRepairNote] = useState('');

  // Inspection Form State
  const [inspectBusId, setInspectBusId] = useState('bus-03');
  const [inspectorName, setInspectorName] = useState('Ahmad Fauzi');
  const [checklist, setChecklist] = useState({
    engine: true,
    brakes: true,
    ac: true,
    tires: true,
    firstAid: true,
    cabinClean: true,
    audioGuide: true,
  });
  const [inspectNotes, setInspectNotes] = useState('');

  const openTickets = tickets.filter((t) => t.status !== 'Selesai');
  const closedTickets = tickets.filter((t) => t.status === 'Selesai');

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket({
      busId: ticketBusId,
      reportedBy: reportedBy.trim(),
      issueDesc: issueDesc.trim(),
      priority,
      workshopName: workshopName.trim(),
      estimatedCostRp,
      repairNote:
        repairNote.trim() ||
        (priority === 'Kritis / Stop Operasi'
          ? 'Unit diblokir otomatis dari kalender pemesanan.'
          : 'Dijadwalkan penanganan setelah operasional harian.'),
    });
    setShowTicketModal(false);
    setIssueDesc('');
    setRepairNote('');
  };

  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const allOk = Object.values(checklist).every(Boolean);
    const criticalOk = checklist.engine && checklist.brakes && checklist.tires;
    const conditionStatus = allOk
      ? 'Laik Jalan'
      : criticalOk
      ? 'Perlu Perhatian'
      : 'Tidak Laik';

    onAddInspection({
      busId: inspectBusId,
      inspectorName: inspectorName.trim() || 'Kru Bertugas',
      checklist,
      conditionStatus,
      notes: inspectNotes.trim() || 'Pemeriksaan pra-perjalanan selesai.',
    });
    setShowInspectModal(false);
    setInspectNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Armada, Ramp Check &amp; Maintenance
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspeksi kelaikan pra-perjalanan, pelacakan tiket masalah armada, dan pemblokiran otomatis unit yang tidak laik jalan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInspectModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            <span>Isi Ramp Check Harian</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTicketModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Tiket Masalah</span>
          </button>
        </div>
      </div>

      {/* Fleet Master Cards (4 Units) */}
      <section aria-label="Master Data 4 Unit Armada Bus" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {buses.map((bus) => {
          const isMaint = bus.status === 'Maintenance';
          const isOp = bus.status === 'Beroperasi';
          return (
            <div
              key={bus.id}
              className={`rounded-xl border bg-white p-4 ${
                isMaint ? 'border-red-300' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isMaint
                        ? 'bg-red-50 text-red-600'
                        : isOp
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    <Bus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-slate-900">
                      {bus.code}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {bus.plateNumber}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    isMaint
                      ? 'text-red-700'
                      : isOp
                      ? 'text-emerald-700'
                      : 'text-sky-700'
                  }`}
                >
                  {bus.status}
                </span>
              </div>

              <div className="mt-3 text-xs font-semibold text-slate-800">
                {bus.unitName} · {bus.seatCapacity} Kursi ({bus.year})
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Kru: {bus.driverName} · Odometer:{' '}
                <span className="font-mono tabular-nums">
                  {bus.odometerKm.toLocaleString('id-ID')} km
                </span>
              </div>
              <div className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
                {bus.facilities.slice(0, 3).join(' · ')}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Split: Active & Historical Maintenance Tickets + Pre-Trip Inspections */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Maintenance Tickets */}
        <section className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Tiket Masalah &amp; Pemeliharaan ({openTickets.length} Aktif)
              </h2>
              <p className="text-xs text-slate-500">
                Tiket dengan prioritas Kritis / Stop Operasi otomatis memblokir jadwal unit pada kalender publik.
              </p>
            </div>
            <Wrench className="h-4 w-4 text-[#0B1F3A]" />
          </div>

          {/* Open Tickets */}
          <div className="space-y-3">
            {openTickets.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tidak ada tiket masalah aktif. Seluruh armada siap melayani perjalanan ODL.</span>
              </div>
            ) : (
              openTickets.map((tkt) => {
                const bus = buses.find((b) => b.id === tkt.busId);
                return (
                  <div
                    key={tkt.id}
                    className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-red-700 tabular-nums">
                          {tkt.ticketCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">
                          {bus?.code} ({bus?.plateNumber})
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{tkt.priority}</span>
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {tkt.issueDesc}
                    </p>

                    <div className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <span>Pelapor: {tkt.reportedBy}</span>
                      <span>Bengkel: {tkt.workshopName}</span>
                      <span>Mulai Servis: {tkt.startDate}</span>
                      <span className="font-mono tabular-nums">
                        Estimasi Biaya: Rp {tkt.estimatedCostRp.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-red-200/60">
                      <span className="text-[11px] text-red-800">{tkt.repairNote}</span>
                      <button
                        type="button"
                        onClick={() => onResolveTicket(tkt.id)}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Selesai &amp; Laik Jalan
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Closed Maintenance Log */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              Riwayat Pemeliharaan Selesai ({closedTickets.length})
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {closedTickets.map((tkt) => {
                const bus = buses.find((b) => b.id === tkt.busId);
                return (
                  <div key={tkt.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono font-semibold text-slate-800 tabular-nums">
                        {tkt.ticketCode} · {bus?.code}
                      </div>
                      <div className="text-slate-600 mt-0.5">{tkt.issueDesc}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        {tkt.startDate} s.d. {tkt.endDate || TODAY_STR} · {tkt.workshopName}
                      </div>
                    </div>
                    <span className="text-emerald-700 font-semibold shrink-0">Selesai</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pre-Trip Inspection (Ramp Check) Log */}
        <section className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Log Inspeksi Pra-Perjalanan (Ramp Check)
              </h2>
              <p className="text-xs text-slate-500">
                Verifikasi keselamatan mesin, rem, AC, ban, dan kelengkapan P3K sebelum berangkat.
              </p>
            </div>
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="space-y-3">
            {inspections.map((rec) => {
              const bus = buses.find((b) => b.id === rec.busId);
              const passedItems = Object.values(rec.checklist).filter(Boolean).length;
              return (
                <div
                  key={rec.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {bus?.code} — {rec.inspectorName}
                    </span>
                    <span
                      className={`font-bold ${
                        rec.conditionStatus === 'Laik Jalan'
                          ? 'text-emerald-700'
                          : rec.conditionStatus === 'Perlu Perhatian'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {rec.conditionStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Waktu: {rec.inspectedAt} · {passedItems}/7 poin lolos inspeksi
                  </div>
                  <p className="text-[11px] text-slate-700">{rec.notes}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Create Maintenance Ticket Modal */}
      {showTicketModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-ticket-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 id="create-ticket-title" className="font-display text-base font-bold text-slate-900">
                  Laporkan Kendala / Tiket Maintenance Armada
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih tingkat prioritas untuk sinkronisasi otomatis dengan jadwal peminjaman.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup modal tiket maintenance"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Armada</label>
                  <select
                    value={ticketBusId}
                    onChange={(e) => setTicketBusId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="Ringan">Ringan (Terjadwal)</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Kritis / Stop Operasi">Kritis / Stop Operasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Pelapor (Kru/Teknisi)</label>
                <input
                  required
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deskripsi Temuan Kerusakan</label>
                <textarea
                  required
                  rows={3}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Jelaskan komponen yang bermasalah..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Bengkel Rekanan</label>
                  <input
                    required
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedCostRp}
                    onChange={(e) => setEstimatedCostRp(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
                >
                  Terbitkan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Trip Inspection Modal */}
      {showInspectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 id="inspect-modal-title" className="font-display text-base font-bold text-slate-900">
                  Checklist Inspeksi Kelaikan Bus (Ramp Check)
                </h2>
                <p className="text-xs text-slate-500">
                  Wajib diisi oleh kru pengemudi sebelum keberangkatan rute ODL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup checklist ramp check"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit Armada</label>
                  <select
                    value={inspectBusId}
                    onChange={(e) => setInspectBusId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nama Pemeriksa</label>
                  <input
                    required
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                {[
                  { key: 'engine', label: 'Kondisi Mesin & Oli Normal' },
                  { key: 'brakes', label: 'Sistem Rem Angin & Parkir Optimal' },
                  { key: 'ac', label: 'Pendingin Kabin (AC) Berfungsi' },
                  { key: 'tires', label: 'Tekanan & Ketebalan Ban Laik' },
                  { key: 'firstAid', label: 'Kotak P3K, APAR & Palu Pemecah Kaca' },
                  { key: 'cabinClean', label: 'Kebersihan Kabin & Kursi Peserta' },
                  { key: 'audioGuide', label: 'Perangkat Audio Guide & GPS Aktif' },
                ].map((item) => {
                  const k = item.key as keyof typeof checklist;
                  return (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist[k]}
                        onChange={(e) =>
                          setChecklist((prev) => ({ ...prev, [k]: e.target.checked }))
                        }
                        className="rounded border-slate-300"
                      />
                      <span className="text-slate-800">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Catatan Kru</label>
                <input
                  type="text"
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  placeholder="Catatan kondisi atau temuan lapangan..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
                >
                  Simpan Inspeksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
