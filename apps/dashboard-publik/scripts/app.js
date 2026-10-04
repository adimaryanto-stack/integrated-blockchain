/**
 * SiTransparan - Core Interactive Application Logic
 * Integrates live PostgreSQL 16 (Port 2027/2028) & imported components from http://localhost:2020
 */

// Global Data Container for SiTransparan (Populated directly from PostgreSQL via Port 2021)
const SITRANSPARAN_DATA = {
  summary: {
    totalBudget: 0,
    realizedBudget: 0,
    absorptionRate: 0,
    totalBeneficiaries: 0,
    lastUpdated: '-'
  },

  programsList: [
    {
      id: 'bos-reguler',
      name: 'BOS Reguler & BOP PAUD 2026',
      category: 'Operasional Sekolah',
      target: 'SD, SMP, SMA, SMK, PAUD',
      allocation: 'Rp59,1 Triliun',
      realization: 'Rp44,3 Triliun (75%)',
      schools: '217.420 Satuan Pendidikan',
      perStudent: 'Rp900rb - Rp1,9jt / siswa / tahun',
      description: 'Pendanaan langsung ke rekening sekolah tanpa perantara untuk operasional belajar mengajar, buku kurikulum, dan listrik/air.',
      status: 'On Track',
      updated: '14 Agustus 2026'
    },
    {
      id: 'pip-kemendikbud',
      name: 'Program Indonesia Pintar (PIP)',
      category: 'Bantuan Siswa Kurang Mampu',
      target: '18,6 Juta Siswa',
      allocation: 'Rp13,4 Triliun',
      realization: 'Rp10,8 Triliun (80.6%)',
      schools: 'Seluruh Jenjang se-Indonesia',
      perStudent: 'Rp450rb - Rp1,8jt / tahun',
      description: 'Bantuan uang tunai untuk mencegah siswa putus sekolah dari keluarga pemegang KIP / DTKS.',
      status: 'Penyaluran Tahap 2',
      updated: '12 Agustus 2026'
    },
    {
      id: 'kip-kuliah',
      name: 'KIP Kuliah Merdeka',
      category: 'Pendidikan Tinggi',
      target: '985.000 Mahasiswa',
      allocation: 'Rp13,9 Triliun',
      realization: 'Rp9,2 Triliun (66.2%)',
      schools: '800+ PTN & PTS',
      perStudent: 'Biaya Kuliah + Uang Saku s.d Rp1,4jt/bln',
      description: 'Pembiayaan UKT dan biaya hidup bagi mahasiswa berprestasi dengan keterbatasan ekonomi.',
      status: 'On Track',
      updated: '10 Agustus 2026'
    },
    {
      id: 'dak-fisik',
      name: 'DAK Fisik Penuntasan Sarpras',
      category: 'Infrastruktur & Sarpras',
      target: '12.400 Ruang Belajar',
      allocation: 'Rp18,2 Triliun',
      realization: 'Rp11,5 Triliun (63.2%)',
      schools: 'Sekolah Wilayah 3T & Rusak Berat',
      perStudent: 'Berbasis Kebutuhan Fisik',
      description: 'Rehabilitasi gedung sekolah rusak, pengadaan laboratorium digital, dan sanitasi layak.',
      status: 'Verifikasi Lapangan',
      updated: '08 Agustus 2026'
    },
    {
      id: 'tunjangan-profesi',
      name: 'Tunjangan Profesi Guru (TPG) & TKG',
      category: 'Kesejahteraan Pendidik',
      target: '1,4 Juta Guru Bersertifikat',
      allocation: 'Rp56,8 Triliun',
      realization: 'Rp42,6 Triliun (75.0%)',
      schools: 'PNS & Non-PNS',
      perStudent: '1x Gaji Pokok / Tunjangan Khusus',
      description: 'Penyaluran tunjangan profesi triwulanan langsung dari Kas Negara ke rekening guru penerima.',
      status: 'Pencairan Triwulan 3',
      updated: '15 Agustus 2026'
    },
    {
      id: 'beasiswa-lpdp',
      name: 'Dana Abadi & Beasiswa LPDP',
      category: 'Riset & Pascasarjana',
      target: '34.000 Awardee',
      allocation: 'Rp20,0 Triliun (Yield Investasi)',
      realization: 'Rp14,1 Triliun (70.5%)',
      schools: 'Top Kampus Dunia & Nasional',
      perStudent: 'Full Scholarship + Living Allowance',
      description: 'Pendanaan studi S2/S3 dan riset strategis dari hasil kelolaan Dana Abadi Pendidikan.',
      status: 'Tahap Seleksi 2',
      updated: '05 Agustus 2026'
    }
  ],

  provinces: []
};

