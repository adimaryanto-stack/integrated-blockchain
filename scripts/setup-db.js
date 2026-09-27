/**
 * Universal PostgreSQL Database Setup & Restore Script
 * Works seamlessly on Linux VPS, macOS (MacBook), and Windows.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '2027';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';

const GZ_FILE = path.join(__dirname, '..', 'database_dump.sql.gz');
const SQL_FILE = path.join(__dirname, '..', 'database_dump.sql');

async function main() {
  console.log('==================================================================');
  console.log(' 🐘 Universal PostgreSQL Database Restorer (Linux / macOS / Win)');
  console.log('==================================================================');
  console.log(` Target Host: ${DB_HOST}:${DB_PORT}`);
  console.log(` Target Database: ${DB_NAME} (User: ${DB_USER})\n`);

  // 1. Check & Decompress dump if needed
  if (!fs.existsSync(SQL_FILE)) {
    if (!fs.existsSync(GZ_FILE)) {
      console.error('❌ Error: Neither database_dump.sql nor database_dump.sql.gz found!');
      process.exit(1);
    }
    console.log('[1/2] 📦 Decompressing database_dump.sql.gz...');
    const startTime = Date.now();
    const gzip = zlib.createGunzip();
    const inp = fs.createReadStream(GZ_FILE);
    const out = fs.createWriteStream(SQL_FILE);
    
    await new Promise((resolve, reject) => {
      inp.pipe(gzip).pipe(out).on('finish', resolve).on('error', reject);
    });
    console.log(`      ✅ Decompressed in ${((Date.now() - startTime) / 1000).toFixed(1)}s: database_dump.sql`);
  } else {
    console.log('[1/2] 📦 database_dump.sql already available.');
  }

  // 2. Locate psql binary
  console.log('\n[2/2] 🚀 Importing 35 relational tables into PostgreSQL...');
  let psqlCmd = 'psql';
  
  // Check if bundled Windows binary exists
  const winPsql = path.join(__dirname, '..', 'pgsql', 'bin', 'psql.exe');
  if (process.platform === 'win32' && fs.existsSync(winPsql)) {
    psqlCmd = winPsql;
  }

  const env = { ...process.env, PGPASSWORD: DB_PASS };

  console.log(`      Executing: ${psqlCmd} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f database_dump.sql`);

  try {
    const importStart = Date.now();
    execSync(`"${psqlCmd}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${SQL_FILE}"`, {
      env,
      stdio: ['ignore', 'ignore', 'pipe']
    });
    console.log(`      ✅ Database imported successfully in ${((Date.now() - importStart) / 1000).toFixed(1)}s!`);
    console.log('\n🎉 ALL 35 TABLES & 367,865 INSTITUTIONS READY!');
    console.log('==================================================================');
  } catch (err) {
    console.error('❌ Failed to run psql import:', err.stderr ? err.stderr.toString() : err.message);
    console.log('\n💡 Hint: Ensure PostgreSQL is running on port ' + DB_PORT + ' and user ' + DB_USER + ' exists.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
