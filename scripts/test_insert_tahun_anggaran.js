const http = require('http');

async function testInsert() {
  const payload = JSON.stringify({
    tahun: 2027,
    total_anggaran: 820900000000000,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
  });

  const req = http.request('http://localhost:2026/rest/v1/tahun_anggaran', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Body:', b);
    });
  });

  req.write(payload);
  req.end();
}

testInsert();
