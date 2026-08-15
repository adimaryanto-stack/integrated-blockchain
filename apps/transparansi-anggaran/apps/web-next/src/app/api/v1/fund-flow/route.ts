import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const targetYear = yearParam ? parseInt(yearParam) : 2026;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        // 1. Fetch APBN Data
        const { data: apbn, error: apbnErr } = await supabase
            .from('apbn_yearly_data')
            .select('*')
            .eq('year', targetYear)
            .single();

        if (apbnErr && apbnErr.code !== 'PGRST116') throw apbnErr;

        // 2. Fetch Provincial Allocations
        const { data: provinsi, error: provErr } = await supabase
            .from('provincial_allocations')
            .select('*')
            .eq('year', targetYear);

        if (provErr) throw provErr;

        // 3. Fetch District Allocations from alokasi_kabupaten_kota & district_allocations
        const { data: akkData } = await supabase
            .from('alokasi_kabupaten_kota')
            .select('*, kabupaten_kota:kabupaten_kota(*)');

        const { data: districts } = await supabase
            .from('district_allocations')
            .select('*')
            .eq('year', targetYear);

        // 4. Map to Frontend format (allocations list)
        const allocations: any[] = [];

        // Map provByName and provByCode for parent matching
        const provByNameMap = new Map<string, any>();
        const provByCodeMap = new Map<string, any>();
        const provByIdMap = new Map<string, any>();
        if (provinsi) {
            provinsi.forEach(p => {
                if (p.provinsi_name) provByNameMap.set(p.provinsi_name.toLowerCase(), p);
                if (p.provinsi_code) provByCodeMap.set(p.provinsi_code, p);
                if (p.id) provByIdMap.set(p.id, p);
            });
        }

        // ... existing APBN mapping ...
        if (apbn) {
            allocations.push({
                id: `apbn-${apbn.id}`,
                fiscal_year: targetYear,
                level: 'APBN',
                entity_name: `APBN ${targetYear}`,
                allocated: Number(apbn.total_budget || 0) * 1e12,
                received: Number(apbn.total_budget || 0) * 1e12,
                disbursed: Number(apbn.total_budget || 0) * 1e12,
                remaining: 0,
                gap: 0,
                gap_percent: 0,
                status: 'OK'
            });

            const kemendikbudAlokasi = Number(apbn.flow_data?.children?.[0]?.children?.[0]?.amount || 0) * 1e12 || 98.5 * 1e12;
            allocations.push({
                id: `kemen-${apbn.id}`,
                fiscal_year: targetYear,
                level: 'KEMENDIKBUD',
                entity_name: 'Kemendikbud',
                allocated: kemendikbudAlokasi,
                received: kemendikbudAlokasi,
                disbursed: kemendikbudAlokasi,
                remaining: 0,
                gap: 0,
                gap_percent: 0,
                status: 'OK'
            });
        }

        // Add Provinces
        if (provinsi) {
            provinsi.forEach(p => {
                const isAnomalous = p.is_flagged || p.is_manual_flagged || p.over_budget_warning;
                allocations.push({
                    id: p.id,
                    fiscal_year: targetYear,
                    level: 'DINAS_PROV',
                    entity_name: p.provinsi_name,
                    provinsi_code: p.provinsi_code,
                    allocated: Number(p.alokasi),
                    received: Number(p.diterima),
                    disbursed: Number(p.disalurkan),
                    remaining: Number(p.sisa),
                    gap: Number(p.selisih),
                    gap_percent: Number(p.persen_selisih),
                    status: isAnomalous ? 'FLAGGED' : 'OK',
                    isManualFlagged: p.is_manual_flagged,
                    overBudgetWarning: p.over_budget_warning
                });
            });
        }

        const addedKabKeys = new Set<string>();

        // Add Districts from district_allocations first
        if (districts) {
            districts.forEach(d => {
                const parentProv = provByIdMap.get(d.provincial_id) || provByCodeMap.get(d.provinsi_code);
                const key = d.kabkota_code || d.kabkota_name.toLowerCase();
                addedKabKeys.add(key);
                allocations.push({
                    id: d.id,
                    parent_id: parentProv?.id || d.provincial_id,
                    fiscal_year: targetYear,
                    level: 'DINAS_KAB',
                    entity_name: d.kabkota_name,
                    kabkota_code: d.kabkota_code,
                    provinsi_code: parentProv?.provinsi_code || d.provinsi_code || '',
                    allocated: Number(d.alokasi),
                    received: Number(d.diterima),
                    disbursed: Number(d.disalurkan),
                    remaining: Number(d.sisa),
                    gap: Number(d.selisih),
                    gap_percent: Number(d.persen_selisih),
                    status: d.is_flagged ? 'FLAGGED' : 'OK'
                });
            });
        }

        // Add remaining Districts from alokasi_kabupaten_kota to cover ALL 38 provinces in Indonesia
        if (akkData && akkData.length > 0) {
            akkData.forEach((akk: any) => {
                const name = akk.kabupaten_kota?.nama_kabupaten_kota || akk.provinsi_nama || 'Kab/Kota';
                const code = akk.kabupaten_kota?.kode_kabupaten_kota || '';
                const provName = akk.provinsi_nama || '';
                
                const parentProv = provByNameMap.get(provName.toLowerCase()) || 
                                   (akk.alokasi_provinsi_id ? provByIdMap.get(akk.alokasi_provinsi_id) : null);
                
                const key = code || name.toLowerCase();
                if (!addedKabKeys.has(key)) {
                    addedKabKeys.add(key);
                    const nom = Number(akk.nominal_alokasi || 0);
                    const real = Number(akk.realisasi_total || 0);
                    const selisih = nom - real;
                    const pct = nom > 0 ? (selisih / nom) * 100 : 0;
                    allocations.push({
                        id: akk.id,
                        parent_id: parentProv?.id || akk.alokasi_provinsi_id || '',
                        fiscal_year: targetYear,
                        level: 'DINAS_KAB',
                        entity_name: name,
                        kabkota_code: code,
                        provinsi_code: parentProv?.provinsi_code || '',
                        allocated: nom,
                        received: real,
                        disbursed: real,
                        remaining: selisih,
                        gap: selisih,
                        gap_percent: pct,
                        status: 'OK'
                    });
                }
            });
        }

        const totalFlaggedCount = (provinsi?.filter(p => p.is_flagged || p.is_manual_flagged || p.over_budget_warning).length || 0) + 
                                  (districts?.filter(d => d.is_flagged).length || 0);

        // 5. Fetch Fund Transfers
        const { data: transfers, error: transfersErr } = await supabase
            .from('fund_transfers')
            .select('*');
        
        if (transfersErr) throw transfersErr;

        // 6. Fetch Fund Allocations for joining
        const { data: fundAllocations, error: allocationsErr } = await supabase
            .from('fund_allocations')
            .select('id, entity_name, level, entity_id, source_allocation_id');
        
        if (allocationsErr) throw allocationsErr;

        // Create a lookup map for allocation names and province/district codes
        const allocationMap = new Map<string, string>();
        const allocationProvMap = new Map<string, string>();
        const allocationKabMap = new Map<string, string>();
        
        if (fundAllocations) {
            // First pass: map DINAS_PROV to their province code
            fundAllocations.forEach(fa => {
                allocationMap.set(fa.id, fa.entity_name);
                if (fa.level === 'DINAS_PROV') {
                    allocationProvMap.set(fa.id, fa.entity_id);
                }
            });
            
            // Second pass: map DINAS_KAB to parent's province code and own kabkota code
            fundAllocations.forEach(fa => {
                if (fa.level === 'DINAS_KAB') {
                    allocationKabMap.set(fa.id, fa.entity_id);
                    if (fa.source_allocation_id) {
                        const provCode = allocationProvMap.get(fa.source_allocation_id);
                        if (provCode) {
                            allocationProvMap.set(fa.id, provCode);
                        }
                    }
                }
            });
            
            // Third pass: map SEKOLAH to parent's province/kabkota code
            fundAllocations.forEach(fa => {
                if (fa.level === 'SEKOLAH' && fa.source_allocation_id) {
                    const provCode = allocationProvMap.get(fa.source_allocation_id);
                    if (provCode) {
                        allocationProvMap.set(fa.id, provCode);
                    }
                    const kabCode = allocationKabMap.get(fa.source_allocation_id);
                    if (kabCode) {
                        allocationKabMap.set(fa.id, kabCode);
                    }
                }
            });
        }

        // Map transfers to flowLinks format
        const flowLinks = (transfers || []).map((t: any) => {
            const provCode = allocationProvMap.get(t.to_allocation_id) || 
                             allocationProvMap.get(t.from_allocation_id) || 
                             '';
            const kabCode = allocationKabMap.get(t.to_allocation_id) || 
                            allocationKabMap.get(t.from_allocation_id) || 
                            '';
            return {
                source: allocationMap.get(t.from_allocation_id) || 'Unknown Source',
                target: allocationMap.get(t.to_allocation_id) || 'Unknown Target',
                value: Number(t.amount || 0),
                reference: t.reference_number || '',
                date: t.transfer_date || '',
                status: t.status || 'PENDING',
                provinsi_code: provCode,
                kabkota_code: kabCode
            };
        });

        return NextResponse.json({
            success: true,
            year: targetYear,
            summary: {
                total_provinsi: provinsi?.length || 0,
                total_kabkota: allocations.filter(a => a.level === 'DINAS_KAB').length,
                total_flagged: totalFlaggedCount,
            },
            allocations,
            flowLinks
        });
    } catch (err: any) {
        console.warn('Fund flow API warning (database connection):', err?.message || err);
        return NextResponse.json({
            success: false,
            year: targetYear,
            summary: { total_provinsi: 0, total_kabkota: 0, total_flagged: 0 },
            allocations: [],
            flowLinks: [],
            error: err?.message || 'Gagal terhubung ke database Supabase.'
        });
    }
}
