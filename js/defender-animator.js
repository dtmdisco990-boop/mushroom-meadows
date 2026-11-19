"use strict";
(function (M) {
  // All motion uses simulation time, so animation freezes with gameplay.
  const profiles = {
    toad: { height: 76, width: 66 },
    piranha: { height: 76, width: 82 },
    fire: { height: 70, width: 78 },
    ice: { height: 70, width: 78 },
    bomb: { height: 62, width: 62, pixel: true },
    pipe: { height: 72, width: 72, pixel: true, frame: M.Art.frames.pipe.crop },
  };

  class DefenderAnimator {
    constructor(scene) {
      this.scene = scene;
    }
    prepareTextures() {
      for (const [key, profile] of Object.entries(profiles)) {
        const texture = this.scene.textures.get(key);
        if (profile.frame) texture.add("defender", 0, ...profile.frame);
        if (profile.pixel)
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    pose(d, time) {
      const p = { x: 0, y: 0, sx: 1, sy: 1, angle: 0, glow: 0 };
      const phase = d.id * 1.73;
      const action = Math.max(0, d.action || 0);
      const breath = Math.sin(time * 2.5 + phase);
      if (d.type === "toad") {
        p.sy += breath * 0.025;
        p.sx -= breath * 0.012;
        p.angle = Math.sin(time * 1.7 + phase) * 2;
        if (action > 0) {
          const leap = Math.sin((1 - action / 0.5) * Math.PI);
          p.y -= Math.max(0, leap) * 15;
          p.sy += leap * 0.065;
          p.angle += Math.sin(action * 17) * 7;
          p.glow = Math.max(0, leap);
        }
      } else if (d.type === "piranha") {
        p.angle = breath * 3;
        p.sy += Math.sin(time * 3.3 + phase) * 0.025;
        if (action > 0) {
          const snap = Math.sin((action / 0.2) * Math.PI);
          p.x += snap * 10;
          p.angle += snap * 11;
          p.sx += snap * 0.13;
          p.sy -= snap * 0.08;
        }
      } else if (d.type === "fire") {
        p.angle = Math.sin(time * 2 + phase) * 2.5;
        p.sy += breath * 0.03;
        if (action > 0) {
          const recoil = Math.sin((action / 0.2) * Math.PI);
          p.x -= recoil * 7;
          p.sx -= recoil * 0.13;
          p.sy += recoil * 0.09;
          p.glow = recoil;
        }
      } else if (d.type === "ice") {
        p.angle = Math.sin(time * 1.8 + phase) * 3;
        p.y -= (Math.sin(time * 2.4 + phase) + 1) * 1.2;
        p.sx += breath * 0.018;
        if (action > 0) {
          const release = Math.sin((action / 0.2) * Math.PI);
          p.y -= release * 4;
          p.angle -= release * 7;
          p.sy += release * 0.1;
          p.glow = release;
        }
      } else if (d.type === "bomb") {
        const urgency = Math.min(1, d.age / M.Config.defenders.bomb.arm);
        const tick = Math.sin(d.age * (15 + urgency * 20));
        p.angle = tick * (3 + urgency * 8);
        p.y = -Math.abs(tick) * (1 + urgency * 3);
        p.sx += urgency * 0.1 + tick * 0.025;
        p.sy += urgency * 0.1 - tick * 0.025;
        p.glow = urgency;
      } else if (d.type === "pipe") {
        p.sy += Math.sin(time * 1.5 + phase) * 0.006;
        if (d.hit > 0) {
          p.x += Math.sin(d.hit * 90) * 4;
          p.sx += Math.sin((d.hit / 0.18) * Math.PI) * 0.08;
          p.sy -= Math.sin((d.hit / 0.18) * Math.PI) * 0.06;
        }
      }
      const pop = Math.min(1, d.age / 0.3);
      const bounce = pop < 1 ? 1 + Math.sin(pop * Math.PI) * 0.18 : 1;
      p.sx *= Math.max(0.08, pop) * bounce;
      p.sy *= Math.max(0.08, pop) / bounce;
      if (d.hit > 0 && d.type !== "pipe") p.x += Math.sin(d.hit * 65) * 2.5;
      return p;
    }
    render(view, d, time) {
      const s = view.sprite,
        config = profiles[d.type],
        pose = this.pose(d, time);
      if (config.frame) s.setFrame("defender");
      const frame = s.frame;
      const scale = Math.min(
        config.width / frame.width,
        config.height / frame.height,
      );
      s.setOrigin(0.5, 1)
        .setPosition(d.x + pose.x, d.y + 22 + pose.y)
        .setScale(scale * pose.sx, scale * pose.sy)
        .setAngle(pose.angle);
      view.shadow
        .setPosition(d.x, d.y + 23)
        .setDisplaySize(config.width * 0.72, 13);
      if (d.type === "bomb" && this.scene.lastTrail > 0.05) {
        this.scene.fx.burst(d.x, d.y - 38 + pose.y, 0xffd84b, 2, 45);
      }
      if (
        d.type === "pipe" &&
        d.hp / d.maxHP < 0.3 &&
        time >= (view.nextSmoke || 0)
      ) {
        view.nextSmoke = time + 0.4;
        this.scene.fx.burst(d.x + 9, d.y - 44, 0xb7c1b1, 2, 28);
      }
      if (d.type === "ice" && time >= (view.nextSpark || 0)) {
        view.nextSpark = time + 1.1;
        this.scene.fx.burst(
          d.x + Math.sin(time * 2) * 28,
          d.y - 35,
          0xc7f8ff,
          2,
          20,
        );
      }
      if (
        d.type === "fire" &&
        pose.glow > 0.65 &&
        this.scene.lastTrail > 0.05
      ) {
        this.scene.fx.burst(d.x + 22, d.y - 31, 0xffcf59, 3, 50);
      }
    }
  }
  M.DefenderAnimator = DefenderAnimator;
  M.DefenderArtProfiles = profiles;
})(Meadow);
