'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGeneratorPage } from '@/components/pelantikan/AdminGeneratorPage';
import { auth } from '@/lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import SessionGuard from '@/components/SessionGuard';

export default function UndanganKirimPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0e2142]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SessionGuard>
      <AdminGeneratorPage
        onGoToLiveInvitation={() => router.push('/pelantikan')}
      />
    </SessionGuard>
  );
}
