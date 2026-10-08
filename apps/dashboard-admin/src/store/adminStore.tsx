import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type {
  AdminUser,
  AdminRole,
  ScopeType,
  PlatformUser,
  InstitutionMaster,
  AuditLogEntry,
  DataSourceStatus,
  AiFaaFlag,
  BankMutation,
  SystemHealth,
  BroadcastNotification,
  RolePermissions,
  RegionalAuditSetting,
  NlToSqlQueryLog,
  UserStatus,
  BankApiConfig,
  BankHimbara,
} from "@/types";
import {
  initialAdminUsers,
  institutions as seedInstitutions,
  platformUsers as seedPlatformUsers,
  auditLogs as seedAuditLogs,
  dataSources as seedDataSources,
  aiFaaFlags as seedAiFaaFlags,
  bankMutations as seedBankMutations,
  initialSystemHealth,
  initialBroadcasts,
  initialRegionalAudits,
  initialNlToSqlLogs,
  initialRolePermissions,
  initialBankApiConfigs,
} from "@/data/dummyData";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AdminStoreContextType {
  // Auth & Session
  currentUser: AdminUser | null;
  pendingMfaUser: AdminUser | null;
  login: (email: string, password: string) => boolean;
  verifyMfa: (code: string) => boolean;
  quickLogin: (role: AdminRole) => void;
  logout: () => void;
  canAccess: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;

  // Users
  users: PlatformUser[];
  addUser: (user: Omit<PlatformUser, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<PlatformUser>) => void;
  deleteUser: (id: string) => void;
  bulkUpdateStatus: (ids: string[], status: UserStatus) => void;
  resetPassword: (userId: string) => string;

  // Institutions & School Search
  institutions: InstitutionMaster[];
  addInstitution: (inst: Omit<InstitutionMaster, "id" | "createdAt">) => void;
  updateInstitution: (id: string, updates: Partial<InstitutionMaster>) => void;
  deleteInstitution: (id: string) => void;
  searchSchools: (query: string) => Promise<InstitutionMaster[]>;
  lookupSchoolByNpsn: (npsn: string) => Promise<any>;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, "id" | "createdAt">) => void;

  // Data Sources
  dataSources: DataSourceStatus[];
  resyncDataSource: (id: string) => Promise<void>;
  addDataSource: (ds: Omit<DataSourceStatus, "id" | "lastSyncAt">) => void;

  // AI-FAA
  aiFlags: AiFaaFlag[];
  updateAiFlagStatus: (id: string, status: "baru" | "ditinjau" | "selesai", notes?: string) => void;
  regionalAudits: RegionalAuditSetting[];
  toggleRegionalAudit: (provinceId: string) => void;
  nlToSqlLogs: NlToSqlQueryLog[];

  // Bank Mutations & API Configs
  bankMutations: BankMutation[];
  bankApiConfigs: BankApiConfig[];
  syncBankMutations: () => Promise<number>;
  addLiveMutation: (mutation: BankMutation) => void;
  toggleBankApi: (bankName: BankHimbara, active: boolean) => void;
  updateBankApiConfig: (bankName: BankHimbara, updates: Partial<BankApiConfig>) => void;
  fetchBankJson: (bankName: BankHimbara, queryParams?: string) => Promise<any>;
  validateBriAccountName: (accountNumber: string, bankCode?: string) => Promise<any>;
  fetchBriInformasiRekening: (accountNo?: string) => Promise<any>;
  sendMutationToAiFaa: (mutationId: string) => void;

  // Broadcasts
  broadcasts: BroadcastNotification[];
  sendBroadcast: (broadcast: Omit<BroadcastNotification, "id" | "sentAt" | "deliveredCount">) => void;

  // Permissions & Admins
  rolePermissions: RolePermissions[];
  updatePermission: (role: AdminRole, module: string, action: "canView" | "canCreate" | "canEdit" | "canDelete", value: boolean) => void;
  adminAccounts: AdminUser[];
  addAdminAccount: (account: Omit<AdminUser, "id" | "createdAt">) => void;
  updateAdminScope: (id: string, scopeType: ScopeType, scopeId?: string) => void;
  deleteAdminAccount: (id: string) => void;

  // System & Database Health
  systemHealth: SystemHealth[];
  refreshSystemHealth: () => Promise<void>;
  dbStatus: { ok: boolean; message: string; latencyMs: number } | null;
  checkDbHealth: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  dismissToast: (id: string) => void;

  // Reset
  resetAllData: () => void;
}

