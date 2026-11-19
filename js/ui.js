"use strict";
(function (M) {
  const C = M.Config,
    art = (k) => M.Art.uri(k),
    img = (k, cls = "") => {
      const frame = M.Art.frames[k];
      if (frame)
        return `<svg class="${cls} art-${k}" viewBox="${frame.crop.join(" ")}" aria-hidden="true"><image href="${art(k)}" width="${frame.size[0]}" height="${frame.size[1]}"/></svg>`;
      return `<img class="${cls} art-${k}" src="${art(k)}" alt="">`;
    };
  class UI {
    constructor() {
      this.root = document.getElementById("ui");
      this.root.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) b.blur();
      });
      this.toastTimer = 0;
      this.warningTimer = 0;
      this.handlers = [];
    }
    clear() {
      this.root.innerHTML = "";
      clearTimeout(this.warningTimer);
      clearTimeout(this.toastTimer);
      const t = document.getElementById("toast");
      t.textContent = "";
      t.classList.remove("show");
      this.handlers = [];
    }
    bind(selector, fn) {
      this.root.querySelector(selector)?.addEventListener("click", fn);
    }
    toast(text) {
      const t = document.getElementById("toast");
      t.textContent = text;
      t.classList.add("show");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
    }
    modal(html, cls = "") {
      const el = document.createElement("div");
      el.className = "overlay " + cls;
      el.innerHTML = html;
      this.root.append(el);
      return el;
    }
    help(onClose) {
      const box = this.modal(
        `<div class="panel tutorial"><button class="close" aria-label="Close guide">×</button><div class="eyebrow">A LITTLE KINGDOM. A BIG DEFENSE.</div><h2>Make every lane count.</h2><div class="guide-grid"><div><h3>Build your team</h3><p>Click a defender card or press <kbd>1</kbd>–<kbd>6</kbd>, then click an empty lawn tile. Build Toads early. Put attackers behind Pipes. <kbd>Esc</kbd> cancels a selection.</p></div><div><h3>Collect your coins</h3><p>Click bouncing coins before they fade. Toads, defeated enemies and sky bonuses keep your economy going. Mario collects nearby coins automatically.</p></div><div><h3>Mario’s rescue zone</h3><p>Use <kbd>WASD</kbd> or arrow keys near the castle. Tap <kbd>Space</kbd> to jump and land on intruders. Mario has 3 hearts; being knocked out costs 2 castle shields and 75 coins.</p></div><div><h3>Hit the ? Blocks</h3><p>Stand beneath a block and jump. Walk into its reward. Star lasts 7 seconds. Fire power lasts 12 seconds: press <kbd>F</kbd> to shoot. A shield halves defender damage for 12 seconds.</p></div><div><h3>Know your enemies</h3><p>Paragoombas vault the first defender. Hammer Bros throw from a distance. Slow them with Ice Flowers and keep an emergency Bob-omb ready.</p></div><div><h3>Protect the castle</h3><p>Survive 8 waves and defeat Giant Goomba. The castle has 5 shields. <kbd>P</kbd> pauses, <kbd>M</kbd> toggles sound. Right-click cancels placement.</p></div></div><div class="actions"><button class="primary">Got it. Let’s defend.</button></div></div>`,
      );
      const close = () => {
        box.remove();
        onClose?.();
      };
      box.querySelector(".close").onclick = close;
      box.querySelector(".primary").onclick = close;
    }
    menu(scene) {
      this.clear();
      let complete = false;
      try {
        complete = JSON.parse(
          localStorage.getItem("meadow-progress") || "{}",
        ).completed?.includes(C.level.id);
      } catch {}
      this.root.innerHTML = `<div class="screen menu-shade"><div class="brand">${img("block")} MUSHROOM MEADOW</div><div class="menu-copy"><span class="pill">A LANE-DEFENSE ADVENTURE</span><h1>Small heroes.<br><span>Big defenses.</span></h1><p>Build your dream team. Hold every lane.<br>Give Bowser’s army a very bad afternoon.</p><div class="actions"><button class="primary" id="play">Let’s-a defend!</button><button class="secondary" id="how">How to play</button></div></div><div class="world-ticket"><div class="ribbon">${complete ? "MEADOW MASTERED" : "WORLD 1-1"}</div><div class="ticket-image"></div><div class="ticket-sprites">${img("piranha")}${img("mario")}${img("toad")}</div><div class="ticket-content"><div class="eyebrow">YOUR ADVENTURE STARTS HERE</div><h2>Mushroom Meadow</h2><p>5 lanes · 6 defenders · 8 waves<br>One very determined plumber.</p></div></div><div class="menu-footer"><span>PRIVATE FAN PROTOTYPE · CUSTOM DEFENDER ART · <a class="small-link" style="font-size:14px" href="downloads/Mushroom-Meadow-World-1-1.zip" download>Download project</a></span><button class="small-link" id="sound">${M.audio.muted ? "Enable sound" : "Sound on"}</button></div></div>`;
      this.bind("#play", () => {
        M.audio.unlock();
        scene.scene.start("Loadout");
      });
      this.bind("#how", () => this.help());
      this.bind("#sound", () => {
        M.audio.unlock();
        M.audio.toggle();
        this.root.querySelector("#sound").textContent = M.audio.muted
          ? "Sound off"
          : "Sound on";
      });
    }
    loadout(scene) {
      this.clear();
      this.root.innerHTML = `<div class="overlay"><div class="panel loadout"><button class="close" aria-label="Back to menu">×</button><div class="loadout-head"><div><div class="eyebrow">WORLD 1-1 / GET YOUR TEAM READY</div><h2>A little strategy goes a long way.</h2><p>Your six defenders are ready. Learn their strengths, then protect the meadow.</p></div><div class="loadout-info">6 / 6 EQUIPPED<br><br>650 starting coins</div></div><div class="roster">${Object.entries(
        Object.fromEntries((scene.model?.loadout || M.CoreRoster).map(k => [k,C.defenders[k]])),
      )
        .map(
          ([key, d]) =>
            `<article class="roster-card"><span class="equipped">✓</span>${img(key, "portrait")}<div class="role">${d.role}</div><h3>${d.name}</h3><p>${d.description}</p><span class="cost">${img("coin")}${d.cost}</span></article>`,
        )
        .join(
          "",
        )}</div><div class="loadout-bottom"><div class="hint"><strong>Field tip:</strong> Start with Toads and a Piranha Plant in each lane.<br>Pipes buy time. Ice Flowers make that time count.</div><button class="primary" id="begin">Enter Mushroom Meadow</button></div></div></div>`;
      this.bind(".close", () => scene.scene.start("Menu"));
      this.bind("#begin", () => scene.scene.start("Battle"));
    }
    battle(scene) {
      this.clear();
      this.root.innerHTML = `<div class="hud"><div class="economy"><div class="mini-label">YOUR COINS</div><div class="coin-count">${img("coin")}<span id="money">650</span></div><div class="castle-health">CASTLE <strong id="castle">5 / 5</strong></div></div><div class="cards">${Object.entries(
        Object.fromEntries((scene.model?.loadout || M.CoreRoster).map(k => [k,C.defenders[k]])),
      )
        .map(
          ([key, d], i) =>
            `<button class="unit-card" data-unit="${key}" aria-label="${d.name}, ${d.cost} coins. ${d.description}" title="${d.name}: ${d.description}"><span class="hotkey">${i + 1}</span>${img(key)}<span class="card-name">${d.name}</span><span class="card-cost">${d.cost}</span><span class="cooldown"></span><span class="cooldown-label"></span></button>`,
        )
        .join(
          "",
        )}</div><div class="battle-status"><div class="mini-label">MARIO</div><div class="hearts" id="hearts"></div><div class="wave-label" id="wave-label">Prepare your defenses</div><div class="wave-track"><div class="wave-fill"></div></div></div><div class="hud-buttons"><button class="icon-button" id="pause" aria-label="Pause game" title="Pause (P)">II</button><button class="icon-button" id="mute" aria-label="Toggle sound" title="Sound (M)">♪</button></div></div><div class="world-label"><div class="eyebrow">WORLD 1-1</div><h2>Mushroom Meadow</h2><div class="weather">PEACH’S CASTLE · THE GRASS IS GREENER HERE</div></div><div class="selected-tip" id="selected-tip"></div><div class="power-status" id="powers"></div><div class="boss-hud"><div class="boss-title"><span>GIANT GOOMBA</span><span id="boss-number"></span></div><div class="boss-track"><div class="boss-fill"></div></div></div><div class="prep-hint" id="prep">Build your defenses. First wave in 18s</div><div class="control-bar"><span><kbd>1–6</kbd> Choose <span style="opacity:.6">/</span> click to plant</span><span><kbd>WASD</kbd> Move</span><span><kbd>Space</kbd> Stomp</span><span><kbd>F</kbd> Fire power</span><span class="tip" id="tip">Plant Toads early, and click every bouncing coin.</span><button class="small-link" id="help">Guide</button></div>`;
      this.cards = Array.from(this.root.querySelectorAll(".unit-card"));
      this.cards.forEach(
        (b) => (b.onclick = () => scene.select(b.dataset.unit)),
      );
      this.bind("#pause", () => scene.togglePause());
      this.bind("#mute", () => {
        M.audio.toggle();
        this.root.querySelector("#mute").textContent = M.audio.muted
          ? "×♪"
          : "♪";
      });
      this.bind("#help", () => {
        if (!scene.model.paused) {
          scene.model.paused = true;
          M.audio.active = false;
          this.help(() => {
            scene.model.paused = false;
            M.audio.active = true;
          });
        }
      });
      this.cache = {};
      for (const id of [
        "money",
        "castle",
        "hearts",
        "wave-label",
        "selected-tip",
        "powers",
        "boss-number",
        "prep",
        "tip",
      ])
        this.cache[id] = this.root.querySelector("#" + id);
      this.lastPower = "";
    }
    updateBattle(scene) {
      const g = scene.model,
        m = g.mario;
      this.cache.money.textContent = g.money;
      this.cache.castle.textContent = `${g.castle} / 5`;
      this.cache.hearts.innerHTML =
        m.respawn > 0
          ? `<span style="font-size:14px;letter-spacing:0">Back in ${Math.ceil(m.respawn)}s</span>`
          : Array.from(
              { length: 3 },
              (_, i) =>
                `<span class="${i < m.hearts ? "" : "empty"}">♥</span>`,
            ).join("");
      this.cards.forEach((b) => {
        const k = b.dataset.unit,
          d = C.defenders[k],
          t = g.cooldowns[k] || 0;
        b.classList.toggle("selected", scene.selected === k);
        b.classList.toggle("poor", g.money < d.cost);
        b.querySelector(".cooldown").style.height =
          (t / d.cooldown) * 100 + "%";
        b.querySelector(".cooldown-label").textContent =
          t > 0 ? Math.ceil(t) : "";
        b.setAttribute("aria-pressed", String(scene.selected === k));
      });
      const idx = g.wave.index;
      this.cache["wave-label"].textContent =
        idx < 0
          ? "Prepare your defenses"
          : g.mode === "endless" ? `WAVE ${idx + 1} · ${g.wave.cleared ? "CLEAR" : "ENDLESS"}` : `WAVE ${idx + 1} / 8${idx === 7 ? " · FINAL STAND" : ""}`;
      this.root.querySelector(".wave-fill").style.width =
        (g.mode === "endless" ? (g.wave.cursor / Math.max(1,g.wave.current?.spawns.length || 1)) : Math.max(0, idx) / 8 +
          (idx >= 0
            ? Math.min(1, g.wave.elapsed / C.level.waves[idx].duration) / 8
            : 0)) *
          100 +
        "%";
      this.cache.prep.style.display = idx < 0 ? "block" : "none";
      this.cache.prep.textContent = `Build your defenses. First wave in ${Math.ceil(g.wave.next)}s`;
      const boss = g.enemies.find((e) => e.alive && (e.boss || e.type === "giant"));
      this.root.querySelector(".boss-hud").style.display = boss
        ? "block"
        : "none";
      if (boss) {
        this.cache["boss-number"].textContent =
          `${Math.ceil(boss.hp)} / ${boss.maxHP}`;
        this.root.querySelector(".boss-fill").style.width =
          (boss.hp / boss.maxHP) * 100 + "%";
      }
      const powers = [
        ["star", m.star, "Star power"],
        ["fire", m.fire, "Fire power · F"],
        ["shield", g.buff, "Team shield"],
      ]
        .filter((a) => a[1] > 0)
        .map(
          ([k, t, label]) =>
            `<div class="power-badge">${img(k)}${label} · ${Math.ceil(t)}s</div>`,
        )
        .join("");
      if (powers !== this.lastPower) {
        this.cache.powers.innerHTML = powers;
        this.lastPower = powers;
      }
      this.cache.tip.textContent =
        idx < 2
          ? "Plant Toads early, and click every bouncing coin."
          : idx < 4
            ? "Layer your defense: attackers behind a Pipe."
            : idx < 5
              ? "Paragoombas vault one defender. Build a second line."
              : idx < 7
                ? "Hammer Bros attack at range. Bomb them before they settle in."
                : "Giant Goomba stomps nearby lanes. Spread out and keep firing!";
    }
    selection(key) {
      const el = this.cache["selected-tip"];
      el.style.display = key ? "block" : "none";
      if (key)
        el.textContent = `${C.defenders[key].name} · Choose a free tile · Esc to cancel`;
    }
    warning(title, subtitle = "") {
      this.root.querySelector(".warning")?.remove();
      const el = document.createElement("div");
      el.className = "warning";
      el.innerHTML = `<strong><small>${subtitle}</small>${title}</strong>`;
      this.root.append(el);
      clearTimeout(this.warningTimer);
      this.warningTimer = setTimeout(() => el.remove(), 3400);
    }
    intro(onStart) {
      const box = this.modal(
        `<div class="panel intro-panel"><div class="eyebrow">WORLD 1-1</div><h2>Mushroom Meadow</h2><div class="intro-icons">${img("toad")}${img("mario")}${img("piranha")}</div><p>Bowser’s army is on its way.<br>Build your defenses. Collect coins. Keep the castle standing.</p><p class="small"><kbd>1–6</kbd> Choose a defender · Click a lawn tile to deploy<br><kbd>WASD</kbd> Move Mario · <kbd>Space</kbd> Jump / stomp</p><button class="primary">Ready, set, defend!</button></div>`,
      );
      box.querySelector("button").onclick = () => {
        box.remove();
        onStart();
      };
    }
    pause(scene) {
      const box = this.modal(
        `<div class="panel pause-panel"><div class="eyebrow">TAKE A BREATHER</div><h2>Meadow on pause.</h2><p>Even plumbers need a coffee break.</p><div class="actions"><button class="primary" id="resume">Keep defending</button><button class="secondary" id="restart">Restart level</button><button class="small-link" id="menu">Return to menu</button></div></div>`,
        "pause-overlay",
      );
      box.querySelector("#resume").onclick = () => scene.togglePause();
      box.querySelector("#restart").onclick = () => scene.scene.restart();
      box.querySelector("#menu").onclick = () => scene.scene.start("Menu");
    }
    result(scene, data) {
      this.clear();
      const won = data.won;
      this.root.innerHTML = `<div class="overlay"><div class="panel result"><div class="eyebrow">WORLD 1-1 ${won ? "COMPLETE" : "/ TRY AGAIN"}</div>${img(won ? "star" : "goomba", "medal")}<h2>${won ? "Meadow protected!" : "The castle fell."}</h2><p>${won ? "A little teamwork. A lot of fireballs. One happy kingdom." : "Every good defense starts with a second attempt."}</p><div class="result-stats"><div><strong>${data.stats.kills}</strong><span>ENEMIES DEFEATED</span></div><div><strong>${data.stats.collected}</strong><span>COINS COLLECTED</span></div><div><strong>${data.castle} / 5</strong><span>CASTLE SHIELDS</span></div></div><div class="reward">${won ? "REWARD UNLOCKED · Meadow Medal · Saved to your adventure record" : "TIP · Use Toads to fund a Piranha Plant in every lane, then add Pipes."}</div><div class="actions"><button class="primary" id="again">${won ? "Play again" : "Try again"}</button><button class="secondary" id="home">Return to menu</button></div></div></div>`;
      this.bind("#again", () => scene.scene.start("Battle"));
      this.bind("#home", () => scene.scene.start("Menu"));
    }
  }
  M.UI = UI;
})(Meadow);
