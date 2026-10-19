'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
  SearchCheck,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { User, UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const [identifier, setIdentifier] = useState('admin@auditor.go.id');
  const [password, setPassword] = useState('AuditorBPK@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick account presets untuk Auditor & BPK
  const quickAccounts = [
    {
      roleTitle: 'Auditor Utama Keuangan Negara (BPK RI)',
      badge: 'Audit Eksternal Negara',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      btnClass: 'hover:border-amber-500 hover:bg-amber-50/50',
      user: {
        id: 'usr-bpk-utama',
        username: 'Dr. Agus Santoso, SE, Ak, CA (BPK RI)',
        email: 'auditor.utama@bpk.go.id',
        role: 'SUPER_ADMIN' as UserRole,
        is_active: true,
        created_at: '2026-01-01',
      },
      password: 'BpkUtama@2026',
      desc: 'Audit investigatif LKPP/LKPD, analisis deviasi pagu vs belanja & pencatatan temuan resmi negara.'
    },
    {
      roleTitle: 'Inspektorat Jenderal (Itjen Kemdikbudristek)',
      badge: 'Pengawas Internal (APIP)',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      btnClass: 'hover:border-indigo-500 hover:bg-indigo-50/50',
      user: {
        id: 'usr-itjen-investigasi',
        username: 'Ir. Dedi Mulyadi (Inspektur Investigasi)',
        email: 'itjen@kemdikbud.go.id',
        role: 'AUDITOR' as UserRole,
        is_active: true,
        created_at: '2026-01-10',
      },
      password: 'ItjenPengawas@2026',
      desc: 'Verifikasi kelengkapan SPJ digital sekolah, validasi scan OCR kuitansi belanja & audit kepatuhan.'
    },
    {
      roleTitle: 'Analis Forensik & Anomali AI-FAA',
      badge: 'AI-FAA Fraud Analytics',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      btnClass: 'hover:border-rose-500 hover:bg-rose-50/50',
      user: {
        id: 'usr-aifaa-analyst',
        username: 'Maya Indrawati, M.Sc (AI-FAA)',
        email: 'analis.aifaa@kpk.go.id',
        role: 'ADMIN' as UserRole,
        is_active: true,
        created_at: '2026-02-01',
      },
      password: 'AiFaaFraud@2026',
      desc: 'Pemantauan skor anomali transaksi berisiko tinggi, deviasi harga pasar & indikasi duplikasi SPJ.'
    }
  ];

  const handleQuickLogin = (acc: typeof quickAccounts[0]) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(`Berhasil login sebagai ${acc.roleTitle}! Mengalihkan...`);
    setCurrentUser(acc.user);

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput || !password) {
      setError('Mohon masukkan email NIP auditor dan kata sandi kedinasan.');
      return;
    }

    setLoading(true);

    const matched = quickAccounts.find(
      (a) =>
        a.user.email.toLowerCase() === cleanInput ||
        a.user.username.toLowerCase().includes(cleanInput)
    );

    if (matched) {
      setCurrentUser(matched.user);
      setSuccessMsg(`Selamat datang kembali, ${matched.user.username}! Mengalihkan...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
      return;
    }

    const customUser: User = {
      id: `usr-auditor-${Date.now()}`,
      username: identifier.includes('@') ? identifier.split('@')[0].replace('.', ' ') : identifier,
      email: identifier.includes('@') ? identifier : `${cleanInput}@auditor.go.id`,
      role: 'AUDITOR',
      is_active: true,
      created_at: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(customUser);
    setSuccessMsg(`Otentikasi berhasil (${customUser.username}). Mengalihkan...`);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-slate-100">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/10 mb-1">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Port :2023 — BPK RI & Inspektorat Jenderal
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard Auditor & BPK
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Portal Pengawasan Investigatif, Verifikasi SPJ Digital, dan Deteksi Anomali Anggaran Pendidikan Nasional
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Quick Login Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Pilih Akun Auditor Resmi:
              </span>
              <span className="text-[11px] text-slate-400">1-Klik Akses Pengawasan</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {quickAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/60 transition-all group flex items-start gap-3 cursor-pointer ${acc.btnClass}`}
                >
                  <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-slate-800 text-amber-400 shrink-0 mt-0.5 border border-slate-800">
                    <UserCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {acc.roleTitle}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold shrink-0 ${acc.badgeClass}`}>
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      {acc.user.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {acc.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              atau gunakan NIP Auditor
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email Kedinasan / NIP Auditor
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="auditor@bpk.go.id"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi Otoritas Audit
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Otoritas Auditor...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard Auditor</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <SearchCheck size={14} className="text-amber-400" />
              Audit Trail Engine Aktif
            </span>
            <a
              href="http://localhost:2020"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Portal Transparansi Warga <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