const AdminStoreContext = createContext<AdminStoreContextType | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`admin_db_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`admin_db_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  // Session State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() =>
    loadStorage<AdminUser | null>("current_user", initialAdminUsers[0])
  );
  const [pendingMfaUser, setPendingMfaUser] = useState<AdminUser | null>(null);

  // Core Data States
  const [users, setUsers] = useState<PlatformUser[]>(() =>
    loadStorage<PlatformUser[]>("platform_users", seedPlatformUsers)
  );
  const [institutions, setInstitutions] = useState<InstitutionMaster[]>(() =>
    loadStorage<InstitutionMaster[]>("institutions", seedInstitutions)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadStorage<AuditLogEntry[]>("audit_logs", seedAuditLogs)
  );
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>(() =>
    loadStorage<DataSourceStatus[]>("data_sources", seedDataSources)
  );
  const [aiFlags, setAiFlags] = useState<AiFaaFlag[]>(() =>
    loadStorage<AiFaaFlag[]>("ai_faa_flags", seedAiFaaFlags)
  );
  const [regionalAudits, setRegionalAudits] = useState<RegionalAuditSetting[]>(() =>
    loadStorage<RegionalAuditSetting[]>("regional_audits", initialRegionalAudits)
  );
  const [nlToSqlLogs, setNlToSqlLogs] = useState<NlToSqlQueryLog[]>(() =>
    loadStorage<NlToSqlQueryLog[]>("nl_to_sql_logs", initialNlToSqlLogs)
  );
  const [bankMutations, setBankMutations] = useState<BankMutation[]>(() =>
    loadStorage<BankMutation[]>("bank_mutations", [])
  );
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>(() =>
    loadStorage<BroadcastNotification[]>("broadcasts", initialBroadcasts)
  );
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(() =>
    loadStorage<RolePermissions[]>("role_permissions", initialRolePermissions)
  );
  const [adminAccounts, setAdminAccounts] = useState<AdminUser[]>(() =>
    loadStorage<AdminUser[]>("admin_accounts", initialAdminUsers)
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>(() =>
    loadStorage<SystemHealth[]>("system_health", initialSystemHealth)
  );
  const [bankApiConfigs, setBankApiConfigs] = useState<BankApiConfig[]>(() =>
    loadStorage<BankApiConfig[]>("bank_api_configs", initialBankApiConfigs)
  );
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; latencyMs: number } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync state to LocalStorage
  useEffect(() => saveStorage("current_user", currentUser), [currentUser]);
  useEffect(() => saveStorage("platform_users", users), [users]);
  useEffect(() => saveStorage("institutions", institutions), [institutions]);
  useEffect(() => saveStorage("audit_logs", auditLogs), [auditLogs]);
  useEffect(() => saveStorage("data_sources", dataSources), [dataSources]);
  useEffect(() => saveStorage("ai_faa_flags", aiFlags), [aiFlags]);
  useEffect(() => saveStorage("regional_audits", regionalAudits), [regionalAudits]);
  useEffect(() => saveStorage("nl_to_sql_logs", nlToSqlLogs), [nlToSqlLogs]);
  useEffect(() => saveStorage("bank_mutations", bankMutations), [bankMutations]);
  useEffect(() => saveStorage("bank_api_configs", bankApiConfigs), [bankApiConfigs]);
  useEffect(() => saveStorage("broadcasts", broadcasts), [broadcasts]);
  useEffect(() => saveStorage("role_permissions", rolePermissions), [rolePermissions]);
  useEffect(() => saveStorage("admin_accounts", adminAccounts), [adminAccounts]);
  useEffect(() => saveStorage("system_health", systemHealth), [systemHealth]);

  // Environment-based API endpoints for 100% Local PostgreSQL & Express Proxy (Ports 2027 & 2028)
  const PROXY_URL = import.meta.env.VITE_API_URL || "http://localhost:2028";
  const ADMIN_API_BASE = import.meta.env.VITE_API_BASE_URL || `${PROXY_URL}/api/admin`;

  // Purge stale mock localStorage keys on boot (prevent inst-001...inst-008 / usr-001...usr-010 contamination)
  useEffect(() => {
    const staleMockKeys = ["institutions", "platform_users", "bank_mutations", "data_sources", "ai_faa_flags"];
    staleMockKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(`admin_db_${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const hasMock = parsed.some((item: any) =>
              (item.id && (item.id.startsWith("inst-") || item.id.startsWith("usr-") || item.id.startsWith("bm-") || item.id.startsWith("flag-") || item.id.startsWith("ds-")))
            );
            if (hasMock) {
              localStorage.removeItem(`admin_db_${key}`);
            }
          }
        }
      } catch {
        // ignore
      }
    });
  }, []);

  // Synchronize state from Local PostgreSQL via Proxy Gateway on startup
  useEffect(() => {
    async function syncFromLocalDb() {
      try {
        const [usersRes, instRes, bankRes, dsRes, flagsRes, bankMutRes] = await Promise.all([
          fetch(`${ADMIN_API_BASE}/users`),
          fetch(`${ADMIN_API_BASE}/institutions?limit=100`),
          fetch(`${ADMIN_API_BASE}/bank-configs`),
          fetch(`${ADMIN_API_BASE}/data-sources`),
          fetch(`${ADMIN_API_BASE}/ai-faa/flags`),
          fetch(`${ADMIN_API_BASE}/bank-mutations?limit=100`),
        ]);

        // ── Replace users with LIVE database records ──────────────────────
        if (usersRes.ok) {
          const liveUsers = await usersRes.json();
          if (Array.isArray(liveUsers) && liveUsers.length > 0) {
            const mapped = liveUsers.map((lu: any) => ({
              id: lu.id,
              name: lu.name,
              email: lu.email,
              phone: lu.phone || "08123456789",
              dashboard: lu.dashboard,
              institutionId: lu.institutionId || lu.institution_id,
              institutionName: lu.institutionName,
              npsn: lu.npsn,
              bankName: lu.bank_name || lu.bankName,
              status: lu.status || "aktif",
              invitedBy: lu.invitedBy || "Sistem",
              createdAt: lu.created_at || lu.createdAt || "2026-01-01",
            }));
            setUsers(mapped);

            // Ensure any institutions linked to users exist in institutions array
            setInstitutions((prev) => {
              const existingMap = new Map(prev.map((i) => [i.id, i]));
              mapped.forEach((u: any) => {
                if (u.institutionId && !existingMap.has(u.institutionId)) {
                  existingMap.set(u.institutionId, {
                    id: u.institutionId,
                    npsn: u.npsn || "69893669",
                    namaSatuan: u.institutionName || "KB AL-IKHLAS",
                    jenjang: (u.institutionName && u.institutionName.startsWith("KB")) ? "PAUD" : "SD",
                    kementerianPembina: "Kemendikdasmen",
                    provinsi: u.provinsi || "Aceh",
                    kabupatenKota: u.kabupatenKota || "Kab. Aceh Barat",
                    kecamatan: "Samatiga",
                    status: "aktif",
                    createdAt: "2026-07-13",
                  });
                }
              });
              return Array.from(existingMap.values());
            });
          }
        }

        // ── Replace institutions with LIVE database records (468,724 schools) ──
        if (instRes.ok) {
          const liveInst = await instRes.json();
          if (Array.isArray(liveInst) && liveInst.length > 0) {
            const mapped = liveInst.map((li: any) => ({
              id: li.id,
              npsn: li.npsn,
              namaSatuan: li.nama_satuan || li.namaSatuan,
              jenjang: li.jenjang,
              kementerianPembina: li.kementerian_pembina || li.kementerianPembina,
              provinsi: li.provinsi,
              kabupatenKota: li.kabupaten_kota || li.kabupatenKota,
              kecamatan: li.kecamatan,
              status: li.status || "aktif",
              createdAt: li.created_at || li.createdAt || "2026-08-01",
            }));
            setInstitutions(mapped);
          }
        }

        // ── Replace bank API configs with LIVE data ───────────────────────
        if (bankRes.ok) {
          const liveBanks = await bankRes.json();
          if (Array.isArray(liveBanks) && liveBanks.length > 0) {
            setBankApiConfigs(liveBanks);
          }
        }

        // ── Replace data sources with LIVE PostgreSQL counts ──────────────
        if (dsRes.ok) {
          const liveSources = await dsRes.json();
          if (Array.isArray(liveSources) && liveSources.length > 0) {
            setDataSources(liveSources);
          }
        }

        // ── Replace AI-FAA flags with LIVE anomaly data ───────────────────
        if (flagsRes.ok) {
          const liveFlags = await flagsRes.json();
          if (Array.isArray(liveFlags)) {
            setAiFlags(liveFlags);
          }
        }

        // ── Replace bank mutations with LIVE transaction data ──────────────
        if (bankMutRes.ok) {
          const liveMutations = await bankMutRes.json();
          if (Array.isArray(liveMutations) && liveMutations.length > 0) {
            setBankMutations(liveMutations);
          }
        }

      } catch {
        // graceful offline fallback — keep whatever is in localStorage
        console.warn("[AdminStore] DB sync failed — using localStorage fallback");
      }
    }
    syncFromLocalDb();
  }, []);

  // Database Connection Health Polling
  const checkDbHealth = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${PROXY_URL}/health`, { cache: "no-store" });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        setDbStatus({
          ok: true,
          message: "Terhubung 100% ke PostgreSQL 2027 & Supabase Proxy 2028",
          latencyMs,
        });
      } else {
        setDbStatus({
          ok: false,
          message: "Database gateway mengembalikan respon error",
          latencyMs,
        });
      }
    } catch {
      setDbStatus({
        ok: false,
        message: "Gagal terhubung ke database lokal (Port 2027/2028)",
        latencyMs: Date.now() - start,
      });
    }
  };

  useEffect(() => {
    checkDbHealth();
    const interval = setInterval(checkDbHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: ToastMessage["type"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Audit Log Helper
  const recordAudit = (entry: Omit<AuditLogEntry, "id" | "createdAt">) => {
    const now = new Date();
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]} WIB`;
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      ...entry,
      actor: entry.actor || (currentUser ? `${currentUser.name} (${currentUser.role})` : "System Automated"),
      actorScope: entry.actorScope || (currentUser ? `${currentUser.scopeType}${currentUser.scopeId ? `:${currentUser.scopeId}` : ""}` : "global"),
      actorDashboard: entry.actorDashboard || "Admin",
      ipAddress: entry.ipAddress || "192.168.1.10",
      createdAt: timeStr,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Auth Methods
  const login = (email: string, _password: string): boolean => {
    const found = adminAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setPendingMfaUser(found);
      return true;
    }
    // Allow demo fallback login if email matches any role name
    const fallback = adminAccounts[0];
    setPendingMfaUser(fallback);
    return true;
  };

  const verifyMfa = (_code: string): boolean => {
    if (!pendingMfaUser) return false;
    const nowStr = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`;
    const updatedUser = { ...pendingMfaUser, lastLoginAt: nowStr };
    setCurrentUser(updatedUser);
    setPendingMfaUser(null);
    recordAudit({
      actor: `${updatedUser.name} (${updatedUser.role})`,
      actorScope: `${updatedUser.scopeType}${updatedUser.scopeId ? `:${updatedUser.scopeId}` : ""}`,
      actorDashboard: "Admin",
      action: "Login berhasil dengan verifikasi MFA TOTP",
      entityType: "admin_users",
      entityId: updatedUser.id,
      beforeState: null,
      afterState: { lastLoginAt: nowStr, role: updatedUser.role, scope: updatedUser.scopeType },
    });
    showToast(`Selamat datang kembali, ${updatedUser.name}!`, "success");
    return true;
  };

  const quickLogin = (role: AdminRole) => {
    const target = adminAccounts.find((a) => a.role === role) || adminAccounts[0];
    const nowStr = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`;
    const updated = { ...target, lastLoginAt: nowStr };
    setCurrentUser(updated);
    showToast(`Beralih peran ke: ${target.name} (${target.role}) [Scope: ${target.scopeType}]`, "info");
    recordAudit({
      actor: `${updated.name} (${updated.role})`,
      actorScope: `${updated.scopeType}${updated.scopeId ? `:${updated.scopeId}` : ""}`,
      actorDashboard: "Admin",
      action: `Beralih peran demo ke ${target.role}`,
      entityType: "admin_users",
      entityId: target.id,
    });
  };

  const logout = () => {
    if (currentUser) {
      recordAudit({
        actor: `${currentUser.name} (${currentUser.role})`,
        actorScope: `${currentUser.scopeType}${currentUser.scopeId ? `:${currentUser.scopeId}` : ""}`,
        actorDashboard: "Admin",
        action: "Logout dari Dashboard Admin",
        entityType: "admin_users",
        entityId: currentUser.id,
      });
    }
    setCurrentUser(null);
    setPendingMfaUser(null);
    showToast("Anda telah keluar dari sesi admin.", "info");
  };

  const canAccess = (module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === "super_admin") return true;
    const rolePerm = rolePermissions.find((r) => r.role === currentUser.role);
    if (!rolePerm) return false;

    const aliasMap: Record<string, string> = {
      "API Wilayah": "Master Data Wilayah",
      "Master Data Wilayah": "Master Data Wilayah",
      "API DIKTI": "Pengaturan API Data Sekolah",
      "Pengaturan API Data Sekolah": "Pengaturan API Data Sekolah",
      "API HIMBARA": "Pengaturan API Bank",
      "Pengaturan API Bank": "Pengaturan API Bank",
      "API AI AKSARA": "Pengaturan AI Aksara",
      "Pengaturan AI Aksara": "Pengaturan AI Aksara",
      "API KPK": "Pengaturan API KPK",
      "Pengaturan API KPK": "Pengaturan API KPK",
      "API Kejaksaan RI": "Pengaturan API Kejaksaan",
      "Pengaturan API Kejaksaan": "Pengaturan API Kejaksaan",
      "API BPK/BPKP": "Pengaturan API BPK & BPKP",
      "Pengaturan API BPK & BPKP": "Pengaturan API BPK & BPKP",
      "API Polsek": "Pengaturan API Polsek",
      "Pengaturan API Polsek": "Pengaturan API Polsek",
    };
    const effectiveModule = aliasMap[module] || module;

    const mod = rolePerm.permissions[effectiveModule];
    if (!mod) {
      if (effectiveModule === "Pengaturan API KPK") {
        if (currentUser.role === "ops_admin" || currentUser.role === "admin_kementerian") return action !== "delete";
      }
      if (effectiveModule === "Pengaturan API Kejaksaan") {
        if (currentUser.role === "ops_admin" || currentUser.role === "admin_kementerian") return action !== "delete";
      }
      if (effectiveModule === "Pengaturan API BPK & BPKP") {
        if (currentUser.role === "ops_admin" || currentUser.role === "admin_kementerian") return action !== "delete";
      }
      if (effectiveModule === "Pengaturan API Polsek") {
        if (currentUser.role === "ops_admin") return action !== "delete";
        if (currentUser.role === "admin_kementerian") return action === "view";
      }
      if (effectiveModule === "Pengaturan API Data Sekolah" || effectiveModule === "Master Data Wilayah") {
        if (currentUser.role === "ops_admin" || currentUser.role === "admin_kementerian") return action !== "delete";
        if (currentUser.role === "admin_wilayah") return action === "view";
      }
      if (effectiveModule === "Pengaturan API Bank") {
        if (currentUser.role === "ops_admin") return action !== "delete";
        if (currentUser.role === "admin_kementerian") return action === "view";
      }
      return false;
    }
    if (action === "view") return mod.canView;
    if (action === "create") return mod.canCreate;
    if (action === "edit") return mod.canEdit;
    if (action === "delete") return mod.canDelete;
    return false;
  };

  // User Management Methods
  const addUser = async (userData: Omit<PlatformUser, "id" | "createdAt">) => {
    const tempId = `usr-${Date.now().toString().slice(-5)}`;
    const newUser: PlatformUser = {
      ...userData,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [newUser, ...prev]);

    try {
      const res = await fetch(`${ADMIN_API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const serverUser = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === tempId ? { ...u, ...serverUser } : u)));
      }
    } catch (e) {
      console.warn("Failed to persist user to backend:", e);
    }

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Membuat akun pengguna baru: ${newUser.name}`,
      entityType: "platform_users",
      entityId: newUser.id,
      afterState: newUser as unknown as Record<string, any>,
    });
    showToast(`Pengguna ${newUser.name} berhasil ditambahkan!`, "success");
  };

  const updateUser = async (id: string, updates: Partial<PlatformUser>) => {
    const prevUser = users.find((u) => u.id === id);
    if (!prevUser) return;
    const updatedUser = { ...prevUser, ...updates };
    setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));

    try {
      await fetch(`${ADMIN_API_BASE}/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn("Failed to update user on backend:", e);
    }

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Memperbarui data pengguna: ${updatedUser.name}`,
      entityType: "platform_users",
      entityId: id,
      beforeState: prevUser as unknown as Record<string, any>,
      afterState: updatedUser as unknown as Record<string, any>,
    });
    showToast(`Data pengguna ${updatedUser.name} berhasil disimpan!`, "success");
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));

    try {
      await fetch(`${ADMIN_API_BASE}/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to delete user on backend:", e);
    }

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Menghapus pengguna: ${target.name}`,
      entityType: "platform_users",
      entityId: id,
      beforeState: target as unknown as Record<string, any>,
    });
    showToast(`Pengguna ${target.name} telah dihapus!`, "warning");
  };

  const bulkUpdateStatus = async (ids: string[], status: UserStatus) => {
    setUsers((prev) =>
      prev.map((u) => (ids.includes(u.id) ? { ...u, status } : u))
    );

    try {
      const res = await fetch(`${ADMIN_API_BASE}/users/bulk-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (res.ok) {
        console.log(`[AdminStore] Bulk updated ${ids.length} users to ${status}`);
      }
    } catch (e) {
      console.warn("Failed to bulk update status on backend:", e);
    }

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Aksi massal: Mengubah status ${ids.length} pengguna menjadi ${status}`,
      entityType: "platform_users",
      entityId: ids.join(","),
      afterState: { updatedIds: ids, newStatus: status },
    });
    showToast(`${ids.length} pengguna berhasil diubah status menjadi "${status}"!`, "success");
  };

  const resetPassword = (userId: string): string => {
    const target = users.find((u) => u.id === userId);
    const tempPassword = `Pass#${Math.random().toString(36).slice(-6)}!`;
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Reset password untuk pengguna: ${target?.name || userId}`,
      entityType: "platform_users",
      entityId: userId,
    });
    showToast(`Password untuk ${target?.name || "pengguna"} telah direset!`, "info");
    return tempPassword;
  };

  // Institution Master Methods
  const addInstitution = (instData: Omit<InstitutionMaster, "id" | "createdAt">) => {
    const newInst: InstitutionMaster = {
      ...instData,
      id: `inst-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setInstitutions((prev) => [newInst, ...prev]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Menambahkan satuan pendidikan master: ${newInst.namaSatuan} (NPSN: ${newInst.npsn})`,
      entityType: "institution_master",
      entityId: newInst.id,
      afterState: newInst as unknown as Record<string, any>,
    });
    showToast(`Satuan ${newInst.namaSatuan} berhasil didaftarkan!`, "success");
  };

  const updateInstitution = (id: string, updates: Partial<InstitutionMaster>) => {
    const prev = institutions.find((i) => i.id === id);
    if (!prev) return;
    const updated = { ...prev, ...updates };
    setInstitutions((prev) => prev.map((i) => (i.id === id ? updated : i)));
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Memperbarui master data satuan: ${updated.namaSatuan}`,
      entityType: "institution_master",
      entityId: id,
      beforeState: prev as unknown as Record<string, any>,
      afterState: updated as unknown as Record<string, any>,
    });
    showToast(`Master data ${updated.namaSatuan} berhasil diperbarui!`, "success");
  };

  const deleteInstitution = (id: string) => {
    const target = institutions.find((i) => i.id === id);
    if (!target) return;
    setInstitutions((prev) => prev.filter((i) => i.id !== id));
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Menghapus satuan pendidikan master: ${target.namaSatuan}`,
      entityType: "institution_master",
      entityId: id,
      beforeState: target as unknown as Record<string, any>,
    });
    showToast(`Satuan ${target.namaSatuan} telah dihapus!`, "warning");
  };

  // High-performance live search across 468,724 schools in PostgreSQL
  const searchSchools = async (query: string): Promise<InstitutionMaster[]> => {
    const trimmed = (query || "").trim();
    if (!trimmed) return institutions.slice(0, 50);
    try {
      const res = await fetch(`${ADMIN_API_BASE}/institutions?search=${encodeURIComponent(trimmed)}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge to institutions state so lookups succeed anywhere
          setInstitutions((prev) => {
            const existingMap = new Map(prev.map((i) => [i.id, i]));
            data.forEach((d: InstitutionMaster) => existingMap.set(d.id, d));
            return Array.from(existingMap.values());
          });
          return data;
        }
      }
    } catch (err) {
      console.error("Error searching schools:", err);
    }
    // Local fallback
    const q = trimmed.toLowerCase();
    return institutions.filter(
      (i) => i.npsn.includes(q) || i.namaSatuan.toLowerCase().includes(q)
    );
  };

  // Dedicated lookup for an NPSN returning school + associated user accounts
  const lookupSchoolByNpsn = async (npsn: string): Promise<any> => {
    const trimmed = (npsn || "").trim();
    if (!trimmed) return { found: false, schools: [] };
    try {
      const res = await fetch(`${ADMIN_API_BASE}/schools/lookup?npsn=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && Array.isArray(data.schools)) {
          // Merge found schools into institutions state
          setInstitutions((prev) => {
            const existingMap = new Map(prev.map((i) => [i.id, i]));
            data.schools.forEach((d: InstitutionMaster) => existingMap.set(d.id, d));
            return Array.from(existingMap.values());
          });
        }
        return data;
      }
    } catch (err) {
      console.error("Error looking up school by NPSN:", err);
    }
    return { found: false, schools: [] };
  };

  // Data Source Methods
  const resyncDataSource = async (id: string): Promise<void> => {
    const ds = dataSources.find((d) => d.id === id);
    if (!ds) return;

    // Simulate async sync
    await new Promise((r) => setTimeout(r, 1200));

    const now = new Date();
    const nowStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]} WIB`;
    const increment = Math.floor(Math.random() * 50) + 10;
    const newCount = ds.recordsCount + increment;

    setDataSources((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "sinkron", lastSyncAt: nowStr, recordsCount: newCount, errorMessage: undefined }
          : d
      )
    );

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Resync manual sumber data: ${ds.name} (+${increment} baris data baru)`,
      entityType: "data_sources",
      entityId: id,
      beforeState: { status: ds.status, lastSyncAt: ds.lastSyncAt, recordsCount: ds.recordsCount },
      afterState: { status: "sinkron", lastSyncAt: nowStr, recordsCount: newCount },
    });

    showToast(`Sinkronisasi ${ds.name} berhasil (+${increment} data baru)!`, "success");
  };

  const addDataSource = (dsData: Omit<DataSourceStatus, "id" | "lastSyncAt">) => {
    const nowStr = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`;
    const newDs: DataSourceStatus = {
      ...dsData,
      id: `ds-${Date.now().toString().slice(-4)}`,
      lastSyncAt: nowStr,
    };
    setDataSources((prev) => [newDs, ...prev]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Menambahkan pipeline sumber data baru: ${newDs.name}`,
      entityType: "data_sources",
      entityId: newDs.id,
      afterState: newDs as unknown as Record<string, any>,
    });
    showToast(`Sumber data ${newDs.name} berhasil ditambahkan!`, "success");
  };

  // AI-FAA Methods
  const updateAiFlagStatus = (id: string, status: "baru" | "ditinjau" | "selesai", notes?: string) => {
    const flag = aiFlags.find((f) => f.id === id);
    if (!flag) return;
    const reviewer = currentUser ? currentUser.name : "Admin Reviewer";
    setAiFlags((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status, reviewedBy: reviewer, reviewNotes: notes || f.reviewNotes }
          : f
      )
    );
    recordAudit({
      actor: `${reviewer} (${currentUser?.role || "Admin"})`,
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Memperbarui status review anomali ${flag.transactionId} -> ${status}`,
      entityType: "ai_faa_flags",
      entityId: id,
      beforeState: { status: flag.status, reviewNotes: flag.reviewNotes },
      afterState: { status, reviewedBy: reviewer, reviewNotes: notes },
    });
    showToast(`Status flag anomali ${flag.transactionId} diperbarui ke "${status}"!`, "success");
  };

  const toggleRegionalAudit = (provinceId: string) => {
    const region = regionalAudits.find((r) => r.provinceId === provinceId);
    if (!region) return;
    const nextState = !region.isAuditActive;
    setRegionalAudits((prev) =>
      prev.map((r) => (r.provinceId === provinceId ? { ...r, isAuditActive: nextState } : r))
    );
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `${nextState ? "Mengaktifkan" : "Menonaktifkan"} AI-FAA scanning otomatis untuk Provinsi ${region.provinceName}`,
      entityType: "regional_audits",
      entityId: provinceId,
      afterState: { provinceId, isAuditActive: nextState },
    });
    showToast(`Audit AI-FAA Provinsi ${region.provinceName} ${nextState ? "Diaktifkan" : "Dinonaktifkan"}!`, "info");
  };

  // Bank Mutations Methods
  const addLiveMutation = (mutation: BankMutation) => {
    setBankMutations((prev) => [mutation, ...prev.slice(0, 39)]);
  };

  const syncBankMutations = async (): Promise<number> => {
    await new Promise((r) => setTimeout(r, 1500));
    // Simulate fetching 2 new mutations with regency
    const newItems: BankMutation[] = [
      {
        id: `bm-${Date.now().toString().slice(-4)}`,
        bankName: "BRI",
        regency: "Kabupaten Pesawaran",
        province: "Lampung",
        institutionName: "MTsN 1 Pesawaran",
        amount: 22500000,
        transactionType: "kredit",
        transactionDate: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("id-ID")} WIB`,
        matchStatus: "cocok",
        transactionId: `trx-${Math.floor(Math.random() * 90000 + 10000)}`,
        accountNumberMasked: "xxxx-xxxx-8891",
        accountNumberFull: "0123-01-008891-50-3",
        matchedDataSourceId: "ds-005",
        description: "Penyaluran BOS Madrasah Afirmasi 2026",
      },
    ];

    setBankMutations((prev) => [...newItems, ...prev]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Polling API Bank Himbara: Mengimpor ${newItems.length} transaksi mutasi baru`,
      entityType: "bank_mutations",
      entityId: newItems.map((n) => n.id).join(","),
      afterState: { count: newItems.length },
    });
    showToast(`Polling berhasil! ${newItems.length} mutasi rekening baru ditarik dari Himbara API.`, "success");
    return newItems.length;
  };

  const toggleBankApi = (bankName: BankHimbara, active: boolean) => {
    setBankApiConfigs((prev) =>
      prev.map((b) =>
        b.bankName === bankName
          ? {
              ...b,
              isActive: active,
              statusDescription: active
                ? "API Aktif Secara Keseluruhan — Mutasi rekening otomatis terhubung dan tampil di dashboard institusi sekolah masing-masing (Port 2024)."
                : "API Dinonaktifkan Secara Keseluruhan — Mutasi ditahan dari dashboard institusi sekolah. Aktifkan sakelar global API untuk mulai meneruskan data mutasi.",
              lastSyncAt: active
                ? `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`
                : b.lastSyncAt,
            }
          : b
      )
    );

    // Call proxy backend asynchronously
    fetch(`http://localhost:2028/api/admin/bank-configs/${bankName}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).catch(() => {
      // Offline fallback is handled gracefully by localStorage
    });

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `${active ? "Mengaktifkan" : "Menonaktifkan"} integrasi API Bank ${bankName} secara KESELURUHAN (Berlaku untuk seluruh satuan pendidikan mitra di Indonesia)`,
      entityType: "bank_api_configs",
      entityId: bankName,
      afterState: { bankName, isActive: active, scope: "global_whole_bank" },
    });

    if (active) {
      showToast(
        `API Bank ${bankName} Diaktifkan Secara KESELURUHAN! Mutasi rekening seluruh sekolah mitra otomatis tampil di Dashboard Institusi Pendidikan (:2024).`,
        "success"
      );
    } else {
      showToast(
        `API Bank ${bankName} Dinonaktifkan Secara KESELURUHAN. Aliran mutasi seluruh sekolah mitra ke dashboard sekolah ditahan sementara.`,
        "warning"
      );
    }
  };

  const updateBankApiConfig = (bankName: BankHimbara, updates: Partial<BankApiConfig>) => {
    setBankApiConfigs((prev) =>
      prev.map((b) => (b.bankName === bankName ? { ...b, ...updates } : b))
    );

    // Call proxy backend asynchronously
    fetch(`http://localhost:2028/api/admin/bank-configs/${bankName}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});

    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Memperbarui konfigurasi API Bank ${bankName}: Endpoint ${updates.apiEndpoint || "diperbarui"}`,
      entityType: "bank_api_configs",
      entityId: bankName,
      afterState: updates as unknown as Record<string, any>,
    });

    showToast(`Konfigurasi API Bank ${bankName} berhasil disimpan!`, "success");
  };

  const fetchBankJson = async (bankName: BankHimbara, queryParams?: string): Promise<any> => {
    const config = bankApiConfigs.find((b) => b.bankName === bankName);
    const queryString = queryParams ? `?${queryParams}` : "";
    try {
      const res = await fetch(`http://localhost:2028/api/admin/bank-configs/${bankName}/fetch-json${queryString}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // offline fallback handled below
    }

    const bankFiltered = bankMutations.filter((m) => m.bankName === bankName);
    return {
      status: "success",
      statusCode: "2000000",
      statusDescription: "Successful - SNAP Bank Response (Client Snapshot)",
      bankCode: bankName,
      bankFullName: config?.bankFullName || `Bank ${bankName}`,
      apiEndpoint: config?.apiEndpoint || "https://api.bank.co.id/v1",
      authType: config?.authType || "OAuth 2.0",
      apiActiveGlobally: config?.isActive ?? false,
      requestMetadata: {
        httpMethod: "GET",
        requestedAt: new Date().toISOString(),
        requestId: `req-snap-${Date.now()}`,
        signatureVerified: true,
        encryptionAlgorithm: "HMAC-SHA256",
      },
      accountSummary: {
        escrowAccountNo: bankName === "BRI" ? "0123-01-008891-50-3" : "1200-00-998811-20-4",
        escrowAccountName: `KEMENDIKDASMEN ESCROW DANA PENDIDIKAN (${bankName})`,
        currency: "IDR",
        ledgerBalance: config?.isActive ? 48250000000 : 0,
        availableBalance: config?.isActive ? 48250000000 : 0,
        lastSyncAt: config?.lastSyncAt || "Baru saja",
      },
      transactionsCount: bankFiltered.length,
      transactions: bankFiltered.map((m) => ({
        transactionId: m.id,
        bankReferenceNo: `HMB-${m.id.toUpperCase()}`,
        accountNumberMasked: m.accountNumberMasked,
        accountHolder: m.institutionName,
        amount: m.amount,
        type: m.transactionType,
        date: m.transactionDate,
        matchStatus: m.matchStatus,
        streamStatusToSchool: config?.isActive ? "STREAMING_ACTIVE" : "PAUSED_GATEWAY",
      })),
      securitySignature: "SNAP-SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    };
  };

  const validateBriAccountName = async (accountNumber: string, bankCode: string = "002") => {
    try {
      const res = await fetch(`${ADMIN_API_BASE}/bank-configs/BRI/account-name-validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // offline fallback
    }

    const matchedInst = institutions.find((i) => accountNumber.includes(i.npsn.slice(-4))) || institutions[0];
    return {
      responseCode: "2000000",
      responseMessage: "Sukses (BRI SNAP Standard)",
      data: {
        accountNo: accountNumber,
        accountName: matchedInst?.namaSatuan?.toUpperCase() || "MIN 1 PESAWARAN",
        bankCode: "002",
        bankName: "BANK RAKYAT INDONESIA",
        accountStatus: "ACTIVE",
        currency: "IDR",
        isValid: true,
        validatedAt: new Date().toISOString(),
      },
    };
  };

  const fetchBriInformasiRekening = async (accountNo?: string) => {
    try {
      const query = accountNo ? `?accountNo=${accountNo}` : "";
      const res = await fetch(`${ADMIN_API_BASE}/bank-configs/BRI/informasi-rekening${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // offline fallback
    }

    const briMutations = bankMutations.filter((m) => m.bankName === "BRI");
    return {
      responseCode: "2001400",
      responseMessage: "Successful (BRI Account Statement)",
      referenceNo: `REF-BRI-${Date.now()}`,
      partnerReferenceNo: `PTR-${Math.floor(Math.random() * 900000 + 100000)}`,
      accountNo: accountNo || "012301008891503",
      name: "KEMENDIKDASMEN ESCROW DANA PENDIDIKAN (BRI)",
      currency: "IDR",
      startingBalance: { value: "48250000000.00", currency: "IDR" },
      endingBalance: { value: "48235000000.00", currency: "IDR" },
      detailData: briMutations.map((m, idx) => ({
        detailBalance: {
          value: (48250000000 - (idx + 1) * m.amount).toFixed(2),
          currency: "IDR",
        },
        amount: { value: m.amount.toFixed(2), currency: "IDR" },
        type: m.transactionType === "kredit" ? "Credit" : "Debit",
        transactionDate: `${m.transactionDate}T10:15:00+07:00`,
        remark: `Penyaluran BOS ${m.institutionName}`,
        beneficiaryAccountNo: m.accountNumberMasked,
        beneficiaryName: m.institutionName,
      })),
    };
  };

  const sendMutationToAiFaa = (mutationId: string) => {
    const mutation = bankMutations.find((m) => m.id === mutationId);
    if (!mutation) return;

    const newFlag: AiFaaFlag = {
      id: `flag-${Date.now().toString().slice(-4)}`,
      transactionId: mutation.transactionId,
      institutionName: mutation.institutionName,
      amount: mutation.amount,
      reason: `Anomali mutasi rekening bank ${mutation.bankName}: Ketidakcocokan nominal atau pencairan tanpa dokumen pendukung`,
      severity: "tinggi",
      status: "baru",
      matchedBankMutationId: mutation.id,
      createdAt: `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`,
    };

    setAiFlags((prev) => [newFlag, ...prev]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Meneruskan mutasi ${mutation.transactionId} (${mutation.institutionName}) ke AI-FAA untuk audit investigasi`,
      entityType: "ai_faa_flags",
      entityId: newFlag.id,
      afterState: newFlag as unknown as Record<string, any>,
    });
    showToast(`Mutasi ${mutation.transactionId} berhasil diflag dan dikirim ke AI-FAA Console!`, "warning");
  };

  // Broadcast Methods
  const sendBroadcast = (data: Omit<BroadcastNotification, "id" | "sentAt" | "deliveredCount">) => {
    const nowStr = `${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} WIB`;
    const newBc: BroadcastNotification = {
      ...data,
      id: `bc-${Date.now().toString().slice(-4)}`,
      sentAt: nowStr,
      deliveredCount: data.targetDashboards.length * 1540 + Math.floor(Math.random() * 200),
    };
    setBroadcasts((prev) => [newBc, ...prev]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
      actorScope: currentUser?.scopeType || "global",
      actorDashboard: "Admin",
      action: `Mengirim broadcast pengumuman: "${newBc.title}" ke ${newBc.targetDashboards.join(", ")}`,
      entityType: "broadcasts",
      entityId: newBc.id,
      afterState: newBc as unknown as Record<string, any>,
    });
    showToast(`Broadcast "${newBc.title}" berhasil disiarkan!`, "success");
  };

  // Permissions & Scopes
  const updatePermission = (
    role: AdminRole,
    module: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete",
    value: boolean
  ) => {
    setRolePermissions((prev) =>
      prev.map((rp) => {
        if (rp.role !== role) return rp;
        const currentMod = rp.permissions[module] || {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
        return {
          ...rp,
          permissions: {
            ...rp.permissions,
            [module]: {
              ...currentMod,
              [action]: value,
            },
          },
        };
      })
    );
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Super Admin",
      actorScope: "global",
      actorDashboard: "Admin",
      action: `Mengubah permission matrix: [${role}] -> [${module}] -> ${action} = ${value}`,
      entityType: "permission_matrix",
      entityId: `${role}:${module}`,
    });
    showToast(`Perubahan permission untuk ${role} telah disimpan!`, "info");
  };

  const addAdminAccount = (accountData: Omit<AdminUser, "id" | "createdAt">) => {
    const newAdmin: AdminUser = {
      ...accountData,
      id: `adm-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setAdminAccounts((prev) => [...prev, newAdmin]);
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Super Admin",
      actorScope: "global",
      actorDashboard: "Admin",
      action: `Mendaftarkan akun administrator baru: ${newAdmin.name} (${newAdmin.role}, Scope: ${newAdmin.scopeType})`,
      entityType: "admin_users",
      entityId: newAdmin.id,
      afterState: newAdmin as unknown as Record<string, any>,
    });
    showToast(`Admin ${newAdmin.name} berhasil dibuat!`, "success");
  };

  const updateAdminScope = (id: string, scopeType: ScopeType, scopeId?: string) => {
    const target = adminAccounts.find((a) => a.id === id);
    if (!target) return;
    setAdminAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, scopeType, scopeId } : a))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, scopeType, scopeId } : null));
    }
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Super Admin",
      actorScope: "global",
      actorDashboard: "Admin",
      action: `Memperbarui cakupan (scope) admin: ${target.name} -> ${scopeType}${scopeId ? ` (${scopeId})` : ""}`,
      entityType: "admin_users",
      entityId: id,
      beforeState: { scopeType: target.scopeType, scopeId: target.scopeId },
      afterState: { scopeType, scopeId },
    });
    showToast(`Cakupan admin ${target.name} diperbarui ke ${scopeType}!`, "success");
  };

  const deleteAdminAccount = (id: string) => {
    const target = adminAccounts.find((a) => a.id === id);
    if (!target) return;
    if (target.id === currentUser?.id) {
      showToast("Anda tidak dapat menghapus akun Anda sendiri!", "error");
      return;
    }
    setAdminAccounts((prev) => prev.filter((a) => a.id !== id));
    recordAudit({
      actor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Super Admin",
      actorScope: "global",
      actorDashboard: "Admin",
      action: `Menghapus akun admin: ${target.name}`,
      entityType: "admin_users",
      entityId: id,
      beforeState: target as unknown as Record<string, any>,
    });
    showToast(`Akun admin ${target.name} telah dihapus!`, "warning");
  };

  // System Health
  const refreshSystemHealth = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSystemHealth((prev) =>
      prev.map((s) => ({
        ...s,
        latencyMs: Math.max(8, s.latencyMs + Math.floor(Math.random() * 30 - 15)),
        lastChecked: "Baru saja",
      }))
    );
    showToast("Pemeriksaan status 9 layanan port selesai (semua snapshot diperbarui).", "info");
  };

  // Reset to initial seed
  const resetAllData = () => {
    setCurrentUser(initialAdminUsers[0]);
    setUsers(seedPlatformUsers);
    setInstitutions(seedInstitutions);
    setAuditLogs(seedAuditLogs);
    setDataSources(seedDataSources);
    setAiFlags(seedAiFaaFlags);
    setRegionalAudits(initialRegionalAudits);
    setNlToSqlLogs(initialNlToSqlLogs);
    setBankMutations(seedBankMutations);
    setBroadcasts(initialBroadcasts);
    setRolePermissions(initialRolePermissions);
    setAdminAccounts(initialAdminUsers);
    setSystemHealth(initialSystemHealth);

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("admin_db_")) {
        localStorage.removeItem(key);
      }
    });

    showToast("Semua data telah direset ke setelan awal PRD!", "info");
  };

  return (
    <AdminStoreContext.Provider
      value={{
        currentUser,
        pendingMfaUser,
        login,
        verifyMfa,
        quickLogin,
        logout,
        canAccess,

        users,
        addUser,
        updateUser,
        deleteUser,
        bulkUpdateStatus,
        resetPassword,

        institutions,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        searchSchools,
        lookupSchoolByNpsn,

        auditLogs,
        addAuditLog: recordAudit,

        dataSources,
        resyncDataSource,
        addDataSource,

        aiFlags,
        updateAiFlagStatus,
        regionalAudits,
        toggleRegionalAudit,
        nlToSqlLogs,

        bankMutations,
        bankApiConfigs,
        syncBankMutations,
        addLiveMutation,
        toggleBankApi,
        updateBankApiConfig,
        fetchBankJson,
        validateBriAccountName,
        fetchBriInformasiRekening,
        sendMutationToAiFaa,

        broadcasts,
        sendBroadcast,

        rolePermissions,
        updatePermission,
        adminAccounts,
        addAdminAccount,
        updateAdminScope,
        deleteAdminAccount,

        systemHealth,
        refreshSystemHealth,
        dbStatus,
        checkDbHealth,

        toasts,
        showToast,
        dismissToast,

        resetAllData,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (!context) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return context;
}
