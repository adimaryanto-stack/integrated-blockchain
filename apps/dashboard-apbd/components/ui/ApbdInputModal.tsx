'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Save, Landmark } from 'lucide-react';
import { formatRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { upsertApbdProvinsi } from '@/lib/data/apbd-service';
import { useAppStore } from '@/lib/store';

interface ApbdInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTotalApbd?: number;
  initialAlokasiRiil?: number;
  initialRealisasi?: number;
  tahun: number;
}

export default function ApbdInputModal({
  isOpen,
  onClose,
  initialTotalApbd = 8240000000000,
  initialAlokasiRiil = 1750000000000,
  initialRealisasi = 1420000000000,
  tahun,
}: ApbdInputModalProps) {
  const { triggerRefresh } = useAppStore();
  const [totalApbd, setTotalApbd] = useState<number>(initialTotalApbd);
  const [alokasiRiil, setAlokasiRiil] = useState<number>(initialAlokasiRiil);
  const [realisasi, setRealisasi] = useState<number>(initialRealisasi);
  const [catatan, setCatatan] = useState<string>(`Perda APBD Provinsi Lampung Tahun ${tahun}`);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const batas20 = totalApbd * 0.2;
  const persentase = totalApbd > 0 ? (alokasiRiil / totalApbd) * 100 : 0;
  const isMemenuhi = alokasiRiil >= batas20;
  const selisihBatas = alokasiRiil - batas20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalApbd <= 0) {
      setErrorMsg('Total APBD harus lebih besar dari 0');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const res = await upsertApbdProvinsi({
      tahun,
      total_apbd: totalApbd,
      alokasi_pendidikan_riil: alokasiRiil,
      realisasi_pendidikan_total: realisasi,
      catatan,
      diinput_oleh: 'Super Admin (BPKAD Lampung)',
    });

    setSaving(false);

    if (res) {
      triggerRefresh();
      onClose();
    } else {
      setErrorMsg('Gagal menyimpan data ke database PostgreSQL lokal.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in-up">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Input & Validasi APBD Lampung</h3>
              <p className="text-xs text-text-muted">Tahun Anggaran {tahun}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-text-muted hover:text-text-primary transition"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Total APBD */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Total APBD Provinsi Lampung (Nominal Murni)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-medium text-text-muted">Rp</span>
              <input
                type="number"
                step="1000000"
                value={totalApbd}
                onChange={(e) => setTotalApbd(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 text-sm font-mono bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
                required
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1 font-mono">{fmtTriliun(totalApbd)} ({formatRupiah(totalApbd)})</p>
          </div>

          {/* Batas 20% (Auto Computed) */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-indigo-900 block">Kewajiban Konstitusi (20%)</span>
              <span className="text-xs text-indigo-700">Pasal 31 Ayat 4 UUD 1945</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold font-mono text-indigo-900 block">{fmtTriliun(batas20)}</span>
              <span className="text-[10px] text-indigo-600 font-mono">Batas Minimal</span>
            </div>
          </div>

          {/* Alokasi Pendidikan Riil */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Alokasi Anggaran Pendidikan Riil Pemprov Lampung
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-medium text-text-muted">Rp</span>
              <input
                type="number"
                step="1000000"
                value={alokasiRiil}
                onChange={(e) => setAlokasiRiil(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 text-sm font-mono bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
                required
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1 font-mono">{fmtTriliun(alokasiRiil)} ({formatRupiah(alokasiRiil)})</p>
          </div>

          {/* Realisasi Total */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Realisasi Belanja Pendidikan Terkini
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-medium text-text-muted">Rp</span>
              <input
                type="number"
                step="1000000"
                value={realisasi}
                onChange={(e) => setRealisasi(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 text-sm font-mono bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-[11px] text-text-muted mt-1 font-mono">{fmtTriliun(realisasi)} ({formatRupiah(realisasi)})</p>
          </div>

          {/* Status Kepatuhan 20% Indicator */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isMemenuhi
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {isMemenuhi ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-rose-600" />}
              <div>
                <p className="text-xs font-bold">
                  Status Kepatuhan: {isMemenuhi ? 'MEMENUHI (≥ 20%)' : 'BELUM MEMENUHI (< 20%)'}
                </p>
                <p className="text-[11px] opacity-80">
                  {isMemenuhi
                    ? `Surplus alokasi: ${fmtTriliun(selisihBatas)} di atas batas wajib`
                    : `Kurang alokasi: ${fmtTriliun(Math.abs(selisihBatas))} dari batas wajib 20%`}
                </p>
              </div>
            </div>
            <div className="text-right font-mono font-bold text-sm">
              {persentase.toFixed(2)}%
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Catatan / Dasar Hukum Perda
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Perda APBD Lampung No. 4 Tahun 2026"
              className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-xs"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs"
            >
              <Save size={14} />
              <span>{saving ? 'Menyimpan ke PostgreSQL...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
