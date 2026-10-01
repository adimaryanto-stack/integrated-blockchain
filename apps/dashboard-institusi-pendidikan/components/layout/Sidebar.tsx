'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard, DollarSign, MapPin, Building2,
  GraduationCap, Users, ChevronDown, ChevronRight,
  Menu, X, Landmark, School, ShieldCheck, CreditCard, ClipboardList, FolderKanban, LogOut
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

const jenjangItems = [
  { label: 'Universitas', href: '/dashboard/jenjang/universitas' },
  { label: 'SMA', href: '/dashboard/jenjang/sma' },
  { label: 'SMP', href: '/dashboard/jenjang/smp' },
  { label: 'SD', href: '/dashboard/jenjang/sd' },
  { label: 'PAUD', href: '/dashboard/jenjang/paud' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, dbData, isSupabaseMode, currentUser, setCurrentUser, logout } = useAppStore();
  const [jenjangOpen, setJenjangOpen] = useState(pathname.includes('/jenjang'));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('active_school_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.username && parsed.username !== currentUser?.username) {
            setCurrentUser(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  const isActive = (href: string) => pathname === href;
  const isJenjangActive = pathname.includes('/jenjang');

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-border shadow-sm lg:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar fixed top-0 left-0 h-screen z-40 w-64 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static`}>
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary leading-tight">Dashboard</h1>
              <p className="text-[10px] text-text-muted">Institusi Pendidikan</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>


          <Link href="/dashboard/profil-institusi" className={`sidebar-item ${pathname.includes('/profil-institusi') ? 'active' : ''}`}>
            <School size={18} />
            <span>Profil Institusi</span>
          </Link>

          <Link href="/dashboard/mutasi-rekening" className={`sidebar-item ${pathname.includes('/mutasi-rekening') ? 'active' : ''}`}>
            <Landmark size={18} />
            <span>Mutasi rekening</span>
          </Link>

          <Link href="/dashboard/rencana-anggaran" className={`sidebar-item ${pathname === '/dashboard/rencana-anggaran' ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span>Rencana (RAB)</span>
          </Link>

          <Link href="/dashboard/rencana-anggaran/paket-project" className={`sidebar-item pl-10 ${pathname.includes('/paket-project') ? 'active' : ''}`}>
            <FolderKanban size={16} />
            <span>Paket Project</span>
          </Link>

          <Link href="/dashboard/pengeluaran" className={`sidebar-item ${pathname.includes('/pengeluaran') ? 'active' : ''}`}>
            <CreditCard size={18} />
            <span>Pengeluaran</span>
          </Link>

          <Link href="/dashboard/audit" className={`sidebar-item ${pathname.includes('/audit') ? 'active' : ''}`}>
            <ShieldCheck size={18} />
            <span>Audit Anggaran</span>
          </Link>

          <Link href="/dashboard/users" className={`sidebar-item ${isActive('/dashboard/users') ? 'active' : ''}`}>
            <Users size={18} />
            <span>User Manager</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {(() => {
            const isReadOnly = currentUser?.is_active === false;
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${
                    isReadOnly
                      ? 'bg-rose-600 shadow-sm'
                      : currentUser?.role === 'OPERATOR' 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {(currentUser?.username || 'KB').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-text-primary truncate">{currentUser?.username || 'admin.kbalikhlas'}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                        isReadOnly
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : currentUser?.role === 'OPERATOR' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {isReadOnly ? 'Non-Aktif' : currentUser?.role === 'OPERATOR' ? 'Operator' : 'Admin'}
                      </span>
                      <span className="text-[10px] text-text-muted truncate max-w-[80px]" title={currentUser?.email}>
                        {currentUser?.email?.split('@')[0]}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    title="Ganti Akun / Logout"
                    className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  >
                    <LogOut size={15} />
                  </Link>
                </div>
                {isReadOnly && (
                  <div className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold text-center leading-tight">
                    🔒 Akses Non-Aktif (Hanya Lihat)
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </aside>
    </>
  );
}
