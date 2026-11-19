"use strict";
(function (M) {
  class AudioManager {
    constructor() {
      this.muted = false;
      this.ctx = null;
      this.musicTime = 0;
      this.note = 0;
      this.active = false;
      this.volume = 0.17;
      this.hooks = {
        collect: [880, 1320, 0.12, "sine"],
        place: [330, 520, 0.12, "triangle"],
        shoot: [500, 230, 0.07, "triangle"],
        ice: [1000, 1700, 0.12, "sine"],
        fire: [200, 70, 0.12, "sawtooth"],
        explosion: [90, 25, 0.45, "sawtooth"],
        hit: [130, 70, 0.08, "triangle"],
        jump: [260, 680, 0.18, "square"],
        block: [420, 900, 0.14, "square"],
        power: [520, 1040, 0.3, "triangle"],
        wave: [190, 380, 0.45, "sawtooth"],
        boss: [85, 40, 0.65, "sawtooth"],
        victory: [523, 1046, 0.6, "triangle"],
        defeat: [330, 80, 0.65, "triangle"],
      };
    }
    unlock() {
      try {
        if (!this.ctx)
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume();
      } catch {}
    }
    tone(a, b, duration, wave = "sine", volume = 1) {
      if (this.muted || !this.ctx || this.ctx.state !== "running") return;
      const t = this.ctx.currentTime,
        o = this.ctx.createOscillator(),
        g = this.ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(a, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, b), t + duration);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(this.volume * volume, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + duration + 0.02);
    }
    play(name) {
      const p = this.hooks[name];
      if (p) this.tone(...p);
    }
    update(dt) {
      if (!this.active || this.muted) return;
      this.musicTime -= dt;
      if (this.musicTime <= 0) {
        this.musicTime = 0.27;
        const melody = [
          523, 0, 659, 784, 659, 523, 440, 0, 494, 587, 698, 587, 494, 392, 440,
          0, 523, 659, 880, 784, 659, 523, 587, 0, 494, 392, 440, 494, 523, 0,
          392, 0,
        ];
        const n = melody[this.note++ % melody.length];
        if (n) this.tone(n, n, 0.16, "triangle", 0.13);
        if (this.note % 4 === 0)
          this.tone(this.note % 8 === 0 ? 131 : 175, 131, 0.25, "sine", 0.18);
      }
    }
    toggle() {
      this.muted = !this.muted;
      return this.muted;
    }
  }
  M.AudioManager = AudioManager;
})(Meadow);
