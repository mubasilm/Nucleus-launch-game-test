(function () {
  "use strict";

  const GAME_NAME = "Deal Dash";
  const PAGE_URL = "https://gtmbuddy.ai/product/nucleus";
  const STORAGE_KEY = "deal-dash-high";
  const LEGACY_KEY = "nucleus-pulse-high";

  const BRAND = {
    ivory: "#F8F6ED",
    forest: "#003013",
    green: "#4CC77C",
    coreGreen: "#00692B",
    gold: "#FFD447",
    red: "#E83B3B",
    pink: "#FF6B9D",
    text: "#121212",
    muted: "#5A7A85",
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("screen-overlay");
  const hud = document.getElementById("screen-hud");
  const scoreEl = document.getElementById("hud-score");
  const comboEl = document.getElementById("hud-combo");
  const toast = document.getElementById("screen-toast");
  const startBtn = document.getElementById("start-btn");
  const muteBtn = document.getElementById("mute-btn");
  const winDialog = document.getElementById("win-dialog");
  const winTag = document.getElementById("win-tag");
  const winTitle = document.getElementById("win-title");
  const winText = document.getElementById("win-text");
  const replayBtn = document.getElementById("replay-btn");
  const shareScoreBtn = document.getElementById("share-score-btn");
  const shareSection = document.getElementById("share-section");
  const sharePreview = document.getElementById("share-preview");
  const downloadBtn = document.getElementById("download-btn");
  const shareLinkedIn = document.getElementById("share-linkedin");
  const shareX = document.getElementById("share-x");
  const highScoreEl = document.getElementById("high-score-val");
  const logoImg = document.getElementById("logo-img");
  const healthEl = document.getElementById("hud-health");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND = H - 64;
  const HUD_H = 52;
  const MAX_HEALTH = 3;
  const COIN_PTS = 100;

  const NUCLEUS_TAGLINE = "Unlock revenue capacity now.";

  const SALES_STAGES = [
    { id: "prospect", name: "PROSPECT", blockers: ["NO ICP FIT", "COLD LEAD"] },
    { id: "discovery", name: "DISCOVERY", blockers: ["NO SHOW", "WRONG PERSON"] },
    { id: "demo", name: "DEMO", blockers: ["NO DM", "FEATURE DUMP"] },
    { id: "proposal", name: "PROPOSAL", blockers: ["LEGAL", "SECURITY REVIEW"] },
    { id: "negotiate", name: "NEGOTIATE", blockers: ["PRICING?", "DISCOUNT PING"] },
    { id: "close", name: "CLOSE", blockers: ["GHOSTED", "CIRCLE BACK"] },
  ];

  const STAGE_TIPS = {
    "NO ICP FIT": "Prospect never matched your ICP.",
    "COLD LEAD": "Lead went cold before discovery.",
    "NO SHOW": "Discovery call never happened.",
    "WRONG PERSON": "Talking to someone with no budget authority.",
    "NO DM": "Demo without a decision maker in the room.",
    "FEATURE DUMP": "Demo became a feature tour, not a deal.",
    LEGAL: "Legal review adds weeks of delay.",
    "SECURITY REVIEW": "Security questionnaire stalled the deal.",
    "PRICING?": "Pricing ask without business context.",
    "DISCOUNT PING": "Discount request before value was proven.",
    GHOSTED: "Prospect vanished at the finish line.",
    "CIRCLE BACK": "Just circling back on circling back.",
  };

  const STAGE_SKIES = [
    { top: "#eef2ee", bottom: "#f8faf8", building: "#c8d4c8", graph: "#94b8a0" },
    { top: "#eef0f5", bottom: "#f6f7fa", building: "#b8c0d0", graph: "#7a9ec4" },
    { top: "#f5f0ea", bottom: "#faf7f2", building: "#d0c4b0", graph: "#c4a87a" },
    { top: "#f2eeea", bottom: "#f9f6f3", building: "#c8bdb0", graph: "#a8907a" },
    { top: "#f5ecec", bottom: "#faf5f5", building: "#d0b8b8", graph: "#c47a7a" },
    { top: "#e8f5ec", bottom: "#f2faf5", building: "#a8d4b8", graph: "#4cc77c" },
  ];

  const NUCLEUS_TIPS = [
    NUCLEUS_TAGLINE,
    "Nucleus surfaces the right signal inside each sales stage.",
    "Revenue Activation operates inside the selling moment.",
    "Move deals forward with in-flow activation, not more folders.",
    "Signal Architecture beats storage-based enablement.",
  ];

  function stageDifficulty() {
    const s = currentStageIndex();
    return {
      speedBonus: s * 0.38,
      spawnFactor: Math.max(0.55, 1 - s * 0.1),
    };
  }

  const state = {
    running: false,
    started: false,
    score: 0,
    best: 0,
    health: MAX_HEALTH,
    invuln: 0,
    combo: 0,
    speed: 2.2,
    frame: 0,
    muted: false,
    shake: 0,
    flash: 0,
    scorePulse: 0,
    popups: [],
    player: { x: 72, y: GROUND, vy: 0, w: 36, h: 38, grounded: true, leg: 0, intro: false },
    coins: [],
    enemies: [],
    stars: [],
    particles: [],
    ambient: [],
    clouds: [],
    buildings: [],
    graphBars: [],
    nextCoin: 70,
    nextEnemy: 140,
    nextStar: 420,
    nextTip: 300,
    tipIndex: 0,
    miles: 0,
    boostUntil: 0,
    stageIndex: 0,
  };

  const audio = { ctx: null };

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  function currentStageIndex() {
    return Math.min(SALES_STAGES.length - 1, Math.floor(state.score / 350));
  }

  function currentStage() {
    return SALES_STAGES[currentStageIndex()];
  }

  function pickBlocker() {
    const idx = currentStageIndex();
    const roll = Math.random();
    const stage = SALES_STAGES[roll > 0.75 && idx < SALES_STAGES.length - 1 ? idx + 1 : idx];
    const label = stage.blockers[Math.floor(Math.random() * stage.blockers.length)];
    return { stage: stage.name, label, tip: STAGE_TIPS[label] || "Deal friction slowed you down." };
  }

  function getHighScore() {
    const v = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY) || "0";
    return Number(v);
  }

  function setHighScore(val) {
    localStorage.setItem(STORAGE_KEY, String(val));
    state.best = val;
    if (highScoreEl) highScoreEl.textContent = String(val);
  }

  function initAudio() {
    if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.ctx.state === "suspended") audio.ctx.resume();
  }

  function playSound(kind) {
    if (state.muted || !audio.ctx) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.connect(gain);
    gain.connect(audio.ctx.destination);
    const tones = {
      jump: [300, 520, 0.07, "square"],
      coin: [660 + state.combo * 30, 990, 0.12, "sine"],
      hit: [180, 90, 0.22, "sawtooth"],
      star: [440, 880, 0.2, "triangle"],
      over: [220, 70, 0.5, "sawtooth"],
      mile: [520, 780, 0.25, "sine"],
    };
    const [f1, f2, dur, type] = tones[kind] || tones.coin;
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
    osc.start(t);
    osc.stop(t + dur + 0.06);
  }

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  function addPopup(text, color, size) {
    state.popups.push({
      text,
      x: W / 2,
      y: H * 0.34,
      life: 55,
      color: color || BRAND.gold,
      size: size || 24,
      scale: 1.8,
    });
  }

  function spawnParticles(x, y, color, n) {
    const cap = 40;
    for (let i = 0; i < n && state.particles.length < cap; i += 1) {
      state.particles.push({
        x, y,
        vx: rand(-3, 3),
        vy: rand(-4, -1),
        life: rand(18, 36),
        color,
        size: rand(3, 6),
      });
    }
  }

  function initBg() {
    state.buildings = Array.from({ length: 14 }, (_, i) => ({
      x: i * 52,
      w: rand(28, 48),
      h: rand(40, 110),
      windows: Math.floor(rand(2, 5)),
    }));
    state.graphBars = Array.from({ length: 8 }, (_, i) => ({
      h: 20 + i * 8 + rand(0, 12),
    }));
    state.ambient = Array.from({ length: 4 }, () => ({
      x: rand(0, W),
      y: rand(HUD_H, GROUND - 20),
      r: rand(1, 2),
      speed: rand(0.15, 0.4),
      alpha: rand(0.1, 0.25),
    }));
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (comboEl) {
      if (state.combo > 1) {
        comboEl.hidden = false;
        comboEl.textContent = "COMBO x" + state.combo;
      } else {
        comboEl.hidden = true;
      }
    }
    if (healthEl) {
      healthEl.textContent = "";
      for (let i = 0; i < MAX_HEALTH; i += 1) {
        const h = document.createElement("span");
        h.className = "hud-heart-char" + (i >= state.health ? " empty" : "");
        h.textContent = "♥";
        healthEl.appendChild(h);
      }
    }
    if (state.score > getHighScore()) setHighScore(state.score);
    if (state.score >= 100 && shareSection) shareSection.hidden = false;
    if (window.__GAME_STATE__) {
      window.__GAME_STATE__.score = state.score;
      window.__GAME_STATE__.best = state.best;
      window.__GAME_STATE__.health = state.health;
      window.__GAME_STATE__.running = state.running;
      window.__GAME_STATE__.started = state.started;
    }
  }

  function reset(full) {
    state.running = full;
    state.started = full;
    state.score = 0;
    state.health = MAX_HEALTH;
    state.invuln = 0;
    state.combo = 0;
    state.speed = 2.2;
    state.frame = 0;
    state.shake = 0;
    state.flash = 0;
    state.scorePulse = 0;
    state.boostUntil = 0;
    state.stageIndex = 0;
    state.coins = [];
    state.enemies = [];
    state.stars = [];
    state.particles = [];
    state.popups = [];
    state.nextCoin = 55;
    state.nextEnemy = 130;
    state.nextStar = 340;
    state.nextTip = 280;
    state.tipIndex = 0;
    state.miles = 0;
    state.best = getHighScore();
    state.player = {
      x: 72, y: -50, vy: 0, w: 36, h: 38,
      grounded: false, leg: 0, intro: full,
    };
    initBg();
    updateHud();
    if (shareScoreBtn) shareScoreBtn.hidden = false;
    if (full) {
      overlay.hidden = true;
      hud.hidden = false;
      toast.hidden = true;
      state.flash = 18;
      addPopup("DEAL DASH", "#fff", 20);
      addPopup("GO!", BRAND.gold, 30);
    } else {
      overlay.hidden = false;
      hud.hidden = true;
      if (startBtn) startBtn.textContent = "START GAME";
      state.player.y = GROUND;
      state.player.grounded = true;
      state.player.intro = false;
    }
  }

  function spawnCoin() {
    state.coins.push({
      x: W + 24,
      y: rand(GROUND - 128, GROUND - 50),
      r: 18,
      spin: rand(0, Math.PI * 2),
      got: false,
    });
  }

  function spawnEnemy() {
    const type = pickBlocker();
    const onGround = Math.random() > 0.3;
    state.enemies.push({
      x: W + 20,
      y: onGround ? GROUND - 48 : rand(GROUND - 120, GROUND - 62),
      w: 64,
      h: 48,
      type,
      phase: rand(0, Math.PI * 2),
      ground: onGround,
      hit: false,
    });
  }

  function spawnStar() {
    state.stars.push({
      x: W + 20,
      y: rand(GROUND - 100, GROUND - 52),
      r: 16,
      spin: 0,
      got: false,
    });
  }

  function playerBox() {
    const p = state.player;
    return { x: p.x + 4, y: p.y - p.h + 2, w: p.w - 8, h: p.h - 4 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(cx, cy, cr, r) {
    const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
    const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < cr * cr;
  }

  function collectCoin(coin) {
    if (coin.got) return;
    coin.got = true;
    state.combo += 1;
    const bonus = state.combo > 1 ? (state.combo - 1) * 25 : 0;
    const pts = COIN_PTS + bonus;
    state.score += pts;
    state.scorePulse = 12;
    updateHud();
    playSound("coin");
    spawnParticles(coin.x, coin.y, BRAND.gold, 16);
    addPopup("+" + pts + " SIGNAL", BRAND.gold, 22);
    if (state.combo >= 3) {
      addPopup(state.combo + "x ON FIRE!", BRAND.green, 22);
      state.shake = 6;
    }
    checkMilestones();
    renderShareCard();
  }

  function collectStar(star) {
    if (star.got) return;
    star.got = true;
    state.boostUntil = state.frame + 180;
    playSound("star");
    showToast("Nucleus in-flow activation: slow-mo precision");
    spawnParticles(star.x, star.y, BRAND.pink, 18);
    addPopup("NUCLEUS BOOST!", BRAND.pink, 22);
  }

  function takeHit(enemy) {
    if (state.invuln > 0 || enemy.hit || state.player.intro) return;
    enemy.hit = true;
    state.health -= 1;
    state.combo = 0;
    state.invuln = 95;
    state.shake = 16;
    updateHud();
    playSound("hit");
    showToast(enemy.type.tip);
    addPopup(enemy.type.label, BRAND.red, 16);
    spawnParticles(state.player.x + 18, state.player.y - 22, BRAND.red, 14);
    if (state.health <= 0) endGame();
  }

  function checkMilestones() {
    const stage = currentStageIndex();
    if (stage > state.stageIndex) {
      state.stageIndex = stage;
      playSound("mile");
      const name = SALES_STAGES[stage].name;
      addPopup(name + " STAGE", BRAND.green, 20);
      showToast("Deal advanced to " + name + ". Nucleus activates signals in-flow.");
      state.shake = 8;
    }
    const m = Math.floor(state.score / 500);
    if (m > state.miles) {
      state.miles = m;
      playSound("mile");
      addPopup(NUCLEUS_TAGLINE, BRAND.green, 14);
      state.shake = 6;
    }
  }

  function endGame() {
    state.running = false;
    state.started = false;
    playSound("over");
    state.shake = 22;
    renderShareCard();
    if (winTag) winTag.textContent = state.score + " revenue capacity";
    if (winTitle) winTitle.textContent = "Deal health hit zero.";
    if (winText) {
      winText.textContent =
        NUCLEUS_TAGLINE + " Dodge stage blockers, collect gold signals, and push the sales cycle forward.";
    }
    if (shareScoreBtn) shareScoreBtn.hidden = state.score < 50;
    if (shareSection) shareSection.hidden = state.score < 100;
    setTimeout(() => {
      if (winDialog && !winDialog.open) winDialog.showModal();
    }, 120);
    updateHud();
  }

  function jump() {
    if (!state.running || state.player.intro) return;
    const p = state.player;
    if (p.grounded) {
      p.vy = -10.8;
      p.grounded = false;
      initAudio();
      playSound("jump");
      spawnParticles(p.x + 18, p.y - 4, BRAND.green, 8);
    }
  }

  function currentSpeed() {
    return state.boostUntil && state.frame < state.boostUntil ? state.speed * 0.45 : state.speed;
  }

  function maybeShowTip() {
    if (state.frame < state.nextTip) return;
    state.nextTip = state.frame + 360;
    showToast(NUCLEUS_TIPS[state.tipIndex % NUCLEUS_TIPS.length]);
    state.tipIndex += 1;
  }

  function tick() {
    if (!state.running) return;

    state.frame += 1;
    state.player.leg += 0.24;
    const diff = stageDifficulty();
    state.speed = Math.min(
      6.2,
      2.2 + state.frame / 2000 + diff.speedBonus
    );
    if (state.invuln > 0) state.invuln -= 1;
    if (state.shake > 0) state.shake -= 1;
    if (state.flash > 0) state.flash -= 1;
    if (state.scorePulse > 0) state.scorePulse -= 1;

    const spd = currentSpeed();
    const p = state.player;

    if (p.intro) {
      p.vy += 0.55;
      p.y += p.vy;
      if (p.y >= GROUND) {
        p.y = GROUND;
        p.vy = 0;
        p.grounded = true;
        p.intro = false;
        state.shake = 10;
        spawnParticles(p.x + 18, p.y - 4, BRAND.green, 14);
      }
    } else {
      p.vy += 0.5;
      p.y += p.vy;
      if (p.y >= GROUND) {
        p.y = GROUND;
        p.vy = 0;
        p.grounded = true;
      }
      if (state.frame % 12 === 0) {
        state.particles.push({
          x: p.x + 6,
          y: p.y - 6,
          vx: -1.5,
          vy: rand(-0.5, 0.5),
          life: 16,
          color: BRAND.green,
          size: 3,
        });
      }
    }

    if (!p.intro) {
      if (state.frame >= state.nextCoin) {
        spawnCoin();
        const diff = stageDifficulty();
        state.nextCoin = state.frame + Math.max(45, (92 - currentStageIndex() * 8) * diff.spawnFactor);
      }
      if (state.frame >= state.nextEnemy) {
        spawnEnemy();
        const diff = stageDifficulty();
        state.nextEnemy = state.frame + Math.max(60, (140 - currentStageIndex() * 14) * diff.spawnFactor);
      }
      if (state.frame >= state.nextStar) {
        spawnStar();
        state.nextStar = state.frame + rand(380, 560);
      }
      maybeShowTip();
    }

    const box = playerBox();

    state.coins.forEach((c) => {
      c.x -= spd;
      c.spin += 0.09;
      if (!c.got && !p.intro && circleRect(c.x, c.y, c.r, box)) collectCoin(c);
    });
    state.coins = state.coins.filter((c) => c.x > -40 && !c.got);

    state.stars.forEach((s) => {
      s.x -= spd;
      s.spin += 0.1;
      if (!s.got && !p.intro && circleRect(s.x, s.y, s.r, box)) collectStar(s);
    });
    state.stars = state.stars.filter((s) => s.x > -40 && !s.got);

    state.enemies.forEach((e) => {
      e.x -= spd * (e.ground ? 1 : 0.85);
      e.phase += 0.07;
      if (!e.ground) e.y += Math.sin(e.phase) * 1.2;
      const eb = { x: e.x, y: e.y - e.h, w: e.w, h: e.h };
      if (!e.hit && !p.intro && overlap(box, eb)) takeHit(e);
    });
    state.enemies = state.enemies.filter((e) => e.x > -60 && !e.hit);

    state.ambient.forEach((a) => {
      a.x -= a.speed;
      if (a.x < -4) {
        a.x = W + 4;
        a.y = rand(HUD_H, GROUND - 20);
      }
    });

    state.particles.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.12;
      pt.life -= 1;
    });
    state.particles = state.particles.filter((pt) => pt.life > 0);

    state.popups.forEach((pop) => {
      pop.life -= 1;
      pop.y -= 1.4;
      pop.scale += (1 - pop.scale) * 0.14;
    });
    state.popups = state.popups.filter((pop) => pop.life > 0);

    draw();
    requestAnimationFrame(tick);
  }

  function drawSky() {
    const sky = STAGE_SKIES[currentStageIndex()];
    const g = ctx.createLinearGradient(0, HUD_H, 0, GROUND);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, HUD_H, W, GROUND - HUD_H);

    const graphY = GROUND - 95;
    const barW = 14;
    const gap = 6;
    const totalBars = state.graphBars.length;
    const startX = W - (totalBars * (barW + gap)) - 20;
    state.graphBars.forEach((bar, i) => {
      const filled = i <= currentStageIndex();
      const h = filled ? bar.h + currentStageIndex() * 4 : bar.h * 0.4;
      const x = startX + i * (barW + gap) - ((state.frame * 0.15) % (barW + gap));
      ctx.fillStyle = filled ? sky.graph : "rgba(0,48,19,0.08)";
      ctx.fillRect(x, graphY - h, barW, h);
    });

    ctx.fillStyle = "rgba(0,48,19,0.35)";
    ctx.font = "bold 7px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("PIPELINE", startX, graphY + 14);

    const scroll = (state.frame * 0.4) % (state.buildings.length * 52);
    state.buildings.forEach((b) => {
      let bx = b.x - scroll;
      if (bx < -60) bx += state.buildings.length * 52;
      const by = GROUND - b.h - 18;
      ctx.fillStyle = sky.building;
      ctx.fillRect(bx, by, b.w, b.h);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      for (let row = 0; row < b.windows; row += 1) {
        for (let col = 0; col < 2; col += 1) {
          ctx.fillRect(bx + 6 + col * 14, by + 10 + row * 16, 8, 10);
        }
      }
    });

    ctx.fillStyle = "rgba(0,48,19,0.12)";
    ctx.fillRect(0, GROUND - 18, W, 18);
  }

  function drawGround() {
    ctx.fillStyle = "#c4a882";
    ctx.fillRect(0, GROUND + 2, W, 8);
    ctx.fillStyle = "#e8f5ec";
    ctx.fillRect(0, GROUND + 10, W, H - GROUND);
    ctx.fillStyle = BRAND.green;
    ctx.fillRect(0, GROUND + 10, W, 6);
  }

  function fitText(text, maxW, startSize) {
    let size = startSize;
    ctx.font = "bold " + size + "px Inter, sans-serif";
    while (ctx.measureText(text).width > maxW && size > 5) {
      size -= 1;
      ctx.font = "bold " + size + "px Inter, sans-serif";
    }
    return size;
  }

  function drawCoin(c) {
    const bob = Math.sin(c.spin) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = "#c9a020";
    ctx.beginPath();
    ctx.arc(0, 0, c.r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BRAND.gold;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BRAND.forest;
    const sigSize = fitText("SIG", c.r * 1.4, 7);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIG", 0, 1);
    ctx.restore();
  }

  function drawStar(s) {
    const bob = Math.sin(s.spin) * 3;
    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.fillStyle = BRAND.pink;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? s.r : s.r * 0.45;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e) {
    const y = e.y - e.h;
    const bounce = e.ground ? 0 : Math.sin(e.phase) * 2;
    const bx = e.x;
    const by = y + bounce;
    const pad = 4;
    const innerW = e.w - pad * 2;

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = BRAND.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, e.w, e.h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = BRAND.red;
    ctx.beginPath();
    ctx.roundRect(bx, by, e.w, 13, [5, 5, 0, 0]);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, e.w, e.h);
    ctx.clip();

    ctx.fillStyle = "#fff";
    const stageSize = fitText(e.type.stage, innerW, 6);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e.type.stage, bx + e.w / 2, by + 7);

    ctx.fillStyle = BRAND.forest;
    fitText(e.type.label, innerW, 9);
    ctx.fillText(e.type.label, bx + e.w / 2, by + 30);

    ctx.fillStyle = BRAND.red;
    ctx.font = "bold 6px Inter, sans-serif";
    ctx.fillText("BLOCKER", bx + e.w / 2, by + e.h - 8);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function drawPlayer(p) {
    const x = p.x;
    const y = p.y - p.h;
    const leg = p.grounded ? Math.sin(p.leg) * 5 : 0;
    const flash = state.invuln > 0 && Math.floor(state.invuln / 5) % 2 === 0;
    if (flash) ctx.globalAlpha = 0.45;

    ctx.fillStyle = BRAND.forest;
    ctx.fillRect(x + 8 + leg, y + 28, 7, 9);
    ctx.fillRect(x + 20 - leg, y + 28, 7, 9);
    ctx.fillStyle = BRAND.coreGreen;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 18, 17, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BRAND.green;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 16, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 11, y + 11, 6, 6);
    ctx.fillRect(x + 20, y + 11, 6, 6);
    ctx.fillStyle = BRAND.forest;
    ctx.fillRect(x + 12, y + 12, 3, 3);
    ctx.fillRect(x + 21, y + 12, 3, 3);
    ctx.fillStyle = BRAND.gold;
    ctx.fillRect(x + 14, y + 20, 8, 4);

    if (flash) ctx.globalAlpha = 1;
  }

  function drawStagePipeline() {
    const y = HUD_H + 6;
    const totalW = W - 32;
    const step = totalW / SALES_STAGES.length;
    SALES_STAGES.forEach((stage, i) => {
      const x = 16 + i * step;
      const active = i === currentStageIndex();
      const done = i < currentStageIndex();
      ctx.fillStyle = done ? BRAND.green : active ? BRAND.forest : "rgba(0,48,19,0.12)";
      ctx.beginPath();
      ctx.roundRect(x, y, step - 4, 18, 4);
      ctx.fill();
      ctx.fillStyle = active || done ? "#fff" : BRAND.muted;
      ctx.font = (active ? "bold 7px" : "7px") + " Inter, sans-serif";
      ctx.textAlign = "center";
      const label = stage.name.slice(0, 4);
      ctx.fillText(label, x + (step - 4) / 2, y + 12);
    });
    ctx.textAlign = "left";
  }

  function drawHud() {
    ctx.fillStyle = BRAND.forest;
    ctx.fillRect(0, 0, W, HUD_H);

    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "left";
    for (let i = 0; i < MAX_HEALTH; i += 1) {
      ctx.fillStyle = i < state.health ? BRAND.pink : "rgba(255,255,255,0.22)";
      ctx.fillText("♥", 12 + i * 20, 34);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = BRAND.ivory;
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(currentStage().name + " STAGE", W / 2, 22);
    ctx.fillStyle = BRAND.green;
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillText("DEAL CYCLE", W / 2, 36);

    ctx.textAlign = "right";
    ctx.fillStyle = BRAND.ivory;
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(String(state.score), W - 12, 34);
    ctx.fillStyle = BRAND.green;
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.fillText("CAPACITY", W - 12, 18);

    if (state.boostUntil && state.frame < state.boostUntil) {
      ctx.fillStyle = BRAND.pink;
      ctx.textAlign = "center";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillText("NUCLEUS BOOST", W / 2, 48);
    }
    ctx.textAlign = "left";
  }

  function drawPopups() {
    state.popups.forEach((pop) => {
      ctx.save();
      ctx.translate(pop.x, pop.y);
      ctx.scale(pop.scale, pop.scale);
      ctx.font = "800 " + pop.size + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = BRAND.forest;
      ctx.lineWidth = 5;
      ctx.strokeText(pop.text, 0, 0);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    });
  }

  function drawLegendHint() {
    if (state.frame > 280 || state.player.intro) return;
    ctx.fillStyle = "rgba(0,48,19,0.72)";
    ctx.fillRect(W / 2 - 118, H - 40, 236, 32);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SPACE or TAP to jump", W / 2, H - 20);
    ctx.textAlign = "left";
  }

  function drawScorePulse() {
    if (state.scorePulse <= 0) return;
    ctx.fillStyle = "rgba(76,199,124," + state.scorePulse / 30 + ")";
    ctx.fillRect(0, HUD_H, W, GROUND - HUD_H);
  }

  function draw() {
    const shakeX = state.shake ? rand(-state.shake, state.shake) * 0.35 : 0;
    const shakeY = state.shake ? rand(-state.shake, state.shake) * 0.35 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.clearRect(-10, -10, W + 20, H + 20);
    drawSky();
    drawGround();
    state.coins.forEach(drawCoin);
    state.stars.forEach(drawStar);
    state.enemies.forEach(drawEnemy);
    drawPlayer(state.player);
    state.particles.forEach((pt) => {
      ctx.globalAlpha = pt.life / 36;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.globalAlpha = 1;
    });
    drawHud();
    drawStagePipeline();
    drawScorePulse();
    drawPopups();
    drawLegendHint();
    if (state.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + state.flash / 22 + ")";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function wrapText(c, text, x, y, maxW, lineH) {
    const words = text.split(" ");
    let line = "";
    let cy = y;
    for (let n = 0; n < words.length; n += 1) {
      const test = line + words[n] + " ";
      if (c.measureText(test).width > maxW && n > 0) {
        c.fillText(line.trim(), x, cy);
        line = words[n] + " ";
        cy += lineH;
      } else {
        line = test;
      }
    }
    c.fillText(line.trim(), x, cy);
    return cy;
  }

  function formatScore(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function drawSharePipeline(c, cx, cy, w, activeIdx) {
    const stages = SALES_STAGES.map((s) => s.name.slice(0, 3));
    const step = w / stages.length;
    stages.forEach((label, i) => {
      const x = cx - w / 2 + i * step + step / 2;
      const done = i <= activeIdx;
      c.beginPath();
      c.arc(x, cy, 14, 0, Math.PI * 2);
      c.fillStyle = done ? BRAND.green : "rgba(0,48,19,0.1)";
      c.fill();
      if (i === activeIdx) {
        c.strokeStyle = BRAND.forest;
        c.lineWidth = 3;
        c.stroke();
      }
      c.fillStyle = done ? "#fff" : BRAND.muted;
      c.font = "bold 11px Inter, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(label, x, cy);
    });
    c.textBaseline = "alphabetic";
    c.textAlign = "left";
  }

  function renderShareCard() {
    if (!sharePreview) return;
    const card = document.createElement("canvas");
    const Wc = 1200;
    const Hc = 630;
    card.width = Wc;
    card.height = Hc;
    const c = card.getContext("2d");
    const stage = currentStage().name;
    const stageIdx = currentStageIndex();
    const scoreText = formatScore(state.score);

    const bg = c.createLinearGradient(0, 0, 0, Hc);
    bg.addColorStop(0, "#F8F6ED");
    bg.addColorStop(1, "#E8E4D6");
    c.fillStyle = bg;
    c.fillRect(0, 0, Wc, Hc);

    for (let i = 0; i < 8; i += 1) {
      c.fillStyle = "rgba(0,48,19,0.035)";
      c.fillRect(80 + i * 130, Hc - 30 - (40 + i * 14), 28, 40 + i * 14);
    }

    const cardX = 48;
    const cardY = 32;
    const cardW = Wc - 96;
    const cardH = Hc - 64;

    c.fillStyle = "#FFFFFF";
    c.beginPath();
    c.roundRect(cardX, cardY, cardW, cardH, 24);
    c.fill();
    c.strokeStyle = BRAND.forest;
    c.lineWidth = 4;
    c.stroke();

    const cx = Wc / 2;

    if (logoImg && logoImg.complete) {
      const lw = 380;
      const lh = Math.round(lw / 5.26);
      c.drawImage(logoImg, cx - lw / 2, cardY + 22, lw, lh);
    }

    const headerBottom = cardY + 100;
    c.fillStyle = BRAND.green;
    c.fillRect(cardX + 40, headerBottom, cardW - 80, 3);

    c.textAlign = "left";
    c.fillStyle = BRAND.forest;
    c.font = "800 20px Inter, sans-serif";
    c.fillText("DEAL DASH", cardX + 44, headerBottom + 32);

    c.fillStyle = BRAND.gold;
    c.beginPath();
    c.roundRect(cardX + cardW - 196, headerBottom + 12, 152, 32, 16);
    c.fill();
    c.fillStyle = BRAND.forest;
    c.font = "bold 14px Inter, sans-serif";
    c.textAlign = "center";
    c.fillText("HIGH SCORE", cardX + cardW - 120, headerBottom + 33);

    const scoreY = headerBottom + 100;
    c.textAlign = "center";
    c.font = "800 96px Inter, sans-serif";
    c.strokeStyle = BRAND.forest;
    c.lineWidth = 8;
    c.lineJoin = "round";
    c.strokeText(scoreText, cx, scoreY);
    c.fillStyle = BRAND.gold;
    c.fillText(scoreText, cx, scoreY);

    c.fillStyle = BRAND.coreGreen;
    c.font = "bold 26px Inter, sans-serif";
    c.fillText("revenue capacity", cx, scoreY + 38);

    c.fillStyle = BRAND.forest;
    c.beginPath();
    c.roundRect(cx - 150, scoreY + 58, 300, 38, 19);
    c.fill();
    c.fillStyle = "#fff";
    c.font = "bold 18px Inter, sans-serif";
    c.fillText(stage + " STAGE", cx, scoreY + 84);

    drawSharePipeline(c, cx, scoreY + 128, 520, stageIdx);

    c.fillStyle = BRAND.muted;
    c.font = "600 22px Inter, sans-serif";
    c.fillText("Can you beat my score?", cx, scoreY + 172);

    c.fillStyle = BRAND.forest;
    c.font = "bold 22px Inter, sans-serif";
    c.fillText(NUCLEUS_TAGLINE, cx, scoreY + 212);

    c.fillStyle = BRAND.green;
    c.beginPath();
    c.roundRect(cx - 220, scoreY + 232, 440, 44, 10);
    c.fill();
    c.fillStyle = "#fff";
    c.font = "bold 18px Inter, sans-serif";
    c.fillText("gtmbuddy.ai/product/nucleus", cx, scoreY + 260);

    c.textAlign = "left";

    const url = card.toDataURL("image/png");
    sharePreview.src = url;
    sharePreview.dataset.url = url;
    sharePreview.width = 600;
    sharePreview.height = 315;
    if (downloadBtn) {
      downloadBtn.href = url;
      downloadBtn.download = "deal-dash-score-" + state.score + ".png";
    }
    const text = encodeURIComponent(
      "I scored " + state.score + " on Deal Dash (" + stage + " stage). " + NUCLEUS_TAGLINE + " " + PAGE_URL
    );
    if (shareLinkedIn) {
      shareLinkedIn.href =
        "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(PAGE_URL);
    }
    if (shareX) shareX.href = "https://twitter.com/intent/tweet?text=" + text;
  }

  function start() {
    initAudio();
    reset(true);
    requestAnimationFrame(tick);
  }

  if (startBtn) startBtn.addEventListener("click", start);
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      state.muted = !state.muted;
      muteBtn.textContent = state.muted ? "Sound off" : "Sound on";
      if (!state.muted) initAudio();
    });
  }
  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      winDialog.close();
      start();
    });
  }
  if (shareScoreBtn) {
    shareScoreBtn.addEventListener("click", () => {
      winDialog.close();
      renderShareCard();
      shareSection.scrollIntoView({ behavior: "smooth" });
    });
  }
  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      if (!sharePreview.dataset.url) {
        e.preventDefault();
        renderShareCard();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!state.running && overlay && !overlay.hidden) start();
    else jump();
  });
  canvas.addEventListener("pointerdown", () => {
    if (!state.running && overlay && !overlay.hidden) start();
    else jump();
  });

  window.__GAME_STATE__ = {
    score: 0,
    best: 0,
    health: MAX_HEALTH,
    running: false,
    started: false,
    gameName: GAME_NAME,
  };

  window.render_game_to_text = function () {
    return JSON.stringify({
      coords: "origin:top-left x:right y:down",
      mode: state.running ? "playing" : state.started ? "game_over" : "menu",
      game: GAME_NAME,
      score: state.score,
      best: state.best,
      health: state.health,
      combo: state.combo,
      coins: state.coins.length,
      stage: currentStage().name,
      stageIndex: currentStageIndex(),
      player: {
        x: Math.round(state.player.x),
        y: Math.round(state.player.y),
        grounded: state.player.grounded,
      },
    });
  };

  window.advanceTime = function (ms) {
    return new Promise((resolve) => {
      const start = performance.now();
      function step() {
        if (performance.now() - start >= ms) return resolve();
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  };

  if (highScoreEl) highScoreEl.textContent = String(getHighScore());
  reset(false);
  draw();
  if (sharePreview && logoImg) {
    const showPreview = () => {
      state.score = Math.max(getHighScore(), 1250);
      state.stageIndex = currentStageIndex();
      renderShareCard();
    };
    if (logoImg.complete) showPreview();
    else logoImg.addEventListener("load", showPreview);
  }
})();
