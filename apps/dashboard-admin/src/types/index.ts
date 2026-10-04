export type Dashboard =
  | "Publik"
  | "Kementerian"
  | "Bank"
  | "Auditor"
  | "Institusi Pendidikan";

export type Jenjang = "PAUD" | "TK" | "SD" | "SMP" | "SMA" | "SMK" | "S1";

export type KementerianPembina =
  | "Kemendikdasmen"
  | "Kemenag"
  | "Kemendiktisaintek"
  | "Lainnya";

export type BankHimbara = "BRI" | "BNI" | "Mandiri" | "BTN";

export type UserStatus = "aktif" | "nonaktif" | "menunggu";

export type AdminRole =
  | "super_admin"
  | "ops_admin"
  | "admin_kementerian"
  | "admin_wilayah"
  | "admin_satuan";

export type ScopeType =
  | "global"
  | "kementerian"
  | "provinsi"
  | "kabupaten_kota"
  | "satuan";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  scopeType: ScopeType;
  scopeId?: string; // e.g. "Kemenag", "Lampung", "Kabupaten Pesawaran", "MIN 1 Pesawaran"
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface InstitutionMaster {
  id: string;
  npsn: string;
  namaSatuan: string;
  jenjang: Jenjang;
  kementerianPembina: KementerianPembina;
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  status: "aktif" | "nonaktif";
  createdAt?: string;
}

export interface PlatformUser {
  id: string;
  dashboard: Dashboard;
  institutionId?: string;
  institutionName?: string;
  npsn?: string;
  bankName?: BankHimbara;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  invitedBy?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorScope: string;
  actorDashboard: Dashboard | "Admin";
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  ipAddress?: string;
  createdAt: string;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  type: "APBN" | "APBD" | "CSR";
  provinsi: string;
  status: "sinkron" | "tertunda" | "gagal";
  lastSyncAt: string;
  recordsCount: number;
  endpointUrl?: string;
  errorMessage?: string;
}

export interface AiFaaFlag {
  id: string;
  transactionId: string;
  institutionName?: string;
  npsn?: string;
  amount?: number;
  reason: string;
  severity: "rendah" | "sedang" | "tinggi";
  status: "baru" | "ditinjau" | "selesai";
  reviewedBy?: string;
  reviewNotes?: string;
  matchedBankMutationId?: string;
  createdAt: string;
}

export interface BankMutation {
  id: string;
  bankName: BankHimbara;
  regency: string; // Kabupaten / Kota
  province: string;
  institutionName: string;
  amount: number;
  transactionType: "debit" | "kredit";
  transactionDate: string;
  matchStatus: "cocok" | "tidak cocok" | "menunggu";
  transactionId: string;
  accountNumberMasked?: string;
  accountNumberFull?: string;
  matchedDataSourceId?: string;
  description?: string;
  isNew?: boolean;
}

export interface BankApiConfig {
  bankName: BankHimbara;
  bankFullName: string;
  isActive: boolean;
  isPrimaryDefault: boolean;
  apiEndpoint: string;
  authType: "OAuth 2.0" | "API Key (mTLS)";
  lastSyncAt?: string;
  activeSchoolsCount: number;
  statusDescription: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  webhookUrl?: string;
  apiTimeoutMs?: number;
  customHeaders?: string;
  defaultQueryParams?: string;
}


export interface SystemHealth {
  service: string;
  port: number;
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  uptime: string;
  errorRate: string;
  lastChecked: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  targetDashboards: Dashboard[];
  targetRoles: string[];
  urgency: "normal" | "penting" | "mendesak";
  sentBy: string;
  sentAt: string;
  deliveredCount: number;
}

export interface ModulePermission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermissions {
  role: AdminRole;
  roleTitle: string;
  scopeLabel: string;
  permissions: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
}

export interface RegionalAuditSetting {
  provinceId: string;
  provinceName: string;
  isAuditActive: boolean;
  anomalyCount: number;
  lastScanTime: string;
}

export interface NlToSqlQueryLog {
  id: string;
  userPrompt: string;
  generatedSql: string;
  astGuardrailPassed: boolean;
  piiMasked: boolean;
  maskedFields: string[];
  executionTimeMs: number;
  queriedAt: string;
  executedBy: string;
}

export interface PolsekApiConfig {
  provider: "google_places" | "osm_overpass" | "polri_presisi" | "custom";
  apiKey: string;
  endpointUrl: string;
  radiusKm: number;
  emergencyHotline: string;
  isActive: boolean;
  fallbackOffline: boolean;
  autoDispatchAlert: boolean;
  updatedAt?: string;
}

export interface PolsekInfo {
  id: string;
  nama: string;
  polres: string;
  polda: string;
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  alamat: string;
  telepon: string;
  hotline: string;
  latitude: number;
  longitude: number;
  jarakKm?: number;
  mapsUrl?: string;
  statusSiaga: string;
}

export interface SchoolsApiConfig {
  provider: "dapodik" | "pddikti" | "satudata" | "emis" | "local_db";
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  endpointUrl: string;
  jenjangScope: string[];
  statusScope: "all" | "negeri" | "swasta";
  syncInterval: "realtime" | "daily" | "weekly" | "manual";
  isActive: boolean;
  fallbackOffline: boolean;
  autoValidateNpsn: boolean;
  updatedAt?: string;
}

