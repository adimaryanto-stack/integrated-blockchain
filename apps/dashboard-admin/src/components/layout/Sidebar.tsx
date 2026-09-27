import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  DatabaseZap,
  ShieldAlert,
  Landmark,
  Megaphone,
  MapPinned,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";

export function Sidebar() {
  const { users, aiFlags, bankMutations, currentUser, canAccess } = useAdminStore();

  const pendingUsersCount = users.filter((u) => u.status === "menunggu").length;
  const activeFlagsCount = aiFlags.filter((f) => f.status !== "selesai").length;
  const unmatchedBankCount = bankMutations.filter((b) => b.matchStatus === "tidak cocok").length;

  const allItems = [
    { to: "/", label: "Beranda", icon: LayoutDashboard, end: true, module: "Beranda" },
    { to: "/users", label: "Manajemen Pengguna", icon: Users, badge: pendingUsersCount > 0 ? pendingUsersCount : undefined, badgeColor: "bg-status-warn text-white", module: "Manajemen Pengguna" },
    { to: "/audit-log", label: "Audit Log", icon: ScrollText, module: "Audit Log" },
    { to: "/data-sources", label: "Data Source Monitor", icon: DatabaseZap, module: "Data Source Monitor" },
    { to: "/ai-faa", label: "AI-FAA Console", icon: ShieldAlert, badge: activeFlagsCount > 0 ? activeFlagsCount : undefined, badgeColor: "bg-status-danger text-white", module: "AI-FAA Console" },
    { to: "/bank-mutations", label: "Mutasi Bank Himbara", icon: Landmark, badge: unmatchedBankCount > 0 ? unmatchedBankCount : undefined, badgeColor: "bg-gold text-ink", module: "Mutasi Bank Himbara" },
    { to: "/broadcast", label: "Broadcast", icon: Megaphone, module: "Broadcast" },
    { to: "/wilayah", label: "Master Data Wilayah", icon: MapPinned, module: "Master Data Wilayah" },
    { to: "/access-control", label: "Access Control Matrix", icon: KeyRound, module: "Access Control Matrix" },
  ];

  // Filter menu items by RBAC — Beranda always visible, others check canAccess("module", "view")
  const items = allItems.filter((item) => {
    if (item.module === "Beranda") return true;
    return canAccess(item.module, "view");
  });

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-navy text-white shadow-xl z-20">
      {/* Brand Header */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-ink font-bold text-sm">
            <ShieldCheck size={18} className="text-navy" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight text-white tracking-wide">
              Dashboard Admin
            </p>
            <p className="text-[11px] text-white/50 leading-tight">Integrated Blockchain</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {items.map(({ to, label, icon: Icon, end, badge, badgeColor }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-semibold shadow-inner"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon size={16} strokeWidth={2} className="shrink-0" />
              <span>{label}</span>
            </div>
            {badge !== undefined && (
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer System & Scope Info */}
      <div className="border-t border-white/10 p-3.5 bg-navy-dark/40 text-[11px] text-white/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/40">Status Konsol:</span>
          <span className="flex items-center gap-1 text-status-ok font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-pulse" />
            Port :2026 Online
          </span>
        </div>
        <div className="truncate text-[10px] text-white/40">
          Admin: {currentUser?.name || "Belum Login"}
        </div>
        <div className="truncate text-[10px] text-gold/80 font-mono">
          Scope: {currentUser?.scopeType || "global"}
        </div>
      </div>
    </aside>
  );
}
