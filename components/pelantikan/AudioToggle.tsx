import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { invitationAudio } from '@/utils/audioHelper';

interface AudioToggleProps {
  onOpenSettings?: () => void;
}

export const AudioToggle: React.FC<AudioToggleProps> = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(invitationAudio.getStatus());
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const unsub = invitationAudio.subscribe(() => {
      setIsPlaying(invitationAudio.getStatus());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn('Audio autoplay prevented:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleToggle = () => {
    const status = invitationAudio.toggle();
    setIsPlaying(status);
  };

  return (
    <>
      <audio ref={audioRef} src={invitationAudio.getCurrentTrack().url} loop preload="auto" />
      <div className="fixed bottom-5 right-5 z-40">
      <button
        id="btn-audio-toggle"
        onClick={handleToggle}
        title={isPlaying ? 'Heningkan Musik' : 'Putar Musik Pengiring'}
        className={`p-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center ${
          isPlaying
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20'
            : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
        }`}
      >
        {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
    </>
  );
};
