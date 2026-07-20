const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 2025, database: 'postgres', user: 'postgres' });
c.connect()
  .then(() => c.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"))
  .then(r => { console.log('Databases:\n' + r.rows.map(x => x.datname).join('\n')); c.end(); })
  .catch(e => console.log('ERR:', e.message));
