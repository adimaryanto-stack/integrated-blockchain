'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { mockAnomalies } from '@/lib/data';
import { AuditAnomaly } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { fmtRupiah } from '@/lib/utils/formatters';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Play,
  Loader2, CheckCircle2, FileText, RefreshCw,
  MapPin, Calendar, User, Wrench, Send,
  FileSearch, X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AuditPage() {
  const { isSupabaseMode, dbData } = useAppStore();
  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>(mockAnomalies);
  const [selectedInst, setSelectedInst] = useState('');
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'DONE'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [activeReport, setActiveReport] = useState<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CLEAN';
    isAnomalyDetected: boolean;
    findings: Array<{ item: string; issue: string; estimatedLoss: number }>;
    reasoning: string;
  } | null>(null);

  // Investigation Modal states
  const [selectedAnomaly, setSelectedAnomaly] = useState<AuditAnomaly | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [tempStatus, setTempStatus] = useState<'TEMUAN' | 'INVESTIGASI' | 'SELESAI' | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Sync anomalies from store if Supabase/local DB mode is active
  useEffect(() => {
    if (isSupabaseMode && dbData?.audit_anomaly) {
      const mapped = dbData.audit_anomaly.map((a: any) => ({
        ...a,
        nominal_selisih: Number(a.nominal_selisih || 0)
      }));
      setAnomalies(mapped);
      if (mapped.length > 0 && !selectedInst) {
        setSelectedInst(mapped[0].institusi_id || mapped[0].id);
      }
    } else {
      setAnomalies(mockAnomalies);
      if (mockAnomalies.length > 0 && !selectedInst) {
        setSelectedInst(mockAnomalies[0].institusi_id || mockAnomalies[0].id);
      }
    }
  }, [isSupabaseMode, dbData?.audit_anomaly]);

  // Statistics
  const activeCount = anomalies.filter(a => a.status !== 'SELESAI').length;
  const totalLoss = anomalies
    .filter(a => a.status !== 'SELESAI')
    .reduce((sum, a) => sum + Number(a.nominal_selisih || 0), 0);
  const resolvedCount = anomalies.filter(a => a.status === 'SELESAI').length;

  // Initial greeting and status initialization when an anomaly is selected
  useEffect(() => {
    if (selectedAnomaly) {
      setChatMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Halo! Saya Asisten Audit Gemini. Saya dapat membantu menganalisis temuan anomali di **${selectedAnomaly.nama_institusi}** secara rinci. Silakan tanyakan informasi mengenai vendor, alasan kecurigaan, kronologi kejadian, atau rekomendasi perbaikan.`,
          timestamp: new Date()
        }
      ]);
      setTempStatus(selectedAnomaly.status);
      setSaveFeedback(false);
    } else {
      setTempStatus(null);
      setSaveFeedback(false);
    }
  }, [selectedAnomaly]);

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

  // Run Gemini AI Scan simulation reading from local database
  const handleStartScan = () => {
    setScanStatus('SCANNING');
    setScanProgress(0);
    setActiveReport(null);
    
    const messages = [
      'Menghubungkan ke Database Lokal & Gemini Gateway...',
      'Membaca histori sumber dana & alokasi bank...',
      'Memindai dokumen kuitansi & nota belanja bulanan...',
      'Mengevaluasi kepatuhan PPN (11%) & PPh...',
      'Menganalisis perbandingan harga satuan dengan e-Katalog nasional...',
      'Merumuskan kesimpulan analitis forensik...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress(Math.min(currentStep * 16.6, 100));
      setScanMessage(messages[Math.min(currentStep, messages.length - 1)]);

      if (currentStep >= 6) {
        clearInterval(interval);
        setScanStatus('DONE');

        const targetAnomaly = anomalies.find(a => (a.institusi_id === selectedInst || a.id === selectedInst));
        if (targetAnomaly) {
          setActiveReport({
            severity: targetAnomaly.tingkat_keparahan,
            isAnomalyDetected: true,
            findings: [
              {
                item: targetAnomaly.tipe_anomali,
                issue: targetAnomaly.audit_what || targetAnomaly.keterangan,
                estimatedLoss: Number(targetAnomaly.nominal_selisih || 0)
              }
            ],
            reasoning: targetAnomaly.audit_why || targetAnomaly.keterangan
          });
        } else {
          setActiveReport({
            severity: 'CLEAN',
            isAnomalyDetected: false,
            findings: [],
            reasoning: 'Pemindaian Database Lokal oleh Gemini AI tidak menemukan anomali harga, indikasi kuitansi ganda, maupun selisih pajak. Semua pengeluaran berada dalam batas toleransi wajar dan dokumen pendukung lengkap.'
          });
        }
      }
    }, 800);
  };

  const updateAnomalyStatus = async (id: string, newStatus: 'TEMUAN' | 'INVESTIGASI' | 'SELESAI') => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    if (selectedAnomaly && selectedAnomaly.id === id) {
      setSelectedAnomaly(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Sync with Zustand and Database Lokal (PostgreSQL port 2025 via 2026)
    const { isSupabaseMode, dbData, setDbData } = useAppStore.getState();
    if (isSupabaseMode && dbData) {
      const updatedAnoms = dbData.audit_anomaly.map((a: any) => a.id === id ? { ...a, status: newStatus } : a);
      setDbData({ ...dbData, audit_anomaly: updatedAnoms });
      const { error } = await supabase
        .from('audit_anomaly')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) {
        console.error('Gagal memperbarui status di Database Lokal:', error.message);
      }
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedAnomaly || !tempStatus) return;
    setIsSavingStatus(true);
    setSaveFeedback(false);
    try {
      await updateAnomalyStatus(selectedAnomaly.id, tempStatus);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (err) {
      console.error('Error saving status:', err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Chat Q&A response generation logic (Dynamic from selected anomaly data)
  const handleSendChat = () => {
    if (!chatInput.trim() || !selectedAnomaly) return;

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

    // Dynamic AI response based on the database anomaly context
    setTimeout(() => {
      let aiText = '';
      const textLower = userText.toLowerCase();

      if (textLower.includes('siapa') || textLower.includes('vendor') || textLower.includes('kontraktor') || textLower.includes('who')) {
        aiText = `Untuk temuan di **${selectedAnomaly.nama_institusi}**, pihak terkait yang terdeteksi dalam catatan database adalah: **${selectedAnomaly.audit_who || 'Pejabat Pembuat Komitmen (PPK) & Rekanan Vendor'}**.`;
      } else if (textLower.includes('bagaimana') || textLower.includes('solusi') || textLower.includes('tindak') || textLower.includes('how')) {
        aiText = `Rekomendasi tindakan mitigasi untuk **${selectedAnomaly.nama_institusi}**:
1. **Verifikasi SPJ**: ${selectedAnomaly.audit_how || 'Melakukan audit verifikasi fisik kuitansi dan sesuaikan dengan regulasi harga pasar.'}
2. **Klarifikasi Formal**: Lakukan pemanggilan kepada pengelola keuangan institusi.
3. **Pembatasan Limiting**: Tahan sisa pembayaran termin sampai dokumen penunjang 100% lengkap.`;
      } else if (textLower.includes('kenapa') || textLower.includes('mengapa') || textLower.includes('bukti') || textLower.includes('why')) {
        aiText = `Indikasi anomali terjadi karena: **${selectedAnomaly.audit_why || selectedAnomaly.keterangan}** dengan potensi selisih senilai **${fmtRupiah(selectedAnomaly.nominal_selisih)}**.`;
      } else if (textLower.includes('mana') || textLower.includes('lokasi') || textLower.includes('where')) {
        aiText = `Lokasi fisik / administratif temuan: **${selectedAnomaly.audit_where || selectedAnomaly.nama_institusi}**.`;
      } else if (textLower.includes('kapan') || textLower.includes('tanggal') || textLower.includes('when')) {
        aiText = `Waktu kejadian / pendeteksian temuan: **${selectedAnomaly.audit_when || `Bulan ${selectedAnomaly.bulan} (${selectedAnomaly.tanggal_ditemukan})`}**.`;
      } else {
        aiText = `Temuan di **${selectedAnomaly.nama_institusi}** diklasifikasikan berisiko **${selectedAnomaly.tingkat_keparahan}** terkait **${selectedAnomaly.tipe_anomali}** (Potensi Selisih: ${fmtRupiah(selectedAnomaly.nominal_selisih)}). ${selectedAnomaly.audit_what || selectedAnomaly.keterangan}`;
      }

      const newAiMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiText,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newAiMessage]);
      setIsAiTyping(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <Header title="Audit Anggaran" subtitle="Panel pengawasan, deteksi fraud, dan verifikasi alokasi anggaran bertenaga Gemini AI & Database Lokal" />

      <div className="p-6 space-y-6">
        {/* Metrik Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="metric-card accent-rose">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Anomali Belum Selesai</p>
                <h3 className="text-2xl font-bold text-rose-600 mt-2">{activeCount} Temuan</h3>
                <p className="text-xs text-text-secondary mt-1">Perlu investigasi lebih lanjut</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-inner">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>

          <div className="metric-card accent-amber">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Potensi Kerugian</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-2">{fmtRupiah(totalLoss)}</h3>
                <p className="text-xs text-text-secondary mt-1">Estimasi nominal indikasi fraud</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-inner">
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>

          <div className="metric-card accent-emerald">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kasus Terselesaikan</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-2">{resolvedCount} Kasus</h3>
                <p className="text-xs text-text-secondary mt-1">Laporan SPJ telah direvisi/diklarifikasi</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Baris Utama: Log Temuan & Simulator AI Scan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Kiri: Daftar Anomali */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-white/40">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-500" />
                  <h3 className="text-sm font-semibold text-text-primary">Daftar Temuan Anomali Anggaran (Database Lokal)</h3>
                </div>
                <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">Live Database</span>
              </div>
              
              <div className="sheet-container overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="sheet-header-cell text-center" style={{ width: 40 }}>No</th>
                      <th className="sheet-header-cell text-left" style={{ minWidth: 160 }}>Institusi</th>
                      <th className="sheet-header-cell text-left" style={{ minWidth: 160 }}>Tipe Temuan</th>
                      <th className="sheet-header-cell text-right" style={{ minWidth: 140 }}>Potensi Selisih</th>
                      <th className="sheet-header-cell text-center" style={{ width: 90 }}>Keparahan</th>
                      <th className="sheet-header-cell text-center" style={{ width: 90 }}>Status</th>
                      <th className="sheet-header-cell text-center" style={{ width: 60 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((anom, idx) => (
                      <tr key={anom.id} className="hover:bg-indigo-50/30 transition">
                        <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                        <td className="sheet-cell text-left font-medium text-text-primary">
                          <div>
                            <p className="text-xs font-semibold">{anom.nama_institusi}</p>
                            <p className="text-[10px] text-text-muted uppercase">{anom.jenjang} • {anom.bulan}</p>
                          </div>
                        </td>
                        <td className="sheet-cell text-left text-text-secondary text-xs truncate max-w-[180px]" title={anom.tipe_anomali}>
                          {anom.tipe_anomali}
                        </td>
                        <td className="sheet-cell text-right font-mono text-rose-600 text-xs">
                          {fmtRupiah(anom.nominal_selisih)}
                        </td>
                        <td className="sheet-cell text-center">
                          <span className={`badge ${getSeverityBadge(anom.tingkat_keparahan)}`}>
                            {anom.tingkat_keparahan}
                          </span>
                        </td>
                        <td className="sheet-cell text-center">
                          <span className={`badge ${getStatusBadge(anom.status)}`}>
                            {anom.status}
                          </span>
                        </td>
                        <td className="sheet-cell text-center">
                          <button
                            onClick={() => setSelectedAnomaly(anom)}
                            className="btn btn-ghost py-1 px-2.5 text-[11px] font-semibold"
                          >
                            Detil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panel Kanan: AI Gemini Audit Scan */}
          <div className="space-y-6">
            <div className="glass-card p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <h3 className="text-sm font-semibold text-text-primary">Gemini AI Audit Scan</h3>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Pilih institusi di bawah ini untuk memicu audit anggaran instan. Gemini akan menganalisis histori SPJ, nota, dan kewajiban pajak PPN 11% dari Database Lokal secara forensik.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted block mb-1">PILIH SASARAN AUDIT</label>
                  <select
                    value={selectedInst}
                    onChange={(e) => {
                      setSelectedInst(e.target.value);
                      setScanStatus('IDLE');
                      setActiveReport(null);
                    }}
                    className="select-dropdown w-full"
                    disabled={scanStatus === 'SCANNING'}
                  >
                    {anomalies.map(a => (
                      <option key={a.id} value={a.institusi_id || a.id}>
                        {a.nama_institusi} ({a.tingkat_keparahan} - {a.tipe_anomali})
                      </option>
                    ))}
                    <option value="clean-ugm">Universitas Gadjah Mada (CLEAN - Patuh Sempurna)</option>
                  </select>
                </div>

                {scanStatus === 'IDLE' && (
                  <button
                    onClick={handleStartScan}
                    className="btn btn-primary w-full justify-center py-2.5 shadow-md shadow-indigo-500/10 font-bold"
                  >
                    <Play size={14} className="fill-white" />
                    Jalankan Audit AI
                  </button>
                )}

                {scanStatus === 'SCANNING' && (
                  <div className="p-4 bg-white/80 border border-indigo-100 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 animate-pulse">
                      <Loader2 size={14} className="animate-spin" />
                      <span>{scanMessage}</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill bg-gradient-to-r from-indigo-500 to-purple-600"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-right text-text-muted font-mono">{Math.round(scanProgress)}%</div>
                  </div>
                )}

                {scanStatus === 'DONE' && activeReport && (
                  <div className="space-y-3 animate-fade-in-up">
                    <div className="flex items-center gap-2 p-3 rounded-xl border bg-white/90">
                      {activeReport.isAnomalyDetected ? (
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                          <ShieldAlert size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">
                          {activeReport.isAnomalyDetected ? 'Terdeteksi Anomali!' : 'Laporan Audit Bersih'}
                        </h4>
                        <p className="text-[10px] text-text-muted">
                          Tingkat Risiko: <span className="font-bold">{activeReport.severity}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/90 border border-border rounded-xl space-y-3 text-xs leading-relaxed shadow-sm">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase border-b border-border pb-1">
                        <FileText size={12} />
                        <span>Laporan Analisis Gemini</span>
                      </div>
                      
                      {activeReport.isAnomalyDetected ? (
                        <div className="space-y-2">
                          {activeReport.findings.map((f, i) => (
                            <div key={i} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg">
                              <p className="font-bold text-rose-700 text-[11px]">{f.item}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">{f.issue}</p>
                              <p className="text-[10px] font-semibold text-rose-600 mt-1 font-mono">Potensi Selisih: {fmtRupiah(f.estimatedLoss)}</p>
                            </div>
                          ))}
                          <p className="text-[10px] text-text-secondary leading-relaxed bg-gray-50 p-2 rounded border border-border/40 italic">
                            &ldquo;{activeReport.reasoning}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-1">
                          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            ✓ Kepatuhan Sempurna (100% Verified)
                          </p>
                          <p className="text-[10px] text-text-secondary bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/50 italic">
                            &ldquo;{activeReport.reasoning}&rdquo;
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => setScanStatus('IDLE')}
                        className="btn btn-ghost w-full py-1.5 text-[10px] font-bold mt-2"
                      >
                        <RefreshCw size={10} />
                        Scan Institusi Lain
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Detail Investigasi Anomali (Dua Kolom: 5W1H & Chat Q&A AI) */}
        {selectedAnomaly && (
          <div className="modal-overlay" onClick={() => setSelectedAnomaly(null)}>
            <div 
              className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] max-w-4xl w-[95%] shadow-2xl animate-fade-in-up" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* KOLOM KIRI: Analisis 5W1H */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-border flex flex-col justify-between bg-white">
                <div className="space-y-5">
                  <div className="flex justify-between items-start border-b border-border pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <ShieldAlert size={16} className="text-rose-500" />
                        Analisis Audit Forensik (5W1H)
                      </h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Institusi: <span className="font-bold text-text-primary">{selectedAnomaly.nama_institusi}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getSeverityBadge(selectedAnomaly.tingkat_keparahan)}`}>
                        {selectedAnomaly.tingkat_keparahan}
                      </span>
                      <button 
                        onClick={() => setSelectedAnomaly(null)}
                        className="p-1 rounded-full hover:bg-gray-100 text-text-muted transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 5W1H Structured Grid */}
                  <div className="space-y-3.5 pr-1">
                    
                    {/* WHAT */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                        <FileSearch size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">What (Apa Temuannya?)</h4>
                        <p className="text-xs text-text-primary font-medium mt-0.5">
                          {selectedAnomaly.audit_what || selectedAnomaly.tipe_anomali}
                        </p>
                      </div>
                    </div>

                    {/* WHY */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Why (Mengapa Terjadi Anomali?)</h4>
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                          {selectedAnomaly.audit_why || selectedAnomaly.keterangan}
                        </p>
                      </div>
                    </div>

                    {/* WHERE */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Where (Di Mana Lokasi Anggaran?)</h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {selectedAnomaly.audit_where || `${selectedAnomaly.nama_institusi}, ${selectedAnomaly.jenjang}`}
                        </p>
                      </div>
                    </div>

                    {/* WHEN */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">When (Kapan Temuan Dideteksi?)</h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {selectedAnomaly.audit_when || `Bulan ${selectedAnomaly.bulan} 2026, terdeteksi sistem tanggal ${selectedAnomaly.tanggal_ditemukan}`}
                        </p>
                      </div>
                    </div>

                    {/* WHO */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                        <User size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Who (Siapa Pihak Terkait?)</h4>
                        <p className="text-xs text-text-secondary mt-0.5 font-medium">
                          {selectedAnomaly.audit_who || 'Bendahara Pengeluaran & Rekanan Toko'}
                        </p>
                      </div>
                    </div>

                    {/* HOW */}
                    <div className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                        <Wrench size={14} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">How (Bagaimana Solusi Rekomendasi?)</h4>
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed bg-emerald-50/20 border border-emerald-100/40 p-2 rounded-lg">
                          {selectedAnomaly.audit_how || 'Minta klarifikasi dokumen pembukuan SPJ.'}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Status Update Bar */}
                <div className="border-t border-border pt-4 mt-4 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Tindak Lanjut Auditor</span>
                    <span className="text-[10px] font-semibold text-rose-600 font-mono">Kerugian: {fmtRupiah(selectedAnomaly.nominal_selisih)}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setTempStatus('TEMUAN')}
                      className={`btn flex-1 py-1.5 text-xs font-semibold justify-center transition-all duration-200 border ${
                        tempStatus === 'TEMUAN' 
                          ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20' 
                          : 'btn-ghost border-slate-200 text-text-secondary hover:bg-slate-50'
                      }`}
                    >
                      Temuan
                    </button>
                    <button
                      onClick={() => setTempStatus('INVESTIGASI')}
                      className={`btn flex-1 py-1.5 text-xs font-semibold justify-center transition-all duration-200 border ${
                        tempStatus === 'INVESTIGASI' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20' 
                          : 'btn-ghost border-slate-200 text-text-secondary hover:bg-slate-50'
                      }`}
                    >
                      Investigasi
                    </button>
                    <button
                      onClick={() => setTempStatus('SELESAI')}
                      className={`btn flex-1 py-1.5 text-xs font-semibold justify-center transition-all duration-200 border ${
                        tempStatus === 'SELESAI' 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' 
                          : 'btn-ghost border-slate-200 text-text-secondary hover:bg-slate-50'
                      }`}
                    >
                      Selesai
                    </button>
                  </div>
                  
                  {/* Save Action Button */}
                  <div className="mt-3">
                    <button
                      onClick={handleSaveStatus}
                      disabled={isSavingStatus || tempStatus === selectedAnomaly.status}
                      className={`btn w-full py-2 text-xs font-bold justify-center transition-all duration-200 ${
                        saveFeedback 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 shadow-sm shadow-emerald-500/10' 
                          : tempStatus === selectedAnomaly.status 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/10'
                      }`}
                    >
                      {isSavingStatus ? (
                        <>
                          <Loader2 size={13} className="animate-spin mr-1.5" />
                          Menyimpan...
                        </>
                      ) : saveFeedback ? (
                        <>
                          <CheckCircle2 size={13} className="mr-1.5" />
                          Tersimpan!
                        </>
                      ) : (
                        'Simpan Tindak Lanjut'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: Chat Q&A AI (Gemini) */}
              <div className="w-full md:w-[380px] bg-slate-50 flex flex-col h-[400px] md:h-full justify-between">
                
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-border bg-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Tanya Jawab AI (Gemini)</h4>
                    <p className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      Online • Siap Menganalisis
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-text-primary border border-border rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-text-muted mt-1 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex items-center gap-2 text-text-muted text-[10px] p-2 bg-white/60 rounded-xl border border-border/50 max-w-[120px]">
                      <Loader2 size={12} className="animate-spin text-indigo-500" />
                      <span>Gemini berpikir...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-border bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendChat();
                    }}
                    placeholder="Tanyakan detail temuan ini..."
                    className="flex-1 text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-slate-50"
                    disabled={isAiTyping}
                  />
                  <button
                    onClick={handleSendChat}
                    className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shrink-0 shadow-sm"
                    disabled={isAiTyping || !chatInput.trim()}
                  >
                    <Send size={12} className="fill-white" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
