const { createClient } = require('@supabase/supabase-js');

async function testSupabaseOr() {
  const supabase = createClient('http://localhost:2028', 'anon-key-davinci-2026');

  console.log('Testing Supabase query for PAUD NPSN 69893669...\n');

  // Test 1: with or
  const { data: d1, error: e1 } = await supabase
    .from('institusi_pendidikan')
    .select('*')
    .eq('jenjang', 'PAUD')
    .or('nama_institusi.ilike.%69893669%,npsn.ilike.%69893669%');

  console.log('Test 1 (or with %):', { error: e1, count: d1?.length, rows: d1 });

  // Test 2: with npsn eq
  const { data: d2, error: e2 } = await supabase
    .from('institusi_pendidikan')
    .select('*')
    .eq('jenjang', 'PAUD')
    .eq('npsn', '69893669');

  console.log('Test 2 (eq npsn):', { error: e2, count: d2?.length, rows: d2 });

  // Test 3: raw query via proxy
  const http = require('http');
  http.get('http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.PAUD&or=(nama_institusi.ilike.*69893669*,npsn.ilike.*69893669*)', (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('Raw HTTP Test with wildcard (*):', res.statusCode, body));
  });
}

testSupabaseOr();
