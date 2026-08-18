'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminGeneratorPage } from '@/components/pelantikan/AdminGeneratorPage';

export default function UndanganKirimPage() {
  const router = useRouter();
  return (
    <AdminGeneratorPage
      onGoToLiveInvitation={() => router.push('/pelantikan')}
    />
  );
}
