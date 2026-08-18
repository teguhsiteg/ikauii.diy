import { MusicTrack } from '@/data/eventData';

class AudioHelper {
  private status: boolean = false;
  private track: MusicTrack | null = null;
  private volume: number = 1;
  private listeners: (() => void)[] = [];

  getStatus() {
    return this.status;
  }

  getCurrentTrack(): MusicTrack {
    return this.track ?? { id: 'none', title: 'Tanpa Musik', type: 'none' };
  }

  getVolume(): number {
    return this.volume;
  }

  setTrack(track: MusicTrack) {
    this.track = track;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.notify();
  }

  play() {
    this.status = true;
    this.notify();
  }

  pause() {
    this.status = false;
    this.notify();
  }

  toggle() {
    this.status = !this.status;
    this.notify();
    return this.status;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const invitationAudio = new AudioHelper();
