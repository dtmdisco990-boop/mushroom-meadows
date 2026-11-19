"use strict";
(function (M) {
  const C = M.Config;
  class EffectsManager {
    constructor(scene) {
      this.scene = scene;
      this.items = [];
      this.free = [];
      this.labels = [];
      this.g = scene.add.graphics().setDepth(80);
    }
    burst(x, y, color = 0xffd26a, n = 12, power = 120) {
      for (let i = 0; i < n; i++) {
        const p = this.free.pop() || {};
        const a = Math.random() * Math.PI * 2,
          s = power * (0.3 + Math.random() * 0.7);
        Object.assign(p, {
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 35,
          life: 0.4 + Math.random() * 0.4,
          max: 0.8,
          size: 2 + Math.random() * 4,
          color,
        });
        this.items.push(p);
      }
    }
    float(x, y, text, color = "#fff5c0", size = 20) {
      const t = this.scene.add
        .text(x, y, text, {
          fontFamily: "Trebuchet MS",
          fontSize: size,
          fontStyle: "bold",
          color,
          stroke: "#294b2e",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(90);
      this.labels.push({ t, life: 1.15 });
    }
    ring(x, y, color, radius = 65) {
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        this.burst(
          x + Math.cos(a) * radius,
          y + Math.sin(a) * radius * 0.6,
          color,
          1,
          30,
        );
      }
    }
    update(dt) {
      this.g.clear();
      for (let i = this.items.length - 1; i >= 0; i--) {
        const p = this.items[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.items.splice(i, 1);
          this.free.push(p);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt;
        this.g.fillStyle(p.color, Math.min(1, p.life * 2));
        this.g.fillCircle(p.x, p.y, p.size * Math.min(1, p.life * 3));
      }
      for (let i = this.labels.length - 1; i >= 0; i--) {
        const p = this.labels[i];
        p.life -= dt;
        if (p.collapse) {
          p.t.scaleY = p.baseScale * Math.max(0.05, p.life / 0.32);
          p.t.angle += dt * 60;
        } else p.t.y -= dt * 37;
        p.t.setAlpha(Math.min(1, p.life * 2));
        if (p.life <= 0) {
          p.t.destroy();
          this.labels.splice(i, 1);
        }
      }
    }
    clear() {
      this.items.length = 0;
      for (const p of this.labels) p.t.destroy();
      this.labels.length = 0;
      this.g.clear();
    }
  }
  class InputManager {
    constructor(scene) {
      this.scene = scene;
      this.keys = scene.input.keyboard.addKeys(
        "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,F,P,ESC,ONE,TWO,THREE,FOUR,FIVE,SIX,M",
      );
      this.keys.P.on("down", () => scene.togglePause());
      this.keys.ESC.on("down", () => {
        if (scene.selected) scene.select(null);
        else scene.togglePause();
      });
      this.keys.M.on("down", () => {
        M.audio.toggle();
      });
      ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX"].forEach((k, i) =>
        this.keys[k].on("down", () =>
          scene.select((scene.model.loadout || M.CoreRoster)[i]),
        ),
      );
      scene.input.keyboard
        .addKey("BACKTICK")
        .on("down", () => scene.toggleDebug());
      this.pointer = (p) => scene.onPointer(p);
      scene.input.on("pointerdown", this.pointer);
      scene.input.mouse.disableContextMenu();
    }
    read() {
      const k = this.keys;
      return {
        left: k.A.isDown || k.LEFT.isDown,
        right: k.D.isDown || k.RIGHT.isDown,
        up: k.W.isDown || k.UP.isDown,
        down: k.S.isDown || k.DOWN.isDown,
        jump: Phaser.Input.Keyboard.JustDown(k.SPACE),
        fire: k.F.isDown,
      };
    }
    destroy() {
      this.scene.input.off("pointerdown", this.pointer);
      this.scene.input.keyboard.removeAllKeys(true);
    }
  }
  class BootScene extends Phaser.Scene {
    constructor() {
      super("Boot");
    }
    preload() {
      this.load.image("meadow", "assets/meadow.png");
      for (const key in M.Art.assets) {
        if (M.Art.overrides[key]) this.load.image(key, M.Art.uri(key));
        else this.load.svg(key, M.Art.uri(key), { width: 256, height: 288 });
      }
      this.load.on("loaderror", (file) => {
        document.getElementById("loading").innerHTML =
          `Could not load ${file.key}. Try running the included local server.`;
      });
    }
    create() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x153b28, 0.22);
      g.fillEllipse(50, 15, 90, 24);
      g.generateTexture("shadow", 100, 30);
      g.destroy();
      new M.DefenderAnimator(this).prepareTextures();
      this.textures.get("mario").add("character", 0, ...M.Art.frames.mario.crop);
      this.textures.get("mario").setFilter(Phaser.Textures.FilterMode.NEAREST);
      M.audio = new M.AudioManager();
      M.ui = new M.UI();
      document.getElementById("loading").remove();
      this.scene.start("Menu");
    }
  }
  function backdrop(scene, dim = false) {
    scene.add.image(720, 495, "meadow").setDisplaySize(1440, 810);
    scene.add.rectangle(720, 45, 1440, 90, 0x55bdec);
    if (dim) scene.add.rectangle(720, 450, 1440, 900, 0x173f2a, 0.08);
  }
  class MenuScene extends Phaser.Scene {
    constructor() {
      super("Menu");
    }
    create() {
      backdrop(this, true);
      M.ui.menu(this);
      M.audio.active = true;
      this.spark = new EffectsManager(this);
      this.elapsed = 0;
      this.events.once("shutdown", () => this.spark.clear());
    }
    update(t, dt) {
      M.audio.update(dt / 1000);
      this.elapsed += dt;
      if (this.elapsed > 600) {
        this.elapsed = 0;
        this.spark.burst(
          700 + Math.random() * 700,
          300 + Math.random() * 450,
          0xffec9b,
          2,
          12,
        );
      }
      this.spark.update(dt / 1000);
    }
  }
  class LoadoutScene extends Phaser.Scene {
    constructor() {
      super("Loadout");
    }
    create() {
      backdrop(this);
      M.ui.loadout(this);
    }
    update(t, dt) {
      M.audio.update(dt / 1000);
    }
  }
  class GameScene extends Phaser.Scene {
    constructor() {
      super("Battle");
    }
    create() {
      this.selected = null;
      this.speed = 1;
      this.intro = true;
      this.lastHUD = 0;
      this.renderItems = new Map();
      this.debug = false;
      this.showHitboxes = false;
      this.finishing = false;
      this.lastTrail = 0;
      this.bgPhase = 0;
      backdrop(this);
      this.board = this.add.graphics().setDepth(1);
      this.hover = this.add.graphics().setDepth(3);
      this.health = this.add.graphics().setDepth(60);
      this.ambient = this.add.graphics().setDepth(4);
      this.zone = this.add.graphics().setDepth(2);
      this.drawBoard();
      this.fx = new EffectsManager(this);
      this.defenderAnimator = new M.DefenderAnimator(this);
      this.model = M.mode === "endless"
        ? new M.EndlessModel({ seed: Date.now() >>> 0, progress: M.progress, loadout: M.progress.data.loadout, events: (t,d) => this.event(t,d) })
        : new M.GameModel({ events: (t, d) => this.event(t, d) });
      this.model.paused = true;
      this.marioShadow = this.add
        .image(215, 600, "shadow")
        .setDisplaySize(51, 16)
        .setDepth(5);
      this.marioSprite = this.add
        .image(215, 585, "mario", "character")
        .setDisplaySize((83 * 442) / 590, 83)
        .setOrigin(0.5, 1)
        .setDepth(35);
      this.inputManager = new InputManager(this);
      M.ui.battle(this);
      M.ui.updateBattle(this);
      M.ui.intro(() => {
        this.intro = false;
        this.model.paused = false;
        M.audio.unlock();
        M.audio.active = true;
        M.ui.toast(
          "18 seconds to prepare. Start with Toads and Piranha Plants.",
        );
      });
      this.onBlur = () => {
        if (!this.intro && !this.model.paused && !this.finishing)
          this.togglePause();
      };
      this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur);
      this.events.once("shutdown", () => {
        this.inputManager.destroy();
        this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur);
        this.fx.clear();
        this.renderItems.clear();
        M.audio.active = false;
      });
    }
    drawBoard() {
      const g = C.grid;
      this.board.lineStyle(1, 0xe5fac0, 0.13);
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 9; c++) {
          this.board.fillStyle((r + c) % 2 === 0 ? 0xbce96b : 0x215b2b, 0.035);
          this.board.fillRoundedRect(
            g.x + c * g.cw + 1,
            g.y + r * g.ch + 1,
            g.cw - 2,
            g.ch - 2,
            8,
          );
          this.board.strokeRoundedRect(
            g.x + c * g.cw + 1,
            g.y + r * g.ch + 1,
            g.cw - 2,
            g.ch - 2,
            8,
          );
        }
      this.zone.lineStyle(2, 0xfff1aa, 0.4);
      for (let y = 400; y < 780; y += 14)
        this.zone.lineBetween(C.mario.maxX + 15, y, C.mario.maxX + 15, y + 7);
      this.add
        .text(194, 797, "MARIO’S ZONE", {
          fontFamily: "Trebuchet MS",
          fontSize: 11,
          fontStyle: "bold",
          color: "#fff4bd",
          stroke: "#356232",
          strokeThickness: 3,
        })
        .setDepth(5);
    }
    select(key) {
      if (this.intro || this.model.paused || this.finishing) return;
      if (key && this.selected === key) key = null;
      this.selected = key;
      M.ui.selection(key);
      M.ui.updateBattle(this);
    }
    pointerPosition(pointer) {
      const r = this.game.canvas.getBoundingClientRect(),
        e = pointer.event;
      return e && Number.isFinite(e.clientX)
        ? {
            x: ((e.clientX - r.left) * C.width) / r.width,
            y: ((e.clientY - r.top) * C.height) / r.height,
          }
        : { x: pointer.x, y: pointer.y };
    }
    onPointer(pointer) {
      if (
        this.intro ||
        this.model.paused ||
        this.finishing ||
        pointer.event?.target !== this.game.canvas
      )
        return;
      M.audio.unlock();
      document.activeElement?.blur();
      if (pointer.rightButtonDown()) {
        this.select(null);
        return;
      }
      const { x, y } = this.pointerPosition(pointer);
      for (const c of this.model.coins) {
        if (Math.hypot(c.x - x, c.y - 22 - y) < 31) {
          this.model.collect(c);
          return;
        }
      }
      if (this.selected) {
        const cell = this.model.grid.cell(x, y);
        if (!cell) return;
        const result = this.model.place(this.selected, cell.row, cell.col);
        if (!result.ok) M.ui.toast(result.reason);
        else this.select(null);
      }
    }
    togglePause() {
      if (this.intro || this.finishing) return;
      this.model.paused = !this.model.paused;
      M.audio.active = !this.model.paused;
      if (this.model.paused) M.ui.pause(this);
      else M.ui.root.querySelector(".pause-overlay")?.remove();
    }
    toggleDebug() {
      if (this.intro) return;
      this.debug = !this.debug;
      M.ui.root.querySelector(".debug")?.remove();
      if (!this.debug) {
        this.showHitboxes = false;
        this.speed = 1;
        return;
      }
      const box = document.createElement("div");
      box.className = "debug";
      box.innerHTML = `<b>DEBUG · <span id="fps">60</span> FPS</b><button data-action="coins">+1,000 coins</button><select id="enemy-kind">${Object.entries(
        Object.fromEntries(Object.entries(C.enemies).filter(([key]) => this.model.mode === "endless" || ["goomba","koopa","para","shy","hammer","giant"].includes(key))),
      )
        .map(([k, v]) => `<option value="${k}">${v.name}</option>`)
        .join(
          "",
        )}</select><select id="enemy-lane">${[0, 1, 2, 3, 4].map((n) => `<option value="${n}" ${n === 2 ? "selected" : ""}>Lane ${n + 1}</option>`).join("")}</select><button data-action="spawn">Spawn enemy</button><button data-action="next">Next wave</button><button data-action="speed">Speed: 1×</button><button data-action="hitboxes">Toggle hitboxes</button><button data-action="reset">Reset level</button>`;
      M.ui.root.append(box);
      box.querySelector('[data-action="coins"]').onclick = () =>
        (this.model.money += 1000);
      box.querySelector('[data-action="spawn"]').onclick = () =>
        this.model.spawnEnemy(
          box.querySelector("#enemy-kind").value,
          Number(box.querySelector("#enemy-lane").value),
        );
      box.querySelector('[data-action="next"]').onclick = () =>
        this.model.wave.start();
      box.querySelector('[data-action="speed"]').onclick = () => {
        this.speed = this.speed === 1 ? 4 : 1;
        box.querySelector('[data-action="speed"]').textContent =
          "Speed: " + this.speed + "×";
      };
      box.querySelector('[data-action="hitboxes"]').onclick = () =>
        (this.showHitboxes = !this.showHitboxes);
      box.querySelector('[data-action="reset"]').onclick = () =>
        this.scene.restart();
    }
    event(type, d) {
      const a = M.audio,
        f = this.fx;
      switch (type) {
        case "place":
          a.play("place");
          f.burst(d.x, d.y + 12, 0xd9ed91, 14, 85);
          break;
        case "collect":
          a.play("collect");
          f.burst(d.x, d.y - 18, 0xffde69, 9, 70);
          f.float(d.x, d.y - 42, "+" + d.value);
          break;
        case "generate":
          a.play("place");
          f.burst(d.x, d.y - 30, 0xffdd75, 5, 55);
          break;
        case "shoot":
          if (d.kind !== "piranha") a.play(d.kind === "ice" ? "ice" : "fire");
          else a.play("shoot");
          break;
        case "hammer":
          a.play("shoot");
          break;
        case "impact":
          a.play("hit");
          f.burst(
            d.x,
            d.y,
            d.kind === "ice"
              ? 0xb4f6ff
              : d.kind === "fire"
                ? 0xffa33d
                : 0xd2ee83,
            d.kind === "fire" ? 13 : 7,
            90,
          );
          break;
        case "enemyDeath":
          f.burst(
            d.x,
            d.y - 10,
            d.type === "giant" ? 0xffd972 : 0xd3b57b,
            d.type === "giant" ? 70 : 13,
            d.type === "giant" ? 250 : 100,
          );
          if (d.type === "giant") {
            this.cameras.main.shake(350, 0.008);
            f.float(d.x, d.y - 65, "BOSS DEFEATED!", "#ffe58a", 30);
          }
          break;
        case "defenderDeath":
          if (d.type !== "bomb") {
            const view = this.renderItems.get(d.id);
            if (view) {
              const s = view.sprite;
              const ghost = this.add
                .image(s.x, s.y, d.type, s.frame.name)
                .setOrigin(0.5, 1)
                .setScale(s.scaleX, s.scaleY)
                .setAngle(s.angle)
                .setDepth(70);
              this.fx.labels.push({
                t: ghost,
                life: 0.32,
                collapse: true,
                baseScale: s.scaleY,
              });
            }
          }
          if (d.type !== "bomb") f.burst(d.x, d.y, 0x87b561, 14, 90);
          break;
        case "defenderHit":
          f.burst(d.x, d.y - 10, 0xffca9b, 3, 50);
          break;
        case "explosion":
          a.play("explosion");
          f.burst(d.x, d.y - 10, 0xffb246, 60, 270);
          f.burst(d.x, d.y - 10, 0xffec8a, 40, 190);
          f.ring(d.x, d.y, 0xffe3a1, d.radius);
          this.cameras.main.shake(250, 0.006);
          f.float(d.x, d.y - 75, "BOOM!", "#ffe991", 30);
          break;
        case "vault":
          f.float(d.x, d.y - 50, "VAULT!", "#f8f9e4", 14);
          break;
        case "shell":
          f.burst(d.x, d.y, 0xe7f0b2, 9, 75);
          break;
        case "jump":
          a.play("jump");
          f.burst(d.x, d.y + 10, 0xf5e3aa, 5, 50);
          break;
        case "land":
          f.ring(d.x, d.y + 12, 0xfff0bf, d.strong ? 45 : 20);
          if (d.strong) {
            a.play("hit");
            f.float(d.x, d.y - 48, "STOMP!");
          }
          break;
        case "blockHit":
          a.play("block");
          f.burst(d.x, d.y - 62, 0xffdb65, 22, 140);
          f.float(d.x, d.y - 70, "NICE!", "#fff4c0", 18);
          break;
        case "blockSpawn":
          M.ui.toast("A ? Block appeared! Move beneath it and jump.");
          break;
        case "power":
          a.play("power");
          f.ring(this.model.mario.x, this.model.mario.y, 0xffed83, 60);
          M.ui.toast(
            d.type === "star"
              ? "STAR POWER! Touch enemies to damage them."
              : d.type === "fire"
                ? "FIRE POWER! Hold F to throw fireballs."
                : "TEAM SHIELD! Defenders take half damage.",
          );
          break;
        case "marioHit":
          a.play("hit");
          f.burst(d.x, d.y - 25, 0xff9584, 13, 100);
          break;
        case "marioDown":
          M.ui.toast("Mario is down! −2 castle shields · −75 coins");
          break;
        case "breach":
          a.play("explosion");
          this.cameras.main.shake(200, 0.004);
          f.float(193, 510, "CASTLE −" + d.value, "#ffb3a3", 27);
          break;
        case "wave":
          a.play("wave");
          M.ui.warning(d.name, `WAVE ${d.index + 1} OF 8`);
          break;
        case "boss":
          a.play("boss");
          this.cameras.main.shake(500, 0.006);
          M.ui.warning("MAKE ROOM FOR THE BIG GUY", "GIANT GOOMBA HAS ARRIVED");
          break;
        case "stomp":
          a.play("explosion");
          f.ring(d.x, d.y, 0xffd591, 150);
          f.burst(d.x, d.y, 0xc2a574, 25, 160);
          this.cameras.main.shake(230, 0.004);
          break;
        case "victory":
        case "defeat":
          this.finishing = true;
          M.audio.active = false;
          a.play(type);
          if (type === "victory") {
            f.burst(720, 450, 0xffd65b, 160, 500);
            try {
              const progress = JSON.parse(
                localStorage.getItem("meadow-progress") || "{}",
              );
              progress.completed = Array.from(
                new Set([...(progress.completed || []), C.level.id]),
              );
              progress.unlocks = Array.from(
                new Set([...(progress.unlocks || []), C.level.unlock]),
              );
              progress.bestCastle = Math.max(
                progress.bestCastle || 0,
                this.model.castle,
              );
              localStorage.setItem("meadow-progress", JSON.stringify(progress));
            } catch {}
          }
          this.time.delayedCall(1600, () =>
            this.scene.start("Result", {
              won: type === "victory",
              stats: { ...this.model.stats },
              castle: this.model.castle,
            }),
          );
          break;
      }
    }
    getView(o, texture, size, depth = 20) {
      let v = this.renderItems.get(o.id);
      if (!v) {
        v = {
          sprite: this.add.image(o.x, o.y, texture).setOrigin(0.5, 0.85),
          shadow: this.add.image(o.x, o.y + 12, "shadow"),
          id: o.id,
        };
        this.renderItems.set(o.id, v);
      }
      if (v.sprite.texture.key !== texture) v.sprite.setTexture(texture);
      v.sprite.setDisplaySize(size, size * 1.125).setDepth(depth);
      v.shadow.setDisplaySize(size * 0.75, size * 0.22).setDepth(4);
      v.seen = true;
      return v;
    }
    renderState(dt) {
      const g = this.model,
        t = g.time;
      this.health.clear();
      for (const v of this.renderItems.values()) v.seen = false;
      for (const d of g.defenders) {
        const size = d.type === "pipe" ? 72 : d.type === "bomb" ? 64 : 73,
          v = this.getView(d, d.type, size, 10 + d.row * 3);
        this.defenderAnimator.render(v, d, t);
        v.sprite.clearTint();
        if (d.hit > 0) v.sprite.setTintFill(0xffe2b7);
        if (g.buff > 0) v.sprite.setTint(0xd8faff);
        if (d.type === "bomb") {
          v.sprite.setTint(
            d.age > 0.9 && Math.floor(d.age * 18) % 2 ? 0xffaf6c : 0xffffff,
          );
        }
        if (d.hp < d.maxHP || this.showHitboxes)
          this.drawHP(d.x, d.y + 27, d.hp / d.maxHP, 49, 0x9be667);
        if (d.type === "pipe" && d.hp < d.maxHP * 0.65) {
          this.health.lineStyle(3, 0x204724, 0.9);
          this.health.beginPath();
          this.health.moveTo(d.x + 8, d.y - 24);
          this.health.lineTo(d.x - 3, d.y - 9);
          this.health.lineTo(d.x + 6, d.y);
          this.health.lineTo(d.x - 4, d.y + 16);
          this.health.strokePath();
          if (d.hp < d.maxHP * 0.3) {
            this.health.lineBetween(d.x - 25, d.y - 11, d.x - 9, d.y - 4);
            this.health.lineBetween(d.x - 9, d.y - 4, d.x - 16, d.y + 9);
          }
        }
      }
      for (const e of g.enemies) {
        const size = C.enemies[e.type].size,
          v = this.getView(e, e.shell ? "shell" : e.type, size, 12 + e.row * 3);
        if (M.Art.overrides[v.sprite.texture.key]) {
          const frame = v.sprite.frame;
          const scale = Math.min(size / frame.width, (size * 1.125) / frame.height);
          v.sprite.setScale(scale).setOrigin(0.5, 1);
        }
        const walk = Math.sin(e.age * (e.type === "shy" ? 14 : 9)),
          jump =
            e.jumpTime > 0 ? Math.sin((e.jumpTime / 0.65) * Math.PI) * 65 : 0,
          flight = e.type === "para" && !e.jumped ? 8 + Math.sin(t * 7) * 5 : 0;
        v.sprite.setPosition(
          e.x + (e.action > 0 ? -Math.sin(e.action * 17) * 5 : 0),
          e.y + 16 - Math.abs(walk) * 2 - jump - flight,
        );
        v.sprite.setAngle(e.type === "giant" ? walk * 1 : walk * 3);
        v.shadow.setPosition(e.x, e.y + 18);
        v.sprite.clearTint();
        if (e.slowTime > 0) {
          v.sprite.setTint(0x94ddff);
          if (Math.floor(t * 10 + e.id) % 7 === 0)
            this.fx.burst(e.x, e.y - 8, 0xc7f8ff, 1, 35);
        }
        if (e.hit > 0) v.sprite.setTintFill(0xffe9bd);
        if (e.hp < e.maxHP && e.type !== "giant")
          this.drawHP(
            e.x,
            e.y - size * 0.78,
            e.hp / e.maxHP,
            43,
            e.slowTime > 0 ? 0x7ed6ff : 0xf2b460,
          );
        if (this.showHitboxes) {
          this.health.lineStyle(1, 0xff8888, 1);
          this.health.strokeRect(e.x - 26, e.y - 30, 52, 60);
        }
      }
      for (const c of g.coins) {
        const v = this.getView(c, "coin", 33, 65);
        const bounce =
          c.age < 0.75
            ? Math.abs(Math.sin((c.age / 0.75) * Math.PI * 2)) * 24
            : Math.sin(t * 3 + c.id) * 3;
        v.sprite.setOrigin(0.5).setPosition(c.x, c.y - 22 - bounce);
        v.sprite.setDisplaySize(30 + Math.sin(t * 4 + c.id) * 4, 39);
        v.sprite.setAlpha(
          c.age > c.life - 4 ? 0.55 + Math.sin(t * 9) * 0.3 : 1,
        );
        v.shadow.setPosition(c.x, c.y + 7).setDisplaySize(29, 8);
      }
      for (const b of g.blocks) {
        const v = this.getView(b, "block", 49, 30);
        v.sprite
          .setOrigin(0.5)
          .setPosition(b.x, b.y - 57 + Math.sin(t * 2) * 2);
        v.shadow.setPosition(b.x, b.y + 13).setDisplaySize(37, 9);
        v.sprite.setAlpha(b.age > b.life - 4 ? 0.6 + Math.sin(t * 9) * 0.3 : 1);
      }
      for (const p of g.powerups) {
        const v = this.getView(p, p.type, 42, 33);
        v.sprite
          .setOrigin(0.5)
          .setPosition(p.x, p.y - 16 + Math.sin(t * 4) * 5);
        v.shadow.setPosition(p.x, p.y + 10).setDisplaySize(30, 8);
      }
      for (const p of g.projectiles) {
        const key =
            {
              piranha: "projectile",
              fire: "fireball",
              ice: "iceball",
              hammer: "hammerball",
            }[p.kind] || "projectile",
          v = this.getView(p, key, p.kind === "hammer" ? 36 : 30, 50);
        let y = p.y;
        if (p.kind === "hammer") {
          const progress = (p.startX - p.x) / Math.max(1, p.startX - p.targetX);
          y -= Math.sin(Math.min(1, progress) * Math.PI) * 85;
          v.sprite.setAngle(p.age * 700);
        } else if (p.kind === "fire") y += Math.sin(p.age * 15) * 5;
        v.sprite.setOrigin(0.5).setPosition(p.x, y);
        v.shadow.setVisible(false);
        if (this.lastTrail > 0.05 && p.kind !== "hammer")
          this.fx.burst(
            p.x - 12,
            y,
            p.kind === "fire"
              ? 0xffa62b
              : p.kind === "ice"
                ? 0xb9f7ff
                : 0xb1d55a,
            1,
            15,
          );
      }
      for (const [id, v] of this.renderItems)
        if (!v.seen) {
          v.sprite.destroy();
          v.shadow.destroy();
          this.renderItems.delete(id);
        }
      const m = g.mario;
      const jump =
        m.jump > 0
          ? Math.sin((1 - m.jump / C.mario.jumpDuration) * Math.PI) * 82
          : 0;
      this.marioSprite
        .setPosition(
          m.x,
          m.y + 17 - jump - (m.walking ? Math.abs(Math.sin(t * 17)) * 3 : 0),
        )
        .setFlipX(m.facing < 0)
        .setAngle(m.walking ? Math.sin(t * 17) * 3 : 0);
      this.marioSprite
        .setVisible(m.respawn <= 0)
        .setAlpha(m.invuln > 0 && Math.floor(t * 12) % 2 ? 0.35 : 1)
        .setDepth(40);
      this.marioShadow
        .setPosition(m.x, m.y + 18)
        .setVisible(m.respawn <= 0)
        .setAlpha(jump > 0 ? 0.6 : 1);
      this.marioSprite.clearTint();
      if (m.star > 0) {
        this.marioSprite.setTint(
          Phaser.Display.Color.HSVToRGB((t * 0.7) % 1, 0.35, 1).color,
        );
        if (this.lastTrail > 0.05)
          this.fx.burst(m.x, m.y - 15, 0xffe57b, 2, 80);
      } else if (m.fire > 0) this.marioSprite.setTint(0xffdfbf);
      if (this.lastTrail > 0.05) this.lastTrail = 0;
    }
    drawHP(x, y, pct, width, color) {
      this.health.fillStyle(0x153327, 0.8);
      this.health.fillRoundedRect(x - width / 2 - 2, y - 2, width + 4, 7, 3);
      this.health.fillStyle(color, 1);
      this.health.fillRoundedRect(
        x - width / 2,
        y,
        Math.max(0, width * pct),
        3,
        2,
      );
    }
    drawHover() {
      this.hover.clear();
      if (this.model.paused || !this.selected) return;
      const g = C.grid;
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 9; c++)
          if (!this.model.grid.get(r, c)) {
            this.hover.fillStyle(0xe7ffb6, 0.075);
            this.hover.fillRoundedRect(
              g.x + c * g.cw + 3,
              g.y + r * g.ch + 3,
              g.cw - 6,
              g.ch - 6,
              9,
            );
          }
      const p = this.pointerPosition(this.input.activePointer),
        cell = this.model.grid.cell(p.x, p.y);
      if (cell) {
        const { row, col } = cell,
          valid =
            !this.model.grid.get(row, col) &&
            this.model.money >= C.defenders[this.selected].cost &&
            !(this.model.cooldowns[this.selected] > 0);
        this.hover.lineStyle(3, valid ? 0xfff4ba : 0xff7970, 0.9);
        this.hover.fillStyle(valid ? 0xffed99 : 0xd75547, 0.15);
        this.hover.fillRoundedRect(
          g.x + col * g.cw + 3,
          g.y + row * g.ch + 3,
          g.cw - 6,
          g.ch - 6,
          10,
        );
        this.hover.strokeRoundedRect(
          g.x + col * g.cw + 3,
          g.y + row * g.ch + 3,
          g.cw - 6,
          g.ch - 6,
          10,
        );
      }
    }
    drawAmbient(dt) {
      this.bgPhase += dt;
      this.ambient.clear();
      const t = this.bgPhase;
      for (let i = 0; i < 12; i++) {
        const x = 425 + ((i * 129 + t * (4 + (i % 3))) % 900),
          y = 340 + Math.sin(t * 0.7 + i * 4) * 18;
        this.ambient.fillStyle(i % 2 ? 0xfff3a4 : 0xffffff, 0.6);
        this.ambient.fillEllipse(x, y, 3 + Math.sin(t * 10 + i) * 2, 3);
      }
      if (this.model.blocks.length) {
        for (const b of this.model.blocks) {
          this.ambient.lineStyle(2, 0xfff4ad, 0.45 + 0.2 * Math.sin(t * 4));
          this.ambient.strokeEllipse(b.x, b.y + 14, 57, 17);
        }
      }
    }
    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.05);
      if (!this.model) return;
      const input = this.inputManager.read();
      for (let i = 0; i < this.speed; i++)
        this.model.update(dt, i === 0 ? input : { ...input, jump: false });
      if (!this.model.paused) {
        this.lastTrail += dt;
        this.renderState(dt);
        this.fx.update(dt);
        this.drawAmbient(dt);
        M.audio.update(dt);
      }
      this.drawHover();
      this.lastHUD += dt;
      if (this.lastHUD > 0.1) {
        this.lastHUD = 0;
        M.ui.updateBattle(this);
        if (this.debug) {
          const fps = M.ui.root.querySelector("#fps");
          if (fps) fps.textContent = Math.round(this.game.loop.actualFps);
        }
      }
    }
  }
  class VictoryScene extends Phaser.Scene {
    constructor() {
      super("Result");
    }
    init(data) {
      this.dataResult = data;
    }
    create() {
      backdrop(this);
      M.ui.result(this, this.dataResult);
      this.fx = new EffectsManager(this);
      this.clock = 0;
      this.events.once("shutdown", () => this.fx.clear());
    }
    update(time, delta) {
      if (this.dataResult.won) {
        this.clock += delta;
        if (this.clock > 220) {
          this.clock = 0;
          this.fx.burst(
            Math.random() * 1440,
            Math.random() * 250,
            Math.random() > 0.5 ? 0xffdf6b : 0xfff8cb,
            6,
            60,
          );
        }
        this.fx.update(delta / 1000);
      }
    }
  }
  Object.assign(M, {
    EffectsManager,
    InputManager,
    BootScene,
    MenuScene,
    LoadoutScene,
    GameScene,
    VictoryScene,
  });
})(Meadow);
