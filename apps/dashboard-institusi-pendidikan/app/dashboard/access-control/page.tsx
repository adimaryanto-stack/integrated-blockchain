'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  KeyRound,
  Shield,
  Users,
  Check,
  X,
  UserPlus,
  Edit2,
  Trash2,
  Info,
  Layers,
  ArrowRight,
  School,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  QrCode,
  ShieldAlert,
  Sliders
} from 'lucide-react';

// List of modules specific to Educational Institution Platform
const modulesList = [
  'Dashboard & Metrik Ringkasan',
  'Profil Institusi & Dokumen Satuan',
  'Mutasi Rekening Kas Bank',
  'Rencana Anggaran Biaya (RAB)',
  'Paket Project & Dokumentasi Fisik',
  'Pengeluaran & Scan Kuitansi OCR AI',
  'Audit Integritas Anggaran AI',
  'User Manager (Pengguna Satuan)',
  'Access Control Matrix & Scoped RBAC',
];

type SchoolRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR';
type ScopeType = 'global' | 'kementerian' | 'provinsi' | 'wilayah' | 'satuan';

interface RolePermission {
  role: SchoolRole;
  roleTitle: string;
  scopeLabel: string;
  badgeSubtitle: string;
  permissions: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
}

const initialPermissions: RolePermission[] = [
  {
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Admin Global',
    scopeLabel: 'Global (Seluruh Nasional)',
    badgeSubtitle: 'Akses Penuh Seluruh Sistem',
    permissions: {
      'Dashboard & Metrik Ringkasan': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Profil Institusi & Dokumen Satuan': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Mutasi Rekening Kas Bank': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Rencana Anggaran Biaya (RAB)': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Paket Project & Dokumentasi Fisik': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Pengeluaran & Scan Kuitansi OCR AI': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Audit Integritas Anggaran AI': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'User Manager (Pengguna Satuan)': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Access Control Matrix & Scoped RBAC': { canView: true, canCreate: true, canEdit: true, canDelete: true },
    },
  },
  {
    role: 'ADMIN',
    roleTitle: 'Admin Sekolah (Kepsek)',
    scopeLabel: 'Satuan: KB AL-IKHLAS',
    badgeSubtitle: 'Wewenang Tertinggi Satuan',
    permissions: {
      'Dashboard & Metrik Ringkasan': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      'Profil Institusi & Dokumen Satuan': { canView: true, canCreate: false, canEdit: true, canDelete: false },
      'Mutasi Rekening Kas Bank': { canView: true, canCreate: true, canEdit: true, canDelete: false },
      'Rencana Anggaran Biaya (RAB)': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Paket Project & Dokumentasi Fisik': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Pengeluaran & Scan Kuitansi OCR AI': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Audit Integritas Anggaran AI': { canView: true, canCreate: true, canEdit: true, canDelete: false },
      'User Manager (Pengguna Satuan)': { canView: true, canCreate: true, canEdit: true, canDelete: true },
      'Access Control Matrix & Scoped RBAC': { canView: true, canCreate: false, canEdit: true, canDelete: false },
    },
  },
  {
    role: 'OPERATOR',
    roleTitle: 'Operator Sekolah',
    scopeLabel: 'Satuan: KB AL-IKHLAS',
    badgeSubtitle: 'Belanja, RAB & Struk OCR (Dikelola Kepsek)',
    permissions: {
      'Dashboard & Metrik Ringkasan': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      'Profil Institusi & Dokumen Satuan': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      'Mutasi Rekening Kas Bank': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      'Rencana Anggaran Biaya (RAB)': { canView: true, canCreate: true, canEdit: true, canDelete: false },
      'Paket Project & Dokumentasi Fisik': { canView: true, canCreate: true, canEdit: true, canDelete: false },
      'Pengeluaran & Scan Kuitansi OCR AI': { canView: true, canCreate: true, canEdit: true, canDelete: false },
      'Audit Integritas Anggaran AI': { canView: true, canCreate: false, canEdit: false, canDelete: false },
      'User Manager (Pengguna Satuan)': { canView: false, canCreate: false, canEdit: false, canDelete: false },
      'Access Control Matrix & Scoped RBAC': { canView: true, canCreate: false, canEdit: false, canDelete: false },
    },
  },
];

interface AccountUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  scopeType: ScopeType;
  scopeId?: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt?: string;
}

