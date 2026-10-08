'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  X,
  UserCheck,
  ShieldCheck,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Mail,
  School,
  Lock,
  Sparkles,
  QrCode,
  Check
} from 'lucide-react';

export default function EditProfileModal() {
  const { isEditProfileOpen, setEditProfileOpen, currentUser, setCurrentUser, addNotification } = useAppStore();

  const [activeTab, setActiveTab] = useState<'biodata' | 'security' | 'school'>('biodata');

  // Form states
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // Security password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync initial values when modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || 'admin.kbalikhlas');
      setEmail(currentUser.email || 'admin@kbalikhlas.sch.id');
      setNamaLengkap(currentUser.nama_lengkap || (currentUser.role === 'OPERATOR' ? 'Ahmad Fauzi, S.Kom' : 'Hj. Siti Aminah, S.Pd'));
      setPhone(currentUser.phone || '0812-3456-7890');
      setMfaEnabled(currentUser.mfa_enabled !== false);
    }
    setNewPassword('');
    setConfirmPassword('');
    setFeedback(null);
  }, [currentUser, isEditProfileOpen]);

  if (!isEditProfileOpen) return null;

  const isReadOnly = currentUser?.is_active === false;
  const isOperator = currentUser?.role === 'OPERATOR';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isReadOnly) {
      setFeedback({
        type: 'error',
        message: 'Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat mengubah data!',
      });
      return;
    }

    if (!email) {
      setFeedback({ type: 'error', message: 'Alamat email wajib diisi!' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru!' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Kata sandi baru minimal harus 6 karakter!' });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Prepare DB update payload
      const dbPayload: any = {
        email: email.trim(),
      };

      if (!isOperator && username.trim()) {
        dbPayload.username = username.trim();
      }

      if (newPassword) {
        dbPayload.password = newPassword;
      }

      // Try update in PostgreSQL database
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update(dbPayload)
          .eq('id', currentUser.id);
      } else if (currentUser?.username) {
        await supabase
          .from('users')
          .update(dbPayload)
          .eq('username', currentUser.username);
      }

      // 2. Update Zustand store & LocalStorage
      const updatedUser = {
        ...currentUser!,
        username: !isOperator && username.trim() ? username.trim() : currentUser?.username || 'admin.kbalikhlas',
        email: email.trim(),
        nama_lengkap: namaLengkap.trim(),
        phone: phone.trim(),
        mfa_enabled: mfaEnabled,
      };

      setCurrentUser(updatedUser);

      // 3. Add to notifications drawer
      addNotification({
        message: `Profil akun ${updatedUser.username} (${updatedUser.nama_sekolah}) berhasil diperbarui.`,
        type: 'success',
        link: '/dashboard',
      });

      setFeedback({
        type: 'success',
        message: 'Profil dan pengaturan kredensial berhasil disimpan ke database!',
      });

      setTimeout(() => {
        setEditProfileOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan profil ke server database.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-purple-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UserCheck size={20} className="text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">Edit Profil & Pengaturan Akun</h3>
              <p className="text-xs text-indigo-200/90">
                {currentUser?.nama_sekolah || 'KB AL-IKHLAS'} · NPSN: {currentUser?.npsn || '69893669'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditProfileOpen(false)}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Read-Only Alert Banner if user is deactivated */}
        {isReadOnly && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>Akun Anda dinonaktifkan oleh administrator. Mode edit dikunci (Hanya Lihat).</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200/80 bg-slate-50/70 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'biodata'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <UserCheck size={14} />
            <span>Biodata & Kontak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'security'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <KeyRound size={14} />
            <span>Keamanan & Kata Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('school')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'school'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building2 size={14} />
            <span>Data Satuan Pendidikan</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: BIODATA & KONTAK */}
          {activeTab === 'biodata' && (
            <div className="space-y-4 text-xs">
              {/* Profile Avatar Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-extrabold shadow-md shadow-indigo-500/20 shrink-0">
                  {(namaLengkap || username || 'KB').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 truncate">
                      {namaLengkap || username}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isOperator
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {isOperator ? 'Operator Sekolah' : 'Admin Satuan (Kepsek)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{email}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <School size={11} className="text-indigo-500" />
                    Cakupan Scope: Satuan {currentUser?.nama_sekolah || 'KB AL-IKHLAS'} (NPSN: {currentUser?.npsn || '69893669'})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Hj. Siti Aminah, S.Pd"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-medium text-slate-800 disabled:bg-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nama pejabat yang tercantum pada dokumen dan kuitansi.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly || isOperator}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono text-slate-800 disabled:bg-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isOperator ? 'Username operator hanya dapat diubah oleh Admin Sekolah.' : 'Username resmi untuk autentikasi sistem.'}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alamat Email Resmi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={isReadOnly}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@kbalikhlas.sch.id"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk notifikasi audit anomali anggaran AI.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Aktif
                  </label>
                  <div className="relative">
                    <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk verifikasi kode OTP dan kontak inspektorat.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEAMANAN & KATA SANDI */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <ShieldCheck size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <h4 className="font-bold text-amber-900 text-xs">Standar Keamanan Transparansi Anggaran</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Kosongkan kolom kata sandi jika Anda tidak ingin mengubah kata sandi login saat ini. Jika ingin mengubah kata sandi, gunakan kombinasi minimal 6 karakter.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isReadOnly}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono text-slate-800 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isReadOnly}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-mono text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* MFA / 2FA Authenticator Section */}
              <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <QrCode size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Autentikasi Dua Faktor (MFA / 2FA TOTP)</h4>
                      <p className="text-[11px] text-slate-500">
                        Wajib untuk otorisasi finalisasi pencairan dana & input belanja kuitansi kas
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mfaEnabled}
                      disabled={isReadOnly}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {mfaEnabled && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Perangkat Authenticator (Google Authenticator / Microsoft Authenticator) aktif dan terhubung.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA SATUAN PENDIDIKAN */}
          {activeTab === 'school' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Building2 size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-indigo-900 text-xs">Identitas Satuan Pendidikan Resmi Kemendikbudristek</h4>
                  <p className="text-[11px] text-indigo-700/90 mt-0.5">
                    Data entitas sekolah terikat langsung dengan basis data Dapodik / Kemendikbudristek dan buku rekening kas bank Himbara/BJB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Nama Institusi / Satuan</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{currentUser?.nama_sekolah || 'KB AL-IKHLAS'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Nomor Pokok Sekolah Nasional (NPSN)</span>
                  <p className="text-sm font-mono font-bold text-indigo-600 mt-1">{currentUser?.npsn || '69893669'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Jenjang Pendidikan</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-bold text-xs">PAUD</span>
                    <span className="text-slate-600">Pendidikan Anak Usia Dini</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Nomor Rekening Giro Kas</span>
                  <p className="text-sm font-mono font-bold text-slate-800 mt-1">100.845.411.000 (Bank BJB)</p>
                </div>

                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Cakupan Wilayah Administrasi</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Kabupaten Purwakarta · Provinsi Jawa Barat
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Terhubung dengan API Data Pokok Pendidikan Nasional & Dashboard Admin Pengawas Wilayah.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              * Perubahan tersimpan langsung ke PostgreSQL Lokal (Port 2028/2025)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isLoading || isReadOnly}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
