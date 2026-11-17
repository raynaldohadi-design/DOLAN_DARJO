import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Booking, BusUnit, Destination, UserRole } from '../types/dolandarjo';

export interface ManagementBriefInsight {
  executiveSummary: string;
  peakHoursAnalysis: string;
  weekendFleetRecommendation: string;
  topRoutesAnalysis: string;
  actionItems: string[];
  generatedAt?: string;
  model?: string;
}

export interface MonthlyAnalyticsPoint {
  month: string;
  fullMonth: string;
  occupancy: number;
  weekdayOccupancy: number;
  weekendOccupancy: number;
  trips: number;
  passengers: number;
  onTimeRate: number;
  avgDelayMins: number;
  noShowRate: number;
}

export interface ApplicantTrendPoint {
  month: string;
  TK: number;
  SD: number;
  SMP: number;
  SMA: number;
  Mahasiswa: number;
  Umum: number;
}

export interface BusOtpPoint {
  code: string;
  unitName: string;
  tripsCompleted: number;
  onTimePercent: number;
  avgDelayMins: number;
  rampCheckPassRate: number;
}

export interface OfficialReportData {
  periodLabel: string;
  activeRole: UserRole;
  printedDate: string;
  kpis: {
    utilizationPercent: number;
    onTimePercent: number;
    totalTrips: number;
    totalPassengers: number;
    ikmScore: number;
    noShowPercent: number;
  };
  monthlySeries: MonthlyAnalyticsPoint[];
  applicantTrend: ApplicantTrendPoint[];
  busOtpSeries: BusOtpPoint[];
  topDestinations: Destination[];
  bookings: Booking[];
  buses: BusUnit[];
  brief: ManagementBriefInsight;
}

function getFinalY(doc: jsPDF, fallbackY: number): number {
  const extended = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return extended.lastAutoTable?.finalY ? extended.lastAutoTable.finalY + 8 : fallbackY;
}

