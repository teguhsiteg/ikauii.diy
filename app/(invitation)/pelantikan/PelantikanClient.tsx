'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoverScreen } from '@/components/pelantikan/CoverScreen';
import { MainInvitation } from '@/components/pelantikan/MainInvitation';
import { GuestInfo } from '@/utils/urlHelper';
import { invitationAudio } from '@/utils/audioHelper';

export default function PelantikanClient() {
  const searchParams = useSearchParams();
  const [showMain, setShowMain] = useState(false);
  const [guest, setGuest] = useState<GuestInfo>({
    name: 'Tamu Undangan',
    role: '',
    category: '',
  });

  useEffect(() => {
    const to = searchParams.get('to');
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const audioUrl = searchParams.get('audio');

    if (to) {
      setGuest({
        name: to,
        role: role || '',
        category: category || '',
        code: 'IKAUII-' + Math.abs(to.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).toUpperCase().slice(0, 6)
      });
    }

    if (audioUrl) {
      invitationAudio.setTrack({
        id: 'custom',
        title: 'Custom Audio',
        type: 'url',
        url: audioUrl,
      });
    }
  }, [searchParams]);

  return (
    <main className="w-full min-h-screen bg-slate-950">
      {!showMain ? (
        <CoverScreen
          guest={guest}
          onOpen={() => setShowMain(true)}
        />
      ) : (
        <MainInvitation
          guest={guest}
          onBackToCover={() => setShowMain(false)}
        />
      )}
    </main>
  );
}