export interface SchoolSearchResult {
  id: string;
  npsn: string;
  namaSatuan: string;
  jenjang: Jenjang;
  kementerianPembina: KementerianPembina;
  statusKepemilikan: "Negeri" | "Swasta";
  akreditasi?: string;
  alamat?: string;
  kecamatan?: string;
  kabupatenKota?: string;
  provinsi?: string;
  totalSiswa?: number;
  lastSyncAt?: string;
}

export type BpkBpkpProvider = "bpk_eaudit" | "bpkp_siswaskau" | "simda_keuangan" | "custom_audit";

export interface BpkBpkpApiConfig {
  provider: BpkBpkpProvider;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  endpointUrl: string;
  instansiScope: "nasional" | "kementerian" | "daerah_provinsi" | "daerah_kabkota";
  syncMode: "realtime_push" | "batch_scheduled" | "on_demand_investigation";
  isActive: boolean;
  autoReportAnomalies: boolean;
  includeAuditTrail: boolean;
  encryptionMode: "TLS_1_3_HMAC" | "ASYMMETRIC_RSA2048";
  emergencyHotline?: string;
  updatedAt?: string;
}

export interface BpkBpkpOffice {
  id: string;
  lembaga: "BPK RI" | "BPKP RI";
  namaKantor: string;
  wilayah: string;
  provinsi: string;
  alamat: string;
  telepon: string;
  email: string;
  hotlinePengaduan: string;
  statusKoneksi: "Terhubung" | "Siaga" | "Maintenance";
  portalUrl: string;
}

export interface RealConnectionDiagnostics {
  isRealLive: boolean;
  targetUrl: string;
  resolvedIp?: string | null;
  httpStatus?: number | null;
  httpStatusText?: string | null;
  latencyMs: number;
  tlsProtocol?: string | null;
  tlsCipher?: string | null;
  certIssuer?: string | null;
  certValidTo?: string | null;
  serverBanner?: string | null;
  checkedAt: string;
  networkError?: string | null;
  rawDetails?: string | null;
}

export interface BpkBpkpAuditTestResult {
  success: boolean;
  latencyMs: number;
  provider: BpkBpkpProvider;
  referenceNo: string;
  timestamp: string;
  blockHashProof: string;
  message: string;
  auditScope: string;
  timPemeriksa: string;
  statusLhp: string;
  anomaliDetected: number;
  diagnostics?: RealConnectionDiagnostics;
}

export type KpkProvider = "kpk_jaga" | "kpk_wbs" | "kpk_elhkpn" | "custom_kpk";

export interface KpkApiConfig {
  provider: KpkProvider;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  endpointUrl: string;
  instansiScope: "nasional" | "kementerian" | "daerah_provinsi" | "daerah_kabkota";
  syncMode: "realtime_push" | "batch_scheduled" | "on_demand_investigation";
  isActive: boolean;
  autoReportAnomalies: boolean;
  includeAuditTrail: boolean;
  encryptionMode: "TLS_1_3_HMAC" | "ASYMMETRIC_RSA2048";
  emergencyHotline?: string;
  updatedAt?: string;
}

export interface KpkChannel {
  id: string;
  lembaga: "KPK RI";
  namaKanal: string;
  bidang: "Pencegahan & Monitoring" | "Pengaduan Masyarakat (Dumas)" | "LHKPN & Gratifikasi" | "Koordinasi Supervisi";
  wilayah: string;
  alamat: string;
  telepon: string;
  email: string;
  callCenter: string;
  statusKoneksi: "Terhubung" | "Siaga" | "Maintenance";
  portalUrl: string;
}

export interface KpkAuditTestResult {
  success: boolean;
  latencyMs: number;
  provider: KpkProvider;
  referenceNo: string;
  timestamp: string;
  blockHashProof: string;
  message: string;
  auditScope: string;
  unitPenerima: string;
  statusPenanganan: string;
  anomaliDetected: number;
  diagnostics?: RealConnectionDiagnostics;
}

export type KejaksaanProvider = "kejaksaan_cms_pidsus" | "kejaksaan_halojpn" | "kejaksaan_pps_intel" | "custom_kejaksaan";

export interface KejaksaanApiConfig {
  provider: KejaksaanProvider;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  endpointUrl: string;
  instansiScope: "nasional" | "kejati_provinsi" | "kejari_kabkota" | "kementerian";
  syncMode: "realtime_push" | "batch_scheduled" | "on_demand_investigation";
  isActive: boolean;
  autoReportAnomalies: boolean;
  includeAuditTrail: boolean;
  encryptionMode: "TLS_1_3_HMAC" | "ASYMMETRIC_RSA2048";
  emergencyHotline?: string;
  updatedAt?: string;
}

export interface KejaksaanOffice {
  id: string;
  lembaga: "Kejaksaan RI";
  satker: "Kejaksaan Agung" | "Kejaksaan Tinggi" | "Kejaksaan Negeri";
  namaKantor: string;
  wilayah: string;
  provinsi: string;
  alamat: string;
  telepon: string;
  email: string;
  hotlinePengaduan: string;
  statusKoneksi: "Terhubung" | "Siaga" | "Maintenance";
  portalUrl: string;
}

export interface KejaksaanAuditTestResult {
  success: boolean;
  latencyMs: number;
  provider: KejaksaanProvider;
  referenceNo: string;
  timestamp: string;
  blockHashProof: string;
  message: string;
  auditScope: string;
  bidangPenerima: string;
  statusTelaah: string;
  anomaliDetected: number;
  diagnostics?: RealConnectionDiagnostics;
}



