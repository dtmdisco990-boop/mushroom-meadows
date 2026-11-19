"use strict";
(function (M) {
  const C = M.Config,
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  class GridManager {
    constructor() {
      Object.assign(this, C.grid);
      this.cells = Array(this.rows * this.cols).fill(null);
    }
    position(row, col) {
      return {
        x: this.x + (col + 0.5) * this.cw,
        y: this.y + (row + 0.5) * this.ch,
      };
    }
    cell(x, y) {
      const col = Math.floor((x - this.x) / this.cw),
        row = Math.floor((y - this.y) / this.ch);
      return row >= 0 && row < this.rows && col >= 0 && col < this.cols
        ? { row, col }
        : null;
    }
    get(row, col) {
      return this.cells[row * this.cols + col];
    }
    put(d) {
      this.cells[d.row * this.cols + d.col] = d;
    }
    remove(d) {
      if (this.get(d.row, d.col) === d)
        this.cells[d.row * this.cols + d.col] = null;
    }
  }
  class Defender {
    constructor(id, type, row, col, grid) {
      Object.assign(this, {
        id,
        type,
        row,
        col,
        ...grid.position(row, col),
        hp: C.defenders[type].hp,
        maxHP: C.defenders[type].hp,
        alive: true,
        age: 0,
        hit: 0,
        action: 0,
        timer: C.defenders[type].first || 0.4,
      });
    }
  }
  class Enemy {
    constructor(id, type, row, x) {
      const d = C.enemies[type];
      Object.assign(this, {
        id,
        type,
        row,
        x,
        y: C.grid.y + (row + 0.5) * C.grid.ch,
        hp: d.hp,
        maxHP: d.hp,
        alive: true,
        age: 0,
        hit: 0,
        action: 0,
        attackTimer: 0,
        throwTimer: 1,
        slowTime: 0,
        jumped: false,
        jumpTime: 0,
        shell: false,
        stompTimer: d.stompInterval || 7,
      });
    }
  }
  class Coin {
    constructor(id, x, y, value, source = "enemy") {
      Object.assign(this, {
        id,
        x,
        y,
        value,
        source,
        age: 0,
        alive: true,
        life: C.economy.coinLifetime,
      });
    }
  }
  class PowerUp {
    constructor(id, type, x, y) {
      Object.assign(this, { id, type, x, y, age: 0, alive: true, life: 15 });
    }
  }
  class Projectile {
    reset(values) {
      Object.assign(this, {
        alive: true,
        age: 0,
        hit: 0,
        source: "defender",
        slow: 0,
        splash: 0,
        target: null,
        ...values,
      });
      return this;
    }
  }
  class Mario {
    constructor() {
      Object.assign(this, {
        x: 215,
        y: 585,
        hearts: C.mario.hearts,
        jump: 0,
        jumpCooldown: 0,
        invuln: 0,
        respawn: 0,
        star: 0,
        fire: 0,
        fireTimer: 0,
        facing: 1,
        walking: false,
        hit: 0,
      });
    }
  }
  class WaveManager {
    constructor(game) {
      this.game = game;
      this.index = -1;
      this.elapsed = 0;
      this.next = C.preparation;
      this.cursor = 0;
      this.complete = false;
    }
    start() {
      if (this.index >= C.level.waves.length - 1) return;
      this.index++;
      this.elapsed = 0;
      this.cursor = 0;
      this.next = C.level.waves[this.index].duration;
      this.game.emit("wave", {
        index: this.index,
        ...C.level.waves[this.index],
      });
    }
    update(dt) {
      if (this.complete) return;
      if (this.index < 0) {
        this.next -= dt;
        if (this.next <= 0) this.start();
        return;
      }
      this.elapsed += dt;
      this.next -= dt;
      const w = C.level.waves[this.index];
      while (
        this.cursor < w.spawns.length &&
        this.elapsed >= w.spawns[this.cursor][0]
      ) {
        const [, type, row] = w.spawns[this.cursor++];
        this.game.spawnEnemy(type, row);
      }
      if (this.next <= 0) {
        if (this.index < C.level.waves.length - 1) this.start();
        else if (this.cursor === w.spawns.length) this.complete = true;
      }
    }
  }
  class GameModel {
    constructor({ seed = 1337, events = () => {} } = {}) {
      this.seed = seed;
      this.events = events;
      this.id = 0;
      this.grid = new GridManager();
      this.defenders = [];
      this.enemies = [];
      this.coins = [];
      this.projectiles = [];
      this.pool = [];
      this.powerups = [];
      this.blocks = [];
      this.mario = new Mario();
      this.cooldowns = {};
      this.money = C.economy.start;
      this.castle = C.castleHP;
      this.status = "playing";
      this.paused = false;
      this.time = 0;
      this.skyTimer = 5;
      this.blockTimer = 7;
      this.buff = 0;
      this.wave = new WaveManager(this);
      this.stats = { kills: 0, collected: 0, planted: 0, stomps: 0 };
    }
    random() {
      this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }
    emit(type, data = {}) {
      this.events(type, data);
    }
    place(type, row, col) {
      const def = C.defenders[type];
      if (this.paused || this.status !== "playing")
        return { ok: false, reason: "Game paused" };
      if (!def || row < 0 || row >= 5 || col < 0 || col >= 9)
        return { ok: false, reason: "Choose a lawn tile" };
      if (this.grid.get(row, col))
        return { ok: false, reason: "That tile is occupied" };
      if ((this.cooldowns[type] || 0) > 0)
        return { ok: false, reason: "Defender is recharging" };
      if (this.money < def.cost)
        return { ok: false, reason: "Not enough coins" };
      const d = new Defender(++this.id, type, row, col, this.grid);
      this.money -= def.cost;
      this.cooldowns[type] = def.cooldown;
      this.grid.put(d);
      this.defenders.push(d);
      this.stats.planted++;
      this.emit("place", d);
      return { ok: true, defender: d };
    }
    remove(d) {
      d.alive = false;
      this.grid.remove(d);
      this.emit("defenderDeath", d);
    }
    spawnEnemy(type, row, x = 1404) {
      if (!C.enemies[type]) return null;
      const e = new Enemy(++this.id, type, clamp(row, 0, 4), x);
      this.enemies.push(e);
      if (type === "giant") this.emit("boss", e);
      else this.emit("spawn", e);
      return e;
    }
    spawnCoin(x, y, value, source) {
      const c = new Coin(++this.id, x, y, value, source);
      this.coins.push(c);
      this.emit("coinSpawn", c);
      return c;
    }
    collect(c) {
      if (!c.alive || this.paused || this.status !== "playing") return false;
      c.alive = false;
      this.money += c.value;
      this.stats.collected += c.value;
      this.emit("collect", c);
      return true;
    }
    fire(values) {
      const p = (this.pool.pop() || new Projectile()).reset({
        id: ++this.id,
        ...values,
      });
      this.projectiles.push(p);
      this.emit(p.source === "enemy" ? "hammer" : "shoot", p);
      return p;
    }
    damageEnemy(e, damage) {
      if (!e.alive) return;
      e.hp -= damage * (e.shell ? C.enemies.koopa.shellArmor : 1);
      e.hit = 0.15;
      if (e.hp <= 0) {
        e.alive = false;
        this.stats.kills++;
        this.spawnCoin(e.x, e.y, C.enemies[e.type].reward);
        this.emit("enemyDeath", e);
      } else if (
        e.type === "koopa" &&
        !e.shell &&
        e.hp / e.maxHP < C.enemies.koopa.shellAt
      ) {
        e.shell = true;
        this.emit("shell", e);
      }
    }
    damageDefender(d, damage) {
      if (!d.alive) return;
      d.hp -= damage * (this.buff > 0 ? 0.5 : 1);
      d.hit = 0.18;
      this.emit("defenderHit", d);
      if (d.hp <= 0) this.remove(d);
    }
    damageMario() {
      const m = this.mario;
      if (m.invuln > 0 || m.star > 0 || m.respawn > 0) return;
      m.hearts--;
      m.invuln = C.mario.invulnerability;
      m.hit = 0.3;
      this.emit("marioHit", m);
      if (m.hearts <= 0) {
        m.respawn = C.mario.respawn;
        this.money = Math.max(0, this.money - C.mario.deathCoins);
        this.hurtCastle(C.mario.deathCastle);
        this.emit("marioDown", m);
      }
    }
    hurtCastle(value) {
      this.castle = Math.max(0, this.castle - value);
      this.emit("breach", { value });
      if (this.castle === 0) this.finish(false);
    }
    finish(won) {
      if (this.status !== "playing") return;
      this.status = won ? "victory" : "defeat";
      this.emit(this.status, this.stats);
    }
    spawnBlock(row = Math.floor(this.random() * 5)) {
      const b = {
        id: ++this.id,
        x: 205,
        y: this.grid.position(row, 0).y,
        age: 0,
        alive: true,
        life: C.block.lifetime,
      };
      this.blocks.push(b);
      this.emit("blockSpawn", b);
      return b;
    }
    hitBlock(b) {
      if (!b.alive) return;
      b.alive = false;
      this.emit("blockHit", b);
      const rewards = ["coins", "fire", "coins", "star", "burst", "shield"];
      const type = rewards[Math.floor(this.random() * rewards.length)];
      if (type === "coins" || type === "burst") {
        for (let i = 0; i < (type === "burst" ? 4 : 2); i++)
          this.spawnCoin(b.x + (i - 1) * 26, b.y + 18, 25, "block");
      } else this.powerups.push(new PowerUp(++this.id, type, b.x, b.y + 8));
    }
    power(type) {
      const m = this.mario;
      if (type === "star") m.star = C.mario.starDuration;
      if (type === "fire") m.fire = C.mario.fireDuration;
      if (type === "shield") this.buff = C.mario.shieldDuration;
      this.emit("power", { type });
    }
    updateMario(dt, input) {
      const m = this.mario;
      for (const k of [
        "jumpCooldown",
        "invuln",
        "star",
        "fire",
        "fireTimer",
        "hit",
      ])
        m[k] = Math.max(0, m[k] - dt);
      if (m.respawn > 0) {
        m.respawn -= dt;
        if (m.respawn <= 0) {
          m.hearts = C.mario.hearts;
          m.invuln = 3;
          m.x = 215;
          m.y = 585;
        }
        return;
      }
      const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0),
        dy = (input.down ? 1 : 0) - (input.up ? 1 : 0),
        norm = Math.hypot(dx, dy) || 1;
      m.walking = !!(dx || dy);
      if (dx) m.facing = dx;
      m.x = clamp(
        m.x + (dx / norm) * C.mario.speed * dt,
        C.mario.minX,
        C.mario.maxX,
      );
      m.y = clamp(
        m.y + (dy / norm) * C.mario.speed * dt,
        C.mario.minY,
        C.mario.maxY,
      );
      if (input.jump && m.jump === 0 && m.jumpCooldown === 0) {
        m.jump = C.mario.jumpDuration;
        m.jumpCooldown = C.mario.jumpCooldown;
        this.emit("jump", m);
      }
      if (m.jump > 0) {
        const before = m.jump;
        m.jump = Math.max(0, m.jump - dt);
        for (const b of this.blocks)
          if (
            b.alive &&
            Math.abs(b.x - m.x) < 48 &&
            Math.abs(b.y - m.y) < 45 &&
            m.jump < C.mario.jumpDuration * 0.65
          )
            this.hitBlock(b);
        if (before > 0 && m.jump === 0) {
          let hit = false;
          for (const e of this.enemies)
            if (
              e.alive &&
              Math.abs(e.x - m.x) < 63 &&
              Math.abs(e.y - m.y) < 43
            ) {
              this.damageEnemy(
                e,
                C.mario.stompDamage * (e.type === "giant" ? 0.45 : 1),
              );
              e.x += 12;
              hit = true;
              this.stats.stomps++;
            }
          this.emit("land", { x: m.x, y: m.y, strong: hit });
          if (hit) m.invuln = Math.max(m.invuln, 0.8);
        }
      }
      if (input.fire && m.fire > 0 && m.fireTimer === 0) {
        m.fireTimer = C.mario.fireInterval;
        this.fire({
          source: "mario",
          kind: "fire",
          x: m.x + 25,
          y: m.y,
          row: clamp(Math.floor((m.y - C.grid.y) / C.grid.ch), 0, 4),
          vx: 420,
          damage: 45,
          splash: 55,
        });
      }
      for (const e of this.enemies)
        if (e.alive && Math.abs(e.x - m.x) < 35 && Math.abs(e.y - m.y) < 30) {
          if (m.star > 0) {
            this.damageEnemy(e, 190 * dt);
            e.x += dt * 20;
          } else if (m.jump === 0) this.damageMario();
        }
      for (const c of this.coins)
        if (c.alive && Math.hypot(c.x - m.x, c.y - m.y) < 42) this.collect(c);
      for (const p of this.powerups)
        if (p.alive && Math.hypot(p.x - m.x, p.y - m.y) < 48) {
          p.alive = false;
          this.power(p.type);
        }
    }
    updateDefender(d, dt) {
      const def = C.defenders[d.type];
      d.age += dt;
      d.hit = Math.max(0, d.hit - dt);
      d.action = Math.max(0, d.action - dt);
      d.timer -= dt;
      if (d.type === "toad") {
        if (d.timer <= 0) {
          d.timer = def.interval;
          d.action = 0.5;
          this.spawnCoin(d.x + 22, d.y - 18, def.income, "toad");
          this.emit("generate", d);
        }
        return;
      }
      if (d.type === "bomb") {
        if (d.age >= def.arm) {
          for (const e of this.enemies)
            if (
              e.alive &&
              Math.abs(e.row - d.row) <= 1 &&
              Math.abs(e.x - d.x) <= C.grid.cw * 1.5
            )
              this.damageEnemy(e, def.damage);
          this.remove(d);
          this.emit("explosion", { x: d.x, y: d.y, radius: C.grid.cw * 1.5 });
        }
        return;
      }
      if (!def.damage) return;
      if (
        d.timer <= 0 &&
        this.enemies.some(
          (e) => e.alive && e.row === d.row && e.x > d.x - 18 && e.x < 1445,
        )
      ) {
        d.timer = def.interval;
        d.action = 0.2;
        this.fire({
          kind: d.type,
          x: d.x + 26,
          y: d.y - 10,
          row: d.row,
          vx: def.projectileSpeed,
          damage: def.damage,
          slow: def.slowDuration || 0,
          splash: def.splash || 0,
        });
      }
    }
    updateEnemy(e, dt) {
      const def = C.enemies[e.type];
      e.age += dt;
      e.hit = Math.max(0, e.hit - dt);
      e.action = Math.max(0, e.action - dt);
      e.slowTime = Math.max(0, e.slowTime - dt);
      e.attackTimer -= dt;
      e.throwTimer -= dt;
      e.stompTimer -= dt;
      if (e.jumpTime > 0) {
        e.jumpTime -= dt;
        e.x -= (C.enemies.para.jumpDistance * dt) / 0.65;
        return;
      }
      const targets = this.defenders
        .filter((d) => d.alive && d.row === e.row && d.x < e.x + 28)
        .sort((a, b) => b.x - a.x);
      const target = targets[0];
      const gap = target ? e.x - target.x : Infinity;
      if (e.type === "para" && !e.jumped && target && gap < 72) {
        e.jumped = true;
        e.jumpTime = 0.65;
        this.emit("vault", e);
        return;
      }
      if (e.type === "giant" && e.stompTimer <= 0) {
        e.stompTimer = def.stompInterval;
        e.action = 0.65;
        for (const d of this.defenders)
          if (
            d.alive &&
            Math.abs(d.x - e.x) < 185 &&
            Math.abs(d.row - e.row) <= 1
          )
            this.damageDefender(d, def.stompDamage);
        if (
          Math.hypot(this.mario.x - e.x, this.mario.y - e.y) < 150 &&
          this.mario.jump === 0
        )
          this.damageMario();
        this.emit("stomp", e);
      }
      if (target && gap < 52 + (e.type === "giant" ? 24 : 0)) {
        if (e.attackTimer <= 0) {
          e.attackTimer = def.interval;
          e.action = 0.25;
          this.damageDefender(target, def.damage);
          this.emit("bite", e);
        }
        return;
      }
      if (e.type === "hammer" && target && gap < def.range) {
        if (e.throwTimer <= 0) {
          e.throwTimer = def.throwInterval;
          e.action = 0.35;
          this.fire({
            source: "enemy",
            kind: "hammer",
            x: e.x - 15,
            y: e.y - 25,
            row: e.row,
            vx: -250,
            damage: def.rangedDamage,
            target: target.id,
            startX: e.x,
            targetX: target.x,
          });
        }
        return;
      }
      e.x -=
        def.speed *
        (e.slowTime > 0 ? C.defenders.ice.slow : 1) *
        (e.shell ? 0.75 : 1) *
        dt;
      if (e.x < 135) {
        e.alive = false;
        this.hurtCastle(def.breach || 1);
      }
    }
    updateProjectiles(dt) {
      for (const p of this.projectiles) {
        if (!p.alive) continue;
        const prev = p.x;
        p.x += p.vx * dt;
        p.age += dt;
        if (p.source === "enemy") {
          const d = this.defenders.find((d) => d.id === p.target && d.alive);
          if (!d) {
            p.alive = false;
            continue;
          }
          if (p.x <= d.x + 22) {
            this.damageDefender(d, p.damage);
            p.alive = false;
            this.emit("impact", { x: d.x, y: d.y, kind: "hammer" });
          }
        } else {
          const hit = this.enemies
            .filter(
              (e) =>
                e.alive &&
                e.row === p.row &&
                e.x >= prev - 30 &&
                e.x <= p.x + 30,
            )
            .sort((a, b) => a.x - b.x)[0];
          if (hit) {
            this.damageEnemy(hit, p.damage);
            if (p.slow) hit.slowTime = p.slow;
            if (p.splash)
              for (const other of this.enemies)
                if (
                  other !== hit &&
                  other.alive &&
                  other.row === hit.row &&
                  Math.abs(other.x - hit.x) < p.splash
                )
                  this.damageEnemy(other, p.damage * 0.5);
            p.alive = false;
            this.emit("impact", { x: hit.x, y: hit.y - 12, kind: p.kind });
          }
        }
        if (p.x > 1480 || p.x < 90 || p.age > 5) p.alive = false;
      }
    }
    update(dt, input = {}) {
      if (this.paused || this.status !== "playing") return;
      dt = Math.min(dt, 0.05);
      this.time += dt;
      this.buff = Math.max(0, this.buff - dt);
      for (const k in this.cooldowns)
        this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
      this.wave.update(dt);
      this.skyTimer -= dt;
      if (this.skyTimer <= 0) {
        this.skyTimer = C.economy.skyInterval;
        this.spawnCoin(
          300 + this.random() * 960,
          420 + this.random() * 310,
          C.economy.skyValue,
          "sky",
        );
      }
      this.blockTimer -= dt;
      if (this.blockTimer <= 0) {
        this.blockTimer = C.block.interval;
        this.spawnBlock();
      }
      this.updateMario(dt, input);
      for (const d of this.defenders) if (d.alive) this.updateDefender(d, dt);
      for (const e of this.enemies) if (e.alive) this.updateEnemy(e, dt);
      this.updateProjectiles(dt);
      for (const list of [this.coins, this.blocks, this.powerups])
        for (const o of list) {
          o.age += dt;
          if (o.age > o.life) o.alive = false;
        }
      this.defenders = this.defenders.filter((d) => d.alive);
      this.enemies = this.enemies.filter((e) => e.alive);
      this.coins = this.coins.filter((c) => c.alive);
      this.blocks = this.blocks.filter((b) => b.alive);
      this.powerups = this.powerups.filter((p) => p.alive);
      for (const p of this.projectiles) if (!p.alive) this.pool.push(p);
      this.projectiles = this.projectiles.filter((p) => p.alive);
      if (this.wave.complete && this.enemies.length === 0) this.finish(true);
    }
  }
  Object.assign(M, {
    GridManager,
    Defender,
    Enemy,
    Coin,
    PowerUp,
    Projectile,
    Mario,
    WaveManager,
    GameModel,
  });
})(Meadow);
if (typeof module !== "undefined") module.exports = Meadow;
