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
      rest: '/rest/v1/:table'
    }
  });
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

    // ── get_all_province_stats: aggregate directly from institusi_pendidikan ──
    else if (func === 'get_all_province_stats') {
      const dbRes = await pool.query(`
        SELECT
          p.id          AS province_id,
          p.kode_provinsi AS province_code,
          p.nama_provinsi AS province_name,
          COUNT(ip.id)::integer AS total_schools,
          COALESCE(SUM(CASE WHEN ip.jenjang = 'PAUD'        THEN 1 ELSE 0 END),0)::integer AS paud,
          COALESCE(SUM(CASE WHEN ip.jenjang = 'SD'          THEN 1 ELSE 0 END),0)::integer AS sd,
          COALESCE(SUM(CASE WHEN ip.jenjang = 'SMP'         THEN 1 ELSE 0 END),0)::integer AS smp,
          COALESCE(SUM(CASE WHEN ip.jenjang = 'SMA'         THEN 1 ELSE 0 END),0)::integer AS sma,
          COALESCE(SUM(CASE WHEN ip.jenjang = 'UNIVERSITAS' THEN 1 ELSE 0 END),0)::integer AS univ
        FROM public.provinsi p
        LEFT JOIN public.institusi_pendidikan ip ON ip.provinsi_id = p.id
        GROUP BY p.id, p.kode_provinsi, p.nama_provinsi
        ORDER BY p.nama_provinsi
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
        (SELECT json_build_object('id', p.id, 'kode_provinsi', p.kode_provinsi, 'nama_provinsi', p.nama_provinsi)
         FROM provinsi p WHERE p.id = ap.provinsi_id) as provinsi
      FROM alokasi_provinsi ap
    `;
  } else if (table === 'alokasi_kabupaten_kota') {
    return `
      SELECT akk.*,
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
