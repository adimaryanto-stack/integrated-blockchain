const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 2028;

app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*',
  exposedHeaders: ['Content-Range', 'Range-Unit', 'Preference-Applied']
}));

app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:2027/postgres',
  max: 20,              // Increase from default 10 → 20 concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware to log requests (only log slow or error responses)
const adminApi = require('./adminApi');

// Mount Admin API router
app.use('/api/admin', adminApi);


// Root / health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Integrated Blockchain Proxy API Server',
    port: port,
    endpoints: {
      rpc: '/rest/v1/rpc/:function',
      rest: '/rest/v1/:table',
      aiConfig: '/api/ai/config',
      aiTest: '/api/ai/test',
      aiChat: '/api/ai/chat'
    }
  });
});

// ─────────────────────────────────────────────────────────
// AI Aksara API Endpoints
// ─────────────────────────────────────────────────────────
app.get('/api/ai/config', async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT value, updated_at FROM public.system_settings WHERE key = 'ai_aksara_config'");
    if (dbRes.rows.length > 0) {
      const config = dbRes.rows[0].value;
      const maskedKey = config.apiKey ? (config.apiKey.length > 8 ? config.apiKey.slice(0, 4) + '...' + config.apiKey.slice(-4) : '****') : '';
      return res.json({ ...config, apiKeyMasked: maskedKey, hasKey: Boolean(config.apiKey), updatedAt: dbRes.rows[0].updated_at });
    }
    return res.json({ hasKey: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/config', async (req, res) => {
  const { provider, apiKey, model, systemPrompt, isActive, temperature, maxTokens, endpointUrl } = req.body;
  try {
    const config = {
      provider: provider || 'gemini',
      apiKey: apiKey || '',
      model: model || 'gemini-2.5-flash',
      systemPrompt: systemPrompt || '',
      isActive: isActive !== false,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens || 1024,
      endpointUrl: endpointUrl || ''
    };
    await pool.query(
      `INSERT INTO public.system_settings (key, value, updated_at)
       VALUES ('ai_aksara_config', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [JSON.stringify(config)]
    );
    console.log('[AI Config] Successfully saved config for provider:', config.provider, 'model:', config.model);
    return res.json({ success: true, message: 'Konfigurasi AI berhasil disimpan!' });
  } catch (err) {
    console.error('[AI Config Save Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Helper: Gemini Model Discovery & Multi-version Caller ─────────
async function fetchAvailableGeminiModels(apiKey) {
  const versions = ['v1beta', 'v1'];
  for (const ver of versions) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || [])
          .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));
        if (models.length > 0) {
          return { models, version: ver };
        }
      }
    } catch (e) {
      console.warn(`[Gemini ListModels] ${ver} error:`, e.message);
    }
  }
  return { models: [], version: 'v1beta' };
}

async function callGeminiGenerate(apiKey, requestedModel, payload) {
  const cleanModel = (requestedModel || 'gemini-2.5-flash').replace(/^models\//, '');
  const versions = ['v1beta', 'v1'];
  let lastError = '';

  // 1. Try requested model across versions
  for (const ver of versions) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${cleanModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`[Gemini Call] Model: ${cleanModel} | Ver: ${ver} | Status: ${res.status}`);
      if (res.ok) {
        return { ok: true, data, usedModel: cleanModel, usedVersion: ver };
      }
      if (data.error?.message) {
        lastError = data.error.message;
      }
      if (res.status === 400 && data.error?.message?.includes('API_KEY_INVALID')) {
        return { ok: false, status: 400, message: 'API Key Google Gemini tidak valid. Silakan periksa kembali key Anda di Google AI Studio.' };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  // 2. Discover available models for this specific API key
  const { models, version } = await fetchAvailableGeminiModels(apiKey);
  console.log(`[Gemini Discovery] Available models:`, models);
  if (models.length > 0) {
    const preferred = [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-pro',
      ...models
    ];
    const candidateModels = Array.from(new Set(preferred.filter(p => models.includes(p))));

    for (const targetModel of candidateModels) {
      for (const ver of versions) {
        try {
          const url = `https://generativelanguage.googleapis.com/${ver}/models/${targetModel}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          console.log(`[Gemini Fallback Call] Model: ${targetModel} | Ver: ${ver} | Status: ${res.status}`);
          if (res.ok) {
            return {
              ok: true,
              data,
              usedModel: targetModel,
              usedVersion: ver,
              autoSwitched: targetModel !== cleanModel,
              originalModel: cleanModel,
              availableModels: models
            };
          }
          if (data.error?.message) {
            lastError = data.error.message;
          }
        } catch (e) {
          lastError = e.message;
        }
      }
    }

    return {
      ok: false,
      status: 400,
      message: `Gagal memanggil model. Model tersedia di akun Anda: ${models.slice(0, 8).join(', ')}. Detail error: ${lastError}`,
      availableModels: models
    };
  }

  return {
    ok: false,
    status: 404,
    message: `Model '${cleanModel}' tidak ditemukan. Detail error: ${lastError || 'Pastikan API Key valid dan telah memiliki izin Google Generative Language API di Google AI Studio.'}`
  };
}

