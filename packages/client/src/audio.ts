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
// Plays a gentle LOOPING MELODY — a synthesized note sequence scheduled in an
// infinite loop. Royalty-free by construction (no audio files, no copyrighted
// tune — original phrase invented here). The melody uses two alternating 8-step
// phrases over a C-major / G-major feel with a soft bass accompaniment.
// ---------------------------------------------------------------------------

class BgmPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private running = false;
  private _volume = 0.5;
  private _muted = false;
  // Keep track of all nodes so stop() can clean up
  private allNodes: AudioNode[] = [];
  // Lookahead scheduling: next-note time in AudioContext.currentTime
  private scheduleTimer: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTime = 0;
  private noteIndex = 0;

  // Melody: two 8-step phrases interleaved (lobby = warm C-major, game = brighter G-major).
  // Each step: [frequency Hz, duration seconds, velocity 0-1].
  // Original melody invented specifically for LasPoly — not based on any existing work.
  private static readonly LOBBY_MELODY: Array<[number, number, number]> = [
    // Phrase A — gentle upward arpeggio
    [261.6, 0.35, 0.7],  // C4
    [329.6, 0.35, 0.6],  // E4
    [392.0, 0.35, 0.65], // G4
    [523.3, 0.55, 0.8],  // C5 (hold)
    [392.0, 0.35, 0.55], // G4
    [329.6, 0.35, 0.5],  // E4
    [261.6, 0.35, 0.6],  // C4
    [196.0, 0.65, 0.5],  // G3 (resolve)
    // Phrase B — playful variant
    [293.7, 0.30, 0.65], // D4
    [349.2, 0.30, 0.6],  // F4
    [392.0, 0.30, 0.7],  // G4
    [440.0, 0.50, 0.75], // A4 (hold)
    [392.0, 0.30, 0.55], // G4
    [349.2, 0.30, 0.5],  // F4
    [329.6, 0.30, 0.6],  // E4
    [261.6, 0.70, 0.6],  // C4 (resolve)
  ];

  private static readonly GAME_MELODY: Array<[number, number, number]> = [
    // Phrase A — brighter G-major feel
    [293.7, 0.30, 0.7],  // D4
    [392.0, 0.30, 0.65], // G4
    [493.9, 0.30, 0.7],  // B4
    [587.3, 0.50, 0.8],  // D5 (hold)
    [493.9, 0.30, 0.6],  // B4
    [392.0, 0.30, 0.55], // G4
    [349.2, 0.30, 0.6],  // F4
    [293.7, 0.65, 0.55], // D4 (resolve)
    // Phrase B — stepping melody
    [329.6, 0.28, 0.65], // E4
    [392.0, 0.28, 0.6],  // G4
    [440.0, 0.28, 0.7],  // A4
    [523.3, 0.48, 0.75], // C5 (hold)
    [440.0, 0.28, 0.55], // A4
    [392.0, 0.28, 0.5],  // G4
    [349.2, 0.28, 0.55], // F4
    [293.7, 0.65, 0.55], // D4 (resolve)
  ];

  private currentMelody: Array<[number, number, number]> = BgmPlayer.LOBBY_MELODY;

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    this._applyGain();
    if (this.audioEl) this.audioEl.volume = this._muted ? 0 : this._volume;
  }

  setMuted(m: boolean) {
    this._muted = m;
    this._applyGain();
    if (this.audioEl) this.audioEl.volume = this._muted ? 0 : this._volume;
  }

  private _applyGain() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this._muted ? 0 : this._volume * 0.12,
        this.ctx.currentTime,
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

  /** Schedule a single melody note at `when` in AudioContext time. */
  private scheduleNote(freq: number, duration: number, velocity: number, when: number) {
    const ctx = this.ctx!;

    // Sine oscillator for the melody note
    const osc = ctx.createOscillator();
    osc.type = "triangle"; // triangle is softer/warmer than square, crisper than sine
    osc.frequency.value = freq;

    // Per-note gain envelope (ADSR-lite: quick attack, sustain, release)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(velocity, when + 0.03);           // attack 30ms
    env.gain.setValueAtTime(velocity * 0.8, when + duration * 0.5);   // sustain
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);    // release

    osc.connect(env);
    env.connect(this.masterGain!);

    osc.start(when);
    osc.stop(when + duration + 0.05);

    // Track for cleanup (osc auto-disconnects after stop)
    this.allNodes.push(osc, env);
  }

  /** Lookahead scheduler: schedules notes ~200ms ahead, called every 100ms. */
  private scheduleAhead() {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const LOOKAHEAD = 0.2; // seconds to schedule ahead
    const melody = this.currentMelody;

    while (this.nextNoteTime < ctx.currentTime + LOOKAHEAD) {
      const [freq, dur, vel] = melody[this.noteIndex % melody.length]!;
      this.scheduleNote(freq, dur, vel, this.nextNoteTime);
      this.nextNoteTime += dur * 0.9; // slight overlap for legato feel
      this.noteIndex++;
    }

    this.scheduleTimer = setTimeout(() => this.scheduleAhead(), 100);
  }

  // Optional original soundtrack: if mp3 files are present under /assets/music
  // (local/private builds only — excluded from the public Docker image) they play
  // instead of the synthesized melody. On 404 (deployed build) we fall back to synth.
  private static readonly TRACKS = [
    "/assets/music/Cruisin.mp3",
    "/assets/music/jazzcomedy.mp3",
    "/assets/music/thejazzpiano.mp3",
  ];
  private audioEl: HTMLAudioElement | null = null;
  private trackIndex = 0;
  private gestureBound = false;

  start(mode: "lobby" | "game") {
    if (this.running) this.stop();
    this.running = true;
    this.currentMelody = mode === "lobby" ? BgmPlayer.LOBBY_MELODY : BgmPlayer.GAME_MELODY;
    // Try the original tracks first; fall back to the synth melody if absent.
    const el = new Audio();
    el.preload = "auto";
    el.volume = this._muted ? 0 : this._volume;
    this.trackIndex = 0;
    const playCurrent = () => {
      el.src = BgmPlayer.TRACKS[this.trackIndex % BgmPlayer.TRACKS.length]!;
      el.play().catch(() => {
        // Autoplay policy blocked it — resume on the first user gesture.
        if (!this.gestureBound) {
          this.gestureBound = true;
          const resume = () => { this.audioEl?.play().catch(() => {}); };
          window.addEventListener("pointerdown", resume, { once: true });
          window.addEventListener("keydown", resume, { once: true });
        }
      });
    };
    el.onended = () => { this.trackIndex++; playCurrent(); };
    el.onerror = () => {
      // Files not present (public build) → use the synthesized melody instead.
      el.onerror = null;
      this.audioEl = null;
      if (this.running) this.startSynth(mode);
    };
    this.audioEl = el;
    playCurrent();
  }

  private startSynth(mode: "lobby" | "game") {
    if (!this._ensureCtx()) return;
    const ctx = this.ctx!;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume * 0.12;
    this.masterGain.connect(ctx.destination);
    this.allNodes.push(this.masterGain);

    this.currentMelody = mode === "lobby" ? BgmPlayer.LOBBY_MELODY : BgmPlayer.GAME_MELODY;
    this.noteIndex = 0;
    this.nextNoteTime = ctx.currentTime + 0.1; // small startup delay
    this.running = true;
    this.scheduleAhead();
  }

  stop() {
    this.running = false;
    if (this.audioEl) {
      this.audioEl.onended = null;
      this.audioEl.onerror = null;
      try { this.audioEl.pause(); } catch { /* ignore */ }
      this.audioEl = null;
    }
    if (this.scheduleTimer) { clearTimeout(this.scheduleTimer); this.scheduleTimer = null; }
    for (const node of this.allNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* already stopped */ }
      try { node.disconnect(); } catch { /* ignore */ }
    }
    this.allNodes = [];
    this.masterGain = null;
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
