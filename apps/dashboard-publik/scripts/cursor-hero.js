/**
 * High-Performance CursorHero & Custom Magnetic Cursor Engine
 * Optimized for Vite: Instant First-Paint (<50ms), Staged Progressive Loading,
 * Viewport Intersection Caching, and Zero Ghosting Canvas Rendering.
 */

(function () {
  'use strict';

  // --- Configuration Constants ---
  const FRAME_COUNT = 64;
  const RESPONSE_FACTOR = 0.38;
  const DEADZONE_RADIUS_PCT = 0.05;
  const ZOOM_FACTOR = 0.88;
  const FRAMES_BASE_URL = '/frames';

  /**
   * Calibrated keyframe angle mapping:
   * 0°   (Right)        -> Frame 27
   * 45°  (Right-Down)   -> Frame 33
   * 90°  (Down)         -> Frame 39
   * 135° (Left-Down)    -> Frame 45
   * 180° (Left)         -> Frame 50
   * 225° (Left-Up)      -> Frame 58
   * 270° (Up)           -> Frame 73 (9 mod 64)
   * 315° (Right-Up)     -> Frame 82 (18 mod 64)
   * 360° (Right)        -> Frame 91 (27 mod 64)
   */
  const KEY_FRAMES = [
    { deg: 0,   frame: 27 },
    { deg: 45,  frame: 33 },
    { deg: 90,  frame: 39 },
    { deg: 135, frame: 45 },
    { deg: 180, frame: 50 },
    { deg: 225, frame: 58 },
    { deg: 270, frame: 73 },
    { deg: 315, frame: 82 },
    { deg: 360, frame: 91 },
  ];

  // Cardinal primary frames to load with high priority
  const CARDINAL_FRAMES = [27, 33, 39, 45, 50, 58, 9, 18];

  function shortestAngleDelta(from, to) {
    let delta = (to - from) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  function getFrameIndexFromAngle(deg) {
    for (let i = 0; i < KEY_FRAMES.length - 1; i++) {
      const k1 = KEY_FRAMES[i];
      const k2 = KEY_FRAMES[i + 1];
      if (deg >= k1.deg && deg <= k2.deg) {
        const t = (deg - k1.deg) / (k2.deg - k1.deg);
        const interpolatedFrame = k1.frame + t * (k2.frame - k1.frame);
        return Math.round(interpolatedFrame) % FRAME_COUNT;
      }
    }
    return 27;
  }

  // --- Frame Storage & State ---
  const frames = new Array(FRAME_COUNT).fill(null);
  const loadedIndices = new Set();
  let centerFrame = null;
  let isCenterLoaded = false;

  // Helper: Find nearest loaded frame if the requested one is still loading
  function getNearestLoadedFrame(targetIdx) {
    if (loadedIndices.has(targetIdx)) {
      return frames[targetIdx];
    }
    // Search outwards from targetIdx
    for (let delta = 1; delta <= 32; delta++) {
      const prev = (targetIdx - delta + FRAME_COUNT) % FRAME_COUNT;
      if (loadedIndices.has(prev)) return frames[prev];
      const next = (targetIdx + delta) % FRAME_COUNT;
      if (loadedIndices.has(next)) return frames[next];
    }
    return centerFrame;
  }

  /**
   * Staged Progressive Loader:
   * 1. Stage 1 (Instant): Load center.webp (88KB) -> render immediately!
   * 2. Stage 2 (Fast Priority): Load 8 cardinal angles.
   * 3. Stage 3 (Idle Background Stream): Load remaining 56 frames in background.
   */
  function initProgressiveLoader(onFirstFrameReady, onAllReady) {
    // 1. Stage 1: Neutral / Center frame (Critical Path)
    centerFrame = new Image();
    centerFrame.decoding = 'async';
    centerFrame.src = `${FRAMES_BASE_URL}/center.webp`;

    const handleCenterReady = () => {
      if (isCenterLoaded) return;
      isCenterLoaded = true;
      if (typeof onFirstFrameReady === 'function') {
        onFirstFrameReady(centerFrame);
      }
      loadCardinalFrames();
    };

    if (centerFrame.complete && centerFrame.naturalWidth > 0) {
      handleCenterReady();
    } else {
      centerFrame.onload = handleCenterReady;
      centerFrame.onerror = handleCenterReady;
    }

    // 2. Stage 2: Cardinal keyframes
    function loadCardinalFrames() {
      let cardinalLoaded = 0;
      CARDINAL_FRAMES.forEach((idx) => {
        loadSingleFrame(idx, () => {
          cardinalLoaded++;
          if (cardinalLoaded >= CARDINAL_FRAMES.length) {
            scheduleRemainingFrames();
          }
        });
      });
    }

    // 3. Stage 3: Stream remaining frames in non-blocking batches
    function scheduleRemainingFrames() {
      const remaining = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (!loadedIndices.has(i)) {
          remaining.push(i);
        }
      }

      let pointer = 0;
      const batchSize = 6;

      function loadNextBatch() {
        if (pointer >= remaining.length) {
          if (typeof onAllReady === 'function') onAllReady();
          return;
        }

        const batch = remaining.slice(pointer, pointer + batchSize);
        pointer += batchSize;

        let batchCount = 0;
        batch.forEach((idx) => {
          loadSingleFrame(idx, () => {
            batchCount++;
            if (batchCount >= batch.length) {
              if ('requestIdleCallback' in window) {
                window.requestIdleCallback(loadNextBatch, { timeout: 200 });
              } else {
                setTimeout(loadNextBatch, 25);
              }
            }
          });
        });
      }

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadNextBatch, { timeout: 150 });
      } else {
        setTimeout(loadNextBatch, 20);
      }
    }

    function loadSingleFrame(i, callback) {
      if (frames[i] && loadedIndices.has(i)) {
        callback?.();
        return;
      }
      const img = new Image();
      const padIdx = String(i).padStart(2, '0');
      img.decoding = 'async';
      img.src = `${FRAMES_BASE_URL}/frame_${padIdx}.webp`;
      img.onload = () => {
        frames[i] = img;
        loadedIndices.add(i);
        callback?.();
      };
      img.onerror = () => {
        callback?.();
      };
    }
  }

  // --- High-Performance Canvas Renderer ---
  function initCursorHero() {
    const canvas = document.getElementById('cursorHeroCanvas');
    const loadingEl = document.getElementById('cursorHeroLoading');
    const heroSection = document.getElementById('beranda');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
    let currentAngle = 0;
    let angleInitialized = false;
    let rafId = null;
    let isHeroInView = true;
    let isTabVisible = !document.hidden;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track pointer with passive listeners
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    // High-DPI Resize
    let cachedCw = 0;
    let cachedCh = 0;

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const newW = Math.max(1, Math.round(rect.width * dpr));
      const newH = Math.max(1, Math.round(rect.height * dpr));
      if (cachedCw !== newW || cachedCh !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        cachedCw = newW;
        cachedCh = newH;
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Render single frame pinned to bottom
    function draw(image) {
      if (!image || !image.complete) return;
      const cw = cachedCw || canvas.width;
      const ch = cachedCh || canvas.height;
      const iw = image.naturalWidth || 1920;
      const ih = image.naturalHeight || 1080;
      if (!iw || !ih) return;

      const scale = (ch / ih) * ZOOM_FACTOR;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = ch - dh;

      ctx.fillStyle = '#dc1f1a';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(image, dx, dy, dw, dh);
    }

    // Animation Tick
    function tick() {
      if (!isHeroInView || !isTabVisible) {
        rafId = null;
        return;
      }

      if (prefersReducedMotion) {
        if (centerFrame && isCenterLoaded) {
          draw(centerFrame);
        }
      } else {
        const rect = canvas.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        const iw = 1920;
        const ih = 1080;
        const scale = (ch / ih) * ZOOM_FACTOR;
        const dw = iw * scale;
        const dh = ih * scale;
        const imgX = (cw - dw) / 2;
        const imgY = ch - dh;

        // Eye anchor position (X=49.3%, Y=39.8%)
        const faceX = rect.left + imgX + 0.493 * dw;
        const faceY = rect.top + imgY + 0.398 * dh;

        const dx = pointer.x - faceX;
        const dy = pointer.y - faceY;
        const dist = Math.hypot(dx, dy);
        const deadzone = Math.min(window.innerWidth, window.innerHeight) * DEADZONE_RADIUS_PCT;

        let targetImage;

        if (!pointer.active || dist < deadzone) {
          targetImage = centerFrame;
        } else {
          const targetAngle = Math.atan2(dy, dx);
          if (!angleInitialized) {
            currentAngle = targetAngle;
            angleInitialized = true;
          }

          const delta = shortestAngleDelta(currentAngle, targetAngle);
          currentAngle += delta * RESPONSE_FACTOR;

          const twoPi = Math.PI * 2;
          let a = currentAngle % twoPi;
          if (a < 0) a += twoPi;
          const deg = (a * 180) / Math.PI;

          const idealFrameIndex = getFrameIndexFromAngle(deg);
          targetImage = getNearestLoadedFrame(idealFrameIndex);
        }

        draw(targetImage);
      }

      rafId = requestAnimationFrame(tick);
    }

    function resumeLoop() {
      if (!rafId && isHeroInView && isTabVisible && isCenterLoaded) {
        rafId = requestAnimationFrame(tick);
      }
    }

    // Battery & CPU optimization: pause RAF when hero is offscreen
    if ('IntersectionObserver' in window && heroSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          isHeroInView = entries[0].isIntersecting;
          if (isHeroInView) resumeLoop();
        },
        { threshold: 0.05 }
      );
      observer.observe(heroSection);
    }

    // Pause RAF when browser tab is inactive
    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) resumeLoop();
    });

    // Start progressive loading with Instant First Paint
    initProgressiveLoader(
      // First frame ready callback (< 50ms)
      (firstFrame) => {
        if (loadingEl) {
          loadingEl.classList.add('is-hidden');
        }
        draw(firstFrame);
        resumeLoop();
      },
      // All frames ready callback
      () => {
        // Full sequence ready, zero fallback needed
      }
    );
  }

  // --- High-Performance Custom Magnetic Cursor ---
  function initCustomCursor() {
    const canHover = window.matchMedia('(pointer: fine)').matches;
    if (!canHover) return;

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;
    let isMoving = false;
    let rafCursor = null;

    document.documentElement.classList.add('public-hero__native-cursor-hidden');

    function onPointerMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      if (!isMoving) {
        isMoving = true;
        cursorLoop();
      }
    }

    function cursorLoop() {
      const dx = targetX - ringX;
      const dy = targetY - ringY;
      ringX += dx * 0.32;
      ringY += dy * 0.32;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      // Keep looping until ring catches up to reduce idle CPU
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafCursor = requestAnimationFrame(cursorLoop);
      } else {
        isMoving = false;
        rafCursor = null;
      }
    }

    function onPointerHover(e) {
      const target = e.target;
      const interactive = target && target.closest(
        'a, button, input, select, textarea, .sankey-node, .chip-btn, .suggestion-chip, .btn-bookmark, [role="button"]'
      );
      ring.classList.toggle('public-hero__cursor-ring--active', Boolean(interactive));
    }

    // Adaptive cursor contrast for light sections
    let scrollScheduled = false;
    function checkCursorTheme() {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        const hero = document.getElementById('beranda');
        if (hero) {
          const heroRect = hero.getBoundingClientRect();
          if (heroRect.bottom < 100) {
            document.body.classList.add('cursor--dark-mode');
          } else {
            document.body.classList.remove('cursor--dark-mode');
          }
        }
        scrollScheduled = false;
      });
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointermove', onPointerHover, { passive: true });
    window.addEventListener('scroll', checkCursorTheme, { passive: true });
  }

  // --- AI Audit Modal Logic ---
  function initAiAuditModal() {
    const modal = document.getElementById('aiAuditModal');
    const closeBtn = document.getElementById('aiModalClose');
    const backdrop = document.getElementById('aiModalBackdrop');
    const form = document.getElementById('aiAuditForm');
    const input = document.getElementById('aiInputText');
    const chatBody = document.getElementById('aiModalBody');
    const btnTanyaAudit = document.getElementById('btnTanyaAudit');
    const navAiAudit = document.getElementById('navAiAudit');

    if (!modal) return;

    function openModal(initialQuestion = '') {
      modal.classList.add('is-open');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      
      if (initialQuestion && input) {
        input.value = initialQuestion;
        askQuestion(initialQuestion);
      } else {
        setTimeout(() => input?.focus(), 150);
      }
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    // Expose globally so any script or modal on the page can open Aksara
    window.openAiAuditModal = openModal;
    window.closeAiAuditModal = closeModal;
    window.askAksara = function(query) {
      openModal(query);
    };

    btnTanyaAudit?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    navAiAudit?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    // Support Header AI Button
    const headerBtnAi = document.getElementById('headerBtnAi');
    headerBtnAi?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    // Floating Scroll To Top Button
    const btnScrollTop = document.getElementById('btnScrollTop');
    if (btnScrollTop) {
      const toggleScrollTop = () => {
        if (window.scrollY > 280) {
          btnScrollTop.classList.add('visible');
        } else {
          btnScrollTop.classList.remove('visible');
        }
      };
      window.addEventListener('scroll', toggleScrollTop, { passive: true });
      toggleScrollTop();

      btnScrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (window.location.hash === '#ai-audit') {
      openModal();
    }

    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#ai-audit') {
        openModal();
      }
    });

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    document.querySelectorAll('.ai-prompt-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        if (promptText) {
          askQuestion(promptText);
        }
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input?.value.trim();
      if (!query) return;
      input.value = '';
      askQuestion(query);
    });

    async function askQuestion(userText) {
      if (!chatBody) return;

      const userMsgDiv = document.createElement('div');
      userMsgDiv.className = 'ai-message ai-message--user';
      userMsgDiv.innerHTML = `<div class="ai-message-bubble">${escapeHtml(userText)}</div>`;
      chatBody.appendChild(userMsgDiv);

      const botMsgDiv = document.createElement('div');
      botMsgDiv.className = 'ai-message ai-message--bot';
      botMsgDiv.innerHTML = `<div class="ai-message-bubble"><div style="display:flex;align-items:center;gap:8px;"><em>Aksara sedang menganalisis data dan menyiapkan jawaban…</em><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1D4ED8;animation:pulse 1s infinite;"></span></div></div>`;
      chatBody.appendChild(botMsgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;

      let botResponse = null;

      // 1. Try querying Live AI via Proxy Backend (which uses configured API token from Admin Settings & PostgreSQL data)
      try {
        const aiRes = await fetch('http://localhost:2028/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText })
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.reply) {
            // Format basic markdown into clean HTML
            botResponse = escapeHtml(aiData.reply)
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 4px;border-radius:3px;">$1</code>')
              .replace(/\n\n/g, '<br><br>')
              .replace(/\n/g, '<br>');
          }
        }
      } catch (err) {
        console.warn('[AI Aksara] Proxy API chat error:', err);
      }

      // 2. Secondary fallback: DBClient if available
      if (!botResponse && window.DBClient) {
        try {
          botResponse = await window.DBClient.queryDatabaseForAI(userText);
        } catch (e) {
          console.warn('[AI Audit] DB Query error:', e);
        }
      }

      // 3. Static engine fallback
      if (!botResponse) {
        botResponse = generateAiResponse(userText);
      }

      botMsgDiv.innerHTML = `<div class="ai-message-bubble">${botResponse}</div>`;
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function generateAiResponse(query) {
      const q = query.toLowerCase();

      if (q.includes('siapa') || q.includes('kamu') || q.includes('aksara') || q.includes('halo') || q.includes('hai') || q.includes('pagi') || q.includes('siang') || q.includes('malam')) {
        return `Halo! Aku <strong>Aksara</strong>, asisten AI interaktif pemantauan APBN Pendidikan 2026. Aku bertugas membantu masyarakat menelusuri transparansi anggaran pendidikan secara terbuka dan faktual — mulai dari dana BOS sekolah, beasiswa PIP & KIP Kuliah, hingga alokasi mandatory spending 20% APBN ke seluruh provinsi.`;
      }

      if (q.includes('total') || q.includes('alokasi') || q.includes('anggaran') || q.includes('realisasi')) {
        return `Berdasarkan data APBN 2026 terverifikasi, total alokasi mandatori pendidikan 20% adalah <strong>Rp757,8 Triliun</strong>. Hingga saat ini, realisasi penyerapan mencapai <strong>Rp542,1 Triliun (71,5%)</strong> disalurkan untuk 53,2 juta siswa dan 438 ribu sekolah se-Indonesia.`;
      }

      if (q.includes('bos') || q.includes('sekolah') || q.includes('operasional')) {
        return `Program <strong>BOS Reguler & BOP PAUD 2026</strong> dialokasikan sebesar <strong>Rp59,1 Triliun</strong> untuk 217.420 sekolah. Penyaluran ditransfer langsung ke rekening sekolah tanpa perantara, dengan nominal berkisar <strong>Rp900.000 s.d. Rp1.900.000</strong> per siswa per tahun.`;
      }

      if (q.includes('pip') || q.includes('kip') || q.includes('beasiswa') || q.includes('mahasiswa')) {
        return `Pemerintah mengalokasikan <strong>Rp13,4 Triliun</strong> untuk <strong>PIP</strong> (18,6 juta siswa rentan) dan <strong>Rp13,9 Triliun</strong> untuk <strong>KIP Kuliah Merdeka</strong> (985.000 mahasiswa aktif di 800+ PTN & PTS).`;
      }

      if (q.includes('guru') || q.includes('gaji') || q.includes('tunjangan') || q.includes('tpg')) {
        return `Alokasi untuk <strong>Kesejahteraan Tenaga Pendidik</strong> mencapai <strong>Rp285,4 Triliun</strong>, mencakup Tunjangan Profesi Guru (TPG) Rp56,8 Triliun serta gaji ASN/PPPK untuk 3,1 juta guru dan dosen di seluruh Indonesia.`;
      }

      if (q.includes('alur') || q.includes('aliran') || q.includes('sankey') || q.includes('alir')) {
        return `Dana berasal dari <strong>APBN Murni (Rp665 T)</strong> dan <strong>APBD Matching Fund (Rp92,8 T)</strong>. Penyaluran dilakukan melalui 4 pintu: Transfer ke Daerah (TKD Rp396,5 T), Dana Abadi LPDP (Rp200 T), Kemendikbudristek (Rp98,9 T), dan Kemenag (Rp62,4 T). Kamu bisa lihat diagram alir interaktifnya di bagian <a href="#flow-section" style="color:#0055C7; text-decoration:underline;">Aliran Dana</a>.`;
      }

      return `Data terkait <em>"${escapeHtml(query)}"</em> dapat kamu telusuri langsung pada tabel <a href="#data" style="color:#0055C7; text-decoration:underline;">Data Anggaran</a> atau gunakan fitur pencarian untuk melihat detail kabupaten/kota di <a href="peta-regional.html" style="color:#0055C7; text-decoration:underline;">Peta Regional</a>.`;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  }

  // --- Smooth Scroll to #data ---
  function initSmoothNav() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#ai-audit') return;

        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, '', href);
        }
      });
    });

    if (window.location.hash === '#data') {
      setTimeout(() => {
        const targetEl = document.getElementById('data');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCursorHero();
      initCustomCursor();
      initAiAuditModal();
      initSmoothNav();
    });
  } else {
    initCursorHero();
    initCustomCursor();
    initAiAuditModal();
    initSmoothNav();
  }
})();
