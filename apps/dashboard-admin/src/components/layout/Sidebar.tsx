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
  Bot,
  Siren,
  GraduationCap,
  CreditCard,
  Key
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  module: string;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon?: any;
  items: NavItem[];
}

export function Sidebar() {
  const { users, aiFlags, bankMutations, currentUser, canAccess } = useAdminStore();

  const pendingUsersCount = users.filter((u) => u.status === "menunggu").length;
  const activeFlagsCount = aiFlags.filter((f) => f.status !== "selesai").length;
  const unmatchedBankCount = bankMutations.filter((b) => b.matchStatus === "tidak cocok").length;

  const rawGroups: NavGroup[] = [
    {
      id: "utama",
      title: "Menu Utama",
      items: [
        { to: "/", label: "Beranda & Ringkasan", icon: LayoutDashboard, end: true, module: "Beranda" },
      ]
    },
    {
      id: "users_security",
      title: "Manajemen Pengguna & Akses",
      items: [
        {
          to: "/users",
          label: "Manajemen Pengguna",
          icon: Users,
          badge: pendingUsersCount > 0 ? pendingUsersCount : undefined,
          badgeColor: "bg-status-warn text-white",
          module: "Manajemen Pengguna"
        },
        { to: "/access-control", label: "Access Control Matrix", icon: KeyRound, module: "Access Control Matrix" },
        { to: "/audit-log", label: "Audit Log Keamanan", icon: ScrollText, module: "Audit Log" },
      ]
    },
    {
      id: "operations",
      title: "Operasional & Monitoring",
      items: [
        { to: "/data-sources", label: "Data Source Monitor", icon: DatabaseZap, module: "Data Source Monitor" },
        {
          to: "/ai-faa",
          label: "AI-FAA Console",
          icon: ShieldAlert,
          badge: activeFlagsCount > 0 ? activeFlagsCount : undefined,
          badgeColor: "bg-status-danger text-white",
          module: "AI-FAA Console"
        },
        {
          to: "/bank-mutations",
          label: "Mutasi Bank Himbara",
          icon: Landmark,
          badge: unmatchedBankCount > 0 ? unmatchedBankCount : undefined,
          badgeColor: "bg-gold text-ink font-bold",
          module: "Mutasi Bank Himbara"
        },
        { to: "/wilayah", label: "Master Data Wilayah", icon: MapPinned, module: "Master Data Wilayah" },
        { to: "/broadcast", label: "Broadcast Pengumuman", icon: Megaphone, module: "Broadcast" },
      ]
    },
    {
      id: "api_keys",
      title: "Pengaturan API Key & Integrasi",
      icon: Key,
      items: [
        { to: "/bank-settings", label: "API Bank Himbara (SNAP)", icon: CreditCard, module: "Pengaturan API Bank" },
        { to: "/ai-settings", label: "API AI Aksara (Gemini)", icon: Bot, module: "Pengaturan AI Aksara" },
        { to: "/polsek-settings", label: "API Polsek Terdekat", icon: Siren, module: "Pengaturan API Polsek" },
        { to: "/schools-settings", label: "API Data Sekolah Nasional", icon: GraduationCap, module: "Pengaturan API Data Sekolah" },
      ]
    }
  ];

  // Filter items in each group by RBAC
  const filteredGroups = rawGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => {
        if (item.module === "Beranda") return true;
        return canAccess(item.module, "view");
      })
    }))
    .filter((grp) => grp.items.length > 0);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-navy text-white shadow-xl z-20">
      {/* Brand Header */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink font-bold text-sm shadow">
            <ShieldCheck size={20} className="text-navy" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight text-white tracking-wide">
              Dashboard Admin
            </p>
            <p className="text-[11px] text-white/50 leading-tight">Integrated Blockchain</p>
          </div>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-white/10">
        {filteredGroups.map((grp, grpIdx) => (
          <div key={grp.id} className="space-y-1">
            {/* Group Header */}
            <div className={`px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-wider ${
              grpIdx > 0 ? "pt-3 border-t border-white/10" : "pt-1"
            }`}>
              <div className="flex items-center gap-1.5">
                {grp.icon && <grp.icon size={11} className="text-gold/70" />}
                <span>{grp.title}</span>
              </div>
              <span className="text-[9px] text-white/30 font-mono font-normal">({grp.items.length})</span>
            </div>

            {/* Group Items */}
            <div className="space-y-1">
              {grp.items.map(({ to, label, icon: Icon, end, badge, badgeColor }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/15 text-white font-semibold shadow-inner ring-1 ring-white/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={16} strokeWidth={1.8} className="shrink-0 text-white/80" />
                    <span className="truncate">{label}</span>
                  </div>
                  {badge !== undefined && (
                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold shadow-sm ${badgeColor}`}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
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