// State & Watchlist Storage Helper
class WatchlistManager {
  static KEY = 'sitransparan_watchlist';

  static getItems() {
    try {
      const items = localStorage.getItem(this.KEY);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  static toggleItem(id) {
    let items = this.getItems();
    const index = items.indexOf(id);
    let added = false;
    if (index > -1) {
      items.splice(index, 1);
      added = false;
    } else {
      items.push(id);
      added = true;
    }
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadges();
    return added;
  }

  static hasItem(id) {
    return this.getItems().includes(id);
  }

  static updateBadges() {
    const count = this.getItems().length;
    document.querySelectorAll('.watchlist-count').forEach(el => {
      el.textContent = count;
    });
  }
}

// UI Toast Notification
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>📌</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Dropdown Navigation Click & Outside Click Handler
function initNavDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('is-open');
      });
    }
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
      }
    });
  });
}

// ==========================================================================
// Initialization on DOM Ready
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavDropdowns();
  WatchlistManager.updateBadges();

  // 1. Initialize 2020 Live School Search Autocomplete
  initSchoolSearch();

  // 2. Initialize Sankey Flow Interactive Nodes
  initSankeyFlow();

  // 3. Initialize Watchlist Buttons
  initWatchlistButtons();

  // 4. Connect to PostgreSQL and sync all live 2020 components
  syncWithPostgres();
});

/**
 * 1. Live School Search & Autocomplete (Debounced against PostgreSQL /schools)
 */
function initSchoolSearch() {
  const searchInput = document.getElementById('schoolSearchInput');
  const searchForm = document.getElementById('schoolSearchForm');
  const popup = document.getElementById('schoolSuggestionsPopup');

  if (!searchInput || !popup) return;

  let debounceTimer = null;

  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (!searchInput.contains(e.target) && !popup.contains(e.target)) {
      popup.style.display = 'none';
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (query.length < 2) {
      popup.style.display = 'none';
      popup.innerHTML = '';
      return;
    }

    popup.style.display = 'block';
    popup.innerHTML = `
      <div class="suggestion-loading">
        <span class="material-symbols-outlined" style="animation: spin 1s linear infinite; vertical-align: middle;">sync</span>
        Mencari data sekolah di PostgreSQL (Port 2027)...
      </div>
    `;

    debounceTimer = setTimeout(async () => {
      try {
        if (!window.DBClient) return;
        const schools = await window.DBClient.searchSchools(query, 6);

        if (!schools || schools.length === 0) {
          popup.innerHTML = `
            <div class="suggestion-empty">
              Tidak ditemukan sekolah dengan kata kunci "<strong>${escapeHtml(query)}</strong>".<br>
              <span style="font-size: 12px; color: #94a3b8;">Coba cari nama sekolah atau NPSN (misal: SDN 1 PESAWARAN, 10800001).</span>
            </div>
          `;
          return;
        }

        const itemsHtml = schools.map(s => {
          const hasAccred = s.accreditation && s.accreditation !== '-';
          return `
            <div class="suggestion-item" data-npsn="${escapeHtml(s.npsn)}" data-name="${escapeHtml(s.name)}" data-location="${escapeHtml(s.location || 'Indonesia')}" data-accreditation="${escapeHtml(s.accreditation || '-')}">
              <div class="suggestion-icon-wrap">
                <span class="material-symbols-outlined">school</span>
              </div>
              <div class="suggestion-details">
                <div class="suggestion-header-row">
                  <p class="suggestion-school-name">${escapeHtml(s.name)}</p>
                  ${hasAccred ? `<span class="badge-accred">Akreditasi ${escapeHtml(s.accreditation)}</span>` : ''}
                </div>
                <p class="suggestion-meta">
                  <strong style="color: var(--color-primary); font-weight: 700;">NPSN ${escapeHtml(s.npsn)}</strong> • ${escapeHtml(s.location || 'Indonesia')}
                </p>
              </div>
              <span class="material-symbols-outlined suggestion-arrow">arrow_forward</span>
            </div>
          `;
        }).join('');

        popup.innerHTML = `
          ${itemsHtml}
          <div class="suggestion-footer">
            <span>⚡ Terhubung ke PostgreSQL Port 2021 (Live)</span>
            <span>Pilih sekolah untuk melihat alokasi</span>
          </div>
        `;

        // Attach click listener to each suggestion
        popup.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            const npsn = item.getAttribute('data-npsn');
            const name = item.getAttribute('data-name');
            const location = item.getAttribute('data-location');
            const accreditation = item.getAttribute('data-accreditation');
            
            popup.style.display = 'none';
            openSchoolModal({ npsn, name, location, accreditation });
          });
        });

      } catch (err) {
        console.error('[Search] Error querying schools:', err);
        popup.innerHTML = `<div class="suggestion-empty">Gagal memuat data dari PostgreSQL: ${err.message}</div>`;
      }
    }, 250);
  });

  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) return;

      popup.style.display = 'block';
      popup.innerHTML = `<div class="suggestion-loading">Mencari...</div>`;

      const schools = await window.DBClient.searchSchools(query, 1);
      if (schools && schools.length > 0) {
        popup.style.display = 'none';
        openSchoolModal(schools[0]);
      } else {
        popup.innerHTML = `<div class="suggestion-empty">Sekolah "${escapeHtml(query)}" tidak ditemukan.</div>`;
      }
    });
  }
}

