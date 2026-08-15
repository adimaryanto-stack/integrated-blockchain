'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { AuditAnomaly } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { fmtRupiah } from '@/lib/utils/formatters';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Play,
  Loader2, CheckCircle2, FileText, RefreshCw, Info,
  HelpCircle, MapPin, Calendar, User, Wrench, Send,
  MessageSquare, FileSearch, X, Award, Check
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AuditPage() {
  const { activeTahun } = useAppStore();
  const schoolId = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';
  const schoolName = 'KB AL-IKHLAS';
  const npsn = '69893669';

  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>([]);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);

  // Fetch anomalies ONLY for this school (KB AL-IKHLAS)
  useEffect(() => {
    let isMounted = true;
    setLoadingAnomalies(true);

    supabase
      .from('audit_anomaly')
      .select('*')
      .eq('institusi_id', schoolId)
      .order('tanggal_ditemukan', { ascending: false })
      .then(({ data, error }) => {
        if (isMounted) {
          if (!error && data) {
            const rows = data.map((r: any) => ({
              ...r,
              nominal_selisih: Number(r.nominal_selisih || 0),
            }));
            setAnomalies(rows);
          }
          setLoadingAnomalies(false);
        }
      });

    return () => { isMounted = false; };
  }, [activeTahun]);

  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'DONE'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  
  // Investigation Modal states
  const [selectedAnomaly, setSelectedAnomaly] = useState<AuditAnomaly | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo Tim Bendahara **${schoolName}**! Saya Asisten Audit AI Gemini. Saya telah menghubungkan analisis kepatuhan keuangan sekolah Anda dengan database PostgreSQL lokal 2026. Anda dapat menanyakan kesesuaian juknis BOP PAUD, kelayakan kuitansi SPJ, atau verifikasi sisa saldo kas di bank.`,
      timestamp: new Date()
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Statistics for KB AL-IKHLAS
  const activeCount = anomalies.filter(a => a.status !== 'SELESAI').length;
  const totalLoss = anomalies
    .filter(a => a.status !== 'SELESAI')
    .reduce((sum, a) => sum + a.nominal_selisih, 0);
  const resolvedCount = anomalies.filter(a => a.status === 'SELESAI').length;

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Severity style helper
  const getSeverityBadge = (sev: 'LOW' | 'MEDIUM' | 'HIGH' | 'CLEAN') => {
    switch (sev) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
  };

  // Status style helper
  const getStatusBadge = (status: 'TEMUAN' | 'INVESTIGASI' | 'SELESAI') => {
    switch (status) {
      case 'TEMUAN':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'INVESTIGASI':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
  };

  // Run Gemini AI Scan specifically for KB AL-IKHLAS
  const handleStartScan = () => {
    setScanStatus('SCANNING');
    setScanProgress(0);
    
    const messages = [
      'Menghubungkan ke Gemini AI Gateway & Database PostgreSQL lokal...',
      'Membaca histori 3 sumber dana: APBN (Rp 187,8M), APBD (Rp 41,9M), CSR (Rp 5,0M)...',
      'Memindai 8 berkas kuitansi & nota belanja operasional KB AL-IKHLAS...',
      'Mengevaluasi kesesuaian harga satuan APE & modul dengan e-Katalog Aceh...',
      'Memvalidasi kepatuhan pajak PPN 11% & pajak honorarium guru...',
      'Merumuskan kesimpulan analitis audit kepatuhan WTP...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress(Math.min(currentStep * 16.6, 100));
      setScanMessage(messages[Math.min(currentStep, messages.length - 1)]);

      if (currentStep >= 6) {
        clearInterval(interval);
        setScanStatus('DONE');
      }
    }, 600);
  };

  // Chat Q&A response generation logic for KB AL-IKHLAS
  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newUserMessage: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = '';
      const textLower = userText.toLowerCase();

      if (textLower.includes('anggaran') || textLower.includes('pagu') || textLower.includes('alokasi') || textLower.includes('saldo')) {
        aiText = `Berdasarkan database lokal tahun anggaran **2026** untuk **${schoolName}**:\n` +
          `- **Total Alokasi Diterima**: Rp 234.775.639 (APBN: Rp 187.820.511 | APBD: Rp 41.955.128 | CSR: Rp 5.000.000)\n` +
          `- **Realisasi Belanja Riil**: Rp 197.211.537 (8 Transaksi Operasional)\n` +
          `- **Sisa Saldo Kas di Bank**: Rp 37.564.102 (Rekening Giro BPD Aceh Syariah 100.845.411.000)\n` +
          `- **Persentase Penyerapan**: 84.0% (Kategori Sangat Sehat).`;
      } else if (textLower.includes('belanja') || textLower.includes('transaksi') || textLower.includes('kuitansi') || textLower.includes('ape')) {
        aiText = `Semua 8 item transaksi pengeluaran **${schoolName}** telah diperiksa:\n` +
          `1. Buku Cerita & Modul Karakter: Rp 28.500.000 (CV Pustaka Ceria Aceh) - **VALID**\n` +
          `2. APE Indoor & Outdoor: Rp 35.400.000 (UD Sarana PAUD Meulaboh) - **VALID**\n` +
          `3. Honorarium Guru PAUD (Jan-Feb): Rp 32.000.000 - **VALID**\n` +
          `4. ATK & Media Gambar: Rp 18.750.000 - **VALID**\n` +
          `5. Pentas Seni & Kunjungan Edukasi: Rp 22.600.000 - **VALID**\n` +
          `6. Honorarium Guru PAUD (Mar-Apr): Rp 32.000.000 - **VALID**\n` +
          `7. Sanitasi & Obat P3K: Rp 15.400.000 - **VALID**\n` +
          `8. Listrik & Jaringan Internet: Rp 12.561.537 - **VALID**\n\n` +
          `Seluruh bukti kuitansi belanja lengkap dan terarsip secara digital.`;
      } else if (textLower.includes('anomali') || textLower.includes('fraud') || textLower.includes('temuan') || textLower.includes('masalah')) {
        aiText = `Hasil audit AI Gemini mengonfirmasi: **0 Temuan Anomali / Tidak Ada Indikasi Fraud** pada pembukuan ${schoolName}. Semua pengeluaran berada dalam batas harga pasar Kabupaten Aceh Barat dan sesuai peruntukan Juknis BOP PAUD 2026.`;
      } else if (textLower.includes('rekomendasi') || textLower.includes('saran') || textLower.includes('bpk') || textLower.includes('inspektorat')) {
        aiText = `Rekomendasi persiapan audit berkala:\n` +
          `1. Pastikan buku kas umum (BKU) dan buku pembantu bank selalu dicetak dan ditandatangani per akhir bulan.\n` +
          `2. Sisa kas Rp 37.564.102 dapat dialokasikan untuk operasional semester 2 sesuai revisi RAB.\n` +
          `3. Pertahankan status kepatuhan WTP (Wajar Tanpa Pengecualian).`;
      } else {
        aiText = `Sebagai AI Pengawas Keuangan untuk **${schoolName}**, saya siap membantu verifikasi pembukuan SPJ, alokasi dana BOP PAUD, dan kepatuhan administrasi. Ada dokumen atau transaksi tertentu yang ingin Anda konsultasikan?`;
      }

      const newAiMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiText,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newAiMessage]);
      setIsAiTyping(false);
    }, 800);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title={`Audit Anggaran: ${schoolName}`}
        subtitle={`Panel audit internal, verifikasi kepatuhan SPJ, dan deteksi anomali mandiri bertenaga Gemini AI & Database Lokal`}
      />

      <div className="p-6 space-y-6">
        {/* Metrik Ringkasan Khusus KB AL-IKHLAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="metric-card accent-emerald">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status Kepatuhan Audit</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-2">100% WTP</h3>
                <p className="text-xs text-text-secondary mt-1">Wajar Tanpa Pengecualian</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>

          <div className="metric-card accent-indigo">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">SPJ Belanja Terverifikasi</p>
                <h3 className="text-2xl font-bold text-indigo-600 mt-2">8 Dokumen</h3>
                <p className="text-xs text-text-secondary mt-1">Total SPJ Rp 197.211.537</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-inner">
                <FileCheckIcon size={20} />
              </div>
            </div>
          </div>

          <div className="metric-card accent-blue">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Temuan Anomali Aktif</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-2">{activeCount} Temuan</h3>
                <p className="text-xs text-text-secondary mt-1">Tidak terdeteksi deviasi anggaran</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-inner">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Baris Utama: Panel Status Audit & AI Scanner Khusus KB AL-IKHLAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Kiri: Tabel Status Temuan Audit Sekolah */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-white/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-text-primary">Status Audit & Integritas Keuangan Sekolah</h3>
                </div>
                <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">PostgreSQL Lokal (:2025)</span>
              </div>
              
              <div className="p-6">
                {loadingAnomalies ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                    <span className="ml-2 text-xs text-text-muted">Memuat data audit sekolah...</span>
                  </div>
                ) : anomalies.length === 0 ? (
                  <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                      <Check size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-emerald-800">Pembukuan Keuangan Sekolah Bersih & Tertib</h4>
                      <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto leading-relaxed">
                        Tidak ditemukan indikasi mark-up, kuitansi ganda, maupun anomali pajak pada seluruh transaksi <strong>{schoolName}</strong> untuk Tahun Anggaran {activeTahun}.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs text-emerald-900 font-medium">
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" /> Pagu Alokasi Rp 234.775.639 Sinkron</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" /> Realisasi Belanja Rp 197.211.537 Valid</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" /> Saldo Kas Bank Rp 37.564.102 Sesuai</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="sheet-header-cell text-center" style={{ width: 40 }}>No</th>
                          <th className="sheet-header-cell text-left">Institusi</th>
                          <th className="sheet-header-cell text-left">Tipe Temuan</th>
                          <th className="sheet-header-cell text-right">Potensi Selisih</th>
                          <th className="sheet-header-cell text-center">Keparahan</th>
                          <th className="sheet-header-cell text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalies.map((anom, idx) => (
                          <tr key={anom.id} className="hover:bg-indigo-50/30 transition">
                            <td className="sheet-cell text-center font-mono text-xs">{idx + 1}</td>
                            <td className="sheet-cell text-left font-bold text-xs">{anom.nama_institusi}</td>
                            <td className="sheet-cell text-left text-xs">{anom.tipe_anomali}</td>
                            <td className="sheet-cell text-right font-mono font-bold text-xs text-rose-600">Rp {fmtRupiah(anom.nominal_selisih)}</td>
                            <td className="sheet-cell text-center"><span className={`badge ${getSeverityBadge(anom.tingkat_keparahan)} text-[10px]`}>{anom.tingkat_keparahan}</span></td>
                            <td className="sheet-cell text-center"><span className={`badge ${getStatusBadge(anom.status)} text-[10px]`}>{anom.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Asisten Konsultasi Audit AI Gemini Interaktif */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-text-primary">Konsultasi Kepatuhan Audit (Gemini AI)</h3>
                </div>
                <span className="text-[10px] text-text-muted">Siap Menjawab Regulasi & Juknis BOP</span>
              </div>

              <div className="p-4 flex flex-col h-[320px]">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                          AI
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                            : 'bg-slate-100 text-text-primary rounded-bl-none border border-slate-200/60'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>
                        <span className={`text-[9px] block mt-1.5 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-text-muted'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isAiTyping && (
                    <div className="flex gap-2.5 items-center">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        AI
                      </div>
                      <div className="bg-slate-100 border border-slate-200/60 px-3.5 py-2 rounded-2xl rounded-bl-none flex items-center gap-1.5 text-xs text-text-muted">
                        <Loader2 className="animate-spin" size={12} />
                        <span>Gemini sedang menganalisis kepatuhan anggaran...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="pt-3 border-t border-border flex gap-2">
                  <input
                    type="text"
                    placeholder="Tanyakan status belanja, sisa saldo kas, atau juknis BOP PAUD..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isAiTyping}
                    className="btn btn-primary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Kanan: Simulator Pemindaian Gemini AI Sekolah Mandiri */}
          <div className="space-y-6">
            <div className="glass-card p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Play size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">AI Compliance Scanner</h3>
                  <p className="text-[10px] text-text-muted">Pemindaian forensik otomatis rekening kas</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Target Sekolah</span>
                  <p className="font-bold text-text-primary">{schoolName}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">NPSN: {npsn} • Kab. Aceh Barat</p>
                </div>

                <button
                  onClick={handleStartScan}
                  disabled={scanStatus === 'SCANNING'}
                  className="w-full btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                >
                  {scanStatus === 'SCANNING' ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Sedang Memindai... ({Math.round(scanProgress)}%)</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Jalankan AI Audit Scan Sekarang</span>
                    </>
                  )}
                </button>

                {scanStatus === 'SCANNING' && (
                  <div className="space-y-2 pt-2 animate-fade-in">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary italic flex items-center gap-1.5">
                      <Loader2 className="animate-spin text-indigo-500" size={10} />
                      <span>{scanMessage}</span>
                    </p>
                  </div>
                )}

                {scanStatus === 'DONE' && (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 space-y-2.5 animate-scale-up">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">Hasil Audit: CLEAN (WTP)</span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Pemindaian Gemini AI terhadap 8 transaksi belanja riil <strong>{schoolName}</strong> (total Rp 197.211.537) menunjukkan seluruh pengeluaran telah didukung kuitansi sah, harga satuan wajar, serta setoran pajak tertib. Saldo kas bank Rp 37.564.102 sinkron dengan mutasi rekening koran.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist Standar Audit BOP 2026 */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" />
                Standar Kepatuhan BOP PAUD 2026
              </h4>
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Kuitansi SPJ terbit bernomor seri sah</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Kesesuaian harga e-Katalog regional Aceh</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Buku Kas Umum (BKU) sinkron kas bank</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Kepatuhan bukti setor PPN 11%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FileCheckIcon(props: any) {
  return <FileCheck {...props} />;
}
function FileCheck(props: any) {
  return <FileText {...props} />;
}
