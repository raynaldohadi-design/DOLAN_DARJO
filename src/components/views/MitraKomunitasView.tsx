import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Store,
  Users,
  X,
} from 'lucide-react';
import { ApplicantSegment, PartnerOrganization } from '../../types/dolandarjo';
import { TODAY_STR } from '../../data/mockSidoarjoData';

interface MitraKomunitasViewProps {
  partners: PartnerOrganization[];
  onAddPartner: (partner: Omit<PartnerOrganization, 'id'>) => void;
  onToggleVerifyPartner: (partnerId: string) => void;
}

export const MitraKomunitasView: React.FC<MitraKomunitasViewProps> = ({
  partners,
  onAddPartner,
  onToggleVerifyPartner,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerOrganization['type']>('Mitra Binaan UMKM');
  const [segment, setSegment] = useState<ApplicantSegment>('Mitra UMKM');
  const [district, setDistrict] = useState('Kec. Sidoarjo');
  const [picName, setPicName] = useState('');
  const [phoneWa, setPhoneWa] = useState('');
  const [productsText, setProductsText] = useState('');

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.picName.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [partners, search, typeFilter]);

  const summary = useMemo(() => {
    const umkmCount = partners.filter((p) => p.type === 'Mitra Binaan UMKM').length;
    const communityCount = partners.filter((p) => p.type === 'Komunitas Pemuda/Olahraga').length;
    const eduCount = partners.filter((p) => p.type === 'Institusi Pendidikan').length;
    const noShowIncidents = partners.reduce((sum, p) => sum + p.noShowCount, 0);
    return { umkmCount, communityCount, eduCount, noShowIncidents };
  }, [partners]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPartner({
      name: name.trim(),
      type,
      segment,
      district,
      picName: picName.trim(),
      phoneWa: phoneWa.trim(),
      totalTrips: 0,
      noShowCount: 0,
      verifiedStatus: 'Terverifikasi',
      featuredProducts: productsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      lastTripDate: TODAY_STR,
    });
    setShowAddModal(false);
    setName('');
    setPicName('');
    setPhoneWa('');
    setProductsText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Mitra UMKM, Komunitas &amp; Pemohon
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pemantauan pemerataan akses segmen masyarakat, katalog produk sentra UMKM binaan, serta histori kepatuhan jadwal (anti no-show).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Daftarkan Mitra / Komunitas</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Mitra Binaan UMKM</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#0B1F3A] tabular-nums">
            {summary.umkmCount} Sentra
          </div>
          <div className="mt-1 text-xs text-slate-500">Terhubung sebagai titik wisata belanja</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Komunitas Pemuda &amp; Olahraga</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-sky-700 tabular-nums">
            {summary.communityCount} Komunitas
          </div>
          <div className="mt-1 text-xs text-slate-500">Karang Taruna &amp; pegiat budaya</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Koordinator Sekolah / Kampus</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {summary.eduCount} Jaringan
          </div>
          <div className="mt-1 text-xs text-slate-500">MKKS, HIMPAUDI, &amp; perguruan tinggi</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Catatan No-Show (&lt; H-2)</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-amber-700 tabular-nums">
            {summary.noShowIncidents} Kejadian
          </div>
          <div className="mt-1 text-xs text-slate-500">Batas wajar operasional &le; 4%</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama mitra, kecamatan, atau penanggung jawab..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'Mitra Binaan UMKM', label: 'Mitra UMKM' },
            { id: 'Komunitas Pemuda/Olahraga', label: 'Komunitas' },
            { id: 'Institusi Pendidikan', label: 'Pendidikan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="py-3 px-4 font-semibold">Nama Mitra / Komunitas</th>
                <th className="py-3 px-3 font-semibold">Kategori &amp; Wilayah</th>
                <th className="py-3 px-3 font-semibold">PIC &amp; Produk Unggulan</th>
                <th className="py-3 px-3 font-semibold text-right">Total Trip</th>
                <th className="py-3 px-3 font-semibold text-right">No-Show</th>
                <th className="py-3 px-4 font-semibold text-right">Status &amp; Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {partner.type === 'Mitra Binaan UMKM' ? (
                        <Store className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Users className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      )}
                      <span>{partner.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      Kunjungan terakhir: {partner.lastTripDate}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 align-top">
                    <div className="font-medium text-slate-800">{partner.type}</div>
                    <div className="text-[11px] text-slate-500">{partner.district}</div>
                  </td>
                  <td className="py-3.5 px-3 align-top">
                    <div className="font-medium text-slate-800">
                      {partner.picName} · {partner.phoneWa}
                    </div>
                    {partner.featuredProducts && partner.featuredProducts.length > 0 && (
                      <div className="text-[11px] text-sky-700 mt-0.5">
                        Produk: {partner.featuredProducts.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 align-top text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {partner.totalTrips}
                  </td>
                  <td className="py-3.5 px-3 align-top text-right font-mono tabular-nums">
                    <span className={partner.noShowCount > 0 ? 'font-bold text-red-600' : 'text-slate-600'}>
                      {partner.noShowCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          partner.verifiedStatus === 'Terverifikasi'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {partner.verifiedStatus === 'Terverifikasi' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{partner.verifiedStatus}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleVerifyPartner(partner.id)}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {partner.verifiedStatus === 'Terverifikasi' ? 'Tangguhkan' : 'Verifikasi'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-partner-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 id="add-partner-title" className="font-display text-base font-bold text-slate-900">
                  Registrasi Mitra UMKM / Komunitas Baru
                </h2>
                <p className="text-xs text-slate-500">
                  Data mitra terhubung dengan katalog pemberhentian rute ODL Sidoarjo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup modal registrasi mitra"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Organisasi / Sentra UMKM
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Sentra Terasi Kupang Candi"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Jenis Mitra</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value as PartnerOrganization['type'];
                      setType(val);
                      setSegment(
                        val === 'Mitra Binaan UMKM'
                          ? 'Mitra UMKM'
                          : val === 'Komunitas Pemuda/Olahraga'
                          ? 'Komunitas'
                          : 'SD'
                      );
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="Mitra Binaan UMKM">Mitra Binaan UMKM</option>
                    <option value="Komunitas Pemuda/Olahraga">Komunitas Pemuda/Olahraga</option>
                    <option value="Institusi Pendidikan">Institusi Pendidikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kecamatan</label>
                  <input
                    required
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nama PIC</label>
                  <input
                    required
                    type="text"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nomor WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={phoneWa}
                    onChange={(e) => setPhoneWa(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Produk Unggulan / Program (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={productsText}
                  onChange={(e) => setProductsText(e.target.value)}
                  placeholder="Contoh: Petis Udang, Kerupuk Ikan, Paket Edukasi"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13315C]"
                >
                  Simpan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