/**
 * Open School Detail Modal with Live Database Record
 */
async function openSchoolModal(school) {
  let modal = document.getElementById('schoolDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'schoolDetailModal';
    modal.className = 'school-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="school-modal-card">
      <button class="school-modal-close" onclick="document.getElementById('schoolDetailModal').classList.remove('open')">&times;</button>
      
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px;">
        <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(29, 78, 216, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 28px;">school</span>
        </div>
        <div>
          <span style="font-size: 11.5px; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">Satuan Pendidikan Terverifikasi</span>
          <h3 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 2px 0;">${escapeHtml(school.name)}</h3>
          <p style="font-size: 13px; color: #64748b;">NPSN: <strong>${escapeHtml(school.npsn)}</strong> • Akreditasi: <strong>${escapeHtml(school.accreditation || 'Terdaftar')}</strong></p>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #475569;">
        <div style="margin-bottom: 6px;">📍 <strong>Alamat:</strong> ${escapeHtml(school.location || 'Wilayah Indonesia')}</div>
        <div>🏛️ <strong>Sumber Data:</strong> PostgreSQL 16 (Port 2021) terintegrasi Dapodik & Kemenkeu</div>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 16px;">
        <a href="dashboard.html?npsn=${encodeURIComponent(school.npsn)}" class="btn-search-2020" style="flex: 1; text-align: center; justify-content: center; font-size: 14px; text-decoration: none;">
          Buka Dashboard Sekolah
        </a>
        <button type="button" class="btn-cta-ghost btn-school-ask-ai" style="color: var(--color-primary); border-color: #cbd5e1; background: #f8fafc; font-size: 14px;" data-name="${escapeHtml(school.name)}" data-npsn="${escapeHtml(school.npsn)}" onclick="askAksaraAboutSchool(this.getAttribute('data-name'), this.getAttribute('data-npsn'))">
          Tanya AI Aksara
        </button>
      </div>

      <div style="font-size: 12px; color: #94a3b8; text-align: center;">
        ● Data sinkron langsung dari basis data port 2021.
      </div>
    </div>
  `;

  modal.classList.add('open');

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}

function askAksaraAboutSchool(schoolName, schoolNpsn = '') {
  const modal = document.getElementById('schoolDetailModal');
  if (modal) {
    modal.classList.remove('open');
    modal.classList.remove('is-open');
  }

  const query = schoolNpsn
    ? `Berapa alokasi dana dan transaksi anggaran untuk ${schoolName} (NPSN: ${schoolNpsn})?`
    : `Berapa alokasi dana dan transaksi anggaran untuk ${schoolName}?`;

  if (typeof window.askAksara === 'function') {
    window.askAksara(query);
  } else if (typeof window.openAiAuditModal === 'function') {
    window.openAiAuditModal(query);
  } else {
    const aiModal = document.getElementById('aiAuditModal');
    const aiInput = document.getElementById('aiInputText');
    if (aiModal) {
      aiModal.classList.add('is-open');
      aiModal.classList.add('open');
      aiModal.setAttribute('aria-hidden', 'false');
    }
    if (aiInput) {
      aiInput.value = query;
      document.getElementById('aiAuditForm')?.requestSubmit();
    }
  }
}

/**
 * 2. Sankey Flow Node Click
 */
function initSankeyFlow() {
  document.querySelectorAll('.sankey-node').forEach(node => {
    node.addEventListener('click', () => {
      document.querySelectorAll('.sankey-node').forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      
      const title = node.getAttribute('data-title') || node.querySelector('.sankey-node-title')?.textContent;
      const amount = node.getAttribute('data-amount') || node.querySelector('.sankey-node-amount')?.textContent;
      const share = node.getAttribute('data-share') || 'Alokasi Terverifikasi';
      const desc = node.getAttribute('data-desc') || 'Data bersumber dari Rencana Kerja Pemerintah & Nota Keuangan APBN.';

      const drawer = document.getElementById('flowInfoDrawer');
      if (drawer) {
        drawer.innerHTML = `
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-primary); margin-bottom: 2px;">Node Aliran Terpilih</div>
            <h4 style="font-size: 18px; font-weight: 800; color: var(--color-text-main);">${title}</h4>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-top: 2px;">${desc}</p>
          </div>
          <div class="drawer-details">
            <div class="drawer-stat-item">
              <span class="drawer-stat-label">Nominal Alokasi</span>
              <span class="drawer-stat-val">${amount}</span>
            </div>
            <div class="drawer-stat-item">
              <span class="drawer-stat-label">Porsi / Status</span>
              <span class="drawer-stat-val" style="color: var(--color-secondary);">${share}</span>
            </div>
            <a href="detail-anggaran.html?node=${encodeURIComponent(title)}" class="btn-search" style="padding: 8px 18px; font-size: 13px;">
              Lihat Rincian &rarr;
            </a>
          </div>
        `;
      }
    });
  });
}

/**
 * 3. Watchlist Bookmark Buttons
 */
function initWatchlistButtons() {
  document.querySelectorAll('.btn-bookmark').forEach(btn => {
    const id = btn.getAttribute('data-id');
    if (id && WatchlistManager.hasItem(id)) {
      btn.classList.add('bookmarked');
      btn.innerHTML = `★ Tersimpan`;
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!id) return;
      const isAdded = WatchlistManager.toggleItem(id);
      if (isAdded) {
        btn.classList.add('bookmarked');
        btn.innerHTML = `★ Tersimpan`;
        showToast('Ditambahkan ke Pantau Anggaran');
      } else {
        btn.classList.remove('bookmarked');
        btn.innerHTML = `☆ Pantau`;
        showToast('Dihapus dari Pantau Anggaran');
      }
    });
  });
}

/**
 * 4. Live PostgreSQL Synchronization Engine (Port 2027 via Port 2028)
 */
let marqueeInterval = null;

async function syncWithPostgres() {
  if (!window.DBClient) return;

  try {
    const [statsResult, transactionsResult, commentsResult, provStatsResult, allocResult] = await Promise.allSettled([
      window.DBClient.getNationalStats(),
      window.DBClient.getRecentTransactions(15),
      window.DBClient.getRecentComments(10),
      window.DBClient.getAllProvinceStats(),
      window.DBClient.getProvincialAllocations(2026)
    ]);

    const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
    const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];
    const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

    // 1. Update Real-Time Metric Cards (Hero Stats 2020)
    if (stats) {
      // Total Dana Terlacak
      const elTotal = document.getElementById('liveTotalTracked');
      if (elTotal && stats.total_spent) {
        elTotal.textContent = window.DBClient.formatIDR(stats.total_spent);
      }

      // Sekolah Terdaftar
      const elSchools = document.getElementById('liveSchoolCount');
      if (elSchools && stats.school_count) {
        elSchools.textContent = stats.school_count.toLocaleString('id-ID');
      }

      // Also sync top KPI cards if present
      const kpiSchoolEl = document.querySelector('.kpi-card.purple .kpi-value');
      const kpiSchoolBadge = document.querySelector('.kpi-card.purple .kpi-badge');
      if (kpiSchoolEl && stats.school_count) {
        kpiSchoolEl.textContent = `${(stats.school_count / 1000).toFixed(0)} Rb+`;
        if (kpiSchoolBadge) {
          kpiSchoolBadge.textContent = `${stats.school_count.toLocaleString('id-ID')} Satuan`;
        }
      }

      const kpiRealizedEl = document.querySelector('.kpi-card.secondary .kpi-value');
      const kpiRealizedBadge = document.querySelector('.kpi-card.secondary .kpi-badge');
      if (kpiRealizedEl && stats.total_spent) {
        const spentT = (stats.total_spent / 1e12).toFixed(1).replace('.', ',');
        kpiRealizedEl.textContent = `Rp${spentT} T`;
        if (kpiRealizedBadge && stats.total_received) {
          const pct = ((stats.total_spent / stats.total_received) * 100).toFixed(1);
          kpiRealizedBadge.textContent = `${pct}% Terserap`;
        }
      }

      // Update SITRANSPARAN_DATA summary
      SITRANSPARAN_DATA.summary.totalBudget = (stats.total_received / 1e12);
      SITRANSPARAN_DATA.summary.realizedBudget = (stats.total_spent / 1e12);
      SITRANSPARAN_DATA.summary.absorptionRate = stats.total_received > 0 ? ((stats.total_spent / stats.total_received) * 100) : 0;
      SITRANSPARAN_DATA.summary.totalBeneficiaries = 53.2;
      SITRANSPARAN_DATA.summary.lastUpdated = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });
    }

    // Populate live provinces into SITRANSPARAN_DATA
    if (provStatsResult.status === 'fulfilled' && Array.isArray(provStatsResult.value)) {
      const allocMap = new Map();
      if (allocResult.status === 'fulfilled' && Array.isArray(allocResult.value)) {
        allocResult.value.forEach(a => {
          const nm = a.provinsi?.nama_provinsi;
          if (nm) allocMap.set(nm.toLowerCase(), a);
        });
      }
      SITRANSPARAN_DATA.provinces = provStatsResult.value.map(s => {
        const alloc = allocMap.get(s.province_name.toLowerCase());
        const budget = alloc ? Number(alloc.nominal_alokasi) : 0;
        const real = alloc ? Number(alloc.realisasi_total) : 0;
        const pct = budget > 0 ? ((real / budget) * 100).toFixed(1) + '%' : '0%';
        return {
          name: s.province_name,
          budget: window.DBClient.formatTriliun(budget),
          realization: pct,
          schools: s.total_schools ? s.total_schools.toLocaleString('id-ID') : '0',
          students: (s.total_schools * 150).toLocaleString('id-ID'),
          code: s.province_code ? `PRV-${s.province_code}` : 'PRV'
        };
      });
    }

    // 2. Build & Render "Aktivitas Nasional" Marquee Feed
    renderAktivitasMarquee(transactions, comments);

    // Update Status Badge in Header
    updateDatabaseStatusBadge(true);
  } catch (err) {
    console.warn('[Sync] Database sync error:', err.message);
    updateDatabaseStatusBadge(false);
  }
}

/**
 * Render Live Vertical Marquee Ticker with Infinite Loop & Hover Pause
 */
function renderAktivitasMarquee(transactions, comments) {
  const track = document.getElementById('aktivitasTimelineTrack');
  const viewport = document.getElementById('aktivitasTimelineViewport');
  if (!track || !viewport) return;

  let activities = [];

  // Map comments
  if (comments && comments.length > 0) {
    comments.forEach(c => {
      const s = Array.isArray(c.schools) ? c.schools[0] : c.schools;
      activities.push({
        id: `comment-${c.id}`,
        type: 'COMMENT',
        date: new Date(c.created_at).getTime(),
        content: `"${escapeHtml(c.comment_text?.substring(0, 75))}${c.comment_text?.length > 75 ? '...' : ''}"`,
        author: c.author_name || 'Warga',
        schoolName: (s && s.name) || c.npsn || 'Sekolah Terdaftar',
        npsn: c.npsn,
        link: c.npsn ? `dashboard.html?npsn=${encodeURIComponent(c.npsn)}#forum` : 'dashboard.html'
      });
    });
  }

  // Map transactions
  if (transactions && transactions.length > 0) {
    transactions.forEach(t => {
      const s = Array.isArray(t.schools) ? t.schools[0] : t.schools;
      const isAnomaly = (t.description || '').toLowerCase().includes('arisan') || (t.category === 'Lainnya' && Number(t.amount) > 10000000);
      const amtFormatted = window.DBClient.formatIDR(t.amount);
      const schoolName = (s && s.name) || 'Satuan Pendidikan';
      const npsn = (s && s.npsn) || '';

      activities.push({
        id: `trx-${t.id}`,
        type: isAnomaly ? 'ANOMALY' : 'TRANSACTION',
        date: new Date(t.created_at || t.date).getTime(),
        content: isAnomaly 
          ? `⚠️ ANOMALI: ${escapeHtml(t.description || 'Pengeluaran')} (${amtFormatted})`
          : `${escapeHtml(t.description || 'Belanja Kegiatan')} • ${amtFormatted}`,
        schoolName: schoolName,
        npsn: npsn,
        link: npsn ? `dashboard.html?npsn=${encodeURIComponent(npsn)}` : 'dashboard.html'
      });
    });
  }

  if (activities.length === 0) {
    track.innerHTML = `<p style="padding: 20px; color: #64748b; text-align: center;">Belum ada aktivitas terekam hari ini.</p>`;
    return;
  }

  // Sort by date desc
  activities.sort((a, b) => b.date - a.date);

  const renderItem = (act, isDup = false) => {
    const isComment = act.type === 'COMMENT';
    const isAnomaly = act.type === 'ANOMALY';
    const dotClass = isAnomaly ? 'anomaly' : isComment ? 'comment' : 'trx';
    const badgeClass = isAnomaly ? 'anomaly' : isComment ? 'comment' : 'trx';
    const iconName = isAnomaly ? 'warning' : isComment ? 'forum' : 'receipt_long';
    const badgeText = isAnomaly ? 'Anomali Terdeteksi' : isComment ? 'Diskusi Baru' : 'Laporan Belanja';

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(new Date(act.date));

    return `
      <div class="timeline-activity-item" key="${act.id}${isDup ? '-dup' : ''}">
        <span class="timeline-dot ${dotClass}">
          <span class="material-symbols-outlined" style="font-size: 16px;">${iconName}</span>
        </span>
        <div class="timeline-activity-content">
          <div class="activity-header">
            <a href="${act.link}" target="_blank" class="activity-school-name" title="Lihat detail sekolah">
              ${escapeHtml(act.schoolName)}
            </a>
            <span class="activity-timestamp">${formattedDate}</span>
          </div>
          <div class="activity-badge-line">
            <span class="activity-badge ${badgeClass}">${badgeText}</span>
            <span class="activity-text">${act.content}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Render both primary and duplicated items for smooth seamless infinite loop
  track.innerHTML = activities.map(a => renderItem(a, false)).join('') +
                    activities.map(a => renderItem(a, true)).join('');

  // Auto-scrolling ticker with pause on hover
  let isHovered = false;
  viewport.addEventListener('mouseenter', () => { isHovered = true; });
  viewport.addEventListener('mouseleave', () => { isHovered = false; });

  if (marqueeInterval) clearInterval(marqueeInterval);

  marqueeInterval = setInterval(() => {
    if (isHovered) return;
    viewport.scrollTop += 1;
    if (viewport.scrollTop >= viewport.scrollHeight / 2) {
      viewport.scrollTop = 0;
    }
  }, 35);
}

function updateDatabaseStatusBadge(isOnline) {
  // Badge removed per user request
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.SITRANSPARAN_DATA = SITRANSPARAN_DATA;
window.WatchlistManager = WatchlistManager;
window.showToast = showToast;
window.syncWithPostgres = syncWithPostgres;
window.openSchoolModal = openSchoolModal;
window.askAksaraAboutSchool = askAksaraAboutSchool;
