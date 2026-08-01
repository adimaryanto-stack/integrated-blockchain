'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { usersData, createUser, updateUser } from '@/lib/data';
import { User, UserRole } from '@/types';
import { Search, Plus, Edit3, Trash2, UserCheck, UserX, ShieldAlert, ShieldCheck, CheckCircle2, Sliders, Users, FileText } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  ADMIN: { label: 'Admin', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  ADMIN_PROVINSI: { label: 'Admin Provinsi', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ADMIN_KABKOTA: { label: 'Admin Kab/Kota', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  PUBLIC_RESEARCHER: { label: 'Public Researcher', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  AUDITOR: { label: 'Auditor', color: 'bg-amber-100 text-amber-700 border-amber-300' },
};

interface RoleDetail {
  title: string;
  desc: string;
  tasks: string[];
  permissions: { module: string; access: 'Full' | 'Read-Only' | 'Restricted' | 'Local Only' | 'Blocked' }[];
}

const DEFAULT_ROLE_DETAILS: Record<UserRole, RoleDetail> = {
  SUPER_ADMIN: {
    title: 'Super Admin System',
    desc: 'Otoritas tertinggi dengan kontrol penuh atas APBN, alokasi 38 provinsi, 514 kab/kota, manajemen pengguna, dan audit trail.',
    tasks: ['Mengesahkan APBN Nasional', 'Pengelolaan User & Peran Sistem', 'Otorisasi Perubahan Data Utama', 'Monitoring & Reset Audit Trail Log'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Full' },
      { module: 'Alokasi Provinsi', access: 'Full' },
      { module: 'Alokasi Kab/Kota', access: 'Full' },
      { module: 'Profil Institusi', access: 'Full' },
      { module: 'User Manager', access: 'Full' },
      { module: 'Audit Trail', access: 'Full' },
    ],
  },
  ADMIN: {
    title: 'Admin Pusat Kementerian',
    desc: 'Pengelola operasional alokasi anggaran nasional, pemantauan penyaluran ke seluruh daerah dan verifikasi realisasi.',
    tasks: ['Monitoring Alokasi Anggaran Nasional', 'Verifikasi Usulan Anggaran Daerah', 'Input & Update Realisasi Anggaran', 'Export Laporan Keuangan'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Read-Only' },
      { module: 'Alokasi Provinsi', access: 'Full' },
      { module: 'Alokasi Kab/Kota', access: 'Full' },
      { module: 'Profil Institusi', access: 'Full' },
      { module: 'User Manager', access: 'Restricted' },
      { module: 'Audit Trail', access: 'Read-Only' },
    ],
  },
  ADMIN_PROVINSI: {
    title: 'Admin Dinas Pendidikan Provinsi',
    desc: 'Pengelola alokasi anggaran khusus wilayah tingkat provinsi dan kabupaten/kota yang berada di bawah naungannya.',
    tasks: ['Update Realisasi Anggaran Provinsi', 'Monitoring Kab/Kota di Provinsinya', 'Verifikasi Laporan Sekolah Daerah', 'Export Laporan Provinsi'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Blocked' },
      { module: 'Alokasi Provinsi', access: 'Local Only' },
      { module: 'Alokasi Kab/Kota', access: 'Local Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Blocked' },
      { module: 'Audit Trail', access: 'Local Only' },
    ],
  },
  ADMIN_KABKOTA: {
    title: 'Admin Dinas Pendidikan Kab/Kota',
    desc: 'Pengelola alokasi anggaran operasional dan penyaluran dana sekolah di tingkat kabupaten/kota lokal.',
    tasks: ['Update Realisasi Anggaran Kab/Kota', 'Monitoring Sekolah & Institusi Lokal', 'Input Rincian Pengeluaran Daerah', 'Export Laporan Kab/Kota'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Blocked' },
      { module: 'Alokasi Provinsi', access: 'Blocked' },
      { module: 'Alokasi Kab/Kota', access: 'Local Only' },
      { module: 'Profil Institusi', access: 'Local Only' },
      { module: 'User Manager', access: 'Blocked' },
      { module: 'Audit Trail', access: 'Local Only' },
    ],
  },
  AUDITOR: {
    title: 'Auditor BPK & Inspektorat Jenderal',
    desc: 'Pemeriksaan independen untuk memantau transparansi, deteksi anomali, dan investigasi temuan keuangan.',
    tasks: ['Audit Investigasi Anomali Keuangan', 'Monitoring Audit Trail Real-Time', 'Penilaian Keparahan Temuan', 'Pemberian Flag Anomali'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Read-Only' },
      { module: 'Alokasi Provinsi', access: 'Read-Only' },
      { module: 'Alokasi Kab/Kota', access: 'Read-Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Blocked' },
      { module: 'Audit Trail', access: 'Full' },
    ],
  },
  PUBLIC_RESEARCHER: {
    title: 'Public Researcher & Pengamat Publik',
    desc: 'Akses publik & akademisi untuk penelitian transparansi anggaran pendidikan tanpa hak mengubah data.',
    tasks: ['Riset Transparansi Anggaran Pendidikan', 'Analisis Penyerapan Dana Daerah', 'Export Data Publik & Statistik', 'Monitoring Profil Institusi'],
    permissions: [
      { module: 'APBN Pertahun', access: 'Read-Only' },
      { module: 'Alokasi Provinsi', access: 'Read-Only' },
      { module: 'Alokasi Kab/Kota', access: 'Read-Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Blocked' },
      { module: 'Audit Trail', access: 'Blocked' },
    ],
  },
};

export default function UsersPage() {
  const { currentUser, addAuditLog } = useAppStore();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
  const [data, setData] = useState<User[]>(usersData);
  const [roleDetails, setRoleDetails] = useState<Record<UserRole, RoleDetail>>(DEFAULT_ROLE_DETAILS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Role Edit Modal State
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [roleFormTitle, setRoleFormTitle] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormTasks, setRoleFormTasks] = useState('');

  // User Form state
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('PUBLIC_RESEARCHER');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      roleConfig[u.role].label.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openAddModal = () => {
    setEditUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormRole('PUBLIC_RESEARCHER');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormRole(user.role);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formUsername || !formEmail) return;

    setShowModal(false);
    if (editUser) {
      setData(prev => prev.map(u => u.id === editUser.id ? { ...u, username: formUsername, email: formEmail, role: formRole } : u));
      await updateUser(editUser.id, { username: formUsername, email: formEmail, role: formRole });
    } else {
      const success = await createUser(formUsername, formEmail, formRole);
      if (success) {
        setData([...usersData]);
      } else {
        alert('Gagal menambahkan user baru ke database.');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const user = data.find(u => u.id === id);
    if (user?.role === 'SUPER_ADMIN') return;
    setData(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    if (user) {
      await updateUser(id, { is_active: !user.is_active });
    }
  };

  const handleDelete = async (id: string) => {
    const user = data.find(u => u.id === id);
    if (user?.role === 'SUPER_ADMIN') { alert('Super Admin tidak bisa dihapus!'); return; }
    if (!confirm('Hapus user ini?')) return;
    setData(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
    await updateUser(id, { is_active: false });
  };

  const openRoleEditModal = (roleKey: UserRole) => {
    if (!isSuperAdmin) return;
    const detail = roleDetails[roleKey];
    setEditingRole(roleKey);
    setRoleFormTitle(detail.title);
    setRoleFormDesc(detail.desc);
    setRoleFormTasks(detail.tasks.join('\n'));
  };

  const handleSaveRoleDetail = () => {
    if (!editingRole) return;
    const tasksList = roleFormTasks.split('\n').map(t => t.trim()).filter(Boolean);
    const updated = {
      ...roleDetails[editingRole],
      title: roleFormTitle,
      desc: roleFormDesc,
      tasks: tasksList,
    };
    setRoleDetails(prev => ({ ...prev, [editingRole]: updated }));
    addAuditLog({
      user_nama: currentUser.username,
      user_role: currentUser.role,
      entitas: `Pengaturan Peran (${roleConfig[editingRole].label})`,
      entitas_id: editingRole,
      field: 'tasks',
      nilai_lama: 'Deskripsi & Tugas Peran Lama',
      nilai_baru: `Judul: ${roleFormTitle} (${tasksList.length} Tugas)`,
    });
    setEditingRole(null);
  };

  const getInitials = (name: string) => {
    return name.split('.').map(s => s[0]?.toUpperCase()).join('').slice(0, 2);
  };

  const getAccessBadgeClass = (access: string) => {
    switch (access) {
      case 'Full': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Local Only': return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      case 'Read-Only': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Blocked': return 'bg-rose-100 text-rose-700 border-rose-300 font-medium';
      default: return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="User Manager" subtitle="Kelola pengguna, pembagian tugas, dan hak akses sistem" />

      <div className="p-6">
        {!isSuperAdmin && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Akses Terbatas:</span> Anda saat ini menggunakan akun <span className="font-semibold">{currentUser.username}</span> ({currentUser.role}). Pengelolaan pengguna dan perizinan sistem terbatas hanya untuk <span className="font-bold">Super Admin</span>. Gunakan menu switcher di header untuk beralih ke Super Admin.
            </div>
          </div>
        )}

        {/* Tab Switcher Header */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'USERS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={15} />
            Daftar Pengguna ({data.length})
          </button>
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ROLES'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders size={15} />
            Pengaturan Peran & Pembagian Tugas (RBAC Matrix)
          </button>
        </div>

        {activeTab === 'USERS' ? (
          <>
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
              <button 
                onClick={openAddModal} 
                disabled={!isSuperAdmin}
                title={!isSuperAdmin ? 'Hanya Super Admin yang dapat menambah pengguna' : ''}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                Tambah User
              </button>
            </div>

            {/* Table */}
            <div className="sheet-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                    <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>User</th>
                    <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Email</th>
                    <th className="sheet-header-cell text-center" style={{ minWidth: 160 }}>Role</th>
                    <th className="sheet-header-cell text-center" style={{ width: 100 }}>Status</th>
                    <th className="sheet-header-cell text-center" style={{ width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-indigo-50/50 transition">
                      <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                      <td className="sheet-cell text-left">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            user.is_active ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {getInitials(user.username)}
                          </div>
                          <span className="font-medium text-text-primary">{user.username}</span>
                        </div>
                      </td>
                      <td className="sheet-cell text-left text-text-secondary text-xs">{user.email}</td>
                      <td className="sheet-cell text-center">
                        <span className={`badge ${roleConfig[user.role]?.color || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
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
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={!isSuperAdmin}
                            className="btn btn-ghost py-1 px-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!isSuperAdmin ? 'Terbatas untuk Super Admin' : 'Edit'}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className="btn btn-ghost py-1 px-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!isSuperAdmin ? 'Terbatas untuk Super Admin' : (user.is_active ? 'Nonaktifkan' : 'Aktifkan')}
                            disabled={!isSuperAdmin || user.role === 'SUPER_ADMIN'}
                          >
                            {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-ghost py-1 px-2 text-xs text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!isSuperAdmin ? 'Terbatas untuk Super Admin' : 'Hapus'}
                            disabled={!isSuperAdmin || user.role === 'SUPER_ADMIN'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* ===== ROLE MANAGEMENT & TASK DISTRIBUTION MATRIX ===== */
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
              <ShieldCheck size={22} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-950">Matriks Pengaturan Peran & Pembagian Tugas (RBAC)</h4>
                <p className="text-xs text-indigo-800/90 mt-0.5">
                  Super Admin dapat mengatur pembagian tugas, wewenang, dan matriks hak akses untuk setiap peran pengguna di bawah ini. Klik <span className="font-semibold">&quot;Edit Tugas Peran&quot;</span> pada kartu terkait untuk memperbarui deskripsi tugas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Object.keys(roleConfig) as UserRole[]).map((roleKey) => {
                const cfg = roleConfig[roleKey];
                const detail = roleDetails[roleKey];
                const countUsers = data.filter(u => u.role === roleKey).length;

                return (
                  <div
                    key={roleKey}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`badge ${cfg.color} text-xs px-2.5 py-1 font-bold`}>
                          {cfg.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {countUsers} Pengguna
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-1">{detail.title}</h4>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-3">{detail.desc}</p>

                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                          <FileText size={12} className="text-indigo-600" />
                          Pembagian Tugas Utama:
                        </span>
                        <ul className="space-y-1.5">
                          {detail.tasks.map((task, tIdx) => (
                            <li key={tIdx} className="text-xs text-slate-700 flex items-start gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
                          Hak Akses Modul Sistem:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {detail.permissions.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-slate-600 truncate mr-1">{p.module}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${getAccessBadgeClass(p.access)}`}>
                                {p.access}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => openRoleEditModal(roleKey)}
                        disabled={!isSuperAdmin}
                        className="btn btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        title={!isSuperAdmin ? 'Hanya Super Admin yang dapat mengubah tugas peran' : 'Edit Tugas & Tanggung Jawab'}
                      >
                        <Edit3 size={12} />
                        Edit Tugas Peran
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Username</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="john.doe"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="john@kemdikbud.go.id"
                  className="search-input w-full pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="select-dropdown w-full"
                >
                  {(Object.keys(roleConfig) as UserRole[]).map(role => (
                    <option key={role} value={role}>{roleConfig[role].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
                <button onClick={handleSave} className="btn btn-primary">
                  {editUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Tasks Edit Modal (Super Admin) */}
      {editingRole && (
        <div className="modal-overlay" onClick={() => setEditingRole(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sliders size={18} className="text-indigo-600" />
              Edit Tugas & Tanggung Jawab ({roleConfig[editingRole].label})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Konfigurasi pembagian tugas utama untuk peran {roleConfig[editingRole].label}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Peran / Jabatan</label>
                <input
                  type="text"
                  value={roleFormTitle}
                  onChange={(e) => setRoleFormTitle(e.target.value)}
                  className="search-input w-full pl-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Tugas</label>
                <textarea
                  rows={3}
                  value={roleFormDesc}
                  onChange={(e) => setRoleFormDesc(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Daftar Pembagian Tugas Utama (1 per baris)</label>
                <textarea
                  rows={4}
                  value={roleFormTasks}
                  onChange={(e) => setRoleFormTasks(e.target.value)}
                  placeholder="Tugas 1&#10;Tugas 2&#10;Tugas 3"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditingRole(null)} className="btn btn-ghost text-xs">Batal</button>
                <button onClick={handleSaveRoleDetail} className="btn btn-primary text-xs">
                  Simpan Tugas Peran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
