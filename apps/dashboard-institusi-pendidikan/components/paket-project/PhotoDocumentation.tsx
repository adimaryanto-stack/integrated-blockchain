'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { TahapProject, ProjectPhoto, TAHAP_LABELS } from '@/types';
import { Camera, Trash2, Calendar, FileText, Check, Plus, Image as ImageIcon, Lock } from 'lucide-react';

interface PhotoDocumentationProps {
  projectId: string;
}

export default function PhotoDocumentation({ projectId }: PhotoDocumentationProps) {
  const { projectPhotos, addProjectPhoto, removeProjectPhoto, addNotification, currentUser } = useAppStore();
  const isReadOnly = currentUser?.is_active === false;

  const [activeTab, setActiveTab] = useState<TahapProject>('pra_produksi');
  const [caption, setCaption] = useState('');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');

  const filteredPhotos = useMemo(() => {
    return projectPhotos.filter(p => p.project_id === projectId && p.tahap === activeTab);
  }, [projectPhotos, projectId, activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat). Anda tidak dapat mengunggah foto.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhoto: ProjectPhoto = {
        id: `photo-${Date.now()}`,
        project_id: projectId,
        tahap: activeTab,
        file_url: reader.result as string,
        caption: caption.trim() || 'Dokumentasi kegiatan',
        tanggal_ambil: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        uploaded_by: currentUser?.username || 'admin.kbalikhlas',
        created_at: new Date().toISOString(),
      };

      addProjectPhoto(newPhoto);
      addNotification({
        message: `Foto dokumentasi berhasil diunggah untuk tahap ${TAHAP_LABELS[activeTab]}.`,
        type: 'success',
        link: `/dashboard/rencana-anggaran/paket-project/${projectId}`,
      });

      setCaption('');
    };

    reader.readAsDataURL(file);
  };

  const handleSaveCaption = (photoId: string) => {
    if (isReadOnly) {
      alert('Akses Ditolak: Akun Anda berstatus NON-AKTIF (Hanya Lihat).');
      return;
    }
    const store = useAppStore.getState();
    store.setProjectPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, caption: editingCaptionText } : p)
    );
    setEditingPhotoId(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs Stage Selector */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl max-w-md">
        {(['pra_produksi', 'produksi', 'pasca_produksi'] as TahapProject[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {TAHAP_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Upload Zone & Caption Form */}
      {isReadOnly ? (
        <div className="glass-card p-4 border border-rose-200 bg-rose-50/70 rounded-2xl flex items-center gap-3 shadow-xs">
          <Lock size={18} className="text-rose-600 shrink-0" />
          <div className="text-xs text-rose-900 leading-snug">
            <span className="font-bold">Unggah Dokumentasi Dinonaktifkan:</span> Akun Anda saat ini berstatus <strong>NON-AKTIF (Hanya Lihat)</strong>. Anda hanya dapat melihat foto-foto dokumentasi yang telah tersimpan.
          </div>
        </div>
      ) : (
        <div className="glass-card p-5 border border-slate-200/60">
          <h4 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-1.5">
            <span>📸</span> Unggah Foto Dokumentasi Baru
          </h4>

          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 space-y-3">
              <input
                type="text"
                placeholder="Berikan keterangan/caption singkat mengenai foto ini..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-text-primary focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-text-muted font-medium"
              />
              <p className="text-[10px] text-text-muted font-medium">
                Tahap Aktif: <span className="font-extrabold text-blue-600 uppercase">{TAHAP_LABELS[activeTab]}</span>
              </p>
            </div>

            <label className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer select-none">
              <Camera size={16} />
              <span>PILIH & UNGGAH FOTO</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="glass-card overflow-hidden group border border-slate-200/60 flex flex-col justify-between shadow-sm hover:shadow-md transition">
              {/* Photo Preview */}
              <div className="relative aspect-video w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.file_url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {!isReadOnly && (
                  <button
                    onClick={() => removeProjectPhoto(photo.id)}
                    className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full transition shadow cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Hapus foto"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Card Meta & Caption */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  {editingPhotoId === photo.id ? (
                    <div className="flex gap-1.5 items-stretch">
                      <input
                        type="text"
                        value={editingCaptionText}
                        onChange={(e) => setEditingCaptionText(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <button
                        onClick={() => handleSaveCaption(photo.id)}
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <p
                      className="text-xs font-semibold text-text-primary leading-normal hover:text-blue-600 cursor-pointer"
                      onClick={() => {
                        setEditingPhotoId(photo.id);
                        setEditingCaptionText(photo.caption);
                      }}
                      title="Klik untuk mengubah caption"
                    >
                      {photo.caption}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-muted font-medium pt-2 border-t border-slate-100 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {photo.tanggal_ambil}
                  </span>
                  <span>Oleh: {photo.uploaded_by}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-text-muted flex flex-col items-center justify-center border border-slate-200/50">
          <ImageIcon size={36} className="text-slate-300 mb-2.5" />
          <h5 className="text-xs font-bold text-text-secondary">Belum ada foto dokumentasi</h5>
          <p className="text-[10px] text-text-muted mt-0.5 max-w-[280px] leading-relaxed mx-auto font-medium">
            Unggah dokumentasi foto di atas untuk melengkapi laporan progres tahap {TAHAP_LABELS[activeTab]} Anda.
          </p>
        </div>
      )}
    </div>
  );
}
