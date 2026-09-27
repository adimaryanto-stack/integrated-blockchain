import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { Dashboard, BroadcastNotification } from "@/types";
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Eye,
} from "lucide-react";

const allDashboards: Dashboard[] = [
  "Publik",
  "Kementerian",
  "Bank",
  "Auditor",
  "Institusi Pendidikan",
];

const availableRoles = [
  "Kepala Sekolah / Rektor",
  "Bendahara Satuan",
  "Operator Satuan",
  "Pejabat Kementerian",
  "Auditor BPK / BPKP",
  "Staf Operasional Bank",
  "Masyarakat Umum",
];

export function Broadcast() {
  const { broadcasts, sendBroadcast, currentUser, canAccess } = useAdminStore();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "penting" | "mendesak">("normal");
  const [selectedDashboards, setSelectedDashboards] = useState<Dashboard[]>([
    "Institusi Pendidikan",
    "Kementerian",
  ]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Bendahara Satuan",
    "Operator Satuan",
  ]);

  const [detailModal, setDetailModal] = useState<BroadcastNotification | null>(null);

  const canCreate = canAccess("Broadcast", "create");

  const toggleDashboard = (dash: Dashboard) => {
    setSelectedDashboards((prev) =>
      prev.includes(dash) ? prev.filter((d) => d !== dash) : [...prev, dash]
    );
  };

  const toggleAllDashboards = () => {
    if (selectedDashboards.length === allDashboards.length) {
      setSelectedDashboards([]);
    } else {
      setSelectedDashboards([...allDashboards]);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (selectedDashboards.length === 0) {
      alert("Pilih minimal satu dashboard tujuan.");
      return;
    }

    sendBroadcast({
      title,
      message,
      urgency,
      targetDashboards: selectedDashboards,
      targetRoles: selectedRoles,
      sentBy: currentUser ? `${currentUser.name} (${currentUser.role})` : "Super Admin",
    });

    // Reset Form
    setTitle("");
    setMessage("");
    setUrgency("normal");
  };

  const estimatedAudience = selectedDashboards.length * 1250 + selectedRoles.length * 80;

  if (!canAccess("Broadcast", "view")) {
    return (
      <DashboardLayout pageTitle="Pusat Notifikasi & Broadcast Nasional">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-warn/10 border border-status-warn/30">
            <Megaphone size={32} className="text-status-warn" />
          </div>
          <h2 className="text-xl font-bold text-ink">Akses Tidak Diizinkan</h2>
          <p className="text-sm text-muted max-w-sm">
            Fitur <strong>Broadcast</strong> hanya tersedia untuk Super Admin, Ops Admin, Admin Kementerian, dan Admin Wilayah.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Pusat Notifikasi & Broadcast Nasional">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Broadcast Form */}
        <div className="lg:col-span-6 space-y-4">
          <Panel
            title="Kirim Pengumuman / Broadcast Baru"
            action={
              <span className="text-xs text-muted flex items-center gap-1">
                <Megaphone size={14} className="text-navy" /> Siaran Lintas Dashboard
              </span>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-ink">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Batas Akhir Pelaporan LPJ BOS Triwulan III 2026"
                  className="focus-ring w-full rounded border border-line p-2 text-ink"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Tingkat Urgensi / Prioritas</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "penting", "mendesak"] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgency(lvl)}
                      className={`rounded border p-2 text-center capitalize font-semibold transition-colors ${
                        urgency === lvl
                          ? lvl === "mendesak"
                            ? "border-status-danger bg-status-danger/10 text-status-danger"
                            : lvl === "penting"
                            ? "border-status-warn bg-status-warn/10 text-status-warn"
                            : "border-navy bg-navy/10 text-navy"
                          : "border-line bg-panel text-muted hover:bg-base"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="font-semibold text-ink">Target Dashboard Platform:</label>
                  <button
                    type="button"
                    onClick={toggleAllDashboards}
                    className="text-[11px] text-navy font-medium hover:underline"
                  >
                    {selectedDashboards.length === allDashboards.length ? "Batal Semua" : "Pilih Semua"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allDashboards.map((dash) => {
                    const isChecked = selectedDashboards.includes(dash);
                    return (
                      <label
                        key={dash}
                        className={`flex items-center gap-2 rounded border p-2 cursor-pointer transition-colors ${
                          isChecked ? "border-navy bg-navy/5 font-semibold text-navy" : "border-line bg-panel text-ink"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDashboard(dash)}
                          className="rounded-sm"
                        />
                        <span className="truncate">{dash}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-ink">Target Peran Pengguna:</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableRoles.map((role) => {
                    const isChecked = selectedRoles.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isChecked
                            ? "bg-navy text-white font-semibold"
                            : "bg-base text-muted hover:text-ink border border-line"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-ink">Isi Pesan Broadcast</label>
                  <span className="text-[10px] text-muted">{message.length}/500 karakter</span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan isi instruksi, pembaruan regulasi, atau peringatan sistem..."
                  className="focus-ring w-full rounded border border-line p-2.5 text-ink leading-relaxed"
                />
              </div>

              <div className="rounded border border-line bg-base p-3 flex items-center justify-between text-[11px]">
                <span className="text-muted">Estimasi Jangkauan Target:</span>
                <span className="font-bold text-navy flex items-center gap-1">
                  <Users size={13} /> ±{estimatedAudience.toLocaleString("id-ID")} Penerima
                </span>
              </div>

              {canCreate ? (
                <button
                  type="submit"
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded bg-navy py-2.5 font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
                >
                  <Send size={14} /> Siarkan Pengumuman Sekarang
                </button>
              ) : (
                <p className="text-center text-status-danger italic">
                  Peran Anda tidak memiliki izin untuk mengirim broadcast.
                </p>
              )}
            </form>
          </Panel>
        </div>

        {/* Right: Broadcast History */}
        <div className="lg:col-span-6 space-y-4">
          <Panel
            title="Riwayat Siaran Broadcast Terkirim"
            action={
              <span className="text-xs text-muted flex items-center gap-1">
                <History size={13} /> {broadcasts.length} Siaran
              </span>
            }
          >
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="rounded-md border border-line bg-panel p-3.5 shadow-sm space-y-2 hover:border-navy/40 transition-colors text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            b.urgency === "mendesak"
                              ? "bg-status-danger/10 text-status-danger"
                              : b.urgency === "penting"
                              ? "bg-status-warn/10 text-status-warn"
                              : "bg-navy/10 text-navy"
                          }`}
                        >
                          {b.urgency}
                        </span>
                        <h4 className="font-bold text-ink">{b.title}</h4>
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">
                        Oleh: {b.sentBy} · {b.sentAt}
                      </div>
                    </div>

                    <button
                      onClick={() => setDetailModal(b)}
                      className="focus-ring rounded p-1 text-muted hover:text-navy hover:bg-base"
                      title="Lihat Detail Pesan"
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <p className="text-muted line-clamp-2 leading-relaxed">{b.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px]">
                    <div className="flex flex-wrap gap-1">
                      {b.targetDashboards.map((td) => (
                        <span key={td} className="rounded bg-base px-1.5 py-0.2 text-muted">
                          {td}
                        </span>
                      ))}
                    </div>
                    <span className="font-medium text-status-ok flex items-center gap-1">
                      <CheckCircle2 size={12} /> {b.deliveredCount.toLocaleString("id-ID")} Terkirim
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Modal Detail Broadcast */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Detail Siaran Pengumuman"
        subtitle={`ID: ${detailModal?.id}`}
      >
        {detailModal && (
          <div className="space-y-4 text-xs">
            <div className="rounded border border-line bg-base p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Judul:</span>
                <span className="font-bold text-ink">{detailModal.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Prioritas:</span>
                <span className="font-bold uppercase text-navy">{detailModal.urgency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Waktu Kirim:</span>
                <span className="font-mono text-muted">{detailModal.sentAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Pengirim:</span>
                <span className="text-ink">{detailModal.sentBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Total Diterima:</span>
                <span className="font-bold text-status-ok">
                  {detailModal.deliveredCount.toLocaleString("id-ID")} pengguna
                </span>
              </div>
            </div>

            <div>
              <span className="block font-semibold text-ink mb-1">Target Dashboard:</span>
              <div className="flex flex-wrap gap-1.5">
                {detailModal.targetDashboards.map((d) => (
                  <span key={d} className="rounded bg-navy/10 px-2 py-0.5 font-medium text-navy">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-semibold text-ink mb-1">Pesan Lengkap:</span>
              <p className="rounded border border-line bg-panel p-3 text-ink leading-relaxed whitespace-pre-wrap">
                {detailModal.message}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                onClick={() => setDetailModal(null)}
                className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
