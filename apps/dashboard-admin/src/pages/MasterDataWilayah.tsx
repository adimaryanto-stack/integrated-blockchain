import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { InstitutionMaster, Jenjang, KementerianPembina } from "@/types";
import {
  MapPinned,
  Plus,
  Search,
  Building2,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink,
  School,
  RefreshCw,
  Filter,
  Check,
  Copy,
  Layers,
  DatabaseZap,
  Globe,
  Radio,
  ChevronRight,
  ShieldCheck,
  Code2,
  Send,
  Sparkles,
  Compass,
  ArrowRight
} from "lucide-react";

interface ProvinceItem {
  id: string;
  name: string;
  code: string;
}

interface RegencyItem {
  id: string;
  name: string;
  province_id: string;
  type?: string;
  provinceName?: string;
}

interface DistrictItem {
  id: string;
  name: string;
}

const ISLAND_GROUPS: Record<string, string[]> = {
  "Sumatra": [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
    "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung"
  ],
  "Jawa": [
    "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "D.I. Yogyakarta", "Jawa Timur"
  ],
  "Bali & Nusa Tenggara": [
    "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur"
  ],
  "Kalimantan": [
    "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara"
  ],
  "Sulawesi": [
    "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara"
  ],
  "Maluku & Papua": [
    "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
  ]
};

