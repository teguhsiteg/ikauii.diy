'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestInfo } from '@/utils/urlHelper';

import { MainInvitation } from '@/components/pelantikan/MainInvitation';
import { AudioToggle } from '@/components/pelantikan/AudioToggle';
import { AdminGeneratorPage } from '@/components/pelantikan/AdminGeneratorPage';
import { CoverScreen } from '@/components/pelantikan/CoverScreen';
import { invitationAudio } from '@/utils/audioHelper';
import { getInvitationSettings, InvitationSettings } from '@/lib/invitation-settings';
import { AnimatePresence, motion } from 'motion/react';
import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import SmartLoader from '@/components/SmartLoader'; // Assume this exists based on component list

function PelantikanContent() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<InvitationSettings | null>(null);
  const [isOpened, setIsOpened] = useState(false);

  const [guest, setGuest] = useState<GuestInfo>({
    name: 'Bapak / Ibu / Saudara/i',
    role: '',
    category: '',
  });

  const isAdmin = searchParams.get('admin') === '1';

  useEffect(() => {
    getInvitationSettings().then((data) => {
      setSettings(data);
      // Inisialisasi musik pengiring
      invitationAudio.setTrack({
        id: 'custom',
        title: 'Custom Audio',
        type: 'url',
        url: data.musicUrl,
      });
      // Optionally handle auto-play based on data.autoPlayMusic if user interacts
      // Browsers block autoplay without interaction, but if there's a play trigger, we respect it.
    });
  }, []);

  // Initialize smooth scrolling with Lenis when invitation is opened
  useEffect(() => {
    let lenis: Lenis | undefined;
    if (isOpened) {
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.06,
        wheelMultiplier: 0.8,
      });
    }
    return () => {
      if (lenis) lenis.destroy();
    };
  }, [isOpened]);

  useEffect(() => {
    const to = searchParams.get('to');
    const role = searchParams.get('role');
    const category = searchParams.get('category');

    if (to) {
      setGuest({
        name: to,
        role: role || '',
        category: category || '',
        code: 'IKAUII-' + Math.abs(to.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).toUpperCase().slice(0, 6)
      });
    }
  }, [searchParams]);

  if (isAdmin) {
    return <AdminGeneratorPage onGoToLiveInvitation={() => {}} />;
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <AnimatePresence mode="wait">
        {!isOpened ? (
          <CoverScreen
            key="cover-screen"
            guest={guest}
            onOpen={() => setIsOpened(true)}
            dynamicSettings={settings}
          />
        ) : (
          <motion.div
            key="main-invitation"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} // smooth ease-out
          >
            <MainInvitation guest={guest} onBackToCover={() => setIsOpened(false)} dynamicSettings={settings} />
            <AudioToggle />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function PelantikanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div></div>}>
      <PelantikanContent />
    </Suspense>
  );
}