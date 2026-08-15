const http = require('http');

async function queryTable(table) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(`http://localhost:2026/rest/v1/${table}?select=*&order=year.asc`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Table ${table.padEnd(20)} -> Status ${res.statusCode} (${Date.now() - start}ms)`);
        resolve();
      });
    }).on('error', (e) => {
      console.log(`Table ${table} -> ERROR ${e.message}`);
      resolve();
    });
  });
}

async function run() {
  await queryTable('apbn_yearly_data');
  await queryTable('apbd_yearly_data');
  await queryTable('csr_yearly_data');
}

run();
