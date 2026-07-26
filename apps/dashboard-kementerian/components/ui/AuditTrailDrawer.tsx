'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { X, History, Search, Trash2, UserCheck, Clock, FileSpreadsheet, ArrowRight } from 'lucide-react';

export default function AuditTrailDrawer() {
  const { auditDrawerOpen, setAuditDrawerOpen, auditLogs, clearAuditLogs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  if (!auditDrawerOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.nilai_lama).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.nilai_baru).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity =
      selectedEntity === 'ALL' ||
      (selectedEntity === 'PROVINSI' && log.entitas.includes('Provinsi')) ||
      (selectedEntity === 'KABKOTA' && log.entitas.includes('Kabupaten')) ||
      (selectedEntity === 'RINCIAN' && log.entitas.includes('Rincian')) ||
      (selectedEntity === 'USER' && log.entitas.includes('User'));

    return matchesSearch && matchesEntity;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN_PROVINSI':
      case 'ADMIN_KABKOTA':
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'AUDITOR':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setAuditDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <History size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  Audit Trail
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {auditLogs.length} Entri
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Histori & Log Perubahan Data Real-time</p>
              </div>
            </div>

            <button
              onClick={() => setAuditDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari user, entitas, atau nilai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                {['ALL', 'PROVINSI', 'KABKOTA', 'RINCIAN', 'USER'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedEntity(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      selectedEntity === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'Semua'
                      : cat === 'PROVINSI'
                      ? 'Provinsi'
                      : cat === 'KABKOTA'
                      ? 'Kab/Kota'
                      : cat === 'RINCIAN'
                      ? 'Rincian'
                      : 'User'}
                  </button>
                ))}
              </div>

              {auditLogs.length > 0 && (
                <button
                  onClick={clearAuditLogs}
                  className="p-1 text-slate-400 hover:text-rose-600 transition flex items-center gap-1 text-[11px]"
                  title="Bersihkan Histori Audit"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <FileSpreadsheet size={32} className="text-slate-300" />
                <p className="text-xs font-semibold">Belum ada catatan perubahan data.</p>
                <p className="text-[11px] text-slate-400">
                  Lakukan perubahan nilai sel pada tabel spreadsheet untuk merekam histori.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="pt-3.5 first:pt-0 space-y-2">
                  {/* Log Card Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheck size={13} className="text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{log.user_nama}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getRoleBadge(log.user_role)}`}>
                      {log.user_role}
                    </span>
                  </div>

                  {/* Entity & Field */}
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="truncate">{log.entitas}</span>
                      <span className="text-[10px] text-indigo-600 font-mono">[{log.field}]</span>
                    </div>

                    {/* Change Diff */}
                    <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-200/60 font-mono">
                      <span className="text-rose-600 line-through truncate max-w-[45%]" title={String(log.nilai_lama)}>
                        {String(log.nilai_lama) || '(kosong)'}
                      </span>
                      <ArrowRight size={12} className="text-slate-400 shrink-0" />
                      <span className="text-emerald-600 font-bold truncate max-w-[45%]" title={String(log.nilai_baru)}>
                        {String(log.nilai_baru)}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {log.timestamp}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">{log.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
            Sistem Audit Log Kementerian Pendidikan RI • Terkoneksi Real-time
          </div>
        </div>
      </div>
    </div>
  );
}
