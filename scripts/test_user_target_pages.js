const http = require('http');

const targetRoutes = [
  'http://localhost:2021/dashboard/jenjang/universitas',
  'http://localhost:2022/dashboard/jenjang/universitas',
  'http://localhost:2023/dashboard/jenjang/sma',
  'http://localhost:2024/dashboard/mutasi-rekening',
  'http://localhost:2022/dashboard/jenjang/sma',
  'http://localhost:2023/dashboard/jenjang/universitas',
  'http://localhost:2024/dashboard/jenjang/sma'
];

async function testTarget() {
  console.log('Testing specific requested pages...\n');
  for (const url of targetRoutes) {
    await new Promise((resolve) => {
      const start = Date.now();
      http.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[STATUS ${res.statusCode}] ${url} -> ${Date.now() - start}ms (Length: ${body.length})`);
          resolve();
        });
      }).on('error', (err) => {
        console.log(`[ERROR] ${url} -> ${err.message}`);
        resolve();
      });
    });
  }
}

testTarget();
