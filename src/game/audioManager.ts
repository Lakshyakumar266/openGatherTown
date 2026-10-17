import { Howl, Howler } from "howler";

export type AudioSettings = {
  bgmVolume: number;
  sfxVolume: number;
  bgmMuted: boolean;
  sfxMuted: boolean;
};

const DEFAULT_SETTINGS: AudioSettings = {
  bgmVolume: 0.4,
  sfxVolume: 0.7,
  bgmMuted: false,
  sfxMuted: false,
};

class AudioManager {
  private bgm: Howl | null = null;
  private sfx: Map<string, Howl> = new Map();
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private footstepCooldown = 0;

  init(settings?: Partial<AudioSettings>) {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    this.bgm = new Howl({
      src: ["/audio/bgm/bgm_demo.mp3"],
      loop: true,
      volume: this.settings.bgmMuted ? 0 : this.settings.bgmVolume,
      html5: true,
    });

    const clickSfx = new Howl({
      src: ["/audio/sfx/click.mp3"],
      volume: this.settings.sfxMuted ? 0 : this.settings.sfxVolume,
    });

    const joinSfx = new Howl({
      src: ["/audio/sfx/join.mp3"],
      volume: this.settings.sfxMuted ? 0 : this.settings.sfxVolume,
    });

    const footstepSfx = new Howl({
      src: ["/audio/sfx/footstep.mp3"],
      volume: (this.settings.sfxMuted ? 0 : this.settings.sfxVolume) * 0.35,
      rate: 1.4,
    });

    this.sfx.set("click", clickSfx);
    this.sfx.set("join", joinSfx);
    this.sfx.set("footstep", footstepSfx);
  }

  playBGM() {
    if (this.bgm && !this.bgm.playing()) {
      this.bgm.play();
    }
  }

  stopBGM() {
    this.bgm?.stop();
  }

  playSFX(name: string) {
    const sound = this.sfx.get(name);
    if (sound) {
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
      this.footstepCooldown = 18;
      this.playSFX("footstep");
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
    const sfxActual = this.settings.sfxMuted ? 0 : vol;
    this.sfx.forEach((sound, key) => {
      sound.volume(key === "footstep" ? sfxActual * 0.35 : sfxActual);
    });
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
    const sfxActual = this.settings.sfxMuted ? 0 : this.settings.sfxVolume;
    this.sfx.forEach((sound, key) => {
      sound.volume(key === "footstep" ? sfxActual * 0.35 : sfxActual);
    });
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
    Howler.unload();
  }
}

export const audioManager = new AudioManager();
