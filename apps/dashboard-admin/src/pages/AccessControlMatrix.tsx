import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { AdminRole, ScopeType, AdminUser } from "@/types";
import {
  KeyRound,
  Shield,
  Users,
  Check,
  X,
  UserPlus,
  Edit2,
  Trash2,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";

const modulesList = [
  "Manajemen Pengguna",
  "Audit Log",
  "Data Source Monitor",
  "AI-FAA Console",
  "Mutasi Bank Himbara",
  "Broadcast",
  "Master Data Wilayah",
  "Access Control Matrix",
  "Pengaturan AI Aksara",
];

const roleOrder: AdminRole[] = [
  "super_admin",
  "ops_admin",
  "admin_kementerian",
  "admin_wilayah",
  "admin_satuan",
];

export function AccessControlMatrix() {
  const {
    rolePermissions,
    updatePermission,
    adminAccounts,
    addAdminAccount,
    updateAdminScope,
    deleteAdminAccount,
    currentUser,
    canAccess,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<"matrix" | "admins" | "architecture">("matrix");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("super_admin");

  // Modals
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [editingAdminScope, setEditingAdminScope] = useState<AdminUser | null>(null);

  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    role: "ops_admin" as AdminRole,
    scopeType: "global" as ScopeType,
    scopeId: "",
    mfaEnabled: true,
  });

  const [scopeEditData, setScopeEditData] = useState<{
    scopeType: ScopeType;
    scopeId: string;
  }>({
    scopeType: "global",
    scopeId: "",
  });

  const isSuperAdmin = currentUser?.role === "super_admin";

  const handleToggle = (
    role: AdminRole,
    mod: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete",
    currentVal: boolean
  ) => {
    if (!isSuperAdmin) {
      alert("Hanya Super Admin yang diizinkan memodifikasi Access Control Matrix.");
      return;
    }
    updatePermission(role, mod, action, !currentVal);
  };

  const handleSaveNewAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    addAdminAccount({
      name: newAdminData.name,
      email: newAdminData.email,
      role: newAdminData.role,
      scopeType: newAdminData.scopeType,
      scopeId: newAdminData.scopeId || undefined,
      mfaEnabled: newAdminData.mfaEnabled,
    });
    setIsAddAdminModalOpen(false);
  };

  const handleOpenEditScope = (admin: AdminUser) => {
    setEditingAdminScope(admin);
    setScopeEditData({
      scopeType: admin.scopeType,
      scopeId: admin.scopeId || "",
    });
  };

  const handleSaveEditScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminScope) return;
    updateAdminScope(
      editingAdminScope.id,
      scopeEditData.scopeType,
      scopeEditData.scopeId || undefined
    );
    setEditingAdminScope(null);
  };

  // RBAC guard — deny access to roles without "Access Control Matrix" view permission
  if (!canAccess("Access Control Matrix", "view")) {
    return (
      <DashboardLayout pageTitle="Access Control Matrix & Scoped RBAC">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10 border border-status-danger/30">
            <KeyRound size={32} className="text-status-danger" />
          </div>
          <h2 className="text-xl font-bold text-ink">Akses Ditolak</h2>
          <p className="text-sm text-muted max-w-sm">
            Halaman <strong>Access Control Matrix</strong> hanya dapat diakses oleh{" "}
            <strong>Super Admin</strong> dan <strong>Ops Admin</strong>.
            Peran Anda saat ini (<strong>{currentUser?.role}</strong>) tidak memiliki izin untuk melihat modul ini.
          </p>
          <p className="text-xs text-muted/70 font-mono">
            Scope: {currentUser?.scopeType} {currentUser?.scopeId ? `(${currentUser.scopeId})` : ""}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Access Control Matrix & Scoped RBAC">
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "matrix"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <KeyRound size={14} />
            <span>Matriks Izin Modul (Role Permissions)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "admins"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>Manajemen Admin & Cakupan Scope ({adminAccounts.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("architecture")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "architecture"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={14} />
            <span>Arsitektur Scoped RBAC (PRD 6.1)</span>
          </div>
        </button>
      </div>

      {/* Tab 1: Permissions Matrix */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <Panel
            title="Matriks Hak Akses Modul Platform"
            action={
              <span className="text-xs text-muted flex items-center gap-1">
                <Shield size={13} className="text-gold" /> Aturan 'Boleh Apa' per Peran
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                    <th className="py-2.5 pr-4">Modul Platform</th>
                    {roleOrder.map((rKey) => {
                      const rp = rolePermissions.find((p) => p.role === rKey);
                      return (
                        <th key={rKey} className="px-3 py-2.5 text-center">
                          <div className="font-bold text-ink">{rp?.roleTitle || rKey}</div>
                          <div className="text-[10px] font-normal normal-case text-muted">
                            {rp?.scopeLabel}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {modulesList.map((m) => (
                    <tr key={m} className="hover:bg-base/40 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-ink">{m}</td>
                      {roleOrder.map((rKey) => {
                        const rp = rolePermissions.find((p) => p.role === rKey);
                        const perm = rp?.permissions[m] || {
                          canView: false,
                          canCreate: false,
                          canEdit: false,
                          canDelete: false,
                        };
                        const isSuperAdminRow = rKey === "super_admin";

                        return (
                          <td key={rKey} className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 rounded border border-line/60 bg-base/50 p-1">
                              {/* View */}
                              <button
                                onClick={() => handleToggle(rKey, m, "canView", perm.canView)}
                                title="Izin Melihat (View)"
                                className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  perm.canView
                                    ? "bg-navy text-white"
                                    : "bg-panel text-muted/50 border border-line"
                                }`}
                              >
                                V
                              </button>
                              {/* Create */}
                              <button
                                onClick={() => handleToggle(rKey, m, "canCreate", perm.canCreate)}
                                title="Izin Membuat (Create)"
                                className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  perm.canCreate
                                    ? "bg-status-ok text-white"
                                    : "bg-panel text-muted/50 border border-line"
                                }`}
                              >
                                C
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => handleToggle(rKey, m, "canEdit", perm.canEdit)}
                                title="Izin Mengubah (Edit)"
                                className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  perm.canEdit
                                    ? "bg-gold text-ink"
                                    : "bg-panel text-muted/50 border border-line"
                                }`}
                              >
                                E
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleToggle(rKey, m, "canDelete", perm.canDelete)}
                                title="Izin Menghapus (Delete)"
                                className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-colors ${
                                  perm.canDelete
                                    ? "bg-status-danger text-white"
                                    : "bg-panel text-muted/50 border border-line"
                                }`}
                              >
                                D
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted border-t border-line pt-3">
              <span className="font-semibold text-ink">Keterangan Izin:</span>
              <span className="flex items-center gap-1 font-mono">
                <span className="rounded bg-navy px-1.5 py-0.2 text-[10px] text-white">V</span> View
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="rounded bg-status-ok px-1.5 py-0.2 text-[10px] text-white">C</span> Create
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="rounded bg-gold px-1.5 py-0.2 text-[10px] text-ink">E</span> Edit
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="rounded bg-status-danger px-1.5 py-0.2 text-[10px] text-white">D</span> Delete
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* Tab 2: Admin Accounts & Scope Management */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted">
              Kelola daftar akun administrator platform dan batas cakupan akses datanya (PRD Section 4: <code>admin_users</code>).
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => setIsAddAdminModalOpen(true)}
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
              >
                <UserPlus size={14} /> Tambah Akun Administrator
              </button>
            )}
          </div>

          <Panel title="Daftar Akun Administrator & Cakupan (Scope)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                    <th className="py-2.5">Nama & Email</th>
                    <th className="py-2.5">Peran (Role)</th>
                    <th className="py-2.5">Tipe Cakupan (Scope Type)</th>
                    <th className="py-2.5">Identitas Cakupan (Scope ID)</th>
                    <th className="py-2.5 text-center">MFA TOTP</th>
                    <th className="py-2.5">Login Terakhir</th>
                    <th className="py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {adminAccounts.map((a) => (
                    <tr key={a.id} className="hover:bg-base/40 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-ink">{a.name}</div>
                        <div className="text-[10px] text-muted font-mono">{a.email}</div>
                      </td>
                      <td className="py-3 font-semibold text-navy">
                        <span className="rounded bg-navy/10 px-2 py-0.5 capitalize">
                          {a.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-base px-2 py-0.5 font-mono text-[10px] font-semibold text-ink">
                          {a.scopeType}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-ink">
                        {a.scopeId ? (
                          <span className="rounded bg-gold/15 px-2 py-0.5 text-navy font-semibold">
                            {a.scopeId}
                          </span>
                        ) : (
                          <span className="text-muted italic">Seluruh Indonesia (Global)</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.mfaEnabled ? "bg-status-ok/10 text-status-ok" : "bg-muted/10 text-muted"
                          }`}
                        >
                          {a.mfaEnabled ? "Wajib" : "Opsional"}
                        </span>
                      </td>
                      <td className="py-3 text-muted font-mono">{a.lastLoginAt || "—"}</td>
                      <td className="py-3 text-right">
                        {isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditScope(a)}
                              className="focus-ring rounded p-1 text-navy hover:bg-navy/10 transition-colors"
                              title="Ubah Cakupan (Scope)"
                            >
                              <Edit2 size={14} />
                            </button>
                            {a.id !== currentUser?.id && (
                              <button
                                onClick={() => deleteAdminAccount(a.id)}
                                className="focus-ring rounded p-1 text-status-danger hover:bg-status-danger/10 transition-colors"
                                title="Hapus Administrator"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Tab 3: Scoped RBAC Architecture Explanation */}
      {activeTab === "architecture" && (
        <Panel title="Prinsip Penegakan Scoped RBAC (PRD Section 6.1)">
          <div className="space-y-4 text-xs">
            <div className="rounded border border-line bg-base p-4">
              <h4 className="font-bold text-ink mb-1 text-sm">
                Aturan Penegakan "Boleh Apa" vs "Atas Data Siapa"
              </h4>
              <p className="text-muted leading-relaxed">
                Karena data anggaran pendidikan terstruktur berjenjang (Kementerian → Jenjang → Provinsi → Kab/Kota → Satuan Pendidikan), otorisasi dibagi menjadi dua lapis independen:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-ink">
                <li>
                  <strong>Boleh Apa (Role Permissions):</strong> Diatur melalui tabel <code>permission_matrix</code> (View, Create, Edit, Delete per modul).
                </li>
                <li>
                  <strong>Atas Data Siapa (Data Scope):</strong> Diatur melalui <code>admin_users.scope_type</code> dan <code>scope_id</code>. Backend secara otomatis menginjeksi klausa SQL filter (misal <code>WHERE kementerian_pembina = ...</code> atau <code>WHERE province_id = ...</code>).
                </li>
                <li>
                  <strong>Hierarki Batasan Delegasi:</strong> Admin dengan cakupan sempit <em>tidak dapat</em> membuat admin baru dengan cakupan lebih luas dari dirinya sendiri.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded border border-line bg-panel p-3">
                <span className="font-bold text-navy block mb-1">Global Scope</span>
                <p className="text-muted text-[11px]">
                  Dipegang oleh Super Admin & Ops Admin. Mengawasi 38 provinsi, 514 kab/kota, dan 5+1 dashboard secara utuh tanpa restriksi wilayah.
                </p>
              </div>

              <div className="rounded border border-line bg-panel p-3">
                <span className="font-bold text-navy block mb-1">Kementerian Scope</span>
                <p className="text-muted text-[11px]">
                  Contoh: Admin Kemenag hanya dapat mengelola data dan pengguna madrasah/PTKI, tidak memiliki visibilitas ke sekolah di bawah Kemendikdasmen.
                </p>
              </div>

              <div className="rounded border border-line bg-panel p-3">
                <span className="font-bold text-navy block mb-1">Wilayah & Satuan Scope</span>
                <p className="text-muted text-[11px]">
                  Contoh: Admin Dinas Provinsi Lampung hanya melihat satuan dalam teritori Lampung; Kepala Satuan MIN 1 Pesawaran hanya melihat akun satuannya sendiri.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Modal: Tambah Administrator */}
      <Modal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        title="Daftarkan Akun Administrator Baru"
        subtitle="Memerlukan hak akses Super Admin"
      >
        <form onSubmit={handleSaveNewAdmin} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Administrator</label>
            <input
              type="text"
              required
              value={newAdminData.name}
              onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.Kom."
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">Alamat Email Resmi</label>
            <input
              type="email"
              required
              value={newAdminData.email}
              onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
              placeholder="budi@kemenag.go.id"
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Peran (Role)</label>
              <select
                value={newAdminData.role}
                onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value as AdminRole })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="ops_admin">Ops Admin</option>
                <option value="admin_kementerian">Admin Kementerian</option>
                <option value="admin_wilayah">Admin Wilayah (Dinas)</option>
                <option value="admin_satuan">Admin Satuan (Kepala Sekolah)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Tipe Cakupan (Scope Type)</label>
              <select
                value={newAdminData.scopeType}
                onChange={(e) =>
                  setNewAdminData({ ...newAdminData, scopeType: e.target.value as ScopeType })
                }
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="global">Global (Nasional)</option>
                <option value="kementerian">Per Kementerian</option>
                <option value="provinsi">Per Provinsi</option>
                <option value="kabupaten_kota">Per Kabupaten/Kota</option>
                <option value="satuan">Per Satuan Pendidikan</option>
              </select>
            </div>
          </div>

          {newAdminData.scopeType !== "global" && (
            <div>
              <label className="mb-1 block font-semibold text-ink">
                Identitas Batas Cakupan (Scope ID)
              </label>
              <input
                type="text"
                required
                value={newAdminData.scopeId}
                onChange={(e) => setNewAdminData({ ...newAdminData, scopeId: e.target.value })}
                placeholder="Contoh: Kemenag / Lampung / MIN 1 Pesawaran"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setIsAddAdminModalOpen(false)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Simpan Admin Baru
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Admin Scope */}
      <Modal
        isOpen={!!editingAdminScope}
        onClose={() => setEditingAdminScope(null)}
        title="Ubah Cakupan Akses (Data Scope)"
        subtitle={`Administrator: ${editingAdminScope?.name} (${editingAdminScope?.role})`}
      >
        <form onSubmit={handleSaveEditScope} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-ink">Tipe Cakupan (Scope Type)</label>
            <select
              value={scopeEditData.scopeType}
              onChange={(e) =>
                setScopeEditData({ ...scopeEditData, scopeType: e.target.value as ScopeType })
              }
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            >
              <option value="global">Global (Nasional)</option>
              <option value="kementerian">Per Kementerian</option>
              <option value="provinsi">Per Provinsi</option>
              <option value="kabupaten_kota">Per Kabupaten/Kota</option>
              <option value="satuan">Per Satuan Pendidikan</option>
            </select>
          </div>

          {scopeEditData.scopeType !== "global" && (
            <div>
              <label className="mb-1 block font-semibold text-ink">
                Identitas Batas Cakupan (Scope ID)
              </label>
              <input
                type="text"
                required
                value={scopeEditData.scopeId}
                onChange={(e) => setScopeEditData({ ...scopeEditData, scopeId: e.target.value })}
                placeholder="Contoh: Kemenag, Lampung, Kabupaten Pesawaran, dsb."
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setEditingAdminScope(null)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Perbarui Cakupan
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
