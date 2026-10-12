/* The living gym floor on the Gym tab: every station you open appears as a tile,
   and members wander between them. Busier gym → more members. */
const Floor = (() => {
  // 4 × 4 floor plan: 13 stations + 3 decor pieces.
  const LAYOUT = [
    'freeWeights', 'treadmillRow', 'squatRack', 'benchPress',
    'cableMachines', '@plant', 'smoothieBar', 'spinStudio',
    'boxingRing', 'yogaLoft', '@fountain', 'saunaPlunge',
    'resolutionRack', 'crossfitBox', 'olympicPlatform', '@mirror',
  ];
  const DECOR = { '@plant': '🪴', '@fountain': '🚰', '@mirror': '🪞' };
  const PEOPLE = ['🧍‍♀️', '🧍', '🧍‍♂️', '🏃‍♀️', '🏃', '🚶‍♀️', '🚶', '🧘', '🤸', '🏋️‍♀️', '🚴‍♀️', '🙋'];

  let root = null;
  let k = {};
  let members = []; // { el, at }
  let timers = [];
  let centers = {}; // tile id → {x, y}

  function tileHtml(id) {
    if (DECOR[id]) return `<div class="tile decor" data-tile="${id}" aria-hidden="true"><span class="tile-emoji">${DECOR[id]}</span></div>`;
    const st = G.station(id);
    return `<button class="tile" data-tile="${id}" data-action="floor-tile" data-id="${id}" style="--tint:${st.tint}">
      <span class="tile-emoji">${st.emoji}</span><span class="tile-lvl num"></span><span class="tile-badge"></span>
    </button>`;
  }

  function render(container) {
    root = container;
    root.innerHTML = `
      <div class="floor" data-k="floor">
        <div class="floor-grid">${LAYOUT.map(tileHtml).join('')}</div>
        <div class="floor-people" data-k="people" aria-hidden="true"></div>
        <div class="floor-fx" data-k="fx" aria-hidden="true"></div>
        <div class="floor-golden" data-k="golden"></div>
      </div>
      <div class="floor-bar">
        <span class="floor-count num" data-k="count"></span>
        <button class="floor-class" data-action="tab" data-tab="classes" data-k="classChip"></button>
      </div>`;
    k = {};
    root.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    members = [];
    syncTiles();
    // setTimeout (not rAF) so it still runs when frames are throttled.
    setTimeout(() => { measure(); syncMembers(true); renderGolden(); }, 30);
    timers.push(setInterval(wander, 1700));
    timers.push(setInterval(sparkle, 1100));
    window.addEventListener('resize', onResize);
  }

  function onResize() { measure(); members.forEach((m) => place(m, m.at, false)); }

  function measure() {
    if (!root) return;
    const box = k.floor.getBoundingClientRect();
    centers = {};
    k.floor.querySelectorAll('[data-tile]').forEach((t) => {
      const r = t.getBoundingClientRect();
      centers[t.dataset.tile] = { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, w: r.width, h: r.height };
    });
    centers['@door'] = { x: box.width / 2, y: box.height + 10, w: 30, h: 0 };
  }

  const openTiles = () => LAYOUT.filter((id) => !DECOR[id] && G.level(G.station(id)) > 0);

  /** Updates each tile's state: open / available / locked, level, class & workout badges. */
  function syncTiles() {
    if (!root) return;
    const live = G.liveClass;
    const focus = G.todayWorkoutFocus;
    k.floor.querySelectorAll('button[data-tile]').forEach((t) => {
      const st = G.station(t.dataset.tile);
      const lvl = G.level(st);
      const state = lvl > 0 ? 'open' : G.isUnlocked(st) ? 'available' : 'locked';
      t.className = `tile ${state} ${st.seasonal ? 'seasonal' : ''} ${live && live.station === st ? 'live' : ''} ${focus && st.focus === focus ? 'boosted' : ''}`;
      UI.setText(t.querySelector('.tile-lvl'), lvl > 0 ? String(lvl) : '');
      UI.setText(t.querySelector('.tile-badge'), live && live.station === st ? '🎵' : focus && st.focus === focus && lvl > 0 ? '💪' : '');
      t.setAttribute('aria-label', `${st.name}${lvl > 0 ? `, level ${lvl}` : state === 'available' ? ', ready to open' : ', locked'}`);
    });
  }

  function targetCount() {
    const f = CFG.floor;
    const base = Math.min(f.maxMembers, f.minMembers + Math.floor(Math.sqrt(G.totalLevels) * 1.2));
    return base + (G.liveClass ? f.classCrowd : 0);
  }

  function place(m, tileId, animate = true) {
    const c = centers[tileId];
    if (!c) return;
    m.at = tileId;
    const jx = (Math.random() - 0.5) * c.w * 0.55;
    const jy = (Math.random() - 0.2) * c.h * 0.45;
    m.el.style.transition = animate ? '' : 'none';
    // Face a random way; the flip goes after the translate so it doesn't mirror the position.
    m.el.style.transform = `translate(${c.x + jx}px, ${c.y + jy}px)${Math.random() < 0.5 ? ' scaleX(-1)' : ''}`;
  }

  function pickTile(preferLive = false) {
    const live = G.liveClass;
    if (preferLive && live) return live.station.id;
    const open = openTiles();
    if (!open.length || Math.random() < 0.12) return LAYOUT.filter((id) => DECOR[id])[(Math.random() * 3) | 0];
    return open[(Math.random() * open.length) | 0];
  }

  /** Adds or removes members to match how busy the gym is; new ones walk in from the door. */
  function syncMembers(initial = false) {
    if (!root || !centers['@door']) return;
    const want = targetCount();
    while (members.length < want) {
      const el = document.createElement('span');
      el.className = 'member';
      el.textContent = PEOPLE[(Math.random() * PEOPLE.length) | 0];
      k.people.appendChild(el);
      const m = { el, at: null, classGoer: members.length >= want - (G.liveClass ? CFG.floor.classCrowd : 0) };
      members.push(m);
      if (initial || FX.reduceMotion) place(m, pickTile(m.classGoer), false);
      else {
        place(m, '@door', false);
        setTimeout(() => place(m, pickTile(m.classGoer)), 40);
      }
    }
    while (members.length > want) {
      const m = members.pop();
      place(m, '@door');
      setTimeout(() => m.el.remove(), 2600);
    }
    UI.setText(k.count, `👥 ${members.length} member${members.length === 1 ? '' : 's'} training`);
  }

  function wander() {
    if (!root || document.hidden || FX.reduceMotion) return;
    members.forEach((m) => { if (Math.random() < 0.35) place(m, pickTile(m.classGoer)); });
  }

  /** Little "+income" puffs over stations that have someone training. */
  function sparkle() {
    if (!root || document.hidden || FX.reduceMotion) return;
    const busy = members.filter((m) => m.at && !m.at.startsWith('@'));
    if (!busy.length) return;
    const m = busy[(Math.random() * busy.length) | 0];
    const c = centers[m.at];
    const st = G.station(m.at);
    const p = document.createElement('span');
    p.className = 'floor-puff';
    p.textContent = `+${Fmt.short(G.stationIncome(st))}`;
    p.style.left = `${c.x}px`;
    p.style.top = `${c.y - c.h * 0.3}px`;
    k.fx.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  function renderGolden() {
    if (!root) return;
    const gc = G.goldenCustomer;
    if (!gc) { k.golden.innerHTML = ''; return; }
    const open = openTiles();
    const c = centers[open[(Math.random() * open.length) | 0]] || centers['@fountain'];
    if (!c) return;
    k.golden.innerHTML = `
      <button class="golden-member" data-action="golden" style="left:${c.x}px;top:${c.y}px" aria-label="Golden member arrived. Tap for bonus Reps">
        <span class="gc-face">🤩</span><span class="gc-label">Golden member!</span>
      </button>`;
  }

  function update() {
    if (!root) return;
    const live = G.liveClass;
    const chip = live
      ? `🎵 ${CFG.classes[live.station.id]} x${+live.mult.toFixed(1)} · ${Fmt.duration(G.slotSecondsLeft)} left`
      : `🗓️ No class now · ${G.currentSlot.name}`;
    UI.setText(k.classChip, chip);
    k.classChip.classList.toggle('on', !!live);
  }

  return {
    render,
    update,
    renderGolden,
    /** After purchases, class changes or a new time slot. */
    refresh() { if (!root) return; syncTiles(); measure(); syncMembers(); update(); },
    goldenPoint() {
      const b = k.golden?.querySelector('.golden-member');
      return b ? { x: parseFloat(b.style.left), y: parseFloat(b.style.top) } : null;
    },
    puff(text, x, y, extra = '') {
      if (!root || FX.reduceMotion) return;
      const p = document.createElement('span');
      p.className = `floor-puff big ${extra}`;
      p.textContent = text;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      k.fx.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    },
    unmount() {
      timers.forEach(clearInterval);
      timers = [];
      window.removeEventListener('resize', onResize);
      root = null;
      members = [];
    },
  };
})();
