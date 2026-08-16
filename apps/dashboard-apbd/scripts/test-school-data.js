const { createClient } = require('@supabase/supabase-js');
const s = createClient('http://localhost:2026', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE');

async function testSchoolData() {
  // Check schools table
  const { data: sData } = await s.from('schools').select('*').eq('npsn', '024029').maybeSingle();
  console.log('schools table:', sData);

  // Check institusi_pendidikan table
  const { data: iData } = await s.from('institusi_pendidikan').select('*').eq('npsn', '024029').maybeSingle();
  console.log('institusi_pendidikan table:', iData);

  // Check transactions for school id
  if (sData || iData) {
    const id = sData?.id || iData?.id;
    const { data: tx } = await s.from('transactions').select('*, transaction_items(*)').eq('school_id', id);
    console.log('transactions table:', tx?.length, tx);

    const { data: inc } = await s.from('incoming_funds').select('*').eq('school_id', id);
    console.log('incoming_funds table:', inc?.length, inc);

    const { data: sd } = await s.from('sumber_dana_institusi').select('*').eq('institusi_id', id);
    console.log('sumber_dana_institusi table:', sd?.length, sd);

    const { data: rp } = await s.from('rincian_pengeluaran_item').select('*').eq('institusi_id', id);
    console.log('rincian_pengeluaran_item table:', rp?.length, rp);
  }
}

testSchoolData();
