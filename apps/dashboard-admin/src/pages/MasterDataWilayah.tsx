import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { InstitutionMaster, Jenjang, KementerianPembina } from "@/types";
import {
  Plus,
  Search,
  Building,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink,
  School,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";

export function MasterDataWilayah() {
  const {
    institutions,
    users,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    canAccess,
    currentUser,
  } = useAdminStore();

  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedKementerian, setSelectedKementerian] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [selectedJenjang, setSelectedJenjang] = useState("");

  // Live data from PostgreSQL via Proxy Gateway
  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string; provinceName?: string }[]>([]);
  const [liveSchools, setLiveSchools] = useState<InstitutionMaster[]>([]);
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [dbOverview, setDbOverview] = useState<any>(null);

  // Load provinces and overview on mount
  React.useEffect(() => {
    fetch("http://localhost:2028/api/admin/provinces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProvincesList(data);
      })
      .catch(() => {});

    fetch("http://localhost:2028/api/admin/database-overview")
      .then((r) => r.json())
      .then((data) => setDbOverview(data))
      .catch(() => {});
  }, []);

  // Load regencies dynamically based on selectedProvinsi
  React.useEffect(() => {
    const url =
      selectedProvinsi && selectedProvinsi !== "Semua Provinsi"
        ? `http://localhost:2028/api/admin/regencies?provinsi=${encodeURIComponent(selectedProvinsi)}`
        : "http://localhost:2028/api/admin/regencies";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRegenciesList(data);
      })
      .catch(() => {});

    setSelectedKabupaten("");
  }, [selectedProvinsi]);

  // Fetch live schools when kementerian or filters change
  React.useEffect(() => {
    if (!selectedKementerian) {
      setLiveSchools([]);
      return;
    }

    setIsLoadingSchools(true);
    const params = new URLSearchParams();
    if (selectedKementerian && selectedKementerian !== "ALL") {
      params.append("kementerian", selectedKementerian);
    }
    if (selectedProvinsi && selectedProvinsi !== "Semua Provinsi") {
      params.append("provinsi", selectedProvinsi);
    }
    if (selectedKabupaten && selectedKabupaten !== "Semua Kabupaten/Kota") {
      params.append("kabupatenKota", selectedKabupaten);
    }
    if (selectedJenjang && selectedJenjang !== "Semua Jenjang") {
      params.append("jenjang", selectedJenjang);
    }
    if (search) {
      params.append("search", search);
    }
    params.append("limit", "200");

    fetch(`http://localhost:2028/api/admin/institutions?${params.toString()}`)
      .then((res) => {
        const countHeader = res.headers.get("X-Total-Count");
        if (countHeader) setServerTotalCount(parseInt(countHeader, 10));
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveSchools(data);
        }
        setIsLoadingSchools(false);
      })
      .catch(() => {
        setIsLoadingSchools(false);
      });
  }, [selectedKementerian, selectedProvinsi, selectedKabupaten, selectedJenjang, search]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstitutionMaster | null>(null);
  const [deletingInst, setDeletingInst] = useState<InstitutionMaster | null>(null);
  const [viewingUsersInst, setViewingUsersInst] = useState<InstitutionMaster | null>(null);

  const [formData, setFormData] = useState({
    npsn: "",
    namaSatuan: "",
    jenjang: "SD" as Jenjang,
    kementerianPembina: "Kemendikdasmen" as KementerianPembina,
    provinsi: "Lampung",
    kabupatenKota: "Kabupaten Pesawaran",
    kecamatan: "Kedondong",
    status: "aktif" as "aktif" | "nonaktif",
  });

  const canCreate = canAccess("Master Data Wilayah", "create");
  const canEdit = canAccess("Master Data Wilayah", "edit");
  const canDelete = canAccess("Master Data Wilayah", "delete");

  // Combined schools pool (live database results prioritized, store institutions merged)
  const allAvailableSchools = useMemo(() => {
    if (!selectedKementerian) return [];
    if (liveSchools.length > 0) return liveSchools;
    return institutions;
  }, [liveSchools, institutions, selectedKementerian]);

  // Scope filtering: admin_satuan only sees their own institution; admin_wilayah sees their region
  const scopedInstitutions = useMemo(() => {
    if (currentUser?.scopeType === "satuan" && currentUser?.scopeId) {
      return allAvailableSchools.filter(
        (i) =>
          i.namaSatuan.toUpperCase() === currentUser.scopeId?.toUpperCase() ||
          i.npsn === currentUser.scopeId
      );
    }
    if (currentUser?.scopeType === "kabupaten_kota" && currentUser?.scopeId) {
      return allAvailableSchools.filter((i) => i.kabupatenKota === currentUser.scopeId);
    }
    if (currentUser?.scopeType === "provinsi" && currentUser?.scopeId) {
      return allAvailableSchools.filter((i) => i.provinsi === currentUser.scopeId);
    }
    return allAvailableSchools;
  }, [allAvailableSchools, currentUser]);

  // Filtered rows for the table view
  const filtered = useMemo(() => {
    // If Kementerian is not chosen yet, do NOT display school names
    if (!selectedKementerian) return [];

    return scopedInstitutions.filter((i) => {
      const matchKem =
        selectedKementerian === "ALL" ||
        !selectedKementerian ||
        i.kementerianPembina === selectedKementerian;
      const matchJen = !selectedJenjang || selectedJenjang === "Semua Jenjang" || i.jenjang === selectedJenjang;
      const matchProv = !selectedProvinsi || selectedProvinsi === "Semua Provinsi" || i.provinsi === selectedProvinsi;
      const matchKab = !selectedKabupaten || selectedKabupaten === "Semua Kabupaten/Kota" || i.kabupatenKota === selectedKabupaten;
      const matchSearch =
        !search ||
        i.namaSatuan.toLowerCase().includes(search.toLowerCase()) ||
        i.npsn.includes(search) ||
        i.kabupatenKota.toLowerCase().includes(search.toLowerCase()) ||
        i.kecamatan.toLowerCase().includes(search.toLowerCase());
      return matchKem && matchJen && matchProv && matchKab && matchSearch;
    });
  }, [scopedInstitutions, selectedKementerian, selectedJenjang, selectedProvinsi, selectedKabupaten, search]);

  const handleOpenAdd = () => {
    setFormData({
      npsn: "",
      namaSatuan: "",
      jenjang: "SD",
      kementerianPembina: "Kemendikdasmen",
      provinsi: "Lampung",
      kabupatenKota: "Kabupaten Pesawaran",
      kecamatan: "Kedondong",
      status: "aktif",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.npsn || !formData.namaSatuan) return;
    addInstitution(formData);
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (inst: InstitutionMaster) => {
    setEditingInst(inst);
    setFormData({
      npsn: inst.npsn,
      namaSatuan: inst.namaSatuan,
      jenjang: inst.jenjang,
      kementerianPembina: inst.kementerianPembina,
      provinsi: inst.provinsi,
      kabupatenKota: inst.kabupatenKota,
      kecamatan: inst.kecamatan,
      status: inst.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    updateInstitution(editingInst.id, formData);
    setEditingInst(null);
  };

  const registeredUsersForInst = useMemo(() => {
    if (!viewingUsersInst) return [];
    return users.filter((u) => u.institutionId === viewingUsersInst.id);
  }, [viewingUsersInst, users]);

  return (
    <DashboardLayout pageTitle="Master Data Wilayah & Satuan Pendidikan">
      {/* Scope notice for admin_satuan */}
      {currentUser?.scopeType === "satuan" && (
        <div className="mb-4 rounded border border-navy/20 bg-navy/5 px-4 py-2 text-xs text-navy font-medium flex items-center gap-2">
          <span className="text-[11px] uppercase font-bold opacity-60">Cakupan Anda:</span>
          Anda hanya dapat melihat data satuan pendidikan Anda sendiri
          ({currentUser.scopeId})
        </div>
      )}
      {/* Top summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className="rounded border border-line bg-panel p-3 shadow-sm">
          <span className="text-[11px] font-semibold text-muted uppercase">
            Total Satuan {currentUser?.scopeType === "satuan" ? "Anda" : "Master Nasional"}
          </span>
          <p className="mt-1 text-2xl font-bold text-navy">
            {currentUser?.scopeType === "satuan"
              ? scopedInstitutions.length.toLocaleString("id-ID")
              : (dbOverview?.tables?.schools || 468724).toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-muted">PostgreSQL Port 2027</span>
        </div>
        <div className="rounded border border-line bg-panel p-3 shadow-sm">
          <span className="text-[11px] font-semibold text-muted uppercase">Kemendikdasmen</span>
          <p className="mt-1 text-2xl font-bold text-ink">
            {currentUser?.scopeType === "satuan"
              ? scopedInstitutions.filter((i) => i.kementerianPembina === "Kemendikdasmen").length
              : "435.120"}
          </p>
          <span className="text-[10px] text-muted">SD, SMP, SMA, SMK</span>
        </div>
        <div className="rounded border border-line bg-panel p-3 shadow-sm">
          <span className="text-[11px] font-semibold text-muted uppercase">Kemenag (Madrasah / PTKI)</span>
          <p className="mt-1 text-2xl font-bold text-ink">
            {currentUser?.scopeType === "satuan"
              ? scopedInstitutions.filter((i) => i.kementerianPembina === "Kemenag").length
              : "31.450"}
          </p>
          <span className="text-[10px] text-muted">MI, MTs, MA, IAIN, UIN</span>
        </div>
        <div className="rounded border border-line bg-panel p-3 shadow-sm">
          <span className="text-[11px] font-semibold text-muted uppercase">Kemendiktisaintek</span>
          <p className="mt-1 text-2xl font-bold text-ink">
            {currentUser?.scopeType === "satuan"
              ? scopedInstitutions.filter((i) => i.kementerianPembina === "Kemendiktisaintek").length
              : "2.154"}
          </p>
          <span className="text-[10px] text-muted">Universitas, Politeknik, Institut</span>
        </div>
      </div>

      {/* Toolbar & Filters (Urutan: Search -> Kementerian -> Provinsi -> Kabupaten/Kota -> Jenjang) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          {/* 1. Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NPSN, nama satuan, kabupaten..."
              className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-xs text-ink shadow-sm"
            />
          </div>

          {/* 2. Filter Kementerian (Urutan Utama) */}
          <select
            value={selectedKementerian}
            onChange={(e) => setSelectedKementerian(e.target.value)}
            className={`focus-ring rounded-sm border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              !selectedKementerian
                ? "border-navy bg-navy/5 text-navy font-bold"
                : "border-line bg-panel text-ink"
            }`}
          >
            <option value="">-- Pilih Kementerian --</option>
            <option value="ALL">Semua Kementerian</option>
            <option value="Kemendikdasmen">Kemendikdasmen</option>
            <option value="Kemenag">Kemenag (Madrasah / PTKI)</option>
            <option value="Kemendiktisaintek">Kemendiktisaintek (Perguruan Tinggi)</option>
          </select>

          {/* 3. Filter Provinsi */}
          <select
            value={selectedProvinsi}
            onChange={(e) => setSelectedProvinsi(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm max-w-[170px]"
          >
            <option value="">Semua Provinsi</option>
            {provincesList.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* 4. Filter Kabupaten / Kota */}
          <select
            value={selectedKabupaten}
            onChange={(e) => setSelectedKabupaten(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm max-w-[190px]"
          >
            <option value="">Semua Kabupaten/Kota</option>
            {regenciesList.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* 5. Filter Jenjang */}
          <select
            value={selectedJenjang}
            onChange={(e) => setSelectedJenjang(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Jenjang</option>
            <option value="PAUD">PAUD</option>
            <option value="TK">TK / RA</option>
            <option value="SD">SD / MI</option>
            <option value="SMP">SMP / MTs</option>
            <option value="SMA">SMA / MA</option>
            <option value="SMK">SMK</option>
            <option value="S1">S1 / Perguruan Tinggi</option>
          </select>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
          >
            <Plus size={14} /> Tambah Satuan Pendidikan
          </button>
        )}
      </div>

      {/* Table */}
      <Panel
        title={
          !selectedKementerian
            ? "Satuan Pendidikan Terdaftar (Silakan Pilih Kementerian di Atas)"
            : `Satuan Pendidikan Terdaftar (${filtered.length} Satuan${
                serverTotalCount ? ` dari ${serverTotalCount.toLocaleString("id-ID")} di Database` : ""
              })`
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                <th className="py-2.5">NPSN / Kode</th>
                <th className="py-2.5">Nama Satuan Pendidikan</th>
                <th className="py-2.5 text-center">Jenjang</th>
                <th className="py-2.5">Kementerian Pembina</th>
                <th className="py-2.5">Hierarki Wilayah (Kecamatan · Kab/Kota · Prov)</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {/* Case 1: Initial state (Kementerian belum dipilih) -> jangan tampilkan dahulu nama satuan */}
              {!selectedKementerian ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex flex-col items-center justify-center max-w-md text-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-navy">
                        <Filter size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink">Pilih Kementerian Terlebih Dahulu</h4>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          Daftar nama satuan pendidikan sengaja belum dimuat saat halaman dibuka (total 468.724 satuan di database). Silakan pilih <strong>Kementerian Pembina</strong> atau klik <strong>"Semua Kementerian"</strong> pada dropdown filter di atas untuk memuat data.
                        </p>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => setSelectedKementerian("ALL")}
                          className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
                        >
                          <School size={14} /> Tampilkan Semua Kementerian
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : isLoadingSchools ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-navy" />
                      <span>Memuat data satuan pendidikan dari database lokal port 2027...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((i) => {
                  const userCount = users.filter((u) => u.institutionId === i.id).length;
                  return (
                    <tr key={i.id} className="hover:bg-base/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-navy">{i.npsn}</td>
                      <td className="py-3">
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <School size={14} className="text-muted shrink-0" />
                          <span>{i.namaSatuan}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="rounded bg-navy/10 px-2 py-0.5 font-bold text-navy">
                          {i.jenjang}
                        </span>
                      </td>
                      <td className="py-3 text-ink font-medium">{i.kementerianPembina}</td>
                      <td className="py-3 text-muted">
                        <span className="text-ink font-medium">Kec. {i.kecamatan}</span>, {i.kabupatenKota}, Prov. {i.provinsi}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge value={i.status} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingUsersInst(i)}
                            className="focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-[11px] font-medium text-navy hover:bg-base transition-colors"
                            title="Lihat Akun Operator/Bendahara"
                          >
                            <Users size={12} />
                            <span>{userCount} Akun</span>
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(i)}
                              className="focus-ring rounded p-1 text-muted hover:text-ink hover:bg-base transition-colors"
                              title="Edit Data Satuan"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setDeletingInst(i)}
                              className="focus-ring rounded p-1 text-status-danger hover:bg-status-danger/10 transition-colors"
                              title="Hapus Satuan"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {selectedKementerian && !isLoadingSchools && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Tidak ada satuan pendidikan yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal: Tambah Satuan */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftarkan Satuan Pendidikan Master Baru"
        subtitle="Rujukan data nasional untuk alokasi dana dan akun satuan"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">NPSN / Kode PDDIKTI</label>
              <input
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                placeholder="Contoh: 10800999"
                className="focus-ring w-full rounded border border-line p-2 text-ink font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Jenjang Pendidikan</label>
              <select
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value as Jenjang })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="PAUD">PAUD</option>
                <option value="TK">TK</option>
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / MA</option>
                <option value="SMK">SMK</option>
                <option value="S1">S1 / Perguruan Tinggi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Satuan Pendidikan</label>
            <input
              type="text"
              required
              value={formData.namaSatuan}
              onChange={(e) => setFormData({ ...formData, namaSatuan: e.target.value })}
              placeholder="Contoh: MIN 2 Pesawaran"
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Kementerian Pembina</label>
              <select
                value={formData.kementerianPembina}
                onChange={(e) =>
                  setFormData({ ...formData, kementerianPembina: e.target.value as KementerianPembina })
                }
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="Kemendikdasmen">Kemendikdasmen</option>
                <option value="Kemenag">Kemenag (Madrasah / PTKI)</option>
                <option value="Kemendiktisaintek">Kemendiktisaintek</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Provinsi</label>
              <input
                type="text"
                required
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                placeholder="Lampung"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Kabupaten / Kota</label>
              <input
                type="text"
                required
                value={formData.kabupatenKota}
                onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                placeholder="Kabupaten Pesawaran"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Kecamatan</label>
              <input
                type="text"
                required
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder="Kedondong"
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Simpan Master Satuan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Satuan */}
      <Modal
        isOpen={!!editingInst}
        onClose={() => setEditingInst(null)}
        title="Edit Master Satuan Pendidikan"
        subtitle={`ID: ${editingInst?.id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">NPSN</label>
              <input
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Jenjang</label>
              <select
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value as Jenjang })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="PAUD">PAUD</option>
                <option value="TK">TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
                <option value="S1">S1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Satuan Pendidikan</label>
            <input
              type="text"
              required
              value={formData.namaSatuan}
              onChange={(e) => setFormData({ ...formData, namaSatuan: e.target.value })}
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Kementerian Pembina</label>
              <select
                value={formData.kementerianPembina}
                onChange={(e) =>
                  setFormData({ ...formData, kementerianPembina: e.target.value as KementerianPembina })
                }
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="Kemendikdasmen">Kemendikdasmen</option>
                <option value="Kemenag">Kemenag</option>
                <option value="Kemendiktisaintek">Kemendiktisaintek</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Provinsi</label>
              <input
                type="text"
                required
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Kab/Kota</label>
              <input
                type="text"
                required
                value={formData.kabupatenKota}
                onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink">Kecamatan</label>
              <input
                type="text"
                required
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setEditingInst(null)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Perbarui Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Users Registered for This School */}
      <Modal
        isOpen={!!viewingUsersInst}
        onClose={() => setViewingUsersInst(null)}
        title={`Akun Pengguna Terdaftar (${viewingUsersInst?.namaSatuan})`}
        subtitle={`NPSN: ${viewingUsersInst?.npsn} · ${viewingUsersInst?.kementerianPembina}`}
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          {registeredUsersForInst.length > 0 ? (
            <div className="divide-y divide-line rounded border border-line bg-panel">
              {registeredUsersForInst.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-ink">{u.name}</span>
                    <div className="text-[11px] text-muted">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={u.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted rounded border border-line bg-base">
              Belum ada akun operator atau bendahara yang didaftarkan untuk satuan pendidikan ini.
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-line">
            <button
              onClick={() => {
                setViewingUsersInst(null);
                navigate("/users");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
            >
              Buka di Halaman Manajemen Pengguna &rarr;
            </button>
            <button
              onClick={() => setViewingUsersInst(null)}
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!deletingInst}
        onClose={() => setDeletingInst(null)}
        title="Konfirmasi Hapus Satuan"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-ink">
            Apakah Anda yakin ingin menghapus master data satuan{" "}
            <strong className="text-status-danger">{deletingInst?.namaSatuan}</strong> (NPSN: {deletingInst?.npsn})?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              onClick={() => setDeletingInst(null)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (deletingInst) {
                  deleteInstitution(deletingInst.id);
                  setDeletingInst(null);
                }
              }}
              className="rounded bg-status-danger px-4 py-1.5 font-semibold text-white hover:bg-status-danger/90"
            >
              Hapus Satuan
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
