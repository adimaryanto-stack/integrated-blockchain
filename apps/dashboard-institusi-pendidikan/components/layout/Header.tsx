'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { tahunAnggaranData } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { Bell, Search, Menu, CheckCheck, Info, AlertTriangle, Sparkles, Database } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showYearSelector?: boolean;
  showSearch?: boolean;
}

interface NotificationItem {
  id: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'warning';
  link: string;
}

export default function Header({ title, subtitle, showYearSelector = true, showSearch = true }: HeaderProps) {
  const { 
    activeTahun, 
    setActiveTahun, 
    toggleSidebar,
    notifications,
    markAsRead,
    markAllAsRead,
    markAllAsUnread,
    currentUser,
    setCurrentUser
  } = useAppStore();
  const [activeTahunList, setActiveTahunList] = useState<{ tahun: number; status: string }[]>(() => {
    if (tahunAnggaranData && tahunAnggaranData.length > 0) {
      return [...tahunAnggaranData].sort((a, b) => a.tahun - b.tahun);
    }
    return [{ tahun: 2026, status: 'ACTIVE' }, { tahun: 2027, status: 'DRAFT' }];
  });
  const router = useRouter();

  // Database Connection Health State
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; latencyMs: number } | null>(null);

  const checkDbHealth = async () => {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('tahun_anggaran')
        .select('id')
        .limit(1);
      const latencyMs = Date.now() - start;
      if (error) {
        setDbStatus({ ok: false, latencyMs });
      } else {
        setDbStatus({ ok: true, latencyMs });
      }
    } catch {
      setDbStatus({ ok: false, latencyMs: Date.now() - start });
    }
  };

  const fetchYearsFromDb = async () => {
    try {
      const { data, error } = await supabase
        .from('tahun_anggaran')
        .select('tahun, status')
        .order('tahun', { ascending: true });
      if (!error && data && data.length > 0) {
        setActiveTahunList(data.map((d: any) => ({ tahun: Number(d.tahun), status: d.status || 'ACTIVE' })));
      }
    } catch (err) {
      console.error('[Institusi Header] Error fetching tahun_anggaran:', err);
    }
  };

  const syncUserStatus = async () => {
    if (!currentUser?.username) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role, is_active')
        .or(`id.eq.${currentUser.id},username.eq.${currentUser.username}`)
        .limit(1);
      if (!error && data && data.length > 0) {
        const dbUser = data[0];
        if (dbUser.is_active !== currentUser.is_active || dbUser.email !== currentUser.email) {
          setCurrentUser({
            ...currentUser,
            is_active: dbUser.is_active,
            email: dbUser.email || currentUser.email,
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchYearsFromDb();
    checkDbHealth();
    syncUserStatus();
    const interval = setInterval(() => {
      checkDbHealth();
      syncUserStatus();
    }, 5000);
    const onFocus = () => {
      fetchYearsFromDb();
      checkDbHealth();
      syncUserStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.username, currentUser?.id]);

  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;
  const allRead = notifications.length > 0 && notifications.every(n => !n.unread);

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const isReadOnly = currentUser?.is_active === false;

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-border px-6 py-4">
      {/* Sticky Read-Only Warning Banner */}
      {isReadOnly && (
        <div className="bg-rose-600 text-white px-6 py-2.5 -mx-6 -mt-4 mb-4 flex items-center justify-between text-xs shadow-md border-b border-rose-700 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">⛔</span>
            <span className="leading-snug">
              <strong>PERINGATAN:</strong> Akun {currentUser?.role === 'ADMIN' ? 'Admin Sekolah' : 'Operator'} Anda berstatus <strong>NON-AKTIF (Hanya Lihat)</strong>. Anda tidak dapat melakukan input, pengubahan data, persetujuan, atau pengunggahan dokumen. {currentUser?.role === 'ADMIN' ? 'Hubungi Super Admin Global untuk mengaktifkan kembali.' : 'Hubungi Admin Sekolah untuk mengaktifkan kembali.'}
            </span>
          </div>
          <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase font-bold tracking-wider shrink-0 border border-white/30">
            Akses Dibatasi (Hanya Lihat)
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-bg-card transition hidden lg:block">
            <Menu size={18} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Database Local Connection Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition ${
              dbStatus?.ok
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/80 border-rose-200 text-rose-800'
            }`}
            title={dbStatus?.ok ? `PostgreSQL 2025 & Supabase 2026 OK (${dbStatus.latencyMs}ms)` : 'Database offline / reconnecting'}
          >
            <Database size={13} className={dbStatus?.ok ? 'text-emerald-600' : 'text-rose-600'} />
            <span>{dbStatus?.ok ? 'DB Lokal Aktif (100%)' : 'DB Reconnecting...'}</span>
            <span className="font-mono text-[9px] opacity-75">{dbStatus?.latencyMs ?? 0}ms</span>
          </div>

          {/* Year selector */}
          {showYearSelector && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Tahun:</span>
              <select
                value={activeTahun}
                onChange={(e) => setActiveTahun(Number(e.target.value))}
                className="select-dropdown font-bold text-indigo-700"
              >
                {activeTahunList.map(t => (
                  <option key={t.tahun} value={t.tahun}>
                    {t.tahun} {t.tahun === activeTahun ? '✓ (Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          {showSearch && (
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari..."
                className="search-input w-40"
              />
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className={`relative p-2 rounded-lg transition hover:bg-bg-card ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-text-secondary'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <>
                {/* Click-outside backdrop overlay */}
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200/80 shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ right: 0 }}
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo-500" />
                      Notifikasi Terbaru
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-indigo-600 hover:text-indigo-850 select-none">
                      <input
                        type="checkbox"
                        checked={allRead}
                        onChange={(e) => {
                          if (e.target.checked) {
                            markAllAsRead();
                          } else {
                            markAllAsUnread();
                          }
                        }}
                        className="h-3 w-3 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Semua Dibaca</span>
                    </label>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            // Mark as read
                            markAsRead(n.id);
                            // Close dropdown
                            setShowNotifications(false);
                            // Navigate
                            router.push(n.link);
                          }}
                          className={`p-3.5 flex gap-3 cursor-pointer transition-colors ${n.unread ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {n.type === 'success' && <div className="p-1 rounded-md bg-emerald-100 text-emerald-600"><CheckCheck size={14} /></div>}
                            {n.type === 'info' && <div className="p-1 rounded-md bg-blue-100 text-blue-600"><Info size={14} /></div>}
                            {n.type === 'warning' && <div className="p-1 rounded-md bg-amber-100 text-amber-600"><AlertTriangle size={14} /></div>}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${n.unread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              {n.time}
                            </span>
                          </div>

                          {n.unread && (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold">Sistem Transparansi Pendidikan v1.0</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Quick Pill / Link to Login */}
          <Link
            href="/login"
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border shadow-xs transition-all text-xs ${
              isReadOnly 
                ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/70' 
                : 'bg-white/80 border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
            title="Klik untuk ganti akun atau login"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
              isReadOnly
                ? 'bg-rose-600'
                : currentUser?.role === 'OPERATOR' 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {(currentUser?.username || 'KB').substring(0, 2).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-700 hidden sm:inline truncate max-w-[120px]">
              {currentUser?.username || 'admin.kbalikhlas'}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              isReadOnly
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : currentUser?.role === 'OPERATOR' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {isReadOnly 
                ? `${currentUser?.role === 'ADMIN' ? 'Admin' : 'Operator'} (Non-Aktif)` 
                : currentUser?.role === 'OPERATOR' ? 'Operator' : 'Admin'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
