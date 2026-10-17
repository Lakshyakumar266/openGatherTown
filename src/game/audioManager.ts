import { Howl, Howler } from "howler";

export type AudioSettings = {
  bgmVolume: number;
  sfxVolume: number;
  bgmMuted: boolean;
  sfxMuted: boolean;
};

const DEFAULT_SETTINGS: AudioSettings = {
  bgmVolume: 0.45,
  sfxVolume: 0.65,
  bgmMuted: false,
  sfxMuted: false,
};

/**
 * Audio Manager using authentic 2D game audio assets (Kenney CC0 2D game assets).
 * - SFX: Kenney Interface Sounds (click, open, close, select, confirmation/join)
 * - Footsteps: Kenney 2D grass footsteps with pitch variation & cadence cycling
 * - BGM: Long, peaceful acoustic game music
 */
class AudioManager {
  private bgm: Howl | null = null;
  private sfx: Map<string, Howl> = new Map();
  private footsteps: Howl[] = [];
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private footstepCooldown = 0;
  private footstepIndex = 0;
  private initialized = false;

  init(settings?: Partial<AudioSettings>) {
    if (this.initialized) return;
    this.initialized = true;

    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    // Long peaceful acoustic BGM
    this.bgm = new Howl({
      src: ["/audio/bgm/bgm_demo.mp3"],
      loop: true,
      volume: this.settings.bgmMuted ? 0 : this.settings.bgmVolume,
      html5: true,
      preload: true,
    });

    const sfxVol = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;

    // Authentic Kenney 2D Game UI Sound Effects
    this.sfx.set(
      "click",
      new Howl({
        src: ["/audio/sfx/click.wav"],
        volume: sfxVol * 0.7,
        preload: true,
      }),
    );

    this.sfx.set(
      "open",
      new Howl({
        src: ["/audio/sfx/open.wav"],
        volume: sfxVol * 0.75,
        preload: true,
      }),
    );

    this.sfx.set(
      "close",
      new Howl({
        src: ["/audio/sfx/close.wav"],
        volume: sfxVol * 0.65,
        preload: true,
      }),
    );

    this.sfx.set(
      "join",
      new Howl({
        src: ["/audio/sfx/join.wav"],
        volume: sfxVol * 0.85,
        preload: true,
      }),
    );

    this.sfx.set(
      "select",
      new Howl({
        src: ["/audio/sfx/select.wav"],
        volume: sfxVol * 0.7,
        preload: true,
      }),
    );

    // Authentic Kenney 2D Game Footsteps (footstep_grass_000 through 004)
    this.footsteps = [0, 1, 2, 3, 4].map((i) => {
      const num = ("000" + i).slice(-3);
      return new Howl({
        src: [`/audio/sfx/footstep_grass_${num}.ogg`],
        volume: sfxVol * 0.45,
        preload: true,
      });
    });
  }

  playBGM() {
    if (this.bgm && !this.bgm.playing()) {
      this.bgm.play();
    }
  }

  stopBGM() {
    this.bgm?.stop();
  }

  playClick() {
    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get("click");
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.7);
      sound.play();
    }
  }

  playOpen() {
    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get("open");
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.75);
      sound.play();
    }
  }

  playClose() {
    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get("close");
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.65);
      sound.play();
    }
  }

  playJoin() {
    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get("join");
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.85);
      sound.play();
    }
  }

  playSelect() {
    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get("select");
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.7);
      sound.play();
    }
  }

  playSFX(name: string) {
    if (name === "click") return this.playClick();
    if (name === "open") return this.playOpen();
    if (name === "close") return this.playClose();
    if (name === "join") return this.playJoin();
    if (name === "select") return this.playSelect();

    if (this.settings.sfxMuted) return;
    const sound = this.sfx.get(name);
    if (sound) {
      sound.volume(this.settings.sfxVolume * 0.7);
      sound.play();
    }
  }

  playFootstep(isMoving: boolean) {
    if (!isMoving) {
      this.footstepCooldown = 0;
      return;
    }
    this.footstepCooldown--;
    if (this.footstepCooldown <= 0) {
      // Step interval: ~18 frames at 60 FPS (~300ms between footsteps)
      this.footstepCooldown = 18;
      if (this.settings.sfxMuted || this.footsteps.length === 0) return;

      this.footstepIndex = (this.footstepIndex + 1) % this.footsteps.length;
      const sound = this.footsteps[this.footstepIndex];
      const pitchVariance = 0.95 + Math.random() * 0.1;
      sound.rate(pitchVariance);
      sound.volume(this.settings.sfxVolume * 0.45);
      sound.play();
    }
  }

  setBGMVolume(vol: number) {
    this.settings.bgmVolume = vol;
    if (this.bgm) {
      this.bgm.volume(this.settings.bgmMuted ? 0 : vol);
    }
  }

  setSFXVolume(vol: number) {
    this.settings.sfxVolume = vol;
    const eff = this.settings.sfxMuted ? 0 : vol;
    const click = this.sfx.get("click");
    if (click) click.volume(eff * 0.7);
    const open = this.sfx.get("open");
    if (open) open.volume(eff * 0.75);
    const close = this.sfx.get("close");
    if (close) close.volume(eff * 0.65);
    const join = this.sfx.get("join");
    if (join) join.volume(eff * 0.85);
    const select = this.sfx.get("select");
    if (select) select.volume(eff * 0.7);

    this.footsteps.forEach((s) => s.volume(eff * 0.45));
  }

  toggleBGMMute() {
    this.settings.bgmMuted = !this.settings.bgmMuted;
    if (this.bgm) {
      this.bgm.volume(this.settings.bgmMuted ? 0 : this.settings.bgmVolume);
    }
    return this.settings.bgmMuted;
  }

  toggleSFXMute() {
    this.settings.sfxMuted = !this.settings.sfxMuted;
    this.setSFXVolume(this.settings.sfxVolume);
    return this.settings.sfxMuted;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  destroy() {
    this.bgm?.stop();
    this.bgm?.unload();
    this.sfx.forEach((s) => s.unload());
    this.sfx.clear();
    this.footsteps.forEach((s) => s.unload());
    this.footsteps = [];
    Howler.unload();
    this.initialized = false;
  }
}

export const audioManager = new AudioManager();