export default function AccessControlPage() {
  const { currentUser, setEditProfileOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<'matrix' | 'accounts' | 'architecture'>('matrix');

  // Permissions state (Filter out any legacy Auditor/Komite from cached localStorage)
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('school_access_control_matrix_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(
              (rp: any) => rp.role === 'SUPER_ADMIN' || rp.role === 'ADMIN' || rp.role === 'OPERATOR'
            );
            if (filtered.length === 3) {
              return filtered;
            }
          }
        } catch (e) {}
      }
    }
    return initialPermissions;
  });

  // Accounts state - Synchronized 6 canonical platform & school accounts
  const [accounts, setAccounts] = useState<AccountUser[]>([
    {
      id: 'adm-001',
      name: 'Adi Maryanto',
      username: 'superadmin',
      email: 'superadmin@integrated-blockchain.id',
      role: 'SUPER_ADMIN',
      scopeType: 'global',
      scopeId: 'Seluruh Indonesia (Global)',
      mfaEnabled: true,
      isActive: true,
      lastLoginAt: '2026-10-08 Aktif',
    },
    {
      id: 'adm-002',
      name: 'Rizki Pratama',
      username: 'ops.admin',
      email: 'ops@integrated-blockchain.id',
      role: 'OPS_ADMIN',
      scopeType: 'global',
      scopeId: 'Seluruh Indonesia (Global)',
      mfaEnabled: true,
      isActive: true,
      lastLoginAt: '2026-10-08 Aktif',
    },
    {
      id: 'adm-003',
      name: 'Drs. H. M. Zainuri',
      username: 'admin.kemenag',
      email: 'admin.kemenag@kemenag.go.id',
      role: 'ADMIN_KEMENTERIAN',
      scopeType: 'kementerian',
      scopeId: 'Kemenag',
      mfaEnabled: true,
      isActive: true,
      lastLoginAt: '2026-10-08 Aktif',
    },
    {
      id: 'adm-004',
      name: 'Dr. Ir. Hendra Gunawan',
      username: 'admin.wilayah',
      email: 'disdik@lampungprov.go.id',
      role: 'ADMIN_WILAYAH',
      scopeType: 'provinsi',
      scopeId: 'Lampung',
      mfaEnabled: false,
      isActive: true,
      lastLoginAt: '2026-10-08 Aktif',
    },
    {
      id: 'u-kbalikhlas-admin',
      name: 'Hj. Siti Aminah, S.Pd (Kepsek)',
      username: 'admin.kbalikhlas',
      email: 'admin@kbalikhlas.sch.id',
      role: 'ADMIN',
      scopeType: 'satuan',
      scopeId: '69893669 - KB AL-IKHLAS',
      mfaEnabled: true,
      isActive: true,
      lastLoginAt: '2026-10-08 20:45:10',
    },
    {
      id: 'u-kbalikhlas-operator',
      name: 'Ahmad Fauzi, S.Kom',
      username: 'operator.kbalikhlas',
      email: 'operator@kbalikhlas.sch.id',
      role: 'OPERATOR',
      scopeType: 'satuan',
      scopeId: '69893669 - KB AL-IKHLAS',
      mfaEnabled: true,
      isActive: true,
      lastLoginAt: '2026-10-08 18:30:14',
    },
  ]);

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingScopeAccount, setEditingScopeAccount] = useState<AccountUser | null>(null);

  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'OPERATOR' as SchoolRole,
    scopeType: 'satuan' as ScopeType,
    scopeId: '69893669 - KB AL-IKHLAS',
    password: '',
    mfaEnabled: true,
  });

  const [scopeEditData, setScopeEditData] = useState<{
    scopeType: ScopeType;
    scopeId: string;
    mfaEnabled: boolean;
  }>({
    scopeType: 'satuan',
    scopeId: '69893669 - KB AL-IKHLAS',
    mfaEnabled: true,
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;
  const isReadOnly = currentUser?.is_active === false;

  // Fetch real users from PostgreSQL database, filtering out Auditor & Komite
  const fetchDbUsers = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });

      if (!error && rows && rows.length > 0) {
        // Exclude AUDITOR & KOMITE
        const filteredRows = rows.filter(
          (r: any) => r.role !== 'AUDITOR' && r.role !== 'KOMITE' && r.role !== 'PUBLIC_RESEARCHER'
        );

        if (filteredRows.length > 0) {
          const mappedUsers: AccountUser[] = filteredRows.map((r: any) => {
            let sType: ScopeType = (r.scope_type as ScopeType) || 'satuan';
            let sId = r.scope_id || '69893669 - KB AL-IKHLAS';

            if (r.role === 'SUPER_ADMIN' || r.role === 'OPS_ADMIN') {
              sType = 'global';
              sId = r.scope_id || 'Seluruh Indonesia (Global)';
            } else if (r.role === 'ADMIN_KEMENTERIAN') {
              sType = 'kementerian';
              sId = r.scope_id || 'Kemenag';
            } else if (r.role === 'ADMIN_WILAYAH') {
              sType = 'provinsi';
              sId = r.scope_id || 'Lampung';
            }

            return {
              id: r.id,
              name:
                r.full_name ||
                (r.username === 'admin.kbalikhlas'
                  ? 'Hj. Siti Aminah, S.Pd (Kepsek)'
                  : r.username === 'operator.kbalikhlas'
                  ? 'Ahmad Fauzi, S.Kom'
                  : r.username === 'superadmin'
                  ? 'Adi Maryanto'
                  : r.username === 'ops.admin'
                  ? 'Rizki Pratama'
                  : r.username === 'admin.kemenag'
                  ? 'Drs. H. M. Zainuri'
                  : r.username === 'admin.wilayah'
                  ? 'Dr. Ir. Hendra Gunawan'
                  : r.username),
              username: r.username,
              email: r.email,
              role: r.role,
              scopeType: sType,
              scopeId: sId,
              mfaEnabled: r.mfa_enabled !== undefined ? r.mfa_enabled : true,
              isActive: r.is_active !== false,
              lastLoginAt: '2026-10-08 Aktif',
            };
          });

          // Sort according to platform hierarchy
          const orderMap: Record<string, number> = {
            SUPER_ADMIN: 1,
            OPS_ADMIN: 2,
            ADMIN_KEMENTERIAN: 3,
            ADMIN_WILAYAH: 4,
            ADMIN: 5,
            OPERATOR: 6,
          };
          mappedUsers.sort((a, b) => (orderMap[a.role] || 99) - (orderMap[b.role] || 99));

          setAccounts(mappedUsers);
        }
      }
    } catch (err) {
      console.error('Error fetching users from DB:', err);
    }
  };

  useEffect(() => {
    fetchDbUsers();
  }, []);

  // Strict RBAC Toggle Handler: Admin Sekolah can ONLY modify Operator Sekolah
  const handleToggle = (
    role: SchoolRole,
    mod: string,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
    currentVal: boolean
  ) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus Non-Aktif (Hanya Lihat).');
      return;
    }

    // Rule 1: Super Admin Global has full access everywhere and cannot be modified by Admin Sekolah
    if (role === 'SUPER_ADMIN') {
      alert(
        'Akses Ditolak: Hak akses Super Admin Global memiliki otoritas absolut ke seluruh sistem nasional dan diproteksi (tidak dapat diubah oleh Admin Sekolah).'
      );
      return;
    }

    // Rule 2: Admin Sekolah cannot be modified by Admin Sekolah (Protected Hierarchy)
    if (role === 'ADMIN') {
      alert(
        'Akses Ditolak: Hak akses Admin Sekolah diproteksi oleh hierarki platform institusi. Admin Sekolah hanya berwenang mengubah hak akses Operator Sekolah.'
      );
      return;
    }

    // Rule 3: Only Operator Sekolah permissions can be modified
    if (role === 'OPERATOR') {
      if (!isAdmin) {
        alert('Akses Ditolak: Hanya Admin Sekolah (Kepala Satuan) yang dapat memodifikasi hak akses Operator Sekolah.');
        return;
      }

      const updated = rolePermissions.map((rp) => {
        if (rp.role === role) {
          const modPerm = rp.permissions[mod] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
          return {
            ...rp,
            permissions: {
              ...rp.permissions,
              [mod]: {
                ...modPerm,
                [action]: !currentVal,
              },
            },
          };
        }
        return rp;
      });

      setRolePermissions(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('school_access_control_matrix_v2', JSON.stringify(updated));
        } catch (e) {}
      }
    }
  };

  const handleOpenEditScope = (account: AccountUser) => {
    if (account.role === 'SUPER_ADMIN') {
      alert('Akses Ditolak: Cakupan Scope Super Admin Global diproteksi dan tidak dapat diubah oleh Admin Sekolah.');
      return;
    }

    if (account.role === 'ADMIN' && !isSuperAdmin) {
      alert('Akses Ditolak: Cakupan Scope Admin Sekolah terikat permanen dengan Satuan KB AL-IKHLAS (NPSN: 69893669).');
      return;
    }

    if (!isAdmin) {
      alert('Hanya Admin Sekolah yang dapat mengubah batasan Scope Operator.');
      return;
    }

    setEditingScopeAccount(account);
    setScopeEditData({
      scopeType: account.scopeType,
      scopeId: account.scopeId || '69893669 - KB AL-IKHLAS',
      mfaEnabled: account.mfaEnabled,
    });
  };

  const handleSaveEditScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScopeAccount) return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === editingScopeAccount.id
          ? {
              ...a,
              scopeType: scopeEditData.scopeType,
              scopeId: scopeEditData.scopeId,
              mfaEnabled: scopeEditData.mfaEnabled,
            }
          : a
      )
    );
    setEditingScopeAccount(null);
  };

  const handleToggleAccountActive = async (account: AccountUser) => {
    if (account.role === 'SUPER_ADMIN') {
      alert('Akses Ditolak: Akun Super Admin Global diproteksi dan tidak dapat dinonaktifkan oleh Admin Sekolah!');
      return;
    }

    if (account.role === 'ADMIN') {
      alert('Akses Ditolak: Akun Admin Sekolah tidak dapat dinonaktifkan demi mencegah terkuncinya sistem sekolah!');
      return;
    }

    if (!isAdmin) {
      alert('Hanya Admin Sekolah yang dapat mengaktifkan atau menonaktifkan akun Operator Sekolah.');
      return;
    }

    const newActiveState = !account.isActive;
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, isActive: newActiveState } : a))
    );

    try {
      await supabase
        .from('users')
        .update({ is_active: newActiveState })
        .eq('id', account.id);
    } catch (e) {
      console.error('Error toggling active state in DB:', e);
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.email) {
      alert('Username dan email wajib diisi!');
      return;
    }

    const newId = `usr-sch-${Date.now()}`;
    const newAcc: AccountUser = {
      id: newId,
      name: newUserData.name || newUserData.username,
      username: newUserData.username,
      email: newUserData.email,
      role: 'OPERATOR',
      scopeType: 'satuan',
      scopeId: '69893669 - KB AL-IKHLAS',
      mfaEnabled: newUserData.mfaEnabled,
      isActive: true,
      lastLoginAt: 'Baru Dibuat',
    };

    setAccounts((prev) => [...prev, newAcc]);

    // Save to PostgreSQL via Supabase
    try {
      await supabase.from('users').insert({
        id: newId,
        username: newUserData.username,
        email: newUserData.email,
        role: 'OPERATOR',
        password: newUserData.password || 'password123',
        is_active: true,
      });
    } catch (e) {
      console.error('Error saving user to DB:', e);
    }

    setIsAddUserModalOpen(false);
    setNewUserData({
      name: '',
      username: '',
      email: '',
      role: 'OPERATOR',
      scopeType: 'satuan',
      scopeId: '69893669 - KB AL-IKHLAS',
      password: '',
      mfaEnabled: true,
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Access Control Matrix & Scoped RBAC"
        subtitle="Matriks Hak Akses Modul, Otoritas Admin Sekolah & Pengendalian Izin Operator Sekolah (KB AL-IKHLAS)"
      />

      <div className="p-6 space-y-6">
        {/* Scope Context & Role Card */}
        <div className="glass-card p-5 border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <KeyRound size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Institusi Satuan: {currentUser?.nama_sekolah || 'KB AL-IKHLAS'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                  NPSN: {currentUser?.npsn || '69893669'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Model Otoritas: <strong>Scoped Role-Based Access Control (RBAC)</strong> · Prinsip Delegasi Satuan Pendidikan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs text-slate-700 flex items-center gap-2">
              <Shield size={14} className="text-indigo-600" />
              <span>Peran Anda:</span>
              <strong className="text-indigo-700 uppercase">
                {currentUser?.role === 'OPERATOR' ? 'Operator Sekolah' : 'Admin Sekolah'}
              </strong>
            </span>
            <button
              onClick={() => setEditProfileOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Edit Profil</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 3 Main Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <KeyRound size={15} />
            <span>Matriks Izin Modul (Role Permissions)</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Manajemen Akun & Cakupan Scope ({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers size={15} />
            <span>Arsitektur Scoped RBAC (PRD 6.1)</span>
          </button>
        </div>

        {/* TAB 1: PERMISSIONS MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Rule Policy Notification Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
              <Sliders size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <strong className="text-indigo-900 block font-bold">
                  Kebijakan Delegasi Hak Akses Satuan (KB AL-IKHLAS):
                </strong>
                <p className="text-indigo-800 mt-0.5">
                  1. <strong>Super Admin Global</strong> memiliki akses penuh ke seluruh modul sistem (diproteksi secara permanen).<br />
                  2. <strong>Admin Sekolah (Kepsek)</strong> memiliki wewenang tertinggi di satuan pendidikan untuk mengelola anggaran Rp 234,7 Jt.<br />
                  3. Hak akses yang dapat diubah dan dikendalikan oleh Admin Sekolah <strong>hanya Operator Sekolah</strong>. Hak akses Super Admin dan Admin Sekolah diproteksi oleh kebijakan platform.
                </p>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    <span>Matriks Hak Akses Modul Platform Institusi Pendidikan</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Izin operasi: <strong>Lihat (V)</strong>, <strong>Buat (C)</strong>, <strong>Ubah (E)</strong>, dan <strong>Hapus (D)</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    ✓ Tersinkronisasi Otomatis
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase text-slate-500 bg-slate-50">
                      <th className="py-3 px-5">Modul Platform Institusi</th>
                      {rolePermissions.map((rp) => (
                        <th key={rp.role} className="px-4 py-3 text-center min-w-[200px]">
                          <div className="font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
                            {rp.roleTitle}
                            {rp.role !== 'OPERATOR' && (
                              <span title="Hak akses diproteksi permanen">
                                <Lock size={12} className="text-slate-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-normal normal-case text-slate-500 mt-0.5">
                            {rp.scopeLabel}
                          </div>
                          <div className="text-[9px] font-semibold text-indigo-600 normal-case mt-0.5">
                            {rp.badgeSubtitle}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modulesList.map((m) => (
                      <tr key={m} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {m}
                        </td>
                        {rolePermissions.map((rp) => {
                          const perm = rp.permissions[m] || {
                            canView: false,
                            canCreate: false,
                            canEdit: false,
                            canDelete: false,
                          };

                          const isEditableRole = rp.role === 'OPERATOR';

                          return (
                            <td key={rp.role} className="px-4 py-3.5 text-center">
                              <div className={`inline-flex items-center gap-1 rounded-xl border p-1 shadow-xs ${
                                isEditableRole
                                  ? 'border-indigo-300 bg-indigo-50/40 ring-1 ring-indigo-200'
                                  : 'border-slate-200 bg-white opacity-90'
                              }`}>
                                {/* View */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle(rp.role, m, 'canView', perm.canView)}
                                  title={
                                    isEditableRole
                                      ? 'Klik untuk mengubah izin Melihat (View) Operator'
                                      : 'Hak akses diproteksi (hanya dapat dibaca)'
                                  }
                                  className={`h-5 w-5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                                    isEditableRole ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-85'
                                  } ${
                                    perm.canView
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-50 text-slate-300 border border-slate-200'
                                  }`}
                                >
                                  V
                                </button>
                                {/* Create */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle(rp.role, m, 'canCreate', perm.canCreate)}
                                  title={
                                    isEditableRole
                                      ? 'Klik untuk mengubah izin Membuat (Create) Operator'
                                      : 'Hak akses diproteksi (hanya dapat dibaca)'
                                  }
                                  className={`h-5 w-5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                                    isEditableRole ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-85'
                                  } ${
                                    perm.canCreate
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-50 text-slate-300 border border-slate-200'
                                  }`}
                                >
                                  C
                                </button>
                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle(rp.role, m, 'canEdit', perm.canEdit)}
                                  title={
                                    isEditableRole
                                      ? 'Klik untuk mengubah izin Mengubah (Edit) Operator'
                                      : 'Hak akses diproteksi (hanya dapat dibaca)'
                                  }
                                  className={`h-5 w-5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                                    isEditableRole ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-85'
                                  } ${
                                    perm.canEdit
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-slate-50 text-slate-300 border border-slate-200'
                                  }`}
                                >
                                  E
                                </button>
                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleToggle(rp.role, m, 'canDelete', perm.canDelete)}
                                  title={
                                    isEditableRole
                                      ? 'Klik untuk mengubah izin Menghapus (Delete) Operator'
                                      : 'Hak akses diproteksi (hanya dapat dibaca)'
                                  }
                                  className={`h-5 w-5 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                                    isEditableRole ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-85'
                                  } ${
                                    perm.canDelete
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-50 text-slate-300 border border-slate-200'
                                  }`}
                                >
                                  D
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend & Help */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <span className="font-bold text-slate-800">Keterangan Otoritas:</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">V</span>
                    <span>View (Lihat Data)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">C</span>
                    <span>Create (Buat Baru)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">E</span>
                    <span>Edit (Ubah Data)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">D</span>
                    <span>Delete (Hapus Data)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full font-semibold">
                    💡 Kolom <strong>Operator Sekolah</strong> dapat disesuaikan langsung oleh Admin Sekolah
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNTS & SCOPE MANAGEMENT */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daftar Akun Pengguna & Cakupan Scope</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Daftar akun berwenang di lingkungan satuan <strong>KB AL-IKHLAS</strong> dan pengawas Super Admin Global.
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>Tambah Operator Sekolah</span>
                </button>
              )}
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase text-slate-500 bg-slate-50">
                      <th className="py-3 px-5">Nama & Username</th>
                      <th className="py-3 px-4">Peran (Role)</th>
                      <th className="py-3 px-4">Tipe Cakupan (Scope Type)</th>
                      <th className="py-3 px-4">Identitas Cakupan (Scope ID)</th>
                      <th className="py-3 px-4 text-center">MFA TOTP</th>
                      <th className="py-3 px-4 text-center">Status Akun</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map((acc) => {
                      const isSuper = acc.role === 'SUPER_ADMIN';
                      const isOps = acc.role === 'OPS_ADMIN';
                      const isKemenag = acc.role === 'ADMIN_KEMENTERIAN';
                      const isWilayah = acc.role === 'ADMIN_WILAYAH';
                      const isSchoolAdmin = acc.role === 'ADMIN';
                      const isOperator = acc.role === 'OPERATOR';
                      const isProtected = !isOperator;

                      let roleLabel = 'Operator Sekolah';
                      let roleBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (isSuper) {
                        roleLabel = 'Super Admin Global';
                        roleBadgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                      } else if (isOps) {
                        roleLabel = 'Ops Admin Global';
                        roleBadgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                      } else if (isKemenag) {
                        roleLabel = 'Admin Kementerian';
                        roleBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                      } else if (isWilayah) {
                        roleLabel = 'Admin Wilayah (Dinas)';
                        roleBadgeClass = 'bg-teal-100 text-teal-800 border-teal-200';
                      } else if (isSchoolAdmin) {
                        roleLabel = 'Admin Sekolah (Kepsek)';
                        roleBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                      }

                      let scopeBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-semibold';
                      if (acc.scopeType === 'global') {
                        scopeBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
                      } else if (acc.scopeType === 'kementerian') {
                        scopeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
                      } else if (acc.scopeType === 'provinsi' || acc.scopeType === 'wilayah') {
                        scopeBadgeClass = 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';
                      }

                      return (
                        <tr key={acc.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {acc.name}
                              {(isSuper || isOps) && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-bold">
                                  Global
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.email}</div>
                            <div className="text-[10px] text-indigo-600 font-mono">@{acc.username}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${roleBadgeClass}`}>
                              {roleLabel}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                              {acc.scopeType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${scopeBadgeClass}`}>
                              {acc.scopeId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.mfaEnabled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {acc.mfaEnabled ? 'Wajib (Aktif)' : 'Opsional'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isProtected ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center gap-1 mx-auto max-w-[100px]">
                                <Lock size={10} />
                                <span>● Aktif</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleAccountActive(acc)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  acc.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                                title="Klik untuk mengaktifkan/menonaktifkan operator"
                              >
                                {acc.isActive ? '● Aktif' : '🔒 Non-Aktif'}
                              </button>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isOperator ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditScope(acc)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Ubah Cakupan Scope Operator"
                                >
                                  <Edit2 size={14} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  Diproteksi
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCOPED RBAC ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-5">
            <div className="glass-card p-6 border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Prinsip Penegakan Scoped RBAC Satuan Pendidikan (PRD Section 6.1)
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Hierarki Wewenang Multi-Tingkat dan Isolasi Data Teritorial Satuan Pendidikan.
                  </p>
                </div>
              </div>

              {/* 3 Main Principles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px]">1</span>
                    <span>Super Admin Global (Pusat)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memegang otoritas penuh (Global Scope) ke seluruh modul tanpa restriksi wilayah. Memantau seluruh satuan pendidikan dan tidak dapat diubah oleh administrator tingkat satuan.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px]">2</span>
                    <span>Admin Sekolah (Kepala Satuan)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memegang wewenang tertinggi di satuan KB AL-IKHLAS. Berhak mengesahkan RAB pagu Rp 234,7 Jt, mengelola staf satuan, dan secara eksklusif mengatur hak akses Operator Sekolah.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">3</span>
                    <span>Operator Sekolah (Pelaksana)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bertanggung jawab atas entri draf alokasi, pencatatan belanja kas, dan pemindaian OCR nota kuitansi. Hak operasinya dikendalikan penuh oleh Admin Sekolah.
                  </p>
                </div>
              </div>

              {/* Visual Hierarchy Flow */}
              <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>Alur Delegasi Wewenang Satuan Pendidikan (Hierarchical RBAC Flow)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-purple-500/30">
                    <span className="text-[10px] text-purple-400 font-mono block font-bold">LEVEL 1 · GLOBAL</span>
                    <strong className="text-slate-100 block mt-1 text-sm">Super Admin Global</strong>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Akses mutlak ke seluruh 38 provinsi & 5+1 dasbor. Konfigurasi keamanan pusat.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700">
                      Permanen & Diproteksi
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/50 shadow-inner">
                    <span className="text-[10px] text-indigo-400 font-mono block font-bold">LEVEL 2 · SATUAN</span>
                    <strong className="text-white block mt-1 text-sm">Admin Sekolah (Kepsek)</strong>
                    <p className="text-[11px] text-indigo-200 mt-1.5 leading-relaxed">
                      Wewenang di atas Operator Sekolah. Menentukan modul yang boleh diakses Operator KB AL-IKHLAS.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700">
                      Pengendali Izin Operator
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/90 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-mono block font-bold">LEVEL 3 · OPERASIONAL</span>
                    <strong className="text-slate-100 block mt-1 text-sm">Operator Sekolah</strong>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Pencatatan nota kuitansi belanja kas, pemindaian OCR AI, dan input draf kegiatan.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                      Izin Dikelola oleh Kepsek
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: EDIT SCOPE OPERATOR */}
      {editingScopeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Ubah Batasan Cakupan Scope Operator</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Akun: <strong>{editingScopeAccount.name}</strong> (@{editingScopeAccount.username})
                </p>
              </div>
              <button
                onClick={() => setEditingScopeAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditScope} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Cakupan (Scope Type)</label>
                <input
                  type="text"
                  disabled
                  value="Satuan Pendidikan (Terkunci)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-500 bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Operator sekolah terikat pada satuan pendidikan KB AL-IKHLAS.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identitas Cakupan (Scope ID)</label>
                <input
                  type="text"
                  disabled
                  value={scopeEditData.scopeId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium text-slate-700 bg-slate-50"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Kewajiban Autentikasi MFA 2FA</span>
                  <span className="text-[11px] text-slate-500">Wajibkan verifikasi TOTP saat pencatatan belanja kas</span>
                </div>
                <input
                  type="checkbox"
                  checked={scopeEditData.mfaEnabled}
                  onChange={(e) => setScopeEditData({ ...scopeEditData, mfaEnabled: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingScopeAccount(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Simpan Perubahan Scope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH OPERATOR SEKOLAH */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Tambah Akun Operator Sekolah</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Mendaftarkan akun operator baru di bawah satuan <strong>KB AL-IKHLAS</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Petugas</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="operator.baru"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="operator@kbalikhlas.sch.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                  <input
                    type="text"
                    disabled
                    value="Operator Sekolah (Belanja & RAB)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Cakupan Teritorial (Scope)</span>
                  <span className="text-[11px] text-slate-500 font-mono">69893669 - KB AL-IKHLAS</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                  Terkunci di KB AL-IKHLAS
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Daftarkan Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