export function exportOfficialPdfReport(data: OfficialReportData): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Official Kop Surat Pemerintah Kabupaten Sidoarjo - Disporapar
  doc.setFillColor(11, 31, 58); // Deep Navy #0B1F3A
  doc.rect(14, 12, 16, 18, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.7);
  doc.rect(14.8, 12.8, 14.4, 16.4, 'S');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PEMKAB', 22, 19, { align: 'center' });
  doc.text('SDA', 22, 24, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KABUPATEN SIDOARJO', pageWidth / 2 + 6, 16, { align: 'center' });
  doc.setFontSize(12.5);
  doc.setTextColor(11, 31, 58);
  doc.text('DINAS KEPEMUDAAN, OLAHRAGA, DAN PARIWISATA', pageWidth / 2 + 6, 21.5, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Jl. Sultan Agung No. 32 Sidoarjo, Jawa Timur 61212 • Telp. (031) 8941234',
    pageWidth / 2 + 6,
    26.5,
    { align: 'center' }
  );
  doc.text(
    'Laman: disporapar.sidoarjokab.go.id • Pos-el: disporapar@sidoarjokab.go.id',
    pageWidth / 2 + 6,
    30.5,
    { align: 'center' }
  );

  // Double institutional border line
  doc.setDrawColor(11, 31, 58);
  doc.setLineWidth(0.9);
  doc.line(14, 33.5, pageWidth - 14, 33.5);
  doc.setLineWidth(0.3);
  doc.line(14, 34.7, pageWidth - 14, 34.7);

  // Report Document Title & Metadata
  doc.setTextColor(11, 31, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    'LAPORAN ANALYTICS & MANAGEMENT BRIEF LAYANAN BUS CITY TOUR (DOLAN DARJO)',
    pageWidth / 2,
    42,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Periode Evaluasi : ${data.periodLabel}`, 14, 49);
  doc.text(`Tanggal Cetak    : ${data.printedDate}`, 14, 53.5);
  doc.text(`Otoritas Akses   : ${data.activeRole}`, 110, 49);
  doc.text(`Jumlah Armada    : ${data.buses.length} Unit Bus Pariwisata`, 110, 53.5);

  // Section 1: Ringkasan KPI
  autoTable(doc, {
    startY: 58,
    head: [['Indikator Kinerja Utama (KPI)', 'Capaian Aktual', 'Target SLA', 'Status']],
    body: [
      [
        'Utilisasi Bulanan Armada Bus',
        `${data.kpis.utilizationPercent}%`,
        '75%',
        data.kpis.utilizationPercent >= 75 ? 'Melampaui Target' : 'Perlu Optimasi',
      ],
      [
        'Tingkat Ketepatan Waktu (On-Time Performance)',
        `${data.kpis.onTimePercent}%`,
        '90%',
        data.kpis.onTimePercent >= 90 ? 'Optimal' : 'Pantauan',
      ],
      ['Total Perjalanan & Masyarakat Terlayani', `${data.kpis.totalTrips} Trip / ${data.kpis.totalPassengers.toLocaleString('id-ID')} Org`, '-', 'Tercatat Digital'],
      ['Indeks Kepuasan Masyarakat (IKM)', `${data.kpis.ikmScore.toFixed(1)} / 5,0`, '4,5 / 5,0', 'Sangat Baik'],
      ['Tingkat Pembatalan Mendadak (No-Show)', `${data.kpis.noShowPercent}%`, '< 5%', 'Terkendali'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [11, 31, 58], fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.2 },
  });

  // Section 2: Utilisasi & Ketepatan Waktu Bulanan
  let nextY = getFinalY(doc, 102);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 31, 58);
  doc.text('A. Rekap Utilisasi Bulanan & On-Time Performance (OTP)', 14, nextY);

  autoTable(doc, {
    startY: nextY + 2.5,
    head: [['Bulan', 'Okupansi Total', 'Hari Kerja', 'Akhir Pekan', 'Total Trip', 'Penumpang', 'OTP (%)', 'Rata Delay']],
    body: data.monthlySeries.map((m) => [
      m.fullMonth,
      `${m.occupancy}%`,
      `${m.weekdayOccupancy}%`,
      `${m.weekendOccupancy}%`,
      `${m.trips} Trip`,
      `${m.passengers.toLocaleString('id-ID')}`,
      `${m.onTimeRate.toFixed(1)}%`,
      `${m.avgDelayMins.toFixed(1)} mnt`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], fontSize: 8 },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });

  // Section 3: Tren Kategori Pemohon (TK, SD, SMP, SMA, Mahasiswa, Umum)
  nextY = getFinalY(doc, 150);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 31, 58);
  doc.text('B. Tren Kategori Pemohon (TK, SD, SMP, SMA, Mahasiswa, Umum)', 14, nextY);

  autoTable(doc, {
    startY: nextY + 2.5,
    head: [['Bulan', 'TK', 'SD', 'SMP', 'SMA', 'Mahasiswa', 'Umum (Komunitas/UMKM)', 'Total Trip']],
    body: data.applicantTrend.map((row) => [
      row.month,
      String(row.TK),
      String(row.SD),
      String(row.SMP),
      String(row.SMA),
      String(row.Mahasiswa),
      String(row.Umum),
      String(row.TK + row.SD + row.SMP + row.SMA + row.Mahasiswa + row.Umum),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [11, 31, 58], fontSize: 8 },
    styles: { fontSize: 7.8, cellPadding: 2 },
  });

  // Page 2 for Management Brief & OTP per Unit + Official Sign-off
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 31, 58);
  doc.text('C. AI INSIGHT & MANAGEMENT BRIEF PIMPINAN DISPORAPAR', 14, 18);

  const briefRows = [
    ['Ringkasan Eksekutif', data.brief.executiveSummary],
    ['Analisis Jam Puncak (Peak Hours)', data.brief.peakHoursAnalysis],
    ['Rekomendasi Armada Akhir Pekan', data.brief.weekendFleetRecommendation],
    ['Identifikasi Rute Terpopuler', data.brief.topRoutesAnalysis],
    [
      'Rekomendasi Tindak Lanjut',
      data.brief.actionItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n'),
    ],
  ];

  autoTable(doc, {
    startY: 22,
    head: [['Aspek Evaluasi Strategis', 'Narasi Management Brief & Rekomendasi']],
    body: briefRows,
    theme: 'grid',
    headStyles: { fillColor: [11, 31, 58], fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold', textColor: [11, 31, 58] },
      1: { cellWidth: 130 },
    },
    styles: { fontSize: 8.2, cellPadding: 3, overflow: 'linebreak' },
  });

  nextY = getFinalY(doc, 115);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 31, 58);
  doc.text('D. Kinerja Ketepatan Waktu per Unit Bus & Destinasi Terpopuler', 14, nextY);

  autoTable(doc, {
    startY: nextY + 2.5,
    head: [['Kode Unit', 'Nama Armada', 'Trip Selesai', 'OTP (%)', 'Rata-Rata Delay', 'Ramp Check Pass']],
    body: data.busOtpSeries.map((b) => [
      b.code,
      b.unitName,
      `${b.tripsCompleted} Trip`,
      `${b.onTimePercent.toFixed(1)}%`,
      `${b.avgDelayMins.toFixed(1)} menit`,
      `${b.rampCheckPassRate.toFixed(1)}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2 },
  });

  // Official Signature Block
  const signY = Math.min(getFinalY(doc, 185) + 8, 250);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Sidoarjo, ${data.printedDate}`, 130, signY);
  doc.text('Mengetahui,', 130, signY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Dinas Kepemudaan, Olahraga,', 130, signY + 10);
  doc.text('dan Pariwisata Kabupaten Sidoarjo', 130, signY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text('____________________________________', 130, signY + 32);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dokumen dihasilkan otomatis oleh Sistem DOLAN DARJO', 14, signY + 32);

  const safePeriod = data.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `Laporan_Analytics_DOLAN_DARJO_${safePeriod}.pdf`;
  doc.save(filename);
  return filename;
}

function buildKopSuratRows(title: string, periodLabel: string, printedDate: string): (string | number)[][] {
  return [
    ['PEMERINTAH KABUPATEN SIDOARJO'],
    ['DINAS KEPEMUDAAN, OLAHRAGA, DAN PARIWISATA (DISPORAPAR)'],
    ['Jl. Sultan Agung No. 32 Sidoarjo, Jawa Timur 61212 | Telp. (031) 8941234 | disporapar.sidoarjokab.go.id'],
    [''],
    [title],
    [`Periode: ${periodLabel}`, '', `Tanggal Cetak: ${printedDate}`],
    [''],
  ];
}

export function exportOfficialExcelReport(data: OfficialReportData): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan KPI & Management Brief
  const sheet1Rows: (string | number)[][] = [
    ...buildKopSuratRows(
      'LAPORAN RINGKASAN EKSEKUTIF & MANAGEMENT BRIEF DOLAN DARJO',
      data.periodLabel,
      data.printedDate
    ),
    ['Otoritas Pengunduh', data.activeRole],
    [''],
    ['INDIKATOR KINERJA UTAMA (KPI)', 'CAPAIAN AKTUAL', 'TARGET SLA', 'KETERANGAN'],
    ['Utilisasi Armada Bulanan (%)', `${data.kpis.utilizationPercent}%`, '75%', 'Okupansi operasional city tour'],
    ['On-Time Performance (%)', `${data.kpis.onTimePercent}%`, '90%', 'Ketepatan waktu check-in & check-out'],
    ['Total Perjalanan ODL', data.kpis.totalTrips, '-', 'Perjalanan selesai/terverifikasi'],
    ['Total Masyarakat Terlayani', data.kpis.totalPassengers, '-', 'Peserta sekolah, mahasiswa, komunitas & UMKM'],
    ['Indeks Kepuasan Masyarakat (IKM)', `${data.kpis.ikmScore.toFixed(1)} / 5.0`, '4.5 / 5.0', 'Survei pasca-perjalanan'],
    ['Tingkat No-Show (%)', `${data.kpis.noShowPercent}%`, '< 5%', 'Pembatalan mendadak tanpa konfirmasi H-2'],
    [''],
    ['AI INSIGHT & MANAGEMENT BRIEF PIMPINAN', 'NARASI ANALISIS & REKOMENDASI'],
    ['Ringkasan Eksekutif', data.brief.executiveSummary],
    ['Analisis Jam Puncak (Peak Hours)', data.brief.peakHoursAnalysis],
    ['Rekomendasi Armada Akhir Pekan', data.brief.weekendFleetRecommendation],
    ['Identifikasi Rute Terpopuler', data.brief.topRoutesAnalysis],
    ...data.brief.actionItems.map((item, idx) => [`Rekomendasi Tindak Lanjut #${idx + 1}`, item]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
  ];
  ws1['!cols'] = [{ wch: 36 }, { wch: 52 }, { wch: 18 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan & Brief');

  // Sheet 2: Utilisasi & OTP Bulanan + Per Unit Bus
  const sheet2Rows: (string | number)[][] = [
    ...buildKopSuratRows(
      'REKAP UTILISASI BULANAN & ON-TIME PERFORMANCE (OTP) ARMADA',
      data.periodLabel,
      data.printedDate
    ),
    ['Bulan', 'Okupansi Total (%)', 'Hari Kerja (%)', 'Akhir Pekan (%)', 'Total Trip', 'Penumpang', 'OTP (%)', 'Rata-Rata Delay (Menit)', 'No-Show (%)'],
    ...data.monthlySeries.map((m) => [
      m.fullMonth,
      m.occupancy,
      m.weekdayOccupancy,
      m.weekendOccupancy,
      m.trips,
      m.passengers,
      m.onTimeRate,
      m.avgDelayMins,
      m.noShowRate,
    ]),
    [''],
    ['KINERJA PER UNIT ARMADA BUS CITY TOUR'],
    ['Kode Unit', 'Nama Bus', 'Trip Selesai', 'On-Time Performance (%)', 'Rata-Rata Delay (Menit)', 'Lulus Ramp Check (%)'],
    ...data.busOtpSeries.map((b) => [
      b.code,
      b.unitName,
      b.tripsCompleted,
      b.onTimePercent,
      b.avgDelayMins,
      b.rampCheckPassRate,
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
  ];
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Utilisasi & OTP');

  // Sheet 3: Tren Kategori Pemohon (TK, SD, SMP, SMA, Mahasiswa, Umum)
  const sheet3Rows: (string | number)[][] = [
    ...buildKopSuratRows(
      'TREN KATEGORI PEMOHON LAYANAN BUS CITY TOUR SIDOARJO',
      data.periodLabel,
      data.printedDate
    ),
    ['Bulan', 'TK', 'SD', 'SMP', 'SMA', 'Mahasiswa', 'Umum (Komunitas & UMKM)', 'Total Trip'],
    ...data.applicantTrend.map((r) => [
      r.month,
      r.TK,
      r.SD,
      r.SMP,
      r.SMA,
      r.Mahasiswa,
      r.Umum,
      r.TK + r.SD + r.SMP + r.SMA + r.Mahasiswa + r.Umum,
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
  ws3['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
  ];
  ws3['!cols'] = [
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Tren Pemohon TK-Umum');

  // Sheet 4: Rekap Transaksi Peminjaman Bus
  const sheet4Rows: (string | number)[][] = [
    ...buildKopSuratRows(
      'DAFTAR TRANSAKSI PEMINJAMAN BUS CITY TOUR (DOLAN DARJO)',
      data.periodLabel,
      data.printedDate
    ),
    ['Kode Booking', 'Tanggal Trip', 'Jam Jemput', 'Instansi / Komunitas', 'Segmen', 'Rute ODL', 'Peserta', 'Status', 'Peringatan Akses'],
    ...data.bookings.map((b) => [
      b.bookingCode,
      b.tripDate,
      b.pickupTime,
      b.organizationName,
      b.segment,
      b.routeName,
      b.participantCount,
      b.status,
      b.hasAccessWarning ? 'Drop-off Khusus' : 'Aman Bus Besar',
    ]),
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Rows);
  ws4['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
  ];
  ws4['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 32 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Rekap Transaksi ODL');

  const safePeriod = data.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `Laporan_Analytics_DOLAN_DARJO_${safePeriod}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
