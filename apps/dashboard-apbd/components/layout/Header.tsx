'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Search, Menu, RefreshCw, ShieldCheck, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getInstitusiPendidikanLampung, checkDatabaseHealth, getAvailableYearsFromDb, InstitusiPendidikan } from '@/lib/data/apbd-service';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenInputModal?: () => void;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const {
    activeTahun,
    setActiveTahun,
    toggleSidebar,
    triggerRefresh,
    refreshKey,
  } = useAppStore();

  const [availableYears, setAvailableYears] = useState<{ tahun: number; status: string }[]>([
    { tahun: 2026, status: 'ACTIVE' },
  ]);

  // Database Connection Health State
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; latencyMs: number } | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InstitusiPendidikan[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function pingDb() {
      const status = await checkDatabaseHealth();
      setDbStatus(status);
      const years = await getAvailableYearsFromDb();
      setAvailableYears(years);
      if (years.length > 0 && !years.some(y => y.tahun === activeTahun)) {
        setActiveTahun(years[0].tahun);
      }
    }
    pingDb();
    window.addEventListener('focus', pingDb);
    return () => window.removeEventListener('focus', pingDb);
  }, [refreshKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await getInstitusiPendidikanLampung({ search: trimmed, limit: 5 });
      setSearchResults(res.data);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      router.push(`/dashboard/profil-institusi?id=${searchResults[0].id}`);
      setShowSearchDropdown(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/75 backdrop-blur-xl border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-bg-card transition hidden lg:block">
            <Menu size={18} className="text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Provinsi Lampung
              </span>
            </div>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Database Local Connection Status Badge */}
          <div
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition ${
              dbStatus?.ok
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-rose-50/80 border-rose-200 text-rose-800'
            }`}
            title={dbStatus?.ok ? `PostgreSQL 2025 & Supabase 2026 OK (${dbStatus.latencyMs}ms)` : 'Database offline'}
          >
            <Database size={13} className={dbStatus?.ok ? 'text-emerald-600' : 'text-rose-600'} />
            <span>{dbStatus?.ok ? 'DB Lokal Aktif (100%)' : 'DB Reconnecting...'}</span>
            <span className="font-mono text-[9px] opacity-75">{dbStatus?.latencyMs}ms</span>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium">Tahun:</span>
            <select
              value={activeTahun}
              onChange={(e) => {
                const selectedYear = Number(e.target.value);
                setActiveTahun(selectedYear);
                triggerRefresh();
              }}
              className="select-dropdown font-bold text-indigo-700"
            >
              {availableYears.map((t) => (
                <option key={t.tahun} value={t.tahun}>
                  {t.tahun} {t.tahun === activeTahun ? '✓ (Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => triggerRefresh()}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-card transition border border-slate-200/80 bg-white"
            title="Refresh Data dari PostgreSQL / Supabase"
          >
            <RefreshCw size={15} className="text-indigo-600" />
          </button>

          {/* Search School in Lampung */}
          <div ref={searchRef} className="relative hidden md:block w-48 focus-within:w-72 transition-all duration-300">
            <form onSubmit={handleSearchSubmit}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Cari sekolah di Lampung..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSearchDropdown(true);
                  }
                }}
                className="search-input"
                style={{ width: '100%' }}
              />
            </form>

            {showSearchDropdown && (
              <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-xl border border-slate-200/80 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-text-muted font-mono">Mencari di database PostgreSQL...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">
                      Tidak ditemukan institusi &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    searchResults.map((school) => (
                      <div
                        key={school.id}
                        onClick={() => {
                          router.push(`/dashboard/profil-institusi?id=${school.id}`);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="p-3 hover:bg-slate-50 transition cursor-pointer flex flex-col gap-0.5 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-text-primary truncate">{school.nama_institusi}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {school.jenjang}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          NPSN: {school.npsn} • {school.kecamatan || 'Lampung'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Badge / Manager Placeholder */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 px-3 rounded-xl border border-slate-200 text-xs">
            <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 text-[11px] leading-tight">Super Admin (BPKAD)</span>
              <span className="text-[9px] text-slate-500 font-medium">Provinsi Lampung</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
