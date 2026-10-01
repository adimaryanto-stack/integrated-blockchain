'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { User, UserRole } from '@/types';
import { Search, Plus, Edit3, Trash2, UserCheck, UserX, ShieldCheck, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

const roleConfig: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin Global', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  ADMIN: { label: 'Admin Sekolah', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  OPERATOR: { label: 'Operator Sekolah', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  ADMIN_PROVINSI: { label: 'Admin Provinsi', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ADMIN_KABKOTA: { label: 'Admin Kab/Kota', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  VIEWER: { label: 'Viewer Internal', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  AUDITOR: { label: 'Auditor Internal', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  PUBLIC_RESEARCHER: { label: 'Public Researcher', color: 'bg-teal-100 text-teal-700 border-teal-300' },
};

export default function UsersPage() {
  const { currentUser, setCurrentUser } = useAppStore();
  const isOperator = currentUser?.role === 'OPERATOR';
  const isReadOnly = currentUser?.is_active === false;

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('OPERATOR');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Helper check: apakah akun ini milik pengguna yang sedang login
  const isSelf = (user: User) => {
    if (!currentUser) return false;
    return (
      (currentUser.id && user.id === currentUser.id) ||
      (currentUser.username && user.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      (currentUser.email && user.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('users')
      .select('*')
      .order('username', { ascending: true });

    if (!error && rows) {
      setData(rows);
      if (currentUser) {
        const matchingCurrent = rows.find(r => 
          (currentUser.id && r.id === currentUser.id) ||
          (currentUser.username && r.username.toLowerCase() === currentUser.username.toLowerCase())
        );
        if (matchingCurrent && matchingCurrent.is_active !== currentUser.is_active) {
          setCurrentUser({ ...currentUser, is_active: matchingCurrent.is_active });
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Auto-refresh when switching back to tab
    const handleFocus = () => fetchUsers();
    window.addEventListener('focus', handleFocus);

    // Auto-poll every 4 seconds to sync status changes from Dashboard Admin immediately
    const pollInterval = setInterval(() => {
      fetchUsers();
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (roleConfig[u.role]?.label || u.role).toLowerCase().includes(q)
    );
  }, [data, search]);

  const openAddModal = () => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat menambah pengguna baru!');
      return;
    }
    if (isOperator) {
      alert('Operator Sekolah tidak diizinkan menambahkan pengguna baru. Hanya Admin Sekolah yang dapat menambah akun.');
      return;
    }
    setEditUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormRole('OPERATOR');
    setFormPassword('');
    setFormConfirmPassword('');
    setFeedbackMsg(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat mengubah data!');
      return;
    }

    if (user.role === 'SUPER_ADMIN') {
      alert('Super Admin Global diproteksi dan tidak dapat diedit dari dasbor sekolah!');
      return;
    }

    if (isOperator) {
      if (!isSelf(user)) {
        alert('Akses Ditolak: Operator sekolah hanya bisa mengganti email dan password akun miliknya sendiri!');
        return;
      }
    }

    setEditUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPassword('');
    setFormConfirmPassword('');
    setFeedbackMsg(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat mengubah data!');
      return;
    }

    if (!formEmail) {
      alert('Email tidak boleh kosong!');
      return;
    }

    if (formPassword && formPassword !== formConfirmPassword) {
      alert('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (isOperator) {
      // Khusus Operator: Hanya boleh ubah email & password akun miliknya sendiri
      if (!editUser || !isSelf(editUser)) {
        alert('Akses Ditolak: Operator sekolah hanya bisa mengganti email dan password akun miliknya sendiri!');
        return;
      }

      const updatePayload: any = { email: formEmail };
      if (formPassword) {
        updatePayload.password = formPassword;
      }

      // Update di local state
      setData(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updatePayload } : u));

      // Update di store & localStorage agar langsung tersinkron ke Header/Sidebar
      if (currentUser) {
        setCurrentUser({ ...currentUser, email: formEmail });
      }

      // Simpan ke database PostgreSQL via Supabase/Proxy
      await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', editUser.id);

      setFeedbackMsg('Email dan kata sandi Anda berhasil diperbarui!');
      setTimeout(() => {
        setShowModal(false);
      }, 700);
      return;
    }

    // Alur Admin Sekolah
    if (!formUsername) {
      alert('Username tidak boleh kosong!');
      return;
    }

    if (editUser) {
      if (editUser.role === 'SUPER_ADMIN') {
        alert('Super Admin Global tidak dapat diubah dari dasbor sekolah!');
        return;
      }
      if (editUser.role === 'ADMIN' && !isSelf(editUser)) {
        alert('Akses Ditolak: Akun Admin Sekolah lain hanya dapat dikelola oleh Super Admin Global!');
        return;
      }

      // Role akun sendiri diproteksi dan tidak boleh diubah
      const targetRole: UserRole = isSelf(editUser) ? editUser.role : 'OPERATOR';
      const updatedUser = { ...editUser, username: formUsername, email: formEmail, role: targetRole };
      if (formPassword) {
        (updatedUser as any).password = formPassword;
      }

      setData(prev => prev.map(u => u.id === editUser.id ? updatedUser : u));
      if (currentUser && isSelf(editUser)) {
        setCurrentUser({ ...currentUser, username: formUsername, email: formEmail });
      }

      const updatePayload: any = { username: formUsername, email: formEmail, role: targetRole };
      if (formPassword) {
        updatePayload.password = formPassword;
      }

      await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', editUser.id);
    } else {
      // Sesuai dokumen hak akses: Admin Sekolah HANYA dapat membuat akun Operator Sekolah
      const newUser: User = {
        id: `u-sch-${Date.now()}`,
        username: formUsername,
        email: formEmail,
        role: 'OPERATOR',
        provinsi_id: 'p-1',
        kabupaten_kota_id: 'r-060600',
        institusi_id: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
        is_active: true,
        created_at: new Date().toISOString().split('T')[0]
      };
      if (formPassword) {
        (newUser as any).password = formPassword;
      }
      setData(prev => [...prev, newUser]);
      await supabase
        .from('users')
        .insert([newUser]);
    }
    setShowModal(false);
  };

  const handleToggleActive = async (id: string) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat mengubah status pengguna!');
      return;
    }
    if (isOperator) {
      alert('Akses Ditolak: Operator sekolah tidak memiliki wewenang untuk mengubah status pengguna!');
      return;
    }
    const user = data.find(u => u.id === id);
    if (!user) return;

    if (user.role === 'SUPER_ADMIN') {
      alert('Akses Ditolak: Super Admin Global tidak dapat dinonaktifkan dari dasbor sekolah!');
      return;
    }

    // PENTING: Admin sekolah TIDAK BISA menonaktifkan dirinya sendiri!
    if (isSelf(user)) {
      alert('Akses Ditolak: Anda tidak dapat menonaktifkan akun Admin Anda sendiri!');
      return;
    }

    // Sesuai hak_akses_sekolah.md: Admin Sekolah hanya mengelola akun Operator
    if (user.role !== 'OPERATOR') {
      alert('Akses Ditolak: Sesuai aturan hak akses, Admin Sekolah hanya dapat menonaktifkan akun Operator Sekolah.');
      return;
    }

    const newActiveState = !user.is_active;
    setData(prev => prev.map(u => u.id === id ? { ...u, is_active: newActiveState } : u));
    
    await supabase
      .from('users')
      .update({ is_active: newActiveState })
      .eq('id', id);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat menghapus pengguna!');
      return;
    }
    if (isOperator) {
      alert('Akses Ditolak: Operator sekolah tidak memiliki wewenang untuk menghapus akun pengguna!');
      return;
    }
    const user = data.find(u => u.id === id);
    if (!user) return;

    if (user.role === 'SUPER_ADMIN') {
      alert('Akses Ditolak: Super Admin Global tidak bisa dihapus!');
      return;
    }

    // PENTING: Admin sekolah TIDAK BISA menghapus dirinya sendiri!
    if (isSelf(user)) {
      alert('Akses Ditolak: Anda tidak dapat menghapus akun Anda sendiri!');
      return;
    }

    // Sesuai hak_akses_sekolah.md: Admin Sekolah hanya mengelola akun Operator
    if (user.role !== 'OPERATOR') {
      alert('Akses Ditolak: Sesuai aturan hak akses, Admin Sekolah hanya dapat menghapus akun Operator Sekolah.');
      return;
    }

    if (!confirm(`Hapus operator ${user.username}?`)) return;

    setData(prev => prev.filter(u => u.id !== id));
    await supabase
      .from('users')
      .delete()
      .eq('id', id);
  };

  const getInitials = (name: string) => {
    return name.split('.').map(s => s[0]?.toUpperCase()).join('').slice(0, 2);
  };

  return (
    <div className="min-h-screen">
      <Header title="User Manager" subtitle="Kelola pengguna dan hak akses sistem" showYearSelector={false} showSearch={false} />

      <div className="p-6">
        {/* Role Access Banner */}
        {isReadOnly ? (
          <div className="mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs bg-rose-50 border-rose-300 text-rose-900 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">⛔</span>
              <div className="leading-snug">
                <span className="font-bold">
                  Mode Akses: {isOperator ? 'Operator Sekolah' : 'Admin Sekolah'} (NON-AKTIF / HANYA LIHAT)
                </span> — Status akun Anda saat ini <span className="font-semibold text-rose-700 underline">NON-AKTIF</span> ({isOperator ? 'dinonaktifkan oleh Admin Sekolah' : 'dinonaktifkan oleh Super Admin Global'}). Semua wewenang manipulasi data, penambahan operator, dan perubahan akun dinonaktifkan. Anda hanya diizinkan melihat informasi sistem.
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border shrink-0 bg-rose-100 text-rose-800 border-rose-300">
              STATUS: NON-AKTIF
            </span>
          </div>
        ) : (
          <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            isOperator 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className={isOperator ? 'text-emerald-600 shrink-0' : 'text-indigo-600 shrink-0'} />
              <div className="leading-snug">
                {isOperator ? (
                  <>
                    <span className="font-bold">Mode Akses: Operator Sekolah</span> — Anda hanya dapat <span className="font-semibold text-emerald-800 underline">mengganti email dan kata sandi akun Anda sendiri</span>. Penambahan akun dilakukan oleh Admin Sekolah.
                  </>
                ) : (
                  <>
                    <span className="font-bold">Mode Akses: Admin Sekolah</span> — Anda memiliki hak penuh untuk menambahkan Operator Sekolah baru serta mengelola seluruh pengguna sekolah.
                  </>
                )}
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border shrink-0 ${
              isOperator ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
            }`}>
              Aktif: {isOperator ? 'OPERATOR' : 'ADMIN'}
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="sheet-toolbar">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari user, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} users</span>

          {/* Action Button: Khusus Admin bisa Tambah Operator, Khusus Operator hanya tombol Ganti Email/Password */}
          {!isOperator ? (
            isReadOnly ? (
              <button
                disabled
                className="btn py-2 px-3 bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-none"
                title="Akun Admin Anda berstatus non-aktif. Tidak dapat menambah operator."
              >
                <Lock size={14} />
                Tambah Operator (Dinonaktifkan)
              </button>
            ) : (
              <button onClick={openAddModal} className="btn btn-primary">
                <Plus size={14} />
                Tambah Operator Sekolah
              </button>
            )
          ) : isReadOnly ? (
            <button 
              disabled
              className="btn py-2 px-3 bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 rounded-xl shadow-none"
              title="Akun Anda berstatus non-aktif. Tidak dapat mengubah data."
            >
              <Lock size={14} />
              Ganti Email & Password (Dinonaktifkan)
            </button>
          ) : (
            <button 
              onClick={() => {
                const myAcc = data.find(isSelf) || data.find(u => u.role === 'OPERATOR');
                if (myAcc) openEditModal(myAcc);
              }} 
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-sm shadow-emerald-600/20"
            >
              <KeyRound size={14} />
              Ganti Email & Password Saya
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="sheet-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>User</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Email</th>
                  <th className="sheet-header-cell text-center" style={{ minWidth: 140 }}>Role</th>
                  <th className="sheet-header-cell text-center" style={{ width: 100 }}>Status</th>
                  <th className="sheet-header-cell text-center" style={{ width: 140 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const isSuperAdmin = user.role === 'SUPER_ADMIN';
                  const me = isSelf(user);
                  const isOperatorUser = user.role === 'OPERATOR';

                  // Izin Edit:
                  // - Jika Operator Non-Aktif: TIDAK BISA EDIT SAMA SEKALI
                  // - Jika Operator Aktif: HANYA bisa edit akunnya sendiri (me)
                  // - Jika Admin Sekolah:
                  //   - Bisa edit akun Operator Sekolah
                  //   - Bisa edit akun miliknya sendiri (me)
                  //   - TIDAK BISA edit akun Super Admin Global
                  //   - TIDAK BISA edit akun Admin Sekolah lain (karena Admin Sekolah hanya mengelola Operator)
                  const canEdit = isReadOnly
                    ? false
                    : isOperator
                    ? me
                    : (me || isOperatorUser);

                  // Izin Toggle / Delete:
                  // Menurut hak_akses_sekolah.md:
                  // - Super Admin Global: All Users
                  // - Admin Sekolah: Operator Users Only
                  // - Operator Sekolah: Self Account Only
                  // PENTING: Admin sekolah TIDAK BISA menonaktifkan dirinya sendiri (me)!
                  // PENTING: Admin sekolah TIDAK BISA menghapus dirinya sendiri (me)!
                  // PENTING: Admin sekolah TIDAK BISA menonaktifkan/menghapus Super Admin atau Admin lain!
                  const canToggle = !isReadOnly && !isOperator && !isSuperAdmin && !me && isOperatorUser;
                  const canDelete = !isReadOnly && !isOperator && !isSuperAdmin && !me && isOperatorUser;

                  return (
                    <tr key={user.id} className={`transition ${me ? (isReadOnly ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'bg-emerald-50/40 hover:bg-emerald-50/60') : 'hover:bg-indigo-50/50'}`}>
                      <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                      <td className="sheet-cell text-left">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            user.is_active ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {getInitials(user.username)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-text-primary">{user.username}</span>
                            {me && (
                              <span className={`text-[9px] border px-1.5 py-0.2 rounded font-bold uppercase ${
                                isReadOnly 
                                  ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}>
                                Anda {isReadOnly ? '(Non-Aktif)' : ''}
                              </span>
                            )}
                          </div>
                          {user.institusi_id && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium ml-1">
                              {user.institusi_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="sheet-cell text-left text-text-secondary text-xs">{user.email}</td>
                      <td className="sheet-cell text-center">
                        <span className={`badge ${roleConfig[user.role]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {roleConfig[user.role]?.label || user.role}
                        </span>
                      </td>
                      <td className="sheet-cell text-center">
                        <span className={`badge ${user.is_active 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                          : 'bg-rose-100 text-rose-700 border-rose-300'}`}
                        >
                          {user.is_active ? '✓ Aktif' : '✗ Non-aktif'}
                        </span>
                      </td>
                      <td className="sheet-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Edit */}
                          <button
                            onClick={() => openEditModal(user)}
                            className={`btn btn-ghost py-1 px-2 text-xs ${
                              !canEdit 
                                ? 'opacity-20 cursor-not-allowed text-gray-400' 
                                : me 
                                ? 'text-emerald-700 hover:bg-emerald-100 font-semibold' 
                                : ''
                            }`}
                            title={
                              isReadOnly
                                ? 'Akun Anda berstatus non-aktif. Tidak dapat mengubah data.'
                                : isOperator 
                                ? (me ? 'Ganti Email & Password Saya' : 'Operator hanya bisa mengganti email dan password akun miliknya sendiri')
                                : isSuperAdmin 
                                ? 'Super Admin Global diproteksi' 
                                : (!me && !isOperatorUser)
                                ? 'Akun Admin Sekolah lain hanya dapat dikelola oleh Super Admin Global'
                                : (me ? 'Edit Akun Saya' : 'Edit Operator')
                            }
                            disabled={!canEdit}
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Tombol Toggle Status (Khusus Admin kelola Operator) */}
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`btn btn-ghost py-1 px-2 text-xs ${!canToggle ? 'opacity-20 cursor-not-allowed text-gray-400' : ''}`}
                            title={
                              isReadOnly
                                ? 'Akun Anda berstatus non-aktif. Tidak dapat mengubah status pengguna'
                                : isOperator 
                                ? 'Operator tidak memiliki izin mengubah status pengguna' 
                                : isSuperAdmin 
                                ? 'Super Admin diproteksi' 
                                : me
                                ? 'Anda tidak dapat menonaktifkan akun Admin Anda sendiri'
                                : !isOperatorUser
                                ? 'Admin Sekolah hanya dapat mengubah status Operator Sekolah'
                                : user.is_active ? 'Nonaktifkan Operator' : 'Aktifkan Operator'
                            }
                            disabled={!canToggle}
                          >
                            {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          </button>

                          {/* Tombol Hapus (Khusus Admin kelola Operator) */}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className={`btn btn-ghost py-1 px-2 text-xs text-rose-500 ${!canDelete ? 'opacity-20 cursor-not-allowed text-gray-400' : ''}`}
                            title={
                              isReadOnly
                                ? 'Akun Anda berstatus non-aktif. Tidak dapat menghapus pengguna'
                                : isOperator 
                                ? 'Operator tidak memiliki izin menghapus pengguna' 
                                : isSuperAdmin 
                                ? 'Super Admin diproteksi' 
                                : me
                                ? 'Anda tidak dapat menghapus akun Anda sendiri'
                                : !isOperatorUser
                                ? 'Admin Sekolah hanya dapat menghapus Operator Sekolah'
                                : 'Hapus Operator'
                            }
                            disabled={!canDelete}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                  isOperator ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}>
                  {isOperator ? <KeyRound size={16} /> : <ShieldCheck size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    {isOperator ? 'Ganti Email & Kata Sandi Saya' : editUser ? 'Edit Pengguna' : 'Tambah Operator Sekolah Baru'}
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    {isOperator ? 'Perbarui email dan kata sandi akun operator Anda' : 'Kelola hak akses pengguna sekolah'}
                  </p>
                </div>
              </div>
            </div>

            {feedbackMsg && (
              <div className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Username Field */}
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Username</label>
                <input
                  type="text"
                  disabled={isOperator || !!editUser}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="contoh: operator.paud"
                  className={`search-input w-full pl-3 ${
                    isOperator || editUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
                {isOperator && (
                  <p className="text-[10px] text-text-muted mt-1">Username bersifat permanen dan tidak dapat diubah oleh operator.</p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Role Pengguna</label>
                {isOperator ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-border flex items-center justify-between">
                    <span className="badge bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                      Operator Sekolah
                    </span>
                    <span className="text-[11px] text-text-muted">Role tetap</span>
                  </div>
                ) : editUser && isSelf(editUser) ? (
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                    <span className="badge bg-indigo-100 text-indigo-800 border-indigo-300 font-bold">
                      Admin Sekolah
                    </span>
                    <span className="text-[11px] text-indigo-700">Role akun sendiri tidak dapat diubah</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
                    <span className="badge bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                      Operator Sekolah
                    </span>
                    <span className="text-[11px] text-emerald-800">Sesuai hak akses: Admin Sekolah mengelola Operator</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Email {isOperator && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contoh: operator@sekolah.sch.id"
                  className="search-input w-full pl-3"
                />
              </div>

              {/* Password Fields (Khusus Operator / Tambah Akun) */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-text-secondary">
                      {isOperator ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}
                    </label>
                    {isOperator && (
                      <span className="text-[10px] text-text-muted">Kosongkan bila tidak diubah</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={isOperator ? 'Masukkan kata sandi baru...' : '••••••••••••'}
                      className="search-input w-full pl-3 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {formPassword && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="search-input w-full pl-3"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Batal
                </button>
                <button 
                  onClick={handleSave} 
                  className={`btn btn-primary ${isOperator ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' : ''}`}
                >
                  {isOperator ? 'Simpan Email & Password' : editUser ? 'Simpan Perubahan' : 'Tambah Operator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
