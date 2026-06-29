// ---------------------------------------------------------------------------
// audio.ts — SFX player + background music synthesizer
// SFX are loaded lazily; autoplay failures are silently swallowed.
// Background music is generated via WebAudio (no audio files shipped —
// royalty-free by construction: it is programmatically synthesized here).
// Mute state persists in localStorage under "laspoly_mute".
// SFX volume under "laspoly_sfx_vol", music volume under "laspoly_music_vol".
// ---------------------------------------------------------------------------

const MUTE_KEY      = "laspoly_mute";
const SFX_VOL_KEY   = "laspoly_sfx_vol";
const MUSIC_VOL_KEY = "laspoly_music_vol";

export type SfxName = "dice" | "buy" | "rent" | "jail" | "build" | "gameover";

const SFX_SRC: Record<SfxName, string> = {
  dice:     "/assets/audio/dice.mp3",
  buy:      "/assets/audio/buy.mp3",
  rent:     "/assets/audio/rent.mp3",
  jail:     "/assets/audio/jail.mp3",
  build:    "/assets/audio/build.mp3",
  gameover: "/assets/audio/gameover.mp3",
};

// ---------------------------------------------------------------------------
// WebAudio background music synthesizer
// A gentle ambient loop: slow chord pad + subtle bass note, no files needed.
// ---------------------------------------------------------------------------

class BgmPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private running = false;
  private _volume = 0.5;
  private _muted = false;

  // Chord presets (lobby = calm major, game = slightly brighter)
  private static readonly LOBBY_FREQS = [130.8, 164.8, 196.0, 261.6]; // C3 E3 G3 C4
  private static readonly GAME_FREQS  = [146.8, 196.0, 246.9, 293.7]; // D3 G3 B3 D4

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    this._applyGain();
  }

  setMuted(m: boolean) {
    this._muted = m;
    this._applyGain();
  }

  private _applyGain() {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this._muted ? 0 : this._volume * 0.08, // soft cap so it stays ambient
        this.ctx!.currentTime,
        0.1
      );
    }
  }

  private _ensureCtx(): boolean {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return false;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {/* autoplay policy — ignored */});
    }
    return true;
  }

  start(mode: "lobby" | "game") {
    if (this.running) this.stop();
    if (!this._ensureCtx()) return;
    const ctx = this.ctx!;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume * 0.08;
    this.masterGain.connect(ctx.destination);

    const freqs = mode === "lobby" ? BgmPlayer.LOBBY_FREQS : BgmPlayer.GAME_FREQS;

    for (const freq of freqs) {
      // Sine pad
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      // Gentle tremolo (LFO)
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.25 + Math.random() * 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.003; // tiny vibrato
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.25 / freqs.length;
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start();
      lfo.start();
      this.oscs.push(osc, lfo);
    }

    // Add a subtle low bass pulse every 2 s
    const bassFreq = freqs[0]! / 2;
    const bassOsc = ctx.createOscillator();
    bassOsc.type = "triangle";
    bassOsc.frequency.value = bassFreq;
    const bassEnv = ctx.createGain();
    bassEnv.gain.value = 0;
    bassOsc.connect(bassEnv);
    bassEnv.connect(this.masterGain);
    bassOsc.start();
    this.oscs.push(bassOsc);

    const pulseBass = () => {
      if (!this.running) return;
      const now = ctx.currentTime;
      bassEnv.gain.cancelScheduledValues(now);
      bassEnv.gain.setValueAtTime(0, now);
      bassEnv.gain.linearRampToValueAtTime(0.35, now + 0.05);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      setTimeout(pulseBass, 2000);
    };
    this.running = true;
    pulseBass();
  }

  stop() {
    this.running = false;
    for (const o of this.oscs) {
      try { o.stop(); } catch { /* already stopped */ }
    }
    this.oscs = [];
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch { /* ignore */ }
      this.masterGain = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Main AudioPlayer: combines SFX + BGM
// ---------------------------------------------------------------------------

class AudioPlayer {
  private muted: boolean;
  private sfxVolume: number;
  private musicVolume: number;
  private sfxCache: Partial<Record<SfxName, HTMLAudioElement>> = {};
  private bgm = new BgmPlayer();

  constructor() {
    this.muted = localStorage.getItem(MUTE_KEY) === "true";
    this.sfxVolume  = parseFloat(localStorage.getItem(SFX_VOL_KEY)   ?? "0.5");
    this.musicVolume = parseFloat(localStorage.getItem(MUSIC_VOL_KEY) ?? "0.5");
    this.bgm.setMuted(this.muted);
    this.bgm.setVolume(this.musicVolume);

    // Start BGM on first user interaction if AudioContext was blocked
    const unlock = () => {
      this.bgm["_ensureCtx"]();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  get isMuted(): boolean { return this.muted; }
  get currentSfxVolume(): number { return this.sfxVolume; }
  get currentMusicVolume(): number { return this.musicVolume; }

  setMuted(val: boolean) {
    this.muted = val;
    localStorage.setItem(MUTE_KEY, String(val));
    this.bgm.setMuted(val);
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem(SFX_VOL_KEY, String(this.sfxVolume));
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem(MUSIC_VOL_KEY, String(this.musicVolume));
    this.bgm.setVolume(this.musicVolume);
  }

  startBgm(mode: "lobby" | "game") {
    try {
      this.bgm.start(mode);
    } catch {
      // Swallow any WebAudio errors (e.g. unsupported browser)
    }
  }

  stopBgm() {
    try {
      this.bgm.stop();
    } catch { /* ignore */ }
  }

  // Maximum playback duration in seconds for sounds that can be too long.
  private static readonly MAX_DURATION: Partial<Record<SfxName, number>> = {
    jail: 1.2,
  };

  play(name: SfxName): void {
    if (this.muted) return;
    try {
      let el = this.sfxCache[name];
      if (!el) {
        el = new Audio(SFX_SRC[name]);
        el.volume = this.sfxVolume;
        this.sfxCache[name] = el;
      }
      // Clone to allow overlapping playback (e.g. rapid dice clicks)
      const clone = el.cloneNode() as HTMLAudioElement;
      clone.volume = this.sfxVolume;
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
