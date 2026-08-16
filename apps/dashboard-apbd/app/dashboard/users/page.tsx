'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import {
  getUsersFromDb,
  createUserInDb,
  updateUserInDb,
  deleteUserInDb,
  DbUser,
} from '@/lib/data/apbd-service';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Users,
  FileText,
  RefreshCw,
} from 'lucide-react';

const roleConfig: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  ADMIN: { label: 'Admin BPKAD Lampung', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  ADMIN_PROVINSI: { label: 'Admin Disdik / Bappeda', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ADMIN_KABKOTA: { label: 'Admin Disdik Kab/Kota', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  AUDITOR: { label: 'Auditor BPK / Inspektorat', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  PUBLIC_RESEARCHER: { label: 'Public Researcher', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
};

interface RoleDetail {
  title: string;
  desc: string;
  tasks: string[];
  permissions: { module: string; access: 'Full' | 'Read-Only' | 'Restricted' | 'Local Only' | 'Blocked' }[];
}

const roleDetailsMap: Record<string, RoleDetail> = {
  SUPER_ADMIN: {
    title: 'Super Admin APBD Lampung',
    desc: 'Otoritas tertinggi dengan kontrol penuh atas input APBD Lampung, breakdown 15 kab/kota, manajemen pengguna, dan audit log.',
    tasks: ['Mengesahkan APBD Provinsi Lampung', 'Pengelolaan User & Peran Sistem', 'Otorisasi Input Batas 20% Anggaran', 'Monitoring & Audit Trail'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Full' },
      { module: 'APBD Pertahun', access: 'Full' },
      { module: 'Kabupaten / Kota', access: 'Full' },
      { module: 'Jenjang Pendidikan', access: 'Full' },
      { module: 'Profil Institusi', access: 'Full' },
      { module: 'User Manager', access: 'Full' },
    ],
  },
  ADMIN: {
    title: 'Pengelola Anggaran BPKAD Lampung',
    desc: 'Penginput utama total APBD murni dan alokasi riil pendidikan serta verifikasi realisasi belanja daerah.',
    tasks: ['Input Anggaran Total APBD Provinsi', 'Perhitungan Alokasi Pendidikan Riil', 'Pencatatan Realisasi Belanja Triwulanan', 'Export Laporan APBD'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Full' },
      { module: 'APBD Pertahun', access: 'Full' },
      { module: 'Kabupaten / Kota', access: 'Full' },
      { module: 'Jenjang Pendidikan', access: 'Read-Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Restricted' },
    ],
  },
  ADMIN_PROVINSI: {
    title: 'Perencana & Dinas Teknis Provinsi Lampung',
    desc: 'Perencanaan dan monitoring pemenuhan mandatory spending 20% pendidikan pada RKPD dan KUA-PPAS.',
    tasks: ['Distribusi Alokasi SMA & SMK Se-Lampung', 'Monitoring Realisasi Belanja Sekolah', 'Verifikasi Data Satuan Pendidikan', 'Pengajuan Kebutuhan BOSDA'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Read-Only' },
      { module: 'APBD Pertahun', access: 'Read-Only' },
      { module: 'Kabupaten / Kota', access: 'Local Only' },
      { module: 'Jenjang Pendidikan', access: 'Full' },
      { module: 'Profil Institusi', access: 'Full' },
      { module: 'User Manager', access: 'Blocked' },
    ],
  },
  ADMIN_KABKOTA: {
    title: 'Dinas Pendidikan Kabupaten / Kota',
    desc: 'Pengelola alokasi operasional pendidikan dasar (SD, SMP, PAUD) di 15 wilayah kab/kota Lampung.',
    tasks: ['Monitoring Satuan Pendidikan Lokal', 'Penyaluran Anggaran Sekolah Dasar', 'Laporan Realisasi Kas Daerah', 'Verifikasi NPSN Lokal'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Read-Only' },
      { module: 'APBD Pertahun', access: 'Blocked' },
      { module: 'Kabupaten / Kota', access: 'Local Only' },
      { module: 'Jenjang Pendidikan', access: 'Local Only' },
      { module: 'Profil Institusi', access: 'Local Only' },
      { module: 'User Manager', access: 'Blocked' },
    ],
  },
  AUDITOR: {
    title: 'Auditor BPK & Inspektorat Lampung',
    desc: 'Pemeriksaan independen atas kepatuhan mandatory spending 20% pendidikan dan audit aliran dana ke sekolah.',
    tasks: ['Verifikasi Kepatuhan 20% APBD', 'Audit Jejak Perubahan (Audit Trail)', 'Pemeriksaan Realisasi vs Anggaran', 'Export Rekapitulasi untuk LHP'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Read-Only' },
      { module: 'APBD Pertahun', access: 'Read-Only' },
      { module: 'Kabupaten / Kota', access: 'Read-Only' },
      { module: 'Jenjang Pendidikan', access: 'Read-Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Blocked' },
    ],
  },
  PUBLIC_RESEARCHER: {
    title: 'Peneliti & Pemerhati Publik',
    desc: 'Akses transparansi anggaran untuk analisis kebijakan publik dan kajian akademis tanpa izin mengubah data.',
    tasks: ['Riset Transparansi Anggaran', 'Analisis Penyerapan Dana Daerah', 'Export Data Publik', 'Monitoring Profil Institusi'],
    permissions: [
      { module: 'Dashboard Utama', access: 'Read-Only' },
      { module: 'APBD Pertahun', access: 'Read-Only' },
      { module: 'Kabupaten / Kota', access: 'Read-Only' },
      { module: 'Jenjang Pendidikan', access: 'Read-Only' },
      { module: 'Profil Institusi', access: 'Read-Only' },
      { module: 'User Manager', access: 'Blocked' },
    ],
  },
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editUser, setEditUser] = useState<DbUser | null>(null);

  // Form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('ADMIN');

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsersFromDb();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (roleConfig[u.role]?.label || u.role).toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleOpenAdd = () => {
    setEditUser(null);
    setUsername('');
    setEmail('');
    setRole('ADMIN');
    setShowModal(true);
  };

  const handleOpenEdit = (u: DbUser) => {
    setEditUser(u);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;

    if (editUser) {
      const ok = await updateUserInDb(editUser.id, { username, email, role });
      if (ok) {
        await loadUsers();
      }
    } else {
      const ok = await createUserInDb({ username, email, role });
      if (ok) {
        await loadUsers();
      }
    }
    setShowModal(false);
  };

  const handleToggleActive = async (user: DbUser) => {
    if (user.role === 'SUPER_ADMIN') return;
    const ok = await updateUserInDb(user.id, { is_active: !user.is_active });
    if (ok) {
      await loadUsers();
    }
  };

  const handleDelete = async (user: DbUser) => {
    if (user.role === 'SUPER_ADMIN') {
      alert('Super Admin tidak dapat dihapus!');
      return;
    }
    if (confirm(`Hapus pengguna ${user.username} dari database?`)) {
      const ok = await deleteUserInDb(user.id);
      if (ok) {
        await loadUsers();
      }
    }
  };

  const getAccessBadgeClass = (access: string) => {
    switch (access) {
      case 'Full':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Local Only':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      case 'Read-Only':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Blocked':
        return 'bg-rose-100 text-rose-700 border-rose-300 font-medium';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="User Manager & Hak Akses"
        subtitle="Kelola Pengguna Sistem, Peran, dan Matriks Wewenang Langsung dari Database PostgreSQL"
      />

      <div className="p-6">
        {/* Tab Switcher */}
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
            Daftar Pengguna ({users.length})
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
            Pengaturan Peran & Matriks Akses (RBAC)
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
                  placeholder="Cari user, email, role di DB..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <span className="text-xs text-text-muted flex-1 font-mono">
                {filtered.length} pengguna di tabel `public.users`
              </span>
              <button
                onClick={loadUsers}
                className="btn btn-ghost text-xs border border-slate-200 text-indigo-700 bg-white"
                title="Reload dari Database"
              >
                <RefreshCw size={13} />
                <span>Sync DB</span>
              </button>
              <button onClick={handleOpenAdd} className="btn btn-primary text-xs">
                <Plus size={14} />
                Tambah Pengguna
              </button>
            </div>

            {/* Table */}
            <div className="sheet-container">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                    <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Nama Pengguna</th>
                    <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Email Kedinasan</th>
                    <th className="sheet-header-cell text-center" style={{ minWidth: 160 }}>Peran (Role)</th>
                    <th className="sheet-header-cell text-center" style={{ width: 100 }}>Status</th>
                    <th className="sheet-header-cell text-center" style={{ width: 110 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-text-muted font-mono">
                        Memuat data pengguna dari PostgreSQL lokal...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-text-muted">
                        Tidak ada pengguna ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-indigo-50/50 transition">
                        <td className="sheet-cell text-center text-text-muted text-xs font-mono">{idx + 1}</td>
                        <td className="sheet-cell text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[11px] font-bold">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-text-primary text-xs">{user.username}</span>
                          </div>
                        </td>
                        <td className="sheet-cell text-left text-text-secondary text-xs font-mono">{user.email}</td>
                        <td className="sheet-cell text-center">
                          <span className={`badge ${roleConfig[user.role]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {roleConfig[user.role]?.label || user.role}
                          </span>
                        </td>
                        <td className="sheet-cell text-center">
                          <span
                            className={`badge ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-rose-100 text-rose-700 border-rose-300'
                            }`}
                          >
                            {user.is_active ? '✓ Aktif' : '✗ Non-aktif'}
                          </span>
                        </td>
                        <td className="sheet-cell text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="btn btn-ghost py-1 px-2 text-xs"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className="btn btn-ghost py-1 px-2 text-xs"
                              title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              disabled={user.role === 'SUPER_ADMIN'}
                            >
                              {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="btn btn-ghost py-1 px-2 text-xs text-rose-500"
                              title="Hapus"
                              disabled={user.role === 'SUPER_ADMIN'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Role Management Cards */
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
              <ShieldCheck size={22} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-950">Matriks Hak Akses & Pembagian Wewenang APBD Lampung</h4>
                <p className="text-xs text-indigo-800/90 mt-0.5">
                  Setiap peran memiliki wewenang spesifik dalam menginput, memvalidasi, dan mengaudit data APBD Provinsi Lampung.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(roleDetailsMap).map((roleKey) => {
                const cfg = roleConfig[roleKey] || { label: roleKey, color: 'bg-gray-100 text-gray-700' };
                const detail = roleDetailsMap[roleKey];
                const countUsers = users.filter((u) => u.role === roleKey).length;

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
                          Tugas Utama:
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
                          Hak Akses Modul:
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-text-primary mb-3">
              {editUser ? 'Edit Pengguna di PostgreSQL' : 'Tambah Pengguna ke PostgreSQL'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nama Pengguna</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: Hendra Setiawan"
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Email Kedinasan</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hendra@lampungprov.go.id"
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Peran (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="select-dropdown w-full text-xs"
                >
                  {Object.keys(roleConfig).map((r) => (
                    <option key={r} value={r}>
                      {roleConfig[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost text-xs">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  {editUser ? 'Simpan ke Database' : 'Tambah ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
