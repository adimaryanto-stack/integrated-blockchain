const http = require('http');

async function testCases() {
  const tests = [
    'http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&or=(nama_institusi.ilike.*69893669*,npsn.ilike.*69893669*)',
    'http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&or=(nama_institusi.ilike.%2569893669%25,npsn.ilike.%2569893669%25)',
    'http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&or=(nama_institusi.ilike.%22%2569893669%25%22,npsn.ilike.%22%2569893669%25%22)',
    'http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&npsn=eq.69893669',
    'http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&or=(nama_institusi.ilike.*AL-IKHLAS*,npsn.ilike.*AL-IKHLAS*)'
  ];

  for (const t of tests) {
    await new Promise(r => {
      http.get(t, res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          console.log('\nURL:', t);
          console.log('Status:', res.statusCode, 'Data count:', JSON.parse(b).length);
          r();
        });
      });
    });
  }
}

testCases();
