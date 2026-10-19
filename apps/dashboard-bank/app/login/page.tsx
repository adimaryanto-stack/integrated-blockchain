'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Landmark,
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
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { User, UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const [identifier, setIdentifier] = useState('superadmin@davincibank.co.id');
  const [password, setPassword] = useState('BankHimbara@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick account presets untuk Bank Penyalur
  const quickAccounts = [
    {
      roleTitle: 'Head of Treasury & Kas (Bank Mandiri)',
      badge: 'Otorisasi Kas Utama',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btnClass: 'hover:border-emerald-500 hover:bg-emerald-50/50',
      user: {
        id: 'usr-bank-mandiri',
        username: 'Rian Hermawan (Head of Treasury)',
        email: 'treasury@bankmandiri.co.id',
        role: 'SUPER_ADMIN' as UserRole,
        is_active: true,
        created_at: '2026-01-01',
      },
      password: 'MandiriTreasury@2026',
      desc: 'Otorisasi penyaluran dana kas APBN/APBD ke rekening resmi sekolah seluruh Indonesia.'
    },
    {
      roleTitle: 'Operator Penyaluran Kas (Bank BRI)',
      badge: 'Disbursement Officer',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      btnClass: 'hover:border-cyan-500 hover:bg-cyan-50/50',
      user: {
        id: 'usr-bank-bri',
        username: 'Siti Nurhaliza (Disbursement Officer)',
        email: 'disbursement@bankbri.co.id',
        role: 'ADMIN' as UserRole,
        is_active: true,
        created_at: '2026-01-10',
      },
      password: 'BriDisburse@2026',
      desc: 'Pemrosesan batch transfer, validasi nomor rekening institusi & rekonsiliasi kas harian.'
    },
    {
      roleTitle: 'Compliance & Audit Perbankan (Bank BNI)',
      badge: 'Kepatuhan & Audit',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      btnClass: 'hover:border-blue-500 hover:bg-blue-50/50',
      user: {
        id: 'usr-bank-bni',
        username: 'Bambang Wijaya (Compliance Officer)',
        email: 'compliance@bankbni.co.id',
        role: 'AUDITOR' as UserRole,
        is_active: true,
        created_at: '2026-02-01',
      },
      password: 'BniCompliance@2026',
      desc: 'Audit kepatuhan transfer, rekonsiliasi mutasi rekening koran dan deteksi anomali transfer.'
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
      setError('Mohon masukkan email korporat bank atau ID Petugas dan kata sandi.');
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
      setSuccessMsg(`Selamat datang, ${matched.user.username}! Mengalihkan...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
      return;
    }

    const customUser: User = {
      id: `usr-bank-${Date.now()}`,
      username: identifier.includes('@') ? identifier.split('@')[0].replace('.', ' ') : identifier,
      email: identifier.includes('@') ? identifier : `${cleanInput}@davincibank.co.id`,
      role: 'ADMIN',
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
      <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10 mb-1">
            <CreditCard className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Port :2022 — Konsorsium Bank Penyalur
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard Bank Penyalur
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Portal Penyaluran Anggaran Pendidikan & Verifikasi Rekening Satuan Pendidikan Terpadu
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Quick Login Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                Pilih Akun Bank Himbara / Daerah:
              </span>
              <span className="text-[11px] text-slate-400">1-Klik Akses Cepat</span>
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
                  <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-slate-800 text-emerald-400 shrink-0 mt-0.5 border border-slate-800">
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
              atau gunakan ID Petugas Bank
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
                Alamat Email Bank / ID Petugas Treasury
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="petugas@bankmandiri.co.id"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PIN Otorisasi / Kata Sandi
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
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
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Otorisasi Bank...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard Bank Penyalur</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              Sertifikasi PCI-DSS Bank Terhubung
            </span>
            <a
              href="http://localhost:2020"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Portal Transparansi Warga <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
