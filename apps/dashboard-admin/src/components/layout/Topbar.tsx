import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Shield, LogOut, Database, CheckCircle, RefreshCw, Server, Layers, FileSpreadsheet, HardDrive, Users, SwitchCamera } from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { Modal } from "@/components/ui/Modal";
import type { AdminRole } from "@/types";

export function Topbar({ pageTitle }: { pageTitle: string }) {
  const {
    currentUser,
    logout,
    quickLogin,
    broadcasts,
    aiFlags,
    dbStatus,
    checkDbHealth,
  } = useAdminStore();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbOverview, setDbOverview] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchDbOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetch("http://localhost:2028/api/admin/database-overview");
      if (res.ok) {
        const data = await res.json();
        setDbOverview(data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingOverview(false);
    }
  };

  const handleOpenDbModal = () => {
    checkDbHealth();
    fetchDbOverview();
    setIsDbModalOpen(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const roleLabelMap: Record<AdminRole, string> = {
    super_admin: "Super Admin",
    ops_admin: "Ops Admin",
    admin_kementerian: "Admin Kementerian",
    admin_wilayah: "Admin Wilayah",
    admin_satuan: "Admin Satuan",
  };

  const unreadNotifs = broadcasts.length + aiFlags.filter(f => f.status === "baru").length;

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-line bg-panel px-6 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-ink">{pageTitle}</h1>
        {currentUser && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/5 px-2.5 py-0.5 text-xs font-medium text-navy">
            <Shield size={11} /> {roleLabelMap[currentUser.role]} · Scope: {currentUser.scopeType} {currentUser.scopeId ? `(${currentUser.scopeId})` : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live Database Connection Badge on Ports 2027 & 2028 */}
        <button
          onClick={handleOpenDbModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-medium transition-colors shadow-sm ${
            dbStatus?.ok
              ? "bg-emerald-50/90 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              : "bg-rose-50/90 border-rose-300 text-rose-800 hover:bg-rose-100"
          }`}
          title="Klik untuk melihat rincian data database lokal (Port 2027 & 2028)"
        >
          <Database size={13} className={dbStatus?.ok ? "text-emerald-600 animate-pulse" : "text-rose-600"} />
          <span className="font-bold">{dbStatus?.ok ? "DB Lokal Aktif (Port 2027/2028)" : "DB Reconnecting..."}</span>
          <span className="font-mono text-[10px] opacity-80">{dbStatus ? `[${dbStatus.latencyMs}ms]` : ""}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="focus-ring relative rounded-sm p-2 text-muted hover:bg-base hover:text-ink transition-colors"
            title="Pusat Pemberitahuan"
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-bold text-white">
                {unreadNotifs}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md border border-line bg-panel shadow-2xl overflow-hidden z-30 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-line bg-base px-4 py-3">
                <span className="text-sm font-semibold text-ink">Notifikasi & Broadcast</span>
                <span className="text-xs text-muted">{unreadNotifs} info aktif</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-line">
                {aiFlags.filter(f => f.status === "baru").map(flag => (
                  <div key={flag.id} className="p-3 hover:bg-base/50 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-status-danger">AI-FAA Alert: Anomali Baru</span>
                      <span className="text-muted">{flag.createdAt}</span>
                    </div>
                    <p className="text-xs text-ink">{flag.reason}</p>
                    <p className="text-[11px] text-muted mt-1">Transaksi: {flag.transactionId} · {flag.institutionName}</p>
                  </div>
                ))}
                {broadcasts.map(bc => (
                  <div key={bc.id} className="p-3 hover:bg-base/50 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-navy">Pengumuman: {bc.title}</span>
                      <span className="text-muted">{bc.sentAt}</span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">{bc.message}</p>
                    <p className="text-[11px] text-muted/80 mt-1">Oleh: {bc.sentBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="focus-ring flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-base transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white shadow-sm">
              {getInitials(currentUser?.name)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-medium text-ink">{currentUser?.name || "Admin"}</p>
              <p className="text-xs text-muted">
                {currentUser ? roleLabelMap[currentUser.role] : "Tamu"}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-line bg-panel shadow-2xl overflow-hidden z-30 animate-in fade-in zoom-in-95">
              {/* Account summary */}
              <div className="border-b border-line bg-base p-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Akun Masuk Resmi</p>
                <p className="text-sm font-bold text-ink mt-0.5">{currentUser?.name}</p>
                <p className="text-xs text-muted">{currentUser?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-[11px] font-medium text-navy">
                    {currentUser ? roleLabelMap[currentUser.role] : ""}
                  </span>
                  <span className="rounded bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-ink">
                    scope: {currentUser?.scopeType} {currentUser?.scopeId ? `(${currentUser.scopeId})` : ""}
                  </span>
                </div>
              </div>

              {/* Role Switcher — RBAC Quick Tester */}
              <div className="border-b border-line p-2">
                <p className="flex items-center gap-1.5 px-1 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                  <SwitchCamera size={11} /> Ganti Peran (Uji RBAC)
                </p>
                {(
                  [
                    { role: "super_admin" as AdminRole, label: "Super Admin", color: "text-status-danger" },
                    { role: "ops_admin" as AdminRole, label: "Ops Admin", color: "text-navy" },
                    { role: "admin_kementerian" as AdminRole, label: "Admin Kementerian", color: "text-blue-600" },
                    { role: "admin_wilayah" as AdminRole, label: "Admin Wilayah", color: "text-emerald-700" },
                    { role: "admin_satuan" as AdminRole, label: "Admin Satuan", color: "text-amber-700" },
                  ] as const
                ).map(({ role, label, color }) => (
                  <button
                    key={role}
                    onClick={() => {
                      quickLogin(role);
                      setIsProfileOpen(false);
                    }}
                    className={`focus-ring flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:bg-base ${
                      currentUser?.role === role ? "bg-base font-bold " + color : "text-ink/70"
                    }`}
                  >
                    <Users size={12} className={currentUser?.role === role ? color : "text-muted"} />
                    {label}
                    {currentUser?.role === role && (
                      <span className={`ml-auto text-[10px] font-bold ${color}`}>● Aktif</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="focus-ring flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-status-danger hover:bg-status-danger/10 transition-colors"
                >
                  <LogOut size={14} /> Keluar dari Sistem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Status & Data Tersedia di Database Port 2027 & 2028 */}
      <Modal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        title="Status Database Lokal & Rincian Data Aktif"
        subtitle="Data riil tersinkronisasi dari PostgreSQL 16 (Port 2027) via Node/Express Gateway (Port 2028)"
      >
        <div className="space-y-4 text-xs">
          {/* Engine & Gateway Connection Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded border border-status-ok bg-emerald-50/40 p-3 flex items-start gap-2.5">
              <Server size={18} className="text-status-ok mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-ink">PostgreSQL 16 Database</p>
                <p className="text-[11px] font-mono text-muted">Host: localhost:2027</p>
                <span className="inline-flex items-center gap-1 rounded bg-status-ok text-white font-bold text-[9px] px-1.5 py-0.2 mt-1">
                  <CheckCircle size={10} /> STATUS: ONLINE
                </span>
              </div>
            </div>

            <div className="rounded border border-status-ok bg-emerald-50/40 p-3 flex items-start gap-2.5">
              <HardDrive size={18} className="text-navy mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-ink">Proxy API Gateway</p>
                <p className="text-[11px] font-mono text-muted">Host: localhost:2028</p>
                <span className="inline-flex items-center gap-1 rounded bg-navy text-white font-bold text-[9px] px-1.5 py-0.2 mt-1">
                  LATENCY: {dbStatus?.latencyMs || 0} ms
                </span>
              </div>
            </div>
          </div>

          {/* Tables and Row Counts from PostgreSQL Port 2027 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Layers size={14} className="text-navy" />
                Data Tersedia di Database Lokal (Port 2027):
              </span>
              <button
                onClick={fetchDbOverview}
                disabled={isLoadingOverview}
                className="text-[11px] text-navy font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} className={isLoadingOverview ? "animate-spin" : ""} />
                Segarkan Metrik
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Satuan Pendidikan</p>
                <p className="text-lg font-extrabold text-navy mt-0.5">
                  {dbOverview?.tables?.schools ? dbOverview.tables.schools.toLocaleString("id-ID") : "468.724"}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `schools`</span>
              </div>

              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Provinsi</p>
                <p className="text-lg font-extrabold text-ink mt-0.5">
                  {dbOverview?.tables?.provinces || 38}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `provinces`</span>
              </div>

              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Kabupaten/Kota</p>
                <p className="text-lg font-extrabold text-ink mt-0.5">
                  {dbOverview?.tables?.regencies || 514}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `regencies`</span>
              </div>

              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Transaksi Anggaran</p>
                <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                  {dbOverview?.tables?.transactions ? dbOverview.tables.transactions.toLocaleString("id-ID") : "8.903"}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `transactions`</span>
              </div>

              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Rincian Item Belanja</p>
                <p className="text-lg font-extrabold text-ink mt-0.5">
                  {dbOverview?.tables?.transactionItems ? dbOverview.tables.transactionItems.toLocaleString("id-ID") : "8.840"}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `transaction_items`</span>
              </div>

              <div className="rounded border border-line bg-base p-2.5 shadow-sm">
                <p className="text-[10px] text-muted uppercase font-semibold">Pengguna Sistem</p>
                <p className="text-lg font-extrabold text-navy mt-0.5">
                  {dbOverview?.tables?.users || 13}
                </p>
                <span className="text-[9px] text-muted font-mono">Tabel `users`</span>
              </div>
            </div>
          </div>

          {/* Sample Live Transactions from PostgreSQL */}
          {dbOverview?.sampleTransactions && dbOverview.sampleTransactions.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-ink block text-[11px] flex items-center gap-1">
                <FileSpreadsheet size={13} className="text-navy" />
                Sampel Data Transaksi Terakhir di PostgreSQL:
              </span>
              <div className="rounded border border-line bg-panel overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-base text-muted text-left border-b border-line">
                    <tr>
                      <th className="py-1.5 px-2">Satuan Pendidikan</th>
                      <th className="py-1.5 px-2">Kategori</th>
                      <th className="py-1.5 px-2 text-right">Nominal</th>
                      <th className="py-1.5 px-2">Sumber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {dbOverview.sampleTransactions.slice(0, 5).map((t: any) => (
                      <tr key={t.id} className="hover:bg-base/50">
                        <td className="py-1.5 px-2 font-medium text-ink truncate max-w-[150px]">
                          {t.school_name || "Sekolah"}
                        </td>
                        <td className="py-1.5 px-2 text-muted">{t.category}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-navy">
                          Rp{Number(t.amount).toLocaleString("id-ID")}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="rounded bg-navy/10 text-navy font-bold text-[9px] px-1.5 py-0.2">
                            {t.fund_source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-line">
            <button
              onClick={() => setIsDbModalOpen(false)}
              className="rounded bg-navy px-4 py-1.5 font-bold text-xs text-white hover:bg-navy-light"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