function getIslandForProvince(provinceName: string): string {
  for (const [island, provs] of Object.entries(ISLAND_GROUPS)) {
    if (provs.some(p => provinceName.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(provinceName.toLowerCase()))) {
      return island;
    }
  }
  return "Wilayah Khusus";
}

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

  // Active Tab: structure | probe | schools
  const [activeTab, setActiveTab] = useState<"structure" | "probe" | "schools">("structure");

  // Wilayah NKRI state
  const [provincesList, setProvincesList] = useState<ProvinceItem[]>([]);
  const [regenciesList, setRegenciesList] = useState<RegencyItem[]>([]);
  const [selectedIsland, setSelectedIsland] = useState<string>("ALL");
  const [searchProv, setSearchProv] = useState<string>("");

  const [activeProvince, setActiveProvince] = useState<ProvinceItem | null>(null);
  const [filteredRegencies, setFilteredRegencies] = useState<RegencyItem[]>([]);
  const [searchReg, setSearchReg] = useState<string>("");

  const [activeRegency, setActiveRegency] = useState<RegencyItem | null>(null);
  const [districtsList, setDistrictsList] = useState<DistrictItem[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [searchDist, setSearchDist] = useState<string>("");

  const [dbOverview, setDbOverview] = useState<any>(null);

  // REST API Probe State
  const [probeEndpoint, setProbeEndpoint] = useState<"/api/admin/provinces" | "/api/admin/regencies" | "/api/admin/districts" | "/api/admin/database-overview">("/api/admin/provinces");
  const [probeParam, setProbeParam] = useState<string>("");
  const [probeLoading, setProbeLoading] = useState<boolean>(false);
  const [probeResponse, setProbeResponse] = useState<any>(null);
  const [probeStatus, setProbeStatus] = useState<number | null>(null);
  const [probeLatency, setProbeLatency] = useState<number | null>(null);
  const [copiedProbe, setCopiedProbe] = useState<boolean>(false);

  // Schools list state (preserved from previous functionality)
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedKementerian, setSelectedKementerian] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [selectedJenjang, setSelectedJenjang] = useState("");
  const [liveSchools, setLiveSchools] = useState<InstitutionMaster[]>([]);
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

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

  const canCreate = canAccess("API Wilayah", "create");
  const canEdit = canAccess("API Wilayah", "edit");
  const canDelete = canAccess("API Wilayah", "delete");

  // Load provinces and overview on mount
  useEffect(() => {
    fetch("http://localhost:2028/api/admin/provinces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProvincesList(data);
          if (data.length > 0 && !activeProvince) {
            // Default to Lampung or first province
            const defaultP = data.find((p: ProvinceItem) => p.name.includes("Lampung")) || data[0];
            setActiveProvince(defaultP);
          }
        }
      })
      .catch(() => {});

    fetch("http://localhost:2028/api/admin/regencies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRegenciesList(data);
      })
      .catch(() => {});

    fetch("http://localhost:2028/api/admin/database-overview")
      .then((r) => r.json())
      .then((data) => setDbOverview(data))
      .catch(() => {});
  }, []);

  // When activeProvince changes, load its regencies
  useEffect(() => {
    if (!activeProvince) {
      setFilteredRegencies([]);
      setActiveRegency(null);
      setDistrictsList([]);
      return;
    }

    const regForProv = regenciesList.filter(
      (r) => r.province_id === activeProvince.id || r.provinceName === activeProvince.name
    );

    if (regForProv.length > 0) {
      setFilteredRegencies(regForProv);
      // Automatically select first regency
      const firstReg = regForProv[0];
      setActiveRegency(firstReg);
    } else {
      // Fetch specifically from proxy
      fetch(`http://localhost:2028/api/admin/regencies?provinsi=${encodeURIComponent(activeProvince.name)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFilteredRegencies(data);
            if (data.length > 0) setActiveRegency(data[0]);
          }
        })
        .catch(() => {});
    }
  }, [activeProvince, regenciesList]);

  // When activeRegency changes, load its districts (kecamatan)
  useEffect(() => {
    if (!activeRegency) {
      setDistrictsList([]);
      return;
    }

    setIsLoadingDistricts(true);
    fetch(`http://localhost:2028/api/admin/districts?regency_id=${encodeURIComponent(activeRegency.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDistrictsList(data);
        } else {
          setDistrictsList([]);
        }
        setIsLoadingDistricts(false);
      })
      .catch(() => {
        setIsLoadingDistricts(false);
        setDistrictsList([]);
      });
  }, [activeRegency]);

  // Handle Live API Probe Execution
  const runApiProbe = async () => {
    setProbeLoading(true);
    const start = Date.now();
    try {
      let url = `http://localhost:2028${probeEndpoint}`;
      if (probeParam.trim()) {
        url += (probeEndpoint.includes("?") ? "&" : "?") + probeParam.trim();
      }
      const res = await fetch(url);
      const latency = Date.now() - start;
      const json = await res.json();
      setProbeStatus(res.status);
      setProbeLatency(latency);
      setProbeResponse(json);
    } catch (err: any) {
      setProbeStatus(500);
      setProbeLatency(Date.now() - start);
      setProbeResponse({ error: "Gagal terhubung ke proxy port 2028: " + err.message });
    } finally {
      setProbeLoading(false);
    }
  };

  const copyProbeResponse = () => {
    if (probeResponse) {
      navigator.clipboard.writeText(JSON.stringify(probeResponse, null, 2));
      setCopiedProbe(true);
      setTimeout(() => setCopiedProbe(false), 2000);
    }
  };

  // Fetch live schools when tab 3 is used
  useEffect(() => {
    if (activeTab !== "schools" || !selectedKementerian) {
      if (!selectedKementerian) setLiveSchools([]);
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
    if (schoolSearch) {
      params.append("search", schoolSearch);
    }
    params.append("limit", "150");

    fetch(`http://localhost:2028/api/admin/institutions?${params.toString()}`)
      .then((res) => {
        const countHeader = res.headers.get("X-Total-Count");
        if (countHeader) setServerTotalCount(parseInt(countHeader, 10));
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setLiveSchools(data);
        setIsLoadingSchools(false);
      })
      .catch(() => setIsLoadingSchools(false));
  }, [activeTab, selectedKementerian, selectedProvinsi, selectedKabupaten, selectedJenjang, schoolSearch]);

  // Filtered provinces by island & search
  const displayedProvinces = useMemo(() => {
    return provincesList.filter((p) => {
      const matchIsland =
        selectedIsland === "ALL" ||
        getIslandForProvince(p.name) === selectedIsland;
      const matchSearch =
        !searchProv ||
        p.name.toLowerCase().includes(searchProv.toLowerCase()) ||
        p.code.includes(searchProv);
      return matchIsland && matchSearch;
    });
  }, [provincesList, selectedIsland, searchProv]);

  // Filtered regencies by search
  const displayedRegencies = useMemo(() => {
    return filteredRegencies.filter((r) => {
      return (
        !searchReg ||
        r.name.toLowerCase().includes(searchReg.toLowerCase()) ||
        r.id.toLowerCase().includes(searchReg.toLowerCase())
      );
    });
  }, [filteredRegencies, searchReg]);

  // Filtered districts by search
  const displayedDistricts = useMemo(() => {
    return districtsList.filter((d) => {
      return !searchDist || d.name.toLowerCase().includes(searchDist.toLowerCase());
    });
  }, [districtsList, searchDist]);

  // Combined schools pool
  const allAvailableSchools = useMemo(() => {
    if (!selectedKementerian) return [];
    if (liveSchools.length > 0) return liveSchools;
    return institutions;
  }, [liveSchools, institutions, selectedKementerian]);

  // Scoped institutions
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

  const filteredSchools = useMemo(() => {
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
        !schoolSearch ||
        i.namaSatuan.toLowerCase().includes(schoolSearch.toLowerCase()) ||
        i.npsn.includes(schoolSearch) ||
        i.kabupatenKota.toLowerCase().includes(schoolSearch.toLowerCase()) ||
        i.kecamatan.toLowerCase().includes(schoolSearch.toLowerCase());
      return matchKem && matchJen && matchProv && matchKab && matchSearch;
    });
  }, [scopedInstitutions, selectedKementerian, selectedJenjang, selectedProvinsi, selectedKabupaten, schoolSearch]);

  const handleOpenAdd = () => {
    setFormData({
      npsn: "",
      namaSatuan: "",
      jenjang: "SD",
      kementerianPembina: "Kemendikdasmen",
      provinsi: activeProvince?.name || "Lampung",
      kabupatenKota: activeRegency?.name || "Kabupaten Pesawaran",
      kecamatan: districtsList[0]?.name || "Pusat",
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
    <DashboardLayout
      pageTitle="API Wilayah"
      description="berisi data Wilayah NKRI, dari Provinsi, kabupaten/kota dan kecamatan Nasional."
    >
      {/* Top Banner KPI Wilayah NKRI */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className="rounded-xl border border-line bg-panel p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Provinsi NKRI
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy/10 text-navy">
              <Globe size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-navy font-mono">
            {provincesList.length > 0 ? provincesList.length : "38"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>8 Region Kepulauan NKRI</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Kabupaten & Kota
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink font-mono">
            {regenciesList.length > 0 ? regenciesList.length : "514"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="text-navy font-semibold">416 Kab</span> · <span>98 Kota Otonom</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Kecamatan Nasional
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <MapPin size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink font-mono">
            9.173+
          </p>
          <div className="mt-1 text-[11px] text-muted">
            Kemendagri & Basis Satuan Terpadu
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Database & REST API
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DatabaseZap size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            PORT 2028
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PostgreSQL 16 (Port 2027) Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-base p-1 border border-line">
          <button
            onClick={() => setActiveTab("structure")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "structure"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-panel"
            }`}
          >
            <MapPinned size={14} />
            <span>Struktur Wilayah NKRI (Provinsi · Kab/Kota · Kecamatan)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("probe");
              if (!probeResponse) runApiProbe();
            }}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "probe"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-panel"
            }`}
          >
            <Code2 size={14} />
            <span>Uji Live REST API Wilayah</span>
            <span className="rounded bg-emerald-500/20 text-emerald-700 px-1.5 py-0.2 text-[10px] font-mono">
              200 OK
            </span>
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "schools"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-panel"
            }`}
          >
            <School size={14} />
            <span>Direktori Satuan per Wilayah</span>
          </button>
        </div>

        {activeTab === "schools" && canCreate && (
          <button
            onClick={handleOpenAdd}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
          >
            <Plus size={14} /> Tambah Satuan Pendidikan
          </button>
        )}
      </div>

      {/* TAB 1: STRUKTUR WILAYAH NKRI */}
      {activeTab === "structure" && (
        <div className="space-y-4">
          {/* Island Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-panel p-2 shadow-sm">
            <span className="text-[11px] font-bold text-muted uppercase px-2">Gugus Kepulauan:</span>
            {["ALL", ...Object.keys(ISLAND_GROUPS)].map((islandKey) => {
              const label = islandKey === "ALL" ? "Seluruh Indonesia (38 Provinsi)" : islandKey;
              const isSelected = selectedIsland === islandKey;
              return (
                <button
                  key={islandKey}
                  onClick={() => setSelectedIsland(islandKey)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-navy text-white shadow-sm"
                      : "bg-base text-ink/70 hover:bg-base/80 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* 3-Column Drilldown Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Column 1: 38 Provinsi */}
            <div className="lg:col-span-4 rounded-xl border border-line bg-panel shadow-sm flex flex-col h-[640px]">
              <div className="p-3 border-b border-line bg-base/40 rounded-t-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-navy" />
                    <h3 className="font-bold text-xs text-ink uppercase tracking-wider">
                      1. Provinsi NKRI ({displayedProvinces.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted font-mono font-medium">Kemendagri</span>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-muted" />
                  <input
                    value={searchProv}
                    onChange={(e) => setSearchProv(e.target.value)}
                    placeholder="Cari provinsi atau kode..."
                    className="w-full rounded-md border border-line bg-white py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-muted focus-ring"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-line scrollbar-thin">
                {displayedProvinces.map((prov) => {
                  const isSelected = activeProvince?.id === prov.id;
                  const island = getIslandForProvince(prov.name);
                  return (
                    <div
                      key={prov.id}
                      onClick={() => setActiveProvince(prov)}
                      className={`p-3 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-navy/10 border-l-4 border-l-navy text-navy font-semibold"
                          : "hover:bg-base/60 text-ink"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy/10 text-navy">
                            {prov.code || prov.id}
                          </span>
                          <span className="text-xs truncate font-bold text-ink">{prov.name}</span>
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">{island}</p>
                      </div>
                      <ChevronRight size={14} className={isSelected ? "text-navy" : "text-muted"} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Kabupaten / Kota */}
            <div className="lg:col-span-4 rounded-xl border border-line bg-panel shadow-sm flex flex-col h-[640px]">
              <div className="p-3 border-b border-line bg-base/40 rounded-t-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-blue-600" />
                    <h3 className="font-bold text-xs text-ink uppercase tracking-wider">
                      2. Kabupaten / Kota ({displayedRegencies.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted font-bold">
                    {activeProvince ? activeProvince.name : "Pilih Provinsi"}
                  </span>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-muted" />
                  <input
                    value={searchReg}
                    onChange={(e) => setSearchReg(e.target.value)}
                    placeholder="Cari kab/kota di provinsi ini..."
                    className="w-full rounded-md border border-line bg-white py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-muted focus-ring"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-line scrollbar-thin">
                {displayedRegencies.length === 0 ? (
                  <div className="p-8 text-center text-muted text-xs">
                    Tidak ada kabupaten/kota yang sesuai dengan filter pencarian.
                  </div>
                ) : (
                  displayedRegencies.map((reg) => {
                    const isSelected = activeRegency?.id === reg.id;
                    const isKota = (reg.type || "").toUpperCase() === "KOTA" || reg.name.toLowerCase().startsWith("kota");
                    return (
                      <div
                        key={reg.id}
                        onClick={() => setActiveRegency(reg)}
                        className={`p-3 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50/80 border-l-4 border-l-blue-600 text-blue-900 font-semibold"
                            : "hover:bg-base/60 text-ink"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isKota
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {isKota ? "KOTA" : "KABUPATEN"}
                            </span>
                            <span className="text-xs truncate font-bold text-ink">{reg.name}</span>
                          </div>
                          <span className="text-[10px] text-muted font-mono mt-0.5 block">
                            ID: {reg.id}
                          </span>
                        </div>
                        <ChevronRight size={14} className={isSelected ? "text-blue-600" : "text-muted"} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Kecamatan Nasional */}
            <div className="lg:col-span-4 rounded-xl border border-line bg-panel shadow-sm flex flex-col h-[640px]">
              <div className="p-3 border-b border-line bg-base/40 rounded-t-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-amber-600" />
                    <h3 className="font-bold text-xs text-ink uppercase tracking-wider">
                      3. Kecamatan Nasional ({displayedDistricts.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted font-bold truncate max-w-[150px]">
                    {activeRegency ? activeRegency.name : "Pilih Kab/Kota"}
                  </span>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-muted" />
                  <input
                    value={searchDist}
                    onChange={(e) => setSearchDist(e.target.value)}
                    placeholder="Cari nama kecamatan..."
                    className="w-full rounded-md border border-line bg-white py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-muted focus-ring"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-line scrollbar-thin">
                {isLoadingDistricts ? (
                  <div className="p-10 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-navy" />
                    <span>Memuat daftar kecamatan dari PostgreSQL 16 port 2027...</span>
                  </div>
                ) : displayedDistricts.length === 0 ? (
                  <div className="p-8 text-center text-muted text-xs">
                    <p className="font-medium text-ink">Tidak ada data kecamatan spesifik</p>
                    <p className="text-[11px] mt-1">
                      Kecamatan dapat diakses via API endpoint <code>/api/admin/districts</code>
                    </p>
                  </div>
                ) : (
                  displayedDistricts.map((dist, idx) => (
                    <div
                      key={dist.id || idx}
                      className="p-3 hover:bg-base/40 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-700 shrink-0">
                          <MapPin size={12} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-ink block truncate">{dist.name}</span>
                          <span className="text-[10px] text-muted">
                            Kecamatan di {activeRegency?.name}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-muted px-1.5 py-0.5 rounded bg-base">
                        #{idx + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* District Action Footer */}
              <div className="p-3 border-t border-line bg-base/30 rounded-b-xl flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted">
                  Total {districtsList.length} Kecamatan terdata
                </span>
                <button
                  onClick={() => {
                    setActiveTab("probe");
                    setProbeEndpoint("/api/admin/districts");
                    setProbeParam(`regency_id=${activeRegency?.id || ""}`);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:underline"
                >
                  <Code2 size={12} />
                  <span>Uji API Kecamatan &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE REST API PROBE */}
      {activeTab === "probe" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-panel p-5 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-white shadow">
                    <Code2 size={16} />
                  </span>
                  <h3 className="font-bold text-base text-ink">
                    REST API Gateway Interoperabilitas Wilayah NKRI
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted max-w-3xl leading-relaxed">
                  Endpoint resmi ini melayani query hierarki wilayah Indonesia (Provinsi, Kabupaten/Kota, dan Kecamatan Nasional) yang terhubung langsung ke basis data PostgreSQL 16 (Port 2027) melalui Proxy Gateway (Port 2028).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runApiProbe}
                  disabled={probeLoading}
                  className="focus-ring inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light shadow transition-all disabled:opacity-50"
                >
                  {probeLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Kirim Request (Uji Koneksi API)</span>
                </button>
              </div>
            </div>

            {/* Request Controls */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 border-t border-line">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                  Pilih Endpoint API
                </label>
                <select
                  value={probeEndpoint}
                  onChange={(e) => {
                    const ep = e.target.value as any;
                    setProbeEndpoint(ep);
                    if (ep === "/api/admin/provinces") setProbeParam("");
                    if (ep === "/api/admin/regencies") setProbeParam("provinsi=Lampung");
                    if (ep === "/api/admin/districts") setProbeParam(`regency_id=${activeRegency?.id || "r-010100"}`);
                    if (ep === "/api/admin/database-overview") setProbeParam("");
                  }}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono font-semibold text-ink focus-ring"
                >
                  <option value="/api/admin/provinces">GET /api/admin/provinces (38 Provinsi NKRI)</option>
                  <option value="/api/admin/regencies">GET /api/admin/regencies (514 Kab/Kota)</option>
                  <option value="/api/admin/districts">GET /api/admin/districts (Kecamatan Nasional)</option>
                  <option value="/api/admin/database-overview">GET /api/admin/database-overview (Statistik Basis Data)</option>
                </select>
              </div>

              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold uppercase text-muted mb-1">
                  Query Parameters (Opsional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={probeParam}
                    onChange={(e) => setProbeParam(e.target.value)}
                    placeholder="Contoh: provinsi=Lampung atau regency_id=r-010100"
                    className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono text-ink placeholder:text-muted focus-ring"
                  />
                  <button
                    onClick={() => setProbeParam("")}
                    className="rounded-lg border border-line px-2.5 py-2 text-xs text-muted hover:bg-base"
                    title="Kosongkan parameter"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Parameters */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-muted">Contoh Preset:</span>
              <button
                onClick={() => {
                  setProbeEndpoint("/api/admin/provinces");
                  setProbeParam("");
                }}
                className="rounded bg-base px-2 py-0.5 text-navy hover:bg-navy/10 font-mono font-medium"
              >
                Semua Provinsi
              </button>
              <button
                onClick={() => {
                  setProbeEndpoint("/api/admin/regencies");
                  setProbeParam("provinsi=Lampung");
                }}
                className="rounded bg-base px-2 py-0.5 text-navy hover:bg-navy/10 font-mono font-medium"
              >
                Kab/Kota di Lampung
              </button>
              <button
                onClick={() => {
                  setProbeEndpoint("/api/admin/districts");
                  setProbeParam("kabupatenKota=Kabupaten Pesawaran");
                }}
                className="rounded bg-base px-2 py-0.5 text-navy hover:bg-navy/10 font-mono font-medium"
              >
                Kecamatan di Pesawaran
              </button>
              <button
                onClick={() => {
                  setProbeEndpoint("/api/admin/districts");
                  setProbeParam("regency_id=r-010100");
                }}
                className="rounded bg-base px-2 py-0.5 text-navy hover:bg-navy/10 font-mono font-medium"
              >
                Kecamatan di Kepulauan Seribu
              </button>
            </div>
          </div>

          {/* Response Payload Viewer */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-muted">
                  Live Response Viewer
                </span>
                {probeStatus && (
                  <span
                    className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                      probeStatus === 200
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    HTTP {probeStatus} OK
                  </span>
                )}
                {probeLatency !== null && (
                  <span className="font-mono text-xs text-muted">
                    Latency: <strong className="text-ink">{probeLatency}ms</strong>
                  </span>
                )}
              </div>

              <button
                onClick={copyProbeResponse}
                disabled={!probeResponse}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-base transition-colors disabled:opacity-40"
              >
                {copiedProbe ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedProbe ? "Tersalin!" : "Salin JSON"}</span>
              </button>
            </div>

            <div className="mt-3">
              <pre className="max-h-[420px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-emerald-400 border border-slate-800 shadow-inner scrollbar-thin">
                {probeLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                    <RefreshCw size={16} className="animate-spin text-emerald-400" />
                    <span>Menghubungi endpoint API lokal port 2028...</span>
                  </div>
                ) : probeResponse ? (
                  JSON.stringify(probeResponse, null, 2)
                ) : (
                  <span className="text-slate-500">
                    Klik tombol "Kirim Request (Uji Koneksi API)" di atas untuk melihat respon langsung.
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SATUAN PENDIDIKAN PER WILAYAH */}
      {activeTab === "schools" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={15} className="absolute left-3 top-2.5 text-muted" />
                <input
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Cari NPSN, nama satuan, kabupaten..."
                  className="focus-ring w-full rounded-md border border-line bg-panel py-2 pl-9 pr-3 text-xs text-ink shadow-sm"
                />
              </div>

              {/* Filter Kementerian */}
              <select
                value={selectedKementerian}
                onChange={(e) => setSelectedKementerian(e.target.value)}
                className={`focus-ring rounded-md border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
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

              {/* Filter Provinsi */}
              <select
                value={selectedProvinsi}
                onChange={(e) => {
                  setSelectedProvinsi(e.target.value);
                  setSelectedKabupaten("");
                }}
                className="focus-ring rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm max-w-[170px]"
              >
                <option value="">Semua Provinsi</option>
                {provincesList.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Filter Kabupaten */}
              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="focus-ring rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm max-w-[190px]"
              >
                <option value="">Semua Kabupaten/Kota</option>
                {regenciesList
                  .filter((r) => !selectedProvinsi || r.provinceName === selectedProvinsi)
                  .map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
              </select>

              {/* Filter Jenjang */}
              <select
                value={selectedJenjang}
                onChange={(e) => setSelectedJenjang(e.target.value)}
                className="focus-ring rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
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
          </div>

          {/* School Table Panel */}
          <Panel
            title={
              !selectedKementerian
                ? "Satuan Pendidikan Terdaftar (Silakan Pilih Kementerian di Atas)"
                : `Satuan Pendidikan Terdaftar (${filteredSchools.length} Satuan${
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
                              Daftar satuan sengaja belum dimuat saat awal (total 468.724 satuan di database). Silakan pilih <strong>Kementerian Pembina</strong> atau klik <strong>"Semua Kementerian"</strong> pada dropdown filter di atas untuk memuat data.
                            </p>
                          </div>
                          <div className="pt-1">
                            <button
                              onClick={() => setSelectedKementerian("ALL")}
                              className="focus-ring inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
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
                    filteredSchools.map((i) => {
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
                            <span className="rounded bg-base px-2 py-0.5 font-bold text-ink">
                              {i.jenjang}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                i.kementerianPembina === "Kemendikdasmen"
                                  ? "bg-navy/10 text-navy"
                                  : i.kementerianPembina === "Kemenag"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {i.kementerianPembina}
                            </span>
                          </td>
                          <td className="py-3 text-muted">
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="text-muted shrink-0" />
                              <span>
                                Kec. {i.kecamatan} · {i.kabupatenKota} · {i.provinsi}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <StatusBadge value={i.status} />
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewingUsersInst(i)}
                                title="Lihat Akun Terdaftar"
                                className="rounded p-1 text-muted hover:bg-base hover:text-navy flex items-center gap-1 text-[11px]"
                              >
                                <Users size={13} />
                                <span className="font-mono">({userCount})</span>
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(i)}
                                  title="Edit Satuan"
                                  className="rounded p-1 text-muted hover:bg-base hover:text-navy"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setDeletingInst(i)}
                                  title="Hapus Satuan"
                                  className="rounded p-1 text-muted hover:bg-base hover:text-status-danger"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Modal: Add School */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Satuan Pendidikan Master"
        subtitle="Registrasi NPSN dan instansi baru ke database master wilayah"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-ink">NPSN / Kode Registrasi *</label>
            <input
              required
              value={formData.npsn}
              onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
              placeholder="Contoh: 10801234"
              className="mt-1 w-full rounded border border-line bg-panel p-2 font-mono text-ink focus-ring"
            />
          </div>
          <div>
            <label className="block font-medium text-ink">Nama Satuan Pendidikan *</label>
            <input
              required
              value={formData.namaSatuan}
              onChange={(e) => setFormData({ ...formData, namaSatuan: e.target.value })}
              placeholder="Contoh: SDN 1 Menteng"
              className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-ink">Jenjang</label>
              <select
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value as Jenjang })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
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
            <div>
              <label className="block font-medium text-ink">Kementerian Pembina</label>
              <select
                value={formData.kementerianPembina}
                onChange={(e) =>
                  setFormData({ ...formData, kementerianPembina: e.target.value as KementerianPembina })
                }
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              >
                <option value="Kemendikdasmen">Kemendikdasmen</option>
                <option value="Kemenag">Kemenag</option>
                <option value="Kemendiktisaintek">Kemendiktisaintek</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-ink">Provinsi</label>
              <input
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              />
            </div>
            <div>
              <label className="block font-medium text-ink">Kabupaten/Kota</label>
              <input
                value={formData.kabupatenKota}
                onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              />
            </div>
            <div>
              <label className="block font-medium text-ink">Kecamatan</label>
              <input
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
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
              Simpan Satuan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit School */}
      <Modal
        isOpen={!!editingInst}
        onClose={() => setEditingInst(null)}
        title="Edit Satuan Pendidikan Master"
        subtitle={`ID: ${editingInst?.id} · NPSN: ${editingInst?.npsn}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-ink">NPSN</label>
            <input
              required
              value={formData.npsn}
              onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
              className="mt-1 w-full rounded border border-line bg-panel p-2 font-mono text-ink focus-ring"
            />
          </div>
          <div>
            <label className="block font-medium text-ink">Nama Satuan Pendidikan</label>
            <input
              required
              value={formData.namaSatuan}
              onChange={(e) => setFormData({ ...formData, namaSatuan: e.target.value })}
              className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-ink">Jenjang</label>
              <select
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value as Jenjang })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
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
            <div>
              <label className="block font-medium text-ink">Kementerian Pembina</label>
              <select
                value={formData.kementerianPembina}
                onChange={(e) =>
                  setFormData({ ...formData, kementerianPembina: e.target.value as KementerianPembina })
                }
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              >
                <option value="Kemendikdasmen">Kemendikdasmen</option>
                <option value="Kemenag">Kemenag</option>
                <option value="Kemendiktisaintek">Kemendiktisaintek</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-ink">Provinsi</label>
              <input
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              />
            </div>
            <div>
              <label className="block font-medium text-ink">Kabupaten/Kota</label>
              <input
                value={formData.kabupatenKota}
                onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
              />
            </div>
            <div>
              <label className="block font-medium text-ink">Kecamatan</label>
              <input
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="mt-1 w-full rounded border border-line bg-panel p-2 text-ink focus-ring"
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