app.post('/api/ai/models', async (req, res) => {
  let { provider, apiKey } = req.body;
  if (!apiKey) {
    const dbRes = await pool.query("SELECT value FROM public.system_settings WHERE key = 'ai_aksara_config'");
    apiKey = dbRes.rows[0]?.value?.apiKey || '';
  }
  if (!apiKey && provider !== 'custom') {
    return res.status(400).json({ error: 'API Key belum diisi' });
  }

  try {
    if (provider === 'gemini') {
      const { models } = await fetchAvailableGeminiModels(apiKey);
      return res.json({ models: models.length > 0 ? models : ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro'] });
    } else if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (r.ok) {
        const d = await r.json();
        const models = (d.data || [])
          .filter(m => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
          .map(m => m.id)
          .slice(0, 10);
        return res.json({ models });
      }
      return res.json({ models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o3-mini'] });
    } else if (provider === 'deepseek') {
      return res.json({ models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'] });
    } else {
      return res.json({ models: ['custom-model'] });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/test', async (req, res) => {
  const { provider, apiKey, model, endpointUrl } = req.body;
  if (!apiKey && provider !== 'custom') {
    return res.status(400).json({ success: false, message: 'API Token belum diisi' });
  }

  try {
    if (provider === 'gemini') {
      const payload = {
        contents: [{ parts: [{ text: 'Halo Aksara, tes koneksi 1 kata saja: Siap' }] }]
      };
      const result = await callGeminiGenerate(apiKey, model, payload);
      if (!result.ok) {
        return res.status(result.status || 400).json({
          success: false,
          message: result.message || 'Gagal tersambung ke Google Gemini API',
          availableModels: result.availableModels
        });
      }

      const reply = result.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Terkoneksi';
      let msg = `Berhasil tersambung ke Gemini (${result.usedModel}): ${reply.trim()}`;
      if (result.autoSwitched) {
        msg = `Berhasil tersambung ke Gemini via model (${result.usedModel})! Model otomatis disesuaikan & disimpan.`;
      }

      // Automatically persist verified config to database so it is instantly live
      try {
        const autoCfg = {
          provider: 'gemini',
          apiKey,
          model: result.usedModel,
          isActive: true,
          temperature: 0.7,
          maxTokens: 1024,
          systemPrompt: 'Kamu adalah Aksara, asisten AI interaktif dan ramah untuk transparansi anggaran pendidikan APBN Indonesia 2026. Kamu membantu masyarakat menelusuri ke mana uang APBN pendidikan mengalir secara transparan, berbasis data resmi, akurat, dan mudah dipahami.'
        };
        await pool.query(
          `INSERT INTO public.system_settings (key, value, updated_at)
           VALUES ('ai_aksara_config', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
          [JSON.stringify(autoCfg)]
        );
        console.log('[AI Test] Auto-saved verified config to database for model:', result.usedModel);
      } catch (eDb) {
        console.error('[AI Test] Auto-save error:', eDb.message);
      }

      return res.json({
        success: true,
        message: msg,
        usedModel: result.usedModel,
        autoSwitched: result.autoSwitched || false,
        availableModels: result.availableModels
      });
    } else if (provider === 'openai' || provider === 'deepseek') {
      const endpoint = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const m = model || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: 'user', content: 'Tes koneksi 1 kata saja: Siap' }],
          max_tokens: 10
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ success: false, message: data.error?.message || `Gagal tersambung ke ${provider.toUpperCase()} API` });
      }

      // Automatically persist verified config
      try {
        const autoCfg = {
          provider,
          apiKey,
          model: m,
          isActive: true,
          temperature: 0.7,
          maxTokens: 1024,
          systemPrompt: 'Kamu adalah Aksara, asisten AI interaktif dan ramah untuk transparansi anggaran pendidikan APBN Indonesia 2026.'
        };
        await pool.query(
          `INSERT INTO public.system_settings (key, value, updated_at)
           VALUES ('ai_aksara_config', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
          [JSON.stringify(autoCfg)]
        );
      } catch (eDb) {}
      return res.json({ success: true, message: `Berhasil tersambung ke ${provider.toUpperCase()} (${m})`, usedModel: m });
    } else {
      return res.json({ success: true, message: 'Konfigurasi tersimpan' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Koneksi error: ' + err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const configRes = await pool.query("SELECT value FROM public.system_settings WHERE key = 'ai_aksara_config'");
    const config = configRes.rows[0]?.value || {};
    const { provider = 'gemini', apiKey = '', model = 'gemini-1.5-flash', systemPrompt, isActive = true } = config;

    const contextData = `
KONTEKS DATA RESMI DATABASE NASIONAL 2026:
- Total alokasi mandatory APBN Pendidikan 2026: Rp757,8 Triliun (20% APBN).
- Total Satuan Pendidikan terdaftar: 468.483 sekolah di 38 provinsi se-Indonesia.
- Rincian jenjang nasional: PAUD (~180rb), SD (~148rb), SMP (~43rb), SMA/SMK (~35rb), Perguruan Tinggi (~5rb).
- Dana BOS Reguler: Rp900.000 - Rp1.960.000 per siswa/tahun, ditransfer langsung dari kas negara ke rekening sekolah tanpa potongan.
- Program Indonesia Pintar (PIP): 18,6 juta siswa SD-SMA. KIP Kuliah: ~985 ribu mahasiswa aktif.
- 5 Provinsi Sekolah Terbanyak: Jawa Timur (86.305), Jawa Tengah (57.057), Jawa Barat (33.686), Sumatera Utara (25.267), Sulawesi Selatan (19.233).
- Data resmi tersinkronisasi langsung dengan database lokal.
    `.trim();

    const fullPrompt = `${systemPrompt || 'Kamu adalah Aksara, asisten AI interaktif pemantauan APBN Pendidikan 2026 yang ramah dan faktual.'}\n\n${contextData}\n\nPertanyaan: ${message}`;

    if (isActive && apiKey && provider === 'gemini') {
      const contents = [];
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: fullPrompt }]
      });

      const payload = {
        contents,
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 1024
        }
      };

      const result = await callGeminiGenerate(apiKey, model, payload);
      if (result.ok) {
        const reply = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          // If autoSwitched, asynchronously update system_settings with the working model
          if (result.autoSwitched && result.usedModel) {
            config.model = result.usedModel;
            pool.query("UPDATE public.system_settings SET value = $1, updated_at = NOW() WHERE key = 'ai_aksara_config'", [JSON.stringify(config)]).catch(console.error);
          }
          return res.json({ reply, provider: 'gemini', model: result.usedModel });
        }
      }
    } else if (isActive && apiKey && (provider === 'openai' || provider === 'deepseek')) {
      const endpoint = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const m = model || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');
      const messages = [{ role: 'system', content: `${systemPrompt || ''}\n\n${contextData}` }];
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => messages.push({ role: h.role, content: h.content }));
      }
      messages.push({ role: 'user', content: message });

      const aiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: m,
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1024
        })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const reply = aiData.choices?.[0]?.message?.content;
        if (reply) {
          return res.json({ reply, provider, model: m });
        }
      }
    }

    return res.json({
      reply: null,
      fallback: true,
      hasKey: Boolean(apiKey),
      message: 'Token API belum aktif atau belum dikonfigurasi di Admin Dashboard (http://localhost:2026/ai-settings).'
    });
  } catch (err) {
    console.error('[AI Chat Error]:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// RPC (Remote Procedure Call) emulation
// ─────────────────────────────────────────────────────────
app.post('/rest/v1/rpc/:function', async (req, res) => {
  const func = req.params.function;
  const body = req.body;
  // console.log(`[Proxy RPC] Called ${func} with body:`, body);

  try {
    if (func === 'get_national_school_stats') {
      const queryText = `
        SELECT
          CASE
            WHEN name ILIKE '%universitas%' OR name ILIKE '%institut%' OR name ILIKE '%politeknik%' OR name ILIKE '%akademi%' OR name ILIKE '%sekolah tinggi%' THEN 'Universitas'
            WHEN name ILIKE '%sma%' OR name ILIKE '%sman%' OR name ILIKE '%smas%' OR name ILIKE '%smk%' OR name ILIKE '%smkn%' OR name ILIKE '%smks%' OR name ILIKE '%ma%' OR name ILIKE '%man%' OR name ILIKE '%mas%' THEN 'SMA'
            WHEN name ILIKE '%smp%' OR name ILIKE '%smpn%' OR name ILIKE '%smps%' OR name ILIKE '%mts%' OR name ILIKE '%mtsn%' OR name ILIKE '%mtss%' THEN 'SMP'
            WHEN name ILIKE '%sd%' OR name ILIKE '%sdn%' OR name ILIKE '%sds%' OR name ILIKE '%mi%' OR name ILIKE '%min%' OR name ILIKE '%mis%' THEN 'SD'
            WHEN name ILIKE '%paud%' OR name ILIKE '%tk%' OR name ILIKE '%kb%' OR name ILIKE '%tpa%' OR name ILIKE '%sps%' THEN 'PAUD'
            ELSE 'Lainnya'
          END as jenjang,
          COUNT(*) as school_count
        FROM public.schools
        GROUP BY jenjang;
      `;
      const dbRes = await pool.query(queryText);
      return res.json(dbRes.rows);
    }

    else if (func === 'get_national_statistics') {
      const [schoolCountRes, totalReceivedRes, totalSpentRes, txCountRes, reportCountRes, categoryRes, monthlyRes, topSchoolsRes] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM public.schools'),
        pool.query('SELECT COALESCE(SUM(amount),0) as sum FROM public.incoming_funds'),
        pool.query('SELECT COALESCE(SUM(amount),0) as sum FROM public.transactions'),
        pool.query('SELECT COUNT(*) as count FROM public.transactions'),
        pool.query('SELECT COUNT(*) as count FROM public.reports'),
        pool.query('SELECT category, SUM(amount) as amount FROM public.transactions GROUP BY category'),
        pool.query("SELECT to_char(date, 'YYYY-MM') as month, SUM(amount) as amount FROM public.transactions GROUP BY month ORDER BY month"),
        pool.query(`
          SELECT s.id, s.name, s.npsn, s.location, s.accreditation,
            COALESCE(sums.total_received, 0) as total_received,
            COALESCE(top_tx.total_spent, 0) as total_spent
          FROM (
            SELECT school_id, SUM(amount) as total_spent 
            FROM public.transactions 
            GROUP BY school_id 
            ORDER BY total_spent DESC 
            LIMIT 10
          ) top_tx
          JOIN public.schools s ON s.id = top_tx.school_id
          LEFT JOIN (
            SELECT school_id, SUM(amount) as total_received 
            FROM public.incoming_funds 
            GROUP BY school_id
          ) sums ON sums.school_id = top_tx.school_id
          ORDER BY total_spent DESC
        `)
      ]);

      return res.json([{
        school_count: Number(schoolCountRes.rows[0].count),
        total_received: Number(totalReceivedRes.rows[0].sum),
        total_spent: Number(totalSpentRes.rows[0].sum),
        transaction_count: Number(txCountRes.rows[0].count),
        report_count: Number(reportCountRes.rows[0].count),
        category_breakdown: categoryRes.rows.map(r => ({ category: r.category, amount: Number(r.amount) })),
        monthly_expenses: monthlyRes.rows.map(r => ({ month: r.month, amount: Number(r.amount) })),
        top_schools: topSchoolsRes.rows.map(r => ({ ...r, total_received: Number(r.total_received), total_spent: Number(r.total_spent) }))
      }]);
    }

    else if (func === 'get_unique_kecamatans_by_province') {
      const p_province_id = body.p_province_id;
      if (!p_province_id) return res.status(400).json({ error: 'p_province_id required' });
      const dbRes = await pool.query(
        'SELECT location FROM public.schools WHERE regency_id IN (SELECT id FROM public.regencies WHERE province_id = $1)',
        [p_province_id]
      );
      const uniqueKecs = new Set();
      dbRes.rows.forEach(r => {
        const match = (r.location || '').match(/.*Kec(?:amatan|\.)?\s+([A-Za-z0-9\s]+?)(?:,|$)/i);
        if (match) {
          const k = match[1].trim();
          if (k && !k.toLowerCase().includes('kabupaten') && !k.toLowerCase().includes('kota') && !k.toLowerCase().includes('provinsi')) {
            uniqueKecs.add(k);
          }
        }
      });
      return res.json(Array.from(uniqueKecs).sort().map(k => ({ kec_name: k })));
    }

    else if (func === 'get_regency_school_counts') {
      const p_province_id = body.p_province_id;
      if (!p_province_id) return res.status(400).json({ error: 'p_province_id required' });
      const dbRes = await pool.query(
        `SELECT regency_id, COUNT(*)::integer as count 
         FROM public.schools 
         WHERE regency_id IN (SELECT id FROM public.regencies WHERE province_id = $1) 
         GROUP BY regency_id`,
        [p_province_id]
      );
      return res.json(dbRes.rows);
    }

    else if (func === 'get_jenjang_summary') {
      const p_jenjang = body.p_jenjang || 'PAUD';
      const dbRes = await pool.query(`
        SELECT 
          COUNT(*)::integer as count,
          COALESCE(SUM(CAST(nominal_alokasi AS NUMERIC)), 0) as total_nominal,
          COALESCE(SUM(CAST(realisasi_total AS NUMERIC)), 0) as total_realisasi
        FROM public.institusi_pendidikan
        WHERE jenjang = $1
      `, [p_jenjang]);
      return res.json(dbRes.rows);
    }

    // ── get_all_province_stats: aggregate directly from province_school_stats ──
    else if (func === 'get_all_province_stats') {
      const dbRes = await pool.query(`
        SELECT
          province_id,
          province_code,
          province_name,
          total_schools::integer,
          paud::integer,
          sd::integer,
          smp::integer,
          sma::integer,
          univ::integer
        FROM public.province_school_stats
        ORDER BY province_name
      `);
      return res.json(dbRes.rows);
    }

    return res.status(404).json({ error: `RPC function ${func} not supported` });
  } catch (err) {
    console.error(`[Proxy RPC Error] ${func}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// Helper: parse PostgREST filter query params into SQL
// ─────────────────────────────────────────────────────────
function parseFilters(queryParams) {
  const whereClauses = [];
  const values = [];
  let idx = 1;
  const skip = new Set(['select', 'order', 'limit', 'offset', 'or']);

  for (const [key, rawVal] of Object.entries(queryParams)) {
    if (skip.has(key)) continue;
    const vals = Array.isArray(rawVal) ? rawVal : [rawVal];

    for (const val of vals) {
      if (typeof val !== 'string') continue;

      if (val.startsWith('eq.')) {
        let v = val.slice(3).replace(/^["']|["']$/g, '');
        if (v === 'null') { whereClauses.push(`"${key}" IS NULL`); }
        else { whereClauses.push(`"${key}" = $${idx++}`); values.push(v); }
      } else if (val.startsWith('neq.')) {
        let v = val.slice(4).replace(/^["']|["']$/g, '');
        whereClauses.push(`"${key}" != $${idx++}`); values.push(v);
      } else if (val.startsWith('gte.')) {
        whereClauses.push(`"${key}" >= $${idx++}`); values.push(val.slice(4));
      } else if (val.startsWith('lte.')) {
        whereClauses.push(`"${key}" <= $${idx++}`); values.push(val.slice(4));
      } else if (val.startsWith('gt.')) {
        whereClauses.push(`"${key}" > $${idx++}`); values.push(val.slice(3));
      } else if (val.startsWith('lt.')) {
        whereClauses.push(`"${key}" < $${idx++}`); values.push(val.slice(3));
      } else if (val.startsWith('ilike.')) {
        let v = val.slice(6).replace(/\*/g, '%').replace(/^["']|["']$/g, '');
        if (!v.includes('%')) v = `%${v}%`;
        whereClauses.push(`"${key}" ILIKE $${idx++}`);
        values.push(v);
      } else if (val.startsWith('like.')) {
        let v = val.slice(5).replace(/\*/g, '%').replace(/^["']|["']$/g, '');
        if (!v.includes('%')) v = `%${v}%`;
        whereClauses.push(`"${key}" LIKE $${idx++}`);
        values.push(v);
      } else if (val.startsWith('in.')) {
        const list = val.slice(4, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        const placeholders = list.map(() => `$${idx++}`);
        whereClauses.push(`"${key}" IN (${placeholders.join(',')})`);
        values.push(...list);
      } else if (val === 'is.null') {
        whereClauses.push(`"${key}" IS NULL`);
      } else if (val === 'is.true') {
        whereClauses.push(`"${key}" = true`);
      } else if (val === 'is.false') {
        whereClauses.push(`"${key}" = false`);
      }
    }
  }

  // Handle `or=` filter: e.g. or=(name.ilike.%foo%,npsn.ilike.%foo%) or or=(name.ilike.*foo*,npsn.ilike.*foo*)
  if (queryParams.or) {
    const orStr = queryParams.or.replace(/^\(|\)$/g, '');
    const orClauses = orStr.split(',').map(part => {
      const dotIdx = part.indexOf('.');
      if (dotIdx === -1) return null;
      const col = part.substring(0, dotIdx);
      const rest = part.substring(dotIdx + 1);
      if (rest.startsWith('ilike.')) {
        let v = rest.slice(6).replace(/\*/g, '%').replace(/^["']|["']$/g, '');
        if (!v.includes('%')) v = `%${v}%`;
        values.push(v);
        return `"${col}" ILIKE $${idx++}`;
      } else if (rest.startsWith('eq.')) {
        let v = rest.slice(3).replace(/^["']|["']$/g, '');
        values.push(v);
        return `"${col}" = $${idx++}`;
      } else if (rest.startsWith('like.')) {
        let v = rest.slice(5).replace(/\*/g, '%').replace(/^["']|["']$/g, '');
        if (!v.includes('%')) v = `%${v}%`;
        values.push(v);
        return `"${col}" LIKE $${idx++}`;
      }
      return null;
    }).filter(Boolean);
    if (orClauses.length) whereClauses.push(`(${orClauses.join(' OR ')})`);
  }

  return { whereClauses, values };
}

// ─────────────────────────────────────────────────────────
// Helper: build base SELECT SQL for a table (with joins)
// ─────────────────────────────────────────────────────────
function buildBaseQuery(table, selectParam) {
  const wantsItems = selectParam.includes('transaction_items');

  if (table === 'schools') {
    return `
      SELECT s.*,
        (SELECT json_build_object('name', r.name)
         FROM regencies r WHERE r.id = s.regency_id) as regencies
      FROM schools s
    `;
  } else if (table === 'transactions') {
    return `
      SELECT t.*,
        (SELECT json_build_object('name', s.name, 'npsn', s.npsn)
         FROM schools s WHERE s.id = t.school_id) as schools${wantsItems ? `,
        COALESCE(
          (SELECT json_agg(ti.* ORDER BY ti.created_at)
           FROM transaction_items ti WHERE ti.transaction_id = t.id),
          '[]'::json
        ) as transaction_items` : ''}
      FROM transactions t
    `;
  } else if (table === 'school_comments') {
    return `
      SELECT sc.*,
        (SELECT json_build_object('name', s.name)
         FROM schools s WHERE s.npsn = sc.npsn) as schools
      FROM school_comments sc
    `;
  } else if (table === 'alokasi_provinsi') {
    return `
      SELECT ap.*,
        COALESCE(
          (SELECT ta.tahun FROM tahun_anggaran ta WHERE ta.id = ap.tahun_anggaran_id LIMIT 1),
          NULLIF(regexp_replace(ap.tahun_anggaran_id, '^ta-', ''), '')::integer
        ) as tahun,
        (SELECT json_build_object('id', p.id, 'kode_provinsi', p.kode_provinsi, 'nama_provinsi', p.nama_provinsi)
         FROM provinsi p WHERE p.id = ap.provinsi_id) as provinsi
      FROM alokasi_provinsi ap
    `;
  } else if (table === 'alokasi_kabupaten_kota') {
    return `
      SELECT akk.*,
        (SELECT ta.tahun FROM alokasi_provinsi ap JOIN tahun_anggaran ta ON ta.id = ap.tahun_anggaran_id WHERE ap.id = akk.alokasi_provinsi_id LIMIT 1) as tahun,
        (SELECT json_build_object('id', kk.id, 'provinsi_id', kk.provinsi_id, 'kode_kabupaten_kota', kk.kode_kabupaten_kota, 'nama_kabupaten_kota', kk.nama_kabupaten_kota, 'tipe', kk.tipe)
         FROM kabupaten_kota kk WHERE kk.id = akk.kabupaten_kota_id) as kabupaten_kota
      FROM alokasi_kabupaten_kota akk
    `;
  } else if (table === 'mv_province_school_stats') {
    return `
      SELECT r.province_id,
        CASE
          WHEN s.name ~* '\\y(UNIVERSITAS|INSTITUT|POLITEKNIK|AKADEMI|SEKOLAH TINGGI|STIE|STIKES|STKIP|STMIK|STIMIK)\\y' THEN 'UNIVERSITAS'
          WHEN s.name ~* '\\y(SMA|SMK|SMAN|SMKN|MA|MAN|MAS|SMAS|SMKS|SMAIT|SLB|ALIYAH|KEJURUAN)\\y' OR s.name ILIKE '%SEKOLAH MENENGAH ATAS%' OR s.name ILIKE '%SEKOLAH MENENGAH KEJURUAN%' THEN 'SMA'
          WHEN s.name ~* '\\y(SMP|SMPN|SMPS|MTS|MTSN|MTSS|SMPIT|TSANAWIYAH)\\y' OR s.name ILIKE '%SEKOLAH MENENGAH PERTAMA%' THEN 'SMP'
          WHEN s.name ~* '\\y(SD|SDN|SDS|MI|MIN|MIS|SDIT|IBTIDAIYAH)\\y' OR s.name ILIKE '%SEKOLAH DASAR%' THEN 'SD'
          ELSE 'PAUD'
        END as jenjang,
        COUNT(*)::integer as school_count
      FROM public.schools s
      JOIN public.regencies r ON s.regency_id = r.id
      GROUP BY r.province_id, jenjang
    `;

  } else if (table === 'audit_anomaly') {
    return `
      SELECT a.*,
        (SELECT json_build_object('nama_institusi', ip.nama_institusi, 'npsn', ip.npsn)
         FROM institusi_pendidikan ip WHERE ip.id = a.institusi_id) as institusi_pendidikan
      FROM audit_anomaly a
    `;
  }

  return `SELECT * FROM "${table}"`;
}

// ─────────────────────────────────────────────────────────
// Tables that don't exist — return empty gracefully
// ─────────────────────────────────────────────────────────
const MISSING_TABLES = new Set([
  'notifications', 'projects', 'project_photos', 'project_expenses',
  'project_vendors', 'rencana_anggaran'
]);

// ─────────────────────────────────────────────────────────
// Main REST router
// ─────────────────────────────────────────────────────────
app.all('/rest/v1/:table', async (req, res) => {
  const table = req.params.table;
  const method = req.method;
  const q = req.query;

  try {
    // ── GET / HEAD ────────────────────────────────────────
    if (method === 'GET' || method === 'HEAD') {
      if (MISSING_TABLES.has(table)) {
        res.setHeader('Content-Range', '0-0/0');
        if (method === 'HEAD') return res.status(200).end();
        return res.json([]);
      }

      const selectParam = q.select || '*';
      const { whereClauses, values } = parseFilters(q);
      const baseQuery = buildBaseQuery(table, selectParam);

      // Wrap filters as subquery
      let sql = whereClauses.length > 0
        ? `SELECT * FROM (${baseQuery}) as _t WHERE ${whereClauses.join(' AND ')}`
        : baseQuery;

      // ORDER BY — handle multi-column: order=date.desc,created_at.desc
      if (q.order) {
        const parts = q.order.split(',').map(o => {
          const segments = o.split('.');
          const col = segments[0];
          const dir = segments[1] && segments[1].toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          const nulls = segments[2] ? ` NULLS ${segments[2].toUpperCase()}` : '';
          return `"${col}" ${dir}${nulls}`;
        });
        sql += ` ORDER BY ${parts.join(', ')}`;
      }

      // COUNT for Content-Range
      const isHeadOrCount = method === 'HEAD' || (req.get('Prefer') || '').includes('count=exact');
      let total = null;
      if (isHeadOrCount) {
        const countSql = `SELECT COUNT(*) FROM (${baseQuery}) as _c ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;
        try {
          const countRes = await pool.query(countSql, values);
          total = parseInt(countRes.rows[0].count, 10);
        } catch { total = 0; }
        if (method === 'HEAD') {
          res.setHeader('Content-Range', `0-${total > 0 ? total - 1 : 0}/${total}`);
          return res.status(200).end();
        }
      }

      // LIMIT & OFFSET
      let offset = q.offset ? parseInt(q.offset) : 0;
      let limit = q.limit ? parseInt(q.limit) : null;
      const rangeHeader = req.get('Range');
      if (rangeHeader && rangeHeader.startsWith('items=')) {
        const m = rangeHeader.match(/items=(\d+)-(\d+)/);
        if (m) { offset = parseInt(m[1]); limit = parseInt(m[2]) - offset + 1; }
      }
      if (limit !== null) sql += ` LIMIT ${limit} OFFSET ${offset}`;

      // console.log(`[Proxy SQL] ${sql.replace(/\s+/g, ' ').trim()} | Values:`, values);
      const dbRes = await pool.query(sql, values);

      const totalRows = total !== null ? total : '*';
      const from = offset;
      const to = offset + dbRes.rows.length - 1;
      res.setHeader('Content-Range', `${from}-${to >= from ? to : from}/${totalRows}`);

      // maybeSingle / single detection via Accept header
      const acceptHeader = req.get('Accept') || '';
      const isSingle = acceptHeader.includes('application/vnd.pgrst.object+json');
      if (isSingle) {
        if (dbRes.rows.length === 0) {
          return res.status(406).json({ code: 'PGRST116', message: 'No rows returned', hint: null });
        }
        return res.json(dbRes.rows[0]);
      }

      // maybeSingle returns null instead of [] when 0 rows and limit=1
      if (limit === 1 && dbRes.rows.length === 0) {
        return res.json(null);
      }

      return res.json(dbRes.rows);
    }

    // ── POST (INSERT) ─────────────────────────────────────
    if (method === 'POST') {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      if (items.length === 0) return res.json([]);

      const columns = Object.keys(items[0]);
      const vals = [];
      let idx = 1;
      const rowPlaceholders = items.map(item => {
        const ph = columns.map(() => `$${idx++}`);
        columns.forEach(col => vals.push(item[col]));
        return `(${ph.join(', ')})`;
      });

      // Conflict resolution per table
      let onConflict = 'ON CONFLICT DO NOTHING';
      if (table === 'tahun_anggaran') onConflict = 'ON CONFLICT (tahun) DO UPDATE SET total_anggaran = EXCLUDED.total_anggaran, status = EXCLUDED.status';
      else if (table === 'provinsi') onConflict = 'ON CONFLICT (id) DO UPDATE SET kode_provinsi = EXCLUDED.kode_provinsi, nama_provinsi = EXCLUDED.nama_provinsi';
      else if (table === 'alokasi_provinsi') onConflict = 'ON CONFLICT (id) DO UPDATE SET nominal_alokasi = EXCLUDED.nominal_alokasi, realisasi_total = EXCLUDED.realisasi_total, selisih = EXCLUDED.selisih, persentase_penyerapan = EXCLUDED.persentase_penyerapan, updated_at = EXCLUDED.updated_at';
      else if (table === 'kabupaten_kota') onConflict = 'ON CONFLICT (id) DO UPDATE SET kode_kabupaten_kota = EXCLUDED.kode_kabupaten_kota, nama_kabupaten_kota = EXCLUDED.nama_kabupaten_kota, tipe = EXCLUDED.tipe';
      else if (table === 'alokasi_kabupaten_kota') onConflict = 'ON CONFLICT (id) DO UPDATE SET nominal_alokasi = EXCLUDED.nominal_alokasi, realisasi_total = EXCLUDED.realisasi_total, selisih = EXCLUDED.selisih, persentase_penyerapan = EXCLUDED.persentase_penyerapan, updated_at = EXCLUDED.updated_at';
      else if (table === 'institusi_pendidikan') onConflict = 'ON CONFLICT (npsn) DO NOTHING';
      else if (table === 'users') onConflict = 'ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, role = EXCLUDED.role, is_active = EXCLUDED.is_active';
      else if (table === 'audit_anomaly') onConflict = 'ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, nominal_selisih = EXCLUDED.nominal_selisih, tingkat_keparahan = EXCLUDED.tingkat_keparahan';
      else if (table === 'school_likes') onConflict = 'ON CONFLICT (npsn, device_id) DO NOTHING';
      else if (table === 'schools') onConflict = 'ON CONFLICT (npsn) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, accreditation = EXCLUDED.accreditation';
      // APBD tables — full upsert (merge-duplicates) required by supabase-js client
      else if (table === 'apbd_provinsi') onConflict = 'ON CONFLICT (id) DO UPDATE SET total_apbd = EXCLUDED.total_apbd, alokasi_pendidikan_riil = EXCLUDED.alokasi_pendidikan_riil, realisasi_pendidikan_total = COALESCE(EXCLUDED.realisasi_pendidikan_total, apbd_provinsi.realisasi_pendidikan_total), status_kepatuhan = EXCLUDED.status_kepatuhan, status_anggaran = EXCLUDED.status_anggaran, diinput_oleh = EXCLUDED.diinput_oleh, catatan = EXCLUDED.catatan, updated_at = EXCLUDED.updated_at';
      else if (table === 'apbd_pendidikan_breakdown') onConflict = 'ON CONFLICT (id) DO UPDATE SET nominal_alokasi = EXCLUDED.nominal_alokasi, realisasi_total = EXCLUDED.realisasi_total, updated_at = EXCLUDED.updated_at';
      else if (table === 'apbd_input_log') onConflict = 'ON CONFLICT (id) DO NOTHING';
      else if (table === 'apbd_yearly_data') onConflict = 'ON CONFLICT (id) DO UPDATE SET total_budget = EXCLUDED.total_budget, allocated_amount = EXCLUDED.allocated_amount, disbursed_amount = EXCLUDED.disbursed_amount, remaining_amount = EXCLUDED.remaining_amount, updated_at = EXCLUDED.updated_at';
      else if (table === 'system_settings') onConflict = 'ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at';

      const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${rowPlaceholders.join(', ')} ${onConflict} RETURNING *`;
      // console.log(`[Proxy SQL] Insert into ${table} with ${items.length} row(s)`);
      const dbRes = await pool.query(sql, vals);

      const acceptHeader = req.get('Accept') || '';
      if (acceptHeader.includes('application/vnd.pgrst.object+json')) {
        return res.status(201).json(dbRes.rows[0] || null);
      }
      return res.status(201).json(dbRes.rows);
    }

    // ── PATCH (UPDATE) ────────────────────────────────────
    if (method === 'PATCH') {
      const { whereClauses, values } = parseFilters(q);
      if (whereClauses.length === 0) return res.status(400).json({ error: 'PATCH requires filter params' });

      let idx = values.length + 1;
      const setClauses = Object.entries(req.body).map(([k, v]) => {
        values.push(v);
        return `"${k}" = $${idx++}`;
      });

      const sql = `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
      // console.log(`[Proxy SQL] ${sql} | Values:`, values);
      const dbRes = await pool.query(sql, values);
      return res.json(dbRes.rows);
    }

    // ── DELETE ────────────────────────────────────────────
    if (method === 'DELETE') {
      const { whereClauses, values } = parseFilters(q);
      if (whereClauses.length === 0) return res.status(400).json({ error: 'DELETE requires filter params' });

      const sql = `DELETE FROM "${table}" WHERE ${whereClauses.join(' AND ')} RETURNING *`;
      // console.log(`[Proxy SQL] ${sql} | Values:`, values);
      const dbRes = await pool.query(sql, values);
      return res.json(dbRes.rows);
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });

  } catch (err) {
    console.error(`[Proxy Error] ${method} on ${table}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// Realtime WebSocket stub (prevents 404 errors in browser)
// ─────────────────────────────────────────────────────────
app.get('/realtime/v1/websocket', (req, res) => {
  // Return 426 Upgrade Required - browser will handle this gracefully
  res.status(426).json({ message: 'Realtime not available in local proxy mode' });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', db: process.env.DATABASE_URL || 'postgresql://localhost:2027' }));

app.listen(port, () => {
  console.log(`[Proxy] Supabase REST API emulator listening on port ${port}`);
});
