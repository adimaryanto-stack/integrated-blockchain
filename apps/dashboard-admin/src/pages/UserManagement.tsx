import React, { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { SchoolNpsnSelector } from "@/components/SchoolNpsnSelector";
import { useAdminStore } from "@/store/adminStore";
import type { Dashboard, PlatformUser, UserStatus, BankHimbara, KementerianPembina, Jenjang } from "@/types";
import {
  Search,
  UserPlus,
  KeyRound,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Copy,
  Check,
  Filter,
  Shield,
  Phone,
  Mail,
  Building,
  Loader2,
  Sparkles,
} from "lucide-react";

const dashboards: Dashboard[] = [
  "Institusi Pendidikan",
  "Publik",
  "Kementerian",
  "Bank",
  "Auditor",
];

export function UserManagement() {
  const {
    users,
    institutions,
    addUser,
    updateUser,
    deleteUser,
    bulkUpdateStatus,
    resetPassword,
    currentUser,
    canAccess,
    searchSchools,
    lookupSchoolByNpsn,
  } = useAdminStore();

  const [activeDashboard, setActiveDashboard] = useState<Dashboard>("Institusi Pendidikan");
  const [kementerian, setKementerian] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kabKota, setKabKota] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Live on-demand school lookup when typing NPSN in search bar
  const [npsnMatchedSchool, setNpsnMatchedSchool] = useState<any>(null);
  const [isSearchingNpsn, setIsSearchingNpsn] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);
  const [resetPwdModal, setResetPwdModal] = useState<{ user: PlatformUser; tempPass: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dashboard: "Institusi Pendidikan" as Dashboard,
    institutionId: "",
    bankName: "BRI" as BankHimbara,
    status: "aktif" as UserStatus,
  });

  const isInstitusi = activeDashboard === "Institusi Pendidikan";

  // Check RBAC permissions
  const canCreate = canAccess("Manajemen Pengguna", "create");
  const canEdit = canAccess("Manajemen Pengguna", "edit");
  const canDelete = canAccess("Manajemen Pengguna", "delete");

  // Scoped RBAC filtering based on currentUser
  const scopedUsers = useMemo(() => {
    let result = users;

    if (currentUser?.scopeType === "kementerian" && currentUser.scopeId) {
      // Find institutions under this ministry
      const allowedInstIds = new Set(
        institutions
          .filter((i) => i.kementerianPembina === currentUser.scopeId)
          .map((i) => i.id)
      );
      result = result.filter(
        (u) => u.dashboard !== "Institusi Pendidikan" || (u.institutionId && allowedInstIds.has(u.institutionId))
      );
    } else if (currentUser?.scopeType === "provinsi" && currentUser.scopeId) {
      // Find institutions in this province
      const allowedInstIds = new Set(
        institutions
          .filter((i) => i.provinsi === currentUser.scopeId)
          .map((i) => i.id)
      );
      result = result.filter(
        (u) => u.dashboard !== "Institusi Pendidikan" || (u.institutionId && allowedInstIds.has(u.institutionId))
      );
    } else if (currentUser?.scopeType === "satuan" && currentUser.scopeId) {
      const allowedInst = institutions.find(
        (i) => i.namaSatuan === currentUser.scopeId || i.npsn === currentUser.scopeId
      );
      if (allowedInst) {
        result = result.filter((u) => u.institutionId === allowedInst.id);
      }
    }

    return result;
  }, [users, currentUser, institutions]);

  // Live on-demand school lookup when typing NPSN or school name in search bar
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed || trimmed.length < 3) {
      setNpsnMatchedSchool(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingNpsn(true);
      try {
        const isNpsnQuery = /^\d+$/.test(trimmed);
        if (isNpsnQuery) {
          const lookup = await lookupSchoolByNpsn(trimmed);
          if (lookup.found && lookup.schools && lookup.schools.length > 0) {
            setNpsnMatchedSchool(lookup.schools[0]);
          } else {
            setNpsnMatchedSchool(null);
          }
        } else {
          await searchSchools(trimmed);
          setNpsnMatchedSchool(null);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearchingNpsn(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, lookupSchoolByNpsn, searchSchools]);

  // Filtered institutions for hierarchy
  const filteredInstitutions = useMemo(() => {
    if (!isInstitusi) return [];
    return institutions.filter((i) => {
      const matchKem = !kementerian || i.kementerianPembina === kementerian;
      const matchJen = !jenjang || i.jenjang === jenjang;
      const matchProv = !provinsi || i.provinsi === provinsi;
      const matchKab = !kabKota || i.kabupatenKota === kabKota;
      const matchKec = !kecamatan || i.kecamatan === kecamatan;
      return matchKem && matchJen && matchProv && matchKab && matchKec;
    });
  }, [isInstitusi, kementerian, jenjang, provinsi, kabKota, kecamatan, institutions]);

  // Filtered rows for current dashboard tab
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (isInstitusi) {
      const hasHierarchyFilter = !!(kementerian || jenjang || provinsi || kabKota || kecamatan);
      const allowedInstIds = hasHierarchyFilter ? new Set(filteredInstitutions.map((i) => i.id)) : null;

      return scopedUsers.filter((u) => {
        if (u.dashboard !== "Institusi Pendidikan") return false;

        // If hierarchical dropdown filters are active, check if user's school matches
        if (allowedInstIds && (!u.institutionId || !allowedInstIds.has(u.institutionId))) {
          return false;
        }

        if (!q) return true;

        const inst = institutions.find((i) => i.id === u.institutionId || i.npsn === u.npsn);
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phone?.toLowerCase().includes(q);
        const matchUserNpsn = u.npsn?.toLowerCase().includes(q);
        const matchUserInst = u.institutionName?.toLowerCase().includes(q);
        const matchInstNpsn = inst?.npsn?.toLowerCase().includes(q);
        const matchInstName = inst?.namaSatuan?.toLowerCase().includes(q);
        const matchLocation = inst?.kabupatenKota?.toLowerCase().includes(q) || inst?.kecamatan?.toLowerCase().includes(q);

        return matchName || matchEmail || matchPhone || matchUserNpsn || matchUserInst || matchInstNpsn || matchInstName || matchLocation;
      });
    }

    return scopedUsers.filter((u) => {
      if (u.dashboard !== activeDashboard) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.bankName && u.bankName.toLowerCase().includes(q))
      );
    });
  }, [isInstitusi, activeDashboard, scopedUsers, filteredInstitutions, search, institutions, kementerian, jenjang, provinsi, kabKota, kecamatan]);

  // Selection handlers
  const toggleAll = () => {
    setSelectedIds(selectedIds.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (status: UserStatus) => {
    if (selectedIds.size === 0) return;
    bulkUpdateStatus(Array.from(selectedIds), status);
    setSelectedIds(new Set());
  };

  const handleBulkResetPassword = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => resetPassword(id));
    setSelectedIds(new Set());
  };

  // Open Add modal (optional preset school from NPSN quick matcher)
  const handleOpenAdd = (presetSchool?: any) => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      dashboard: "Institusi Pendidikan",
      institutionId: presetSchool ? presetSchool.id : (institutions[0]?.id || ""),
      bankName: "BRI",
      status: "aktif",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      dashboard: formData.dashboard,
      institutionId: formData.dashboard === "Institusi Pendidikan" ? formData.institutionId : undefined,
      bankName: formData.dashboard === "Bank" ? formData.bankName : undefined,
      status: formData.status,
      invitedBy: currentUser?.name || "Admin",
    });
    setIsAddModalOpen(false);
  };

  // Open Edit modal
  const handleOpenEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      dashboard: user.dashboard,
      institutionId: user.institutionId || institutions[0]?.id || "",
      bankName: user.bankName || "BRI",
      status: user.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dashboard: formData.dashboard,
      institutionId: formData.dashboard === "Institusi Pendidikan" ? formData.institutionId : undefined,
      bankName: formData.dashboard === "Bank" ? formData.bankName : undefined,
      status: formData.status,
    });
    setEditingUser(null);
  };

  // Handle single Reset Password
  const handleResetPassword = (user: PlatformUser) => {
    const tempPass = resetPassword(user.id);
    setResetPwdModal({ user, tempPass });
    setCopiedPass(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const institutionName = (id?: string) =>
    institutions.find((i) => i.id === id)?.namaSatuan ?? "—";

  return (
    <DashboardLayout pageTitle="Manajemen Pengguna & Peran">
      {/* Top dashboard selector tabs & Add Button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {dashboards.map((d) => (
            <button
              key={d}
              onClick={() => {
                setActiveDashboard(d);
                setSelectedIds(new Set());
              }}
              className={`focus-ring rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeDashboard === d
                  ? "bg-navy text-white shadow-sm"
                  : "border border-line bg-panel text-ink hover:bg-base"
              }`}
            >
              {d}
              <span className="ml-1.5 opacity-75">
                ({scopedUsers.filter((u) => u.dashboard === d).length})
              </span>
            </button>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
          >
            <UserPlus size={14} /> Tambah Pengguna Baru
          </button>
        )}
      </div>

      {/* Hierarchical Filter for Institusi Pendidikan (PRD 2.1) */}
      {isInstitusi && (
        <div className="mb-4">
          <Panel
            title="Filter Berjenjang (Level 0: Kementerian → Level 1: Jenjang → Level 2-4: Wilayah/Kecamatan)"
            action={
              <button
                onClick={() => {
                  setKementerian("");
                  setJenjang("");
                  setProvinsi("");
                  setKabKota("");
                  setKecamatan("");
                }}
                className="text-xs font-medium text-navy hover:underline"
              >
                Reset Filter
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 text-xs">
              <div>
                <label className="mb-1 block font-medium text-muted">Kementerian Pembina</label>
                <select
                  className="focus-ring w-full rounded-sm border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                  value={kementerian}
                  onChange={(e) => setKementerian(e.target.value)}
                >
                  <option value="">Semua Kementerian</option>
                  <option value="Kemendikdasmen">Kemendikdasmen</option>
                  <option value="Kemenag">Kemenag (Madrasah/PTKI)</option>
                  <option value="Kemendiktisaintek">Kemendiktisaintek (Perguruan Tinggi)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted">Jenjang Pendidikan</label>
                <select
                  className="focus-ring w-full rounded-sm border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value)}
                >
                  <option value="">Semua Jenjang</option>
                  <option value="PAUD">PAUD</option>
                  <option value="TK">TK</option>
                  <option value="SD">SD / MI</option>
                  <option value="SMP">SMP / MTs</option>
                  <option value="SMA">SMA / MA</option>
                  <option value="SMK">SMK</option>
                  <option value="S1">S1 / Perguruan Tinggi</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted">Provinsi</label>
                <select
                  className="focus-ring w-full rounded-sm border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                >
                  <option value="">Semua Provinsi</option>
                  <option value="Lampung">Lampung</option>
                  <option value="DKI Jakarta">DKI Jakarta</option>
                  <option value="Jawa Barat">Jawa Barat</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted">Kabupaten / Kota</label>
                <select
                  className="focus-ring w-full rounded-sm border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                  value={kabKota}
                  onChange={(e) => setKabKota(e.target.value)}
                >
                  <option value="">Semua Kab/Kota</option>
                  <option value="Kabupaten Pesawaran">Kabupaten Pesawaran</option>
                  <option value="Kota Bandar Lampung">Kota Bandar Lampung</option>
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                  <option value="Kota Bandung">Kota Bandung</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted">Kecamatan</label>
                <select
                  className="focus-ring w-full rounded-sm border border-line bg-panel px-2.5 py-1.5 text-xs text-ink"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                >
                  <option value="">Semua Kecamatan</option>
                  <option value="Kedondong">Kedondong</option>
                  <option value="Gedong Tataan">Gedong Tataan</option>
                  <option value="Tanjung Karang Pusat">Tanjung Karang Pusat</option>
                  <option value="Sukarame">Sukarame</option>
                  <option value="Kebayoran Baru">Kebayoran Baru</option>
                  <option value="Coblong">Coblong</option>
                </select>
              </div>
            </div>

            {/* Quick Helper badge for MIN 1 Pesawaran requirement */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted border-t border-line/50 pt-2">
              <span className="font-semibold text-navy">Studi Kasus PRD 2.1:</span>
              <button
                onClick={() => {
                  setKementerian("Kemenag");
                  setJenjang("SD");
                  setProvinsi("Lampung");
                  setKabKota("Kabupaten Pesawaran");
                  setKecamatan("Kedondong");
                }}
                className="underline hover:text-ink text-navy font-mono"
              >
                Terapkan Filter: MIN 1 Pesawaran (Kemenag &gt; SD &gt; Lampung &gt; Pesawaran &gt; Kedondong)
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* Search and Bulk Action Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={15} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pengguna, email, NPSN (contoh: 69893669), atau nama satuan..."
            className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-8 text-xs text-ink shadow-sm"
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
            {isSearchingNpsn && <Loader2 size={13} className="animate-spin text-navy" />}
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted hover:text-ink"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-sm border border-line bg-panel px-3 py-1.5 shadow-sm text-xs animate-in fade-in">
            <span className="font-semibold text-ink">{selectedIds.size} dipilih</span>
            <div className="h-4 w-px bg-line" />
            <button
              onClick={() => handleBulkAction("aktif")}
              className="focus-ring flex items-center gap-1 rounded bg-status-ok/10 px-2 py-1 font-semibold text-status-ok hover:bg-status-ok/20 transition-colors"
            >
              <CheckCircle size={13} /> Aktifkan
            </button>
            <button
              onClick={() => handleBulkAction("nonaktif")}
              className="focus-ring flex items-center gap-1 rounded bg-status-danger/10 px-2 py-1 font-semibold text-status-danger hover:bg-status-danger/20 transition-colors"
            >
              <XCircle size={13} /> Nonaktifkan
            </button>
            <button
              onClick={handleBulkResetPassword}
              className="focus-ring flex items-center gap-1 rounded bg-navy/10 px-2 py-1 font-semibold text-navy hover:bg-navy/20 transition-colors"
            >
              <KeyRound size={13} /> Reset Sandi Massal
            </button>
          </div>
        )}
      </div>

      {/* Quick Search Helper Chips */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        <span className="font-medium text-navy flex items-center gap-1">
          <Sparkles size={12} /> Coba cari NPSN / Pengguna:
        </span>
        <button
          type="button"
          onClick={() => setSearch("69893669")}
          className="rounded bg-panel hover:bg-base text-ink px-2 py-0.5 border border-line font-mono font-semibold"
        >
          69893669 (KB AL-IKHLAS)
        </button>
        <button
          type="button"
          onClick={() => setSearch("admin.kbalikhlas")}
          className="rounded bg-panel hover:bg-base text-ink px-2 py-0.5 border border-line font-mono font-semibold"
        >
          admin.kbalikhlas
        </button>
        <button
          type="button"
          onClick={() => setSearch("admin@kbalikhlas.sch.id")}
          className="rounded bg-panel hover:bg-base text-ink px-2 py-0.5 border border-line font-mono font-semibold"
        >
          admin@kbalikhlas.sch.id
        </button>
        <button
          type="button"
          onClick={() => setSearch("10208665")}
          className="rounded bg-panel hover:bg-base text-ink px-2 py-0.5 border border-line font-mono font-semibold"
        >
          10208665 (SDN 030415)
        </button>
      </div>

      {/* Live NPSN Match Banner */}
      {npsnMatchedSchool && (
        <div className="mb-4 rounded-sm border border-navy/30 bg-navy/5 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-navy text-white">
              <Building size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-ink">{npsnMatchedSchool.namaSatuan}</span>
                <span className="rounded bg-navy text-white px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide">
                  NPSN: {npsnMatchedSchool.npsn}
                </span>
                <span className="rounded bg-navy/10 text-navy px-2 py-0.5 text-[10px] font-semibold">
                  {npsnMatchedSchool.jenjang} · {npsnMatchedSchool.kementerianPembina}
                </span>
              </div>
              <div className="text-xs text-muted mt-0.5">
                📍 {npsnMatchedSchool.kabupatenKota}, {npsnMatchedSchool.provinsi}
                {npsnMatchedSchool.users && npsnMatchedSchool.users.length > 0 ? (
                  <span className="ml-2 font-semibold text-status-ok">
                    ✓ {npsnMatchedSchool.users.length} akun terdaftar di sistem
                  </span>
                ) : (
                  <span className="ml-2 font-medium text-status-warn">
                    ⚠️ Belum ada akun pengguna untuk sekolah ini
                  </span>
                )}
              </div>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => handleOpenAdd(npsnMatchedSchool)}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm"
            >
              <UserPlus size={13} />
              + Buat Akun Sekolah Ini
            </button>
          )}
        </div>
      )}

      {/* Users Table */}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                <th className="w-8 py-2.5">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.size === rows.length}
                    onChange={toggleAll}
                    className="rounded-sm"
                  />
                </th>
                <th className="py-2.5">Pengguna</th>
                <th className="py-2.5">Kontak</th>
                {isInstitusi && <th className="py-2.5">Satuan Pendidikan (NPSN)</th>}
                {activeDashboard === "Bank" && <th className="py-2.5">Bank Himbara</th>}
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => {
                const inst = institutions.find((i) => i.id === u.institutionId || i.npsn === u.npsn);
                return (
                  <tr key={u.id} className="hover:bg-base/40 transition-colors">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="rounded-sm"
                      />
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-ink">{u.name}</div>
                      <div className="text-[10px] text-muted flex items-center gap-1">
                        <Mail size={10} /> {u.email}
                      </div>
                    </td>
                    <td className="py-3 text-muted">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone size={11} /> {u.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    {isInstitusi && (
                      <td className="py-3">
                        {(() => {
                          const schoolName = inst?.namaSatuan || u.institutionName;
                          const schoolNpsn = inst?.npsn || u.npsn;
                          const schoolJenjang = inst?.jenjang || (schoolName?.startsWith("KB") ? "PAUD" : "SD");
                          const schoolKem = inst?.kementerianPembina || "Kemendikdasmen";
                          if (!schoolName && !schoolNpsn) return <span className="text-muted">—</span>;
                          return (
                            <div>
                              <div className="font-semibold text-ink flex items-center gap-1.5">
                                <Building size={13} className="text-navy shrink-0" />
                                <span>{schoolName || "—"}</span>
                              </div>
                              <div className="text-[10px] text-muted font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                {schoolNpsn && (
                                  <span className="rounded bg-navy/10 px-1.5 py-0.2 text-navy font-bold">
                                    NPSN: {schoolNpsn}
                                  </span>
                                )}
                                <span>·</span>
                                <span>{schoolJenjang}</span>
                                <span>·</span>
                                <span>{schoolKem}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    )}
                    {activeDashboard === "Bank" && (
                      <td className="py-3 font-semibold text-navy">
                        <span className="rounded bg-navy/10 px-2 py-0.5">{u.bankName || "—"}</span>
                      </td>
                    )}
                    <td className="py-3">
                      <StatusBadge value={u.status} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <>
                            {u.status !== "aktif" ? (
                              <button
                                onClick={() => updateUser(u.id, { status: "aktif" })}
                                className="focus-ring rounded p-1 text-status-ok hover:bg-status-ok/10 transition-colors"
                                title="Aktifkan Akun"
                              >
                                <CheckCircle size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => updateUser(u.id, { status: "nonaktif" })}
                                className="focus-ring rounded p-1 text-status-warn hover:bg-status-warn/10 transition-colors"
                                title="Nonaktifkan Akun"
                              >
                                <XCircle size={15} />
                              </button>
                            )}

                            <button
                              onClick={() => handleResetPassword(u)}
                              className="focus-ring rounded p-1 text-navy hover:bg-navy/10 transition-colors"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="focus-ring rounded p-1 text-muted hover:text-ink hover:bg-base transition-colors"
                              title="Edit Data Pengguna"
                            >
                              <Edit2 size={15} />
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="focus-ring rounded p-1 text-status-danger hover:bg-status-danger/10 transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Tidak ada akun pengguna yang cocok dengan kriteria filter atau pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal: Tambah Pengguna */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Akun Pengguna Baru"
        subtitle={`Akan didaftarkan pada dashboard: ${formData.dashboard}`}
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Ahmad Fauzi, S.Pd."
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Alamat Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@institusi.sch.id"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Nomor Telepon/HP</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Dashboard Peran</label>
              <select
                value={formData.dashboard}
                onChange={(e) => setFormData({ ...formData, dashboard: e.target.value as Dashboard })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                {dashboards.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Status Awal</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="aktif">Aktif</option>
                <option value="menunggu">Menunggu Verifikasi</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {formData.dashboard === "Institusi Pendidikan" && (
            <SchoolNpsnSelector
              value={formData.institutionId}
              onChange={(schoolId) => setFormData({ ...formData, institutionId: schoolId })}
              institutions={institutions}
              searchSchools={searchSchools}
              required
            />
          )}

          {formData.dashboard === "Bank" && (
            <div>
              <label className="mb-1 block font-semibold text-ink">Bank Himbara</label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value as BankHimbara })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="BRI">Bank BRI</option>
                <option value="BNI">Bank BNI</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BTN">Bank BTN</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Simpan & Daftarkan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Pengguna */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Data Pengguna"
        subtitle={`ID: ${editingUser?.id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Telepon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Dashboard</label>
              <select
                value={formData.dashboard}
                onChange={(e) => setFormData({ ...formData, dashboard: e.target.value as Dashboard })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                {dashboards.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="aktif">Aktif</option>
                <option value="menunggu">Menunggu</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {formData.dashboard === "Institusi Pendidikan" && (
            <SchoolNpsnSelector
              value={formData.institutionId}
              onChange={(schoolId) => setFormData({ ...formData, institutionId: schoolId })}
              institutions={institutions}
              searchSchools={searchSchools}
              required
            />
          )}

          {formData.dashboard === "Bank" && (
            <div>
              <label className="mb-1 block font-semibold text-ink">Bank</label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value as BankHimbara })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="BRI">Bank BRI</option>
                <option value="BNI">Bank BNI</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BTN">Bank BTN</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Perbarui Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Hapus Pengguna Confirmation */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Konfirmasi Hapus Pengguna"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-ink">
            Apakah Anda yakin ingin menghapus akun pengguna{" "}
            <strong className="text-status-danger">{deletingUser?.name}</strong> ({deletingUser?.email})?
          </p>
          <p className="text-muted">
            Tindakan ini tidak dapat dibatalkan dan akan dicatat secara permanen pada Audit Log.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              onClick={() => setDeletingUser(null)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (deletingUser) {
                  deleteUser(deletingUser.id);
                  setDeletingUser(null);
                }
              }}
              className="rounded bg-status-danger px-4 py-1.5 font-semibold text-white hover:bg-status-danger/90"
            >
              Ya, Hapus Akun
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hasil Reset Password */}
      <Modal
        isOpen={!!resetPwdModal}
        onClose={() => setResetPwdModal(null)}
        title="Kata Sandi Sementara Dibuat"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-ink">
            Kata sandi untuk <strong className="text-navy">{resetPwdModal?.user.name}</strong> telah berhasil direset. Berikan kata sandi sementara berikut kepada pengguna:
          </p>
          <div className="flex items-center justify-between rounded border border-line bg-base p-3 font-mono text-sm font-bold text-navy">
            <span>{resetPwdModal?.tempPass}</span>
            <button
              onClick={() => resetPwdModal && copyToClipboard(resetPwdModal.tempPass)}
              className="focus-ring flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-sans font-medium text-ink shadow-sm hover:bg-base"
            >
              {copiedPass ? <Check size={13} className="text-status-ok" /> : <Copy size={13} />}
              <span>{copiedPass ? "Tersalin!" : "Salin"}</span>
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Pengguna akan diminta mengganti kata sandi ini saat pertama kali login.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setResetPwdModal(null)}
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
