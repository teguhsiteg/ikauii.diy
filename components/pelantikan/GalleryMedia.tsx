'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface GalleryMediaProps {
  url: string;
  index: number;
}

export function GalleryMedia({ url, index }: GalleryMediaProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const isRawVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
  const isHeic = url.match(/\.(heic|heif)$/i);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function processMedia() {
      if (!isHeic) {
        setDisplayUrl(url);
        setIsLoading(false);
        return;
      }

      // Handle HEIC
      try {
        // Dynamic import heic2any only on client side
        const heic2any = (await import('heic2any')).default;
        
        // Fetch the image as a blob
        const res = await fetch(url);
        const blob = await res.blob();
        
        // Convert to JPG
        const convertedBlob = await heic2any({
          blob,
          toType: 'image/jpeg',
          quality: 0.8
        }) as Blob;
        
        if (isMounted) {
          objectUrl = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
          setDisplayUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to convert HEIC image:', err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    processMedia();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, isHeic]);

  const frameClass = "rounded-xl overflow-hidden bg-white p-2 sm:p-3 border-[6px] border-[#d4af37]/90 shadow-2xl relative flex flex-col justify-center ring-2 ring-slate-900/50";
  
  if (isYoutube) {
    return (
      <div className={`${frameClass} aspect-video`}>
        <div className="w-full h-full relative bg-slate-900 rounded">
          <iframe
            className="w-full h-full absolute inset-0 rounded"
            src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
            title={`Video Ucapan ${index + 1}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  if (isRawVideo) {
    return (
      <div className={`${frameClass} aspect-[4/5] sm:aspect-square`}>
        <div className="w-full h-full bg-slate-900 rounded overflow-hidden flex items-center justify-center relative">
          <video src={url} controls playsInline className="w-full h-full object-cover absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${frameClass} aspect-[4/5] sm:aspect-square group transition-all duration-300 hover:scale-[1.02] hover:-rotate-1`}>
      <div className="w-full h-full relative bg-slate-100 rounded flex items-center justify-center overflow-hidden">
        {isLoading && (
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin absolute" />
        )}
        {error && (
          <span className="text-xs text-red-500 p-4 text-center">Gagal memuat gambar</span>
        )}
        {displayUrl && !error && (
          <img 
            src={displayUrl} 
            alt={`Galeri ${index + 1}`} 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
            loading="lazy" 
          />
        )}
      </div>
    </div>
  );
}
