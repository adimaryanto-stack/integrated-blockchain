const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 2027, database: 'postgres', user: 'postgres' });
c.connect()
  .then(() => c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"))
  .then(r => { console.log('Tables in public schema:\n' + r.rows.map(x => '- ' + x.table_name).join('\n')); c.end(); })
  .catch(e => console.log('ERR:', e.message));
