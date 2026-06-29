// ---------------------------------------------------------------------------
// audio.ts — tiny SFX player
// Sounds are loaded lazily; autoplay failures are silently swallowed.
// Mute state persists in localStorage under the key "laspoly_mute".
// ---------------------------------------------------------------------------

const MUTE_KEY = "laspoly_mute";

export type SfxName = "dice" | "buy" | "rent" | "jail" | "build" | "gameover";

const SFX_SRC: Record<SfxName, string> = {
  dice:     "/assets/audio/dice.mp3",
  buy:      "/assets/audio/buy.mp3",
  rent:     "/assets/audio/rent.mp3",
  jail:     "/assets/audio/jail.mp3",
  build:    "/assets/audio/build.mp3",
  gameover: "/assets/audio/gameover.mp3",
};

class AudioPlayer {
  private muted: boolean;
  private cache: Partial<Record<SfxName, HTMLAudioElement>> = {};

  constructor() {
    this.muted = localStorage.getItem(MUTE_KEY) === "true";
  }

  get isMuted(): boolean { return this.muted; }

  setMuted(val: boolean) {
    this.muted = val;
    localStorage.setItem(MUTE_KEY, String(val));
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Maximum playback duration in seconds for sounds that can be too long.
  private static readonly MAX_DURATION: Partial<Record<SfxName, number>> = {
    jail: 1.2,
  };

  play(name: SfxName): void {
    if (this.muted) return;
    try {
      let el = this.cache[name];
      if (!el) {
        el = new Audio(SFX_SRC[name]);
        el.volume = 0.5;
        this.cache[name] = el;
      }
      // Clone to allow overlapping playback (e.g. rapid dice clicks)
      const clone = el.cloneNode() as HTMLAudioElement;
      clone.volume = el.volume;
      void clone.play().catch(() => {/* autoplay blocked — ignore */});
      // Cap duration for sounds that would otherwise run too long (e.g. jail siren)
      const maxDur = AudioPlayer.MAX_DURATION[name];
      if (maxDur !== undefined) {
        setTimeout(() => {
          clone.pause();
          clone.currentTime = 0;
        }, maxDur * 1000);
      }
    } catch {
      // Any failure is silently swallowed
    }
  }
}

export const audio = new AudioPlayer();
