export type NavTabId =
  | 'dashboard'
  | 'peminjaman'
  | 'rute-odl'
  | 'peta-webar'
  | 'mitra'
  | 'maintenance'
  | 'analytics'
  | 'pengaturan';

export type BusStatus = 'Tersedia' | 'Terjadwal' | 'Beroperasi' | 'Maintenance';

export type ApplicantSegment =
  | 'TK/PAUD'
  | 'SD'
  | 'SMP/SMA'
  | 'Mahasiswa'
  | 'Komunitas'
  | 'Mitra UMKM';

export type BookingStatus =
  | 'Diajukan'
  | 'Verifikasi Berkas'
  | 'Rute Disetujui'
  | 'Terbit E-Ticket'
  | 'Sedang Berjalan'
  | 'Selesai'
  | 'Ditolak'
  | 'No-Show';

export type TicketPriority = 'Ringan' | 'Sedang' | 'Kritis / Stop Operasi';
export type TicketStatus = 'Terbuka' | 'Dalam Perbaikan' | 'Selesai';

export type UserRole =
  | 'Super Admin (Pranata Komputer)'
  | 'Approver (Pimpinan Disporapar)'
  | 'Operator / Verifikator'
  | 'Kru / Pengemudi Bus'
  | 'Pemohon Masyarakat';

export interface BusUnit {
  id: string;
  code: string;
  plateNumber: string;
  unitName: string;
  seatCapacity: number;
  year: number;
  driverName: string;
  driverPhone: string;
  odometerKm: number;
  facilities: string[];
  status: BusStatus;
  lastInspectionDate: string;
  currentTripRoute?: string;
  imageUrl?: string;
}

export interface Destination {
  id: string;
  name: string;
  category: 'Sejarah' | 'Edukasi' | 'UMKM' | 'Alam' | 'Olahraga';
  district: string;
  latitude: number;
  longitude: number;
  mapX: number; // 0-100 percentage on Sidoarjo coordinate map
  mapY: number; // 0-100 percentage on Sidoarjo coordinate map
  busAccessible: boolean;
  roadConstraintNote?: string;
  recommendedDropOff?: string;
  parkingNote: string;
  avgDurationMins: number;
  distanceFromAlunKm: number;
  bearingDeg: number;
  shortNarrative: string;
  photoSpotTip: string;
  umkmHighlight?: string;
  visitCountMonth: number;
  imageUrl?: string;
}

export interface OdlPackage {
  id: string;
  packageName: string;
  theme: string;
  targetSegments: ApplicantSegment[];
  totalDurationHours: number;
  description: string;
  stopIds: string[];
  isActive: boolean;
  popularityPercent: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  applicantName: string;
  organizationName: string;
  phoneWa: string;
  segment: ApplicantSegment;
  busId: string;
  odlPackageId: string | null;
  routeName: string;
  stopIds: string[];
  tripDate: string; // YYYY-MM-DD
  pickupTime: string;
  endTime: string;
  pickupAddress: string;
  participantCount: number;
  letterFileName: string;
  manifestFileName: string;
  status: BookingStatus;
  isUrgentH3: boolean;
  hasAccessWarning: boolean;
  accessWarningNote?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  actualParticipants?: number;
  createdAt: string;
  notes?: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketCode: string;
  busId: string;
  reportedBy: string;
  issueDesc: string;
  priority: TicketPriority;
  status: TicketStatus;
  startDate: string;
  endDate?: string;
  workshopName: string;
  estimatedCostRp: number;
  repairNote: string;
}

export interface PartnerOrganization {
  id: string;
  name: string;
  type: 'Mitra Binaan UMKM' | 'Komunitas Pemuda/Olahraga' | 'Institusi Pendidikan';
  segment: ApplicantSegment;
  district: string;
  picName: string;
  phoneWa: string;
  totalTrips: number;
  noShowCount: number;
  verifiedStatus: 'Terverifikasi' | 'Menunggu Verifikasi';
  featuredProducts?: string[];
  lastTripDate: string;
}

export interface InspectionRecord {
  id: string;
  busId: string;
  inspectorName: string;
  inspectedAt: string;
  checklist: {
    engine: boolean;
    brakes: boolean;
    ac: boolean;
    tires: boolean;
    firstAid: boolean;
    cabinClean: boolean;
    audioGuide: boolean;
  };
  conditionStatus: 'Laik Jalan' | 'Perlu Perhatian' | 'Tidak Laik';
  notes: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  detail: string;
}
