'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';

export default function ProfilInstitusiPage() {
  const router = useRouter();

  useEffect(() => {
    supabase
      .from('institusi_pendidikan')
      .select('id')
      .eq('npsn', '69893669')
      .limit(1)
      .then(({ data }) => {
        const targetId = data?.[0]?.id || 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';
        router.replace(`/dashboard/profil-institusi/${targetId}`);
      })
      .catch(() => {
        router.replace('/dashboard/profil-institusi/e45bdf94-41c6-4ee0-9864-8c3c7c4576f7');
      });
  }, [router]);

  return (
    <div className="min-h-screen">
      <Header
        title="Profil Institusi"
        subtitle="Mengalihkan ke profil keuangan institusi..."
        showYearSelector={false}
        showSearch={false}
      />
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted font-medium">Mengalihkan ke profil keuangan sekolah...</p>
        </div>
      </div>
    </div>
  );
}
