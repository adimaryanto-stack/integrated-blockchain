import React, { useState, useEffect, useRef } from "react";
import type { InstitutionMaster } from "@/types";
import { Search, Building, Check, Loader2, X } from "lucide-react";

interface SchoolNpsnSelectorProps {
  value: string; // school id or npsn
  onChange: (schoolId: string, schoolObj?: InstitutionMaster) => void;
  institutions: InstitutionMaster[];
  searchSchools: (query: string) => Promise<InstitutionMaster[]>;
  required?: boolean;
}

export function SchoolNpsnSelector({
  value,
  onChange,
  institutions,
  searchSchools,
  required = false,
}: SchoolNpsnSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstitutionMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [useLegacySelect, setUseLegacySelect] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find currently selected school
  const selectedSchool = institutions.find(
    (i) => i.id === value || i.npsn === value
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchSchools(trimmed);
        setResults(res || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error("Search school failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, searchSchools]);

  const handleSelect = (school: InstitutionMaster) => {
    onChange(school.id, school);
    setIsDropdownOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5 text-xs" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <label className="font-semibold text-ink flex items-center gap-1.5">
          <span>Satuan Pendidikan Rujukan</span>
          {required && <span className="text-status-danger">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setUseLegacySelect(!useLegacySelect)}
          className="text-[11px] text-muted hover:text-navy underline"
        >
          {useLegacySelect ? "Gunakan Cari NPSN Cepat" : "Pilih dari Dropdown"}
        </button>
      </div>

      {useLegacySelect ? (
        <div>
          <select
            value={value}
            onChange={(e) => {
              const inst = institutions.find((i) => i.id === e.target.value);
              onChange(e.target.value, inst);
            }}
            className="focus-ring w-full rounded border border-line bg-panel p-2 text-ink text-xs"
            required={required}
          >
            <option value="">-- Pilih Satuan Pendidikan --</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.namaSatuan} (NPSN: {i.npsn}) — {i.kabupatenKota}
              </option>
            ))}
          </select>
        </div>
      ) : selectedSchool && !isDropdownOpen && !query ? (
        /* Selected School Card Preview */
        <div className="rounded border border-status-ok/30 bg-status-ok/5 p-2.5 flex items-center justify-between gap-2 transition-all">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-status-ok/15 text-status-ok">
              <Building size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-ink text-xs truncate max-w-[280px]">
                  {selectedSchool.namaSatuan}
                </span>
                <span className="rounded bg-status-ok/20 text-status-ok px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  NPSN: {selectedSchool.npsn}
                </span>
                <span className="rounded bg-navy/10 text-navy px-1.5 py-0.2 text-[10px] font-medium">
                  {selectedSchool.jenjang}
                </span>
              </div>
              <div className="text-[11px] text-muted mt-0.5 truncate">
                {selectedSchool.kabupatenKota}, {selectedSchool.provinsi} ({selectedSchool.kementerianPembina})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-medium text-navy hover:bg-base transition-colors"
          >
            Ganti Sekolah
          </button>
        </div>
      ) : (
        /* Search by NPSN or School Name */
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim()) setIsDropdownOpen(true);
              }}
              placeholder="Ketik 8-digit NPSN (misal: 69893669) atau nama sekolah..."
              className="focus-ring w-full rounded border border-line bg-panel py-2 pl-8 pr-16 text-xs text-ink shadow-sm"
              autoFocus={!!selectedSchool}
            />
            <div className="absolute right-2 flex items-center gap-1">
              {loading && <Loader2 size={13} className="animate-spin text-navy" />}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setIsDropdownOpen(false);
                  }}
                  className="rounded p-0.5 text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Quick NPSN suggestion chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
            <span>Contoh cepat:</span>
            <button
              type="button"
              onClick={() => setQuery("69893669")}
              className="rounded bg-navy/5 hover:bg-navy/10 text-navy px-1.5 py-0.5 font-mono border border-navy/20"
            >
              69893669 (KB AL-IKHLAS)
            </button>
            <button
              type="button"
              onClick={() => setQuery("10208665")}
              className="rounded bg-navy/5 hover:bg-navy/10 text-navy px-1.5 py-0.5 font-mono border border-navy/20"
            >
              10208665 (SDN 030415)
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-line bg-panel p-1 shadow-lg">
              {loading && (
                <div className="flex items-center gap-2 p-3 text-muted text-xs">
                  <Loader2 size={13} className="animate-spin text-navy" />
                  <span>Mencari di antara 468.724 sekolah se-Indonesia...</span>
                </div>
              )}

              {!loading && results.length === 0 && query.trim() && (
                <div className="p-3 text-center text-muted text-xs">
                  Tidak ditemukan sekolah dengan NPSN atau nama &quot;{query}&quot;.
                </div>
              )}

              {!loading && results.map((school) => {
                const isCurrent = school.id === value || school.npsn === value;
                return (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSelect(school)}
                    className={`w-full text-left rounded p-2 text-xs transition-colors flex items-start justify-between gap-2 ${
                      isCurrent
                        ? "bg-navy/10 text-navy font-semibold"
                        : "hover:bg-base text-ink"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink">{school.namaSatuan}</span>
                        <span className="rounded bg-navy text-white px-1.5 py-0.2 text-[10px] font-mono font-bold">
                          NPSN: {school.npsn}
                        </span>
                        <span className="rounded bg-muted/20 px-1 py-0.2 text-[9px] text-muted font-medium">
                          {school.jenjang}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 truncate">
                        {school.kabupatenKota}, {school.provinsi} · {school.kementerianPembina}
                      </div>
                    </div>
                    {isCurrent && <Check size={14} className="text-navy shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
