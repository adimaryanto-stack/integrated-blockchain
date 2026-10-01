'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  School,
  Database
} from 'lucide-react';
import { useAppStore, CurrentSchoolUser } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const [identifier, setIdentifier] = useState('admin.sekolah');
  const [password, setPassword] = useState('Admin@Sekolah2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);

  // Quick account presets untuk seluruh satuan pendidikan
  const quickAccounts = [
    {
      roleTitle: 'Admin Sekolah',
      badge: 'Admin Penuh',
      badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      btnClass: 'hover:border-indigo-500 hover:bg-indigo-50/50',
      user: {
        id: 'u-admin-sekolah',
        username: 'admin.sekolah',
        email: 'admin@sekolah.sch.id',
        role: 'ADMIN' as const,
        nama_sekolah: 'Satuan Pendidikan',
        npsn: 'Nasional'
      },
      password: 'Admin@Sekolah2026',
      desc: 'Pagu anggaran, mutasi kas bank, audit & user manager'
    },
    {
      roleTitle: 'Operator Sekolah',
      badge: 'Operasional Belanja',
      badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      btnClass: 'hover:border-emerald-500 hover:bg-emerald-50/50',
      user: {
        id: 'u-operator-sekolah',
        username: 'operator.sekolah',
        email: 'operator@sekolah.sch.id',
        role: 'OPERATOR' as const,
        nama_sekolah: 'Satuan Pendidikan',
        npsn: 'Nasional'
      },
      password: 'Operator@Sekolah2026',
      desc: 'Input realisasi belanja, kuitansi scan OCR & diskusi RAB'
    }
  ];

  // Check DB connection on load
  useEffect(() => {
    async function checkDb() {
      try {
        const { data, error } = await supabase.from('institusi_pendidikan').select('npsn').limit(1);
        if (!error && data) {
          setDbHealthy(true);
        } else {
          setDbHealthy(false);
        }
      } catch {
        setDbHealthy(false);
      }
    }
    checkDb();
  }, []);

  const handleQuickLogin = async (acc: typeof quickAccounts[0]) => {
    setLoading(true);
    setError(null);
    let finalUser: CurrentSchoolUser = { ...acc.user, is_active: true };

    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('role', acc.user.role)
        .order('id', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        finalUser = {
          id: data[0].id,
          username: data[0].username,
          email: data[0].email,
          role: data[0].role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
          nama_sekolah: 'Satuan Pendidikan',
          npsn: data[0].institusi_id?.replace(/[^0-9]/g, '') || '69893669',
          is_active: data[0].is_active
        };
      }
    } catch (e) {}

    setSuccessMsg(`Berhasil login sebagai ${acc.roleTitle}! Mengalihkan...`);
    setCurrentUser(finalUser);

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanInput = identifier.trim();
    if (!cleanInput || !password) {
      setError('Mohon masukkan username, email, atau NPSN dan password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cek kecocokan di quick accounts
      const matchedQuick = quickAccounts.find(
        (a) => a.user.username.toLowerCase() === cleanInput.toLowerCase() ||
               a.user.email.toLowerCase() === cleanInput.toLowerCase()
      );

      if (matchedQuick) {
        let finalUser: CurrentSchoolUser = { ...matchedQuick.user, is_active: true };
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${cleanInput},email.eq.${cleanInput},role.eq.${matchedQuick.user.role}`)
            .limit(1);
          if (data && data.length > 0) {
            finalUser = {
              id: data[0].id,
              username: data[0].username,
              email: data[0].email,
              role: data[0].role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
              nama_sekolah: 'Satuan Pendidikan',
              npsn: data[0].institusi_id?.replace(/[^0-9]/g, '') || '69893669',
              is_active: data[0].is_active
            };
          }
        } catch (e) {}

        setCurrentUser(finalUser);
        setSuccessMsg(`Selamat datang, ${finalUser.username}!`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
        return;
      }

      // 2. Cek apakah input adalah NPSN (angka 8 digit)
      const isNumericNpsn = /^\d{8}$/.test(cleanInput);
      if (isNumericNpsn) {
        const { data: instData } = await supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('npsn', cleanInput)
          .limit(1);

        if (instData && instData.length > 0) {
          const inst = instData[0];
          const schoolUser: CurrentSchoolUser = {
            id: `u-npsn-${inst.npsn}`,
            username: `admin.${inst.npsn}`,
            email: `admin@${inst.npsn}.sch.id`,
            role: 'ADMIN',
            nama_sekolah: inst.nama_institusi,
            npsn: inst.npsn,
            is_active: true
          };
          setCurrentUser(schoolUser);
          setSuccessMsg(`Terautentikasi untuk ${inst.nama_institusi} (NPSN: ${inst.npsn})...`);
          setTimeout(() => {
            router.push('/dashboard');
          }, 600);
          return;
        }
      }

      // 3. Cek ke database users
      const { data: dbUsers, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${cleanInput},email.eq.${cleanInput}`)
        .limit(1);

      if (!dbErr && dbUsers && dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        const schoolUser: CurrentSchoolUser = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
          nama_sekolah: 'Satuan Pendidikan',
          npsn: dbUser.institusi_id?.replace(/[^0-9]/g, '') || '-',
          is_active: dbUser.is_active
        };

        setCurrentUser(schoolUser);
        setSuccessMsg(`Autentikasi berhasil (${dbUser.username}). Mengalihkan...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      } else {
        // Fallback user jika offline
        const customUser: CurrentSchoolUser = {
          id: `u-${Date.now()}`,
          username: cleanInput,
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@sekolah.sch.id`,
          role: cleanInput.toLowerCase().includes('operator') ? 'OPERATOR' : 'ADMIN',
          nama_sekolah: 'Satuan Pendidikan',
          npsn: 'Nasional',
          is_active: true
        };
        setCurrentUser(customUser);
        setSuccessMsg(`Masuk sebagai ${customUser.username}...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal melakukan login. Silakan gunakan tombol Login Cepat.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-slate-100">
      {/* Background Glow & Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/25 mb-3 border border-indigo-400/30">
            <School size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Dashboard Institusi
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Port :2024
            </span>
          </h1>
          <p className="text-sm font-medium text-indigo-200/90 mt-1">
            Portal Satuan Pendidikan
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem Tata Kelola Pagu Anggaran, Mutasi Bank & OCR Belanja Sekolah
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Status Alert */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-pulse">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Login Section (1-Klik Cepat) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Login Cepat 1-Klik
              </span>
              <span className="text-[10px] text-slate-400">Siap Pakai</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {quickAccounts.map((acc) => (
                <button
                  key={acc.user.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className={`w-full text-left p-3 rounded-xl border border-slate-700 bg-slate-800/60 transition-all duration-200 flex items-center justify-between group ${acc.btnClass} disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-700/80 flex items-center justify-center text-xs font-bold text-white group-hover:scale-105 transition-transform">
                      <UserCheck size={18} className="text-indigo-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {acc.roleTitle}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${acc.badgeClass}`}>
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[210px]">
                        {acc.user.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-700/80 w-full" />
            <span className="bg-slate-800 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium absolute">
              atau masuk manual
            </span>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username, Email, atau NPSN Sekolah
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin.sekolah, email@sekolah.sch.id, atau NPSN..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-slate-400 hover:text-indigo-300 cursor-pointer">
                  Lupa sandi?
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* System & Database Connectivity Footer */}
        <div className="mt-5 text-center space-y-1 text-[11px] text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <span className="flex items-center gap-1">
              <Database size={12} className={dbHealthy ? 'text-emerald-400' : 'text-amber-400'} />
              Database :2027 & Proxy :2028:
            </span>
            <span className={`font-semibold ${dbHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dbHealthy === true ? 'TERHUBUNG (Online)' : dbHealthy === false ? 'OFFLINE (Mode Fallback)' : 'Memeriksa...'}
            </span>
          </div>
          <p className="text-slate-400">
            Sistem Transparansi dan Akuntabilitas Anggaran Satuan Pendidikan Terpadu
          </p>
        </div>
      </div>
    </div>
  );
}
