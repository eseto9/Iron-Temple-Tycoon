/* Tab 1: Gym. Rendered once; numbers update in place every tick so nothing jumps. */
const GymScreen = (() => {
  let root = null;
  let k = {}; // data-k refs
  let rows = []; // { st, el, refs }

  function render(container) {
    root = container;
    root.innerHTML = `
      <header class="topbar">
        ${UI.pill('protein', '0')}
        ${UI.pill('plates', '0')}
        <div class="grow"></div>
        <button class="round-btn" data-action="open-tasks" aria-label="Tasks">${Icons.clipboard()}<span class="dot" data-k="tasksDot" hidden></span></button>
        <button class="round-btn" data-action="open-settings" aria-label="Settings">${Icons.gear()}</button>
      </header>

      <section class="counter" aria-live="off">
        <div class="reps-line">${Icons.reps(46)}<span class="reps-num num" data-k="reps">0</span></div>
        <div class="rate-line">${Icons.cash(20)}<span class="num" data-k="rate">0/s</span></div>
      </section>

      <section class="tap-zone">
        <div class="particles" data-k="particles" aria-hidden="true"></div>
        <div class="tap-halo" aria-hidden="true"></div>
        <button class="tap-btn" data-k="tapBtn" aria-label="Lift. Earns Reps per tap">
          <span class="tap-face" data-k="tapFace">${DUMBBELL_SVG}</span>
        </button>
        <div class="golden-slot" data-k="golden"></div>
      </section>
      <p class="tap-caption">Tap to lift <span class="num" data-k="tapValue">+1</span><span class="auto-chip" data-k="autoChip" hidden>🤖 Auto-Tap on</span></p>

      <button class="card season-card" data-action="open-season" aria-label="Open season pass">
        <div class="row gap-14">
          ${UI.badge(CFG.season.emoji, '#FCE1CC', 48)}
          <div class="grow">
            <div class="row gap-8"><h3>${esc(CFG.season.name)}</h3><span class="chip chip-clay num" data-k="seasonDays"></span></div>
            <div class="season-progress">${UI.progress(0, 'linear-gradient(90deg,#F0A15F,var(--clay))', 'seasonBar')}</div>
            <div class="season-foot small">
              <span class="num strong" data-k="seasonTier"></span><span class="muted">·</span>
              <span class="muted grow" data-k="seasonTrack">level the Resolution Rack</span>
              <span class="chip chip-clay-solid" data-k="seasonClaim" hidden></span>
            </div>
          </div>
          <span class="muted">${Icons.chevron(18)}</span>
        </div>
      </button>

      <div data-k="homeGym">${UI.homeGymCard()}</div>

      <div class="section-head">
        <h2>Stations</h2>
        <div class="seg" role="radiogroup" aria-label="Buy amount" data-k="seg">
          <span class="seg-thumb" aria-hidden="true"></span>
          ${['x1', 'x10', 'MAX'].map((a) => `<button role="radio" data-action="buy-amount" data-amount="${a}">${a}</button>`).join('')}
        </div>
      </div>
      <p class="muted small hint">Income doubles at levels 25, 50, 100, 200… and each milestone pays Protein.</p>
      <div class="stations" data-k="stations"></div>`;

    k = {};
    root.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    bindTap();
    renderStations();
    renderSeason();
    renderGolden();
    syncSeg();
    update();
  }

  // ───────── Stations ─────────
  function stationRow(st) {
    const seasonal = !!st.seasonal;
    return `
      <article class="card station ${seasonal ? 'seasonal' : ''}" data-station="${st.id}">
        ${UI.badge(st.emoji, st.tint, 52)}
        <div class="grow st-info">
          <div class="row gap-6"><h3>${esc(st.name)}</h3>${seasonal ? '<span class="tag">SEASON</span>' : ''}</div>
          <p class="muted small num" data-r="meta"></p>
          <div class="ms-row">
            <div class="bar"><div class="bar-fill" data-r="msBar"></div></div>
            <span class="tiny muted num" data-r="ms"></span>
          </div>
          ${seasonal ? '<p class="tiny clay">Each level = +1 season point · gone when the season ends.</p>' : ''}
        </div>
        <button class="buy" data-action="buy" data-id="${st.id}">
          <span class="buy-label" data-r="label">BUY</span>
          <span class="buy-cost">${Icons.reps(15)}<span class="num" data-r="cost"></span></span>
        </button>
      </article>`;
  }

  function lockedRow(st) {
    const prev = G.previousStation(st);
    return `
      <article class="card station locked" aria-label="${esc(st.name)}, locked">
        <div class="badge lock-badge" style="width:52px;height:52px">${Icons.lock(20)}</div>
        <div class="grow">
          <h3>${esc(st.name)}</h3>
          <p class="muted small">Unlock ${esc(prev.name)} first</p>
        </div>
        <span class="lock-tag">${Icons.lock(14)}</span>
      </article>`;
  }

  function renderStations() {
    if (!root) return;
    const list = k.stations;
    const open = [CFG.season.station, ...CFG.stations.filter((st) => G.isUnlocked(st))];
    const locked = CFG.stations.filter((st) => !G.isUnlocked(st));
    let html = open.map(stationRow).join('');
    if (locked.length) {
      html += lockedRow(locked[0]);
      if (locked.length > 1) html += `<p class="more-note muted small">${locked.length - 1} more station${locked.length > 2 ? 's' : ''} to discover</p>`;
    } else {
      html += `<p class="more-note muted small">Every station is open. Time to think about a franchise ✨</p>`;
    }
    list.innerHTML = html;
    rows = open.map((st) => {
      const el = list.querySelector(`[data-station="${st.id}"]`);
      const refs = {};
      el.querySelectorAll('[data-r]').forEach((r) => (refs[r.dataset.r] = r));
      refs.btn = el.querySelector('.buy');
      return { st, el, refs };
    });
    updateStations();
  }

  function updateStations() {
    for (const { st, refs } of rows) {
      const lvl = G.level(st);
      const q = G.quote(st);
      const income = lvl > 0 ? G.stationIncome(st) : G.stationIncomePerLevel(st);
      const trainer = G.s.trainers.includes(st.id) ? ' · 🧑‍🏫 x2' : '';
      UI.setText(refs.meta, lvl > 0 ? `Lv ${lvl} · ${Fmt.rate(income)}${trainer}` : `+${Fmt.rate(income)} per level`);
      const prev = previousMilestone(lvl), next = nextMilestone(lvl);
      UI.setStyle(refs.msBar, 'width', `${((lvl - prev) / (next - prev)) * 100}%`);
      UI.setText(refs.ms, `x${+G.milestoneFactor.toFixed(2)} at ${next}`);
      const verb = lvl === 0 ? 'OPEN' : 'BUY';
      const label = q.count === 1 ? verb : `${verb} x${q.count}`;
      UI.setText(refs.label, label);
      UI.setText(refs.cost, Fmt.short(q.cost));
      if (refs.btn.disabled === q.affordable) refs.btn.disabled = !q.affordable;
      const aria = `${verb === 'OPEN' ? 'Open' : 'Buy'} ${q.count} level${q.count > 1 ? 's' : ''} of ${st.name} for ${Fmt.short(q.cost)} Reps`;
      if (refs.btn.getAttribute('aria-label') !== aria) refs.btn.setAttribute('aria-label', aria);
    }
  }

  function bump(st) {
    const row = rows.find((r) => r.st === st);
    if (!row) return;
    row.el.classList.remove('bump');
    void row.el.offsetWidth;
    row.el.classList.add('bump');
  }

  // ───────── Season card ─────────
  function renderSeason() {
    if (!root) return;
    const tiers = CFG.season.tiers;
    const pts = G.seasonPoints, per = CFG.season.pointsPerTier;
    const tier = G.seasonTier;
    const frac = tier >= tiers ? 0 : (pts % per) / per;
    UI.setText(k.seasonTier, `Tier ${tier}/${tiers}`);
    UI.setStyle(k.seasonBar, 'width', `${((tier + frac) / tiers) * 100}%`);
    const claim = G.seasonClaimable;
    k.seasonClaim.hidden = claim === 0;
    k.seasonTrack.hidden = claim > 0;
    UI.setText(k.seasonClaim, `${claim} to claim`);
    UI.setText(k.seasonDays, `${G.seasonDaysLeft}d left`);
  }

  // ───────── Golden member ─────────
  function renderGolden() {
    if (!root) return;
    const gc = G.goldenCustomer;
    if (!gc) { k.golden.innerHTML = ''; return; }
    k.golden.innerHTML = `
      <button class="golden-customer ${gc.side < 0 ? 'left' : 'right'}" data-action="golden" aria-label="Golden member arrived. Tap for bonus Reps">
        <span class="gc-face">🤩</span><span class="gc-label">Golden member!</span>
      </button>`;
  }

  // ───────── Tapping ─────────
  function bindTap() {
    const btn = k.tapBtn;
    const doTap = (x, y) => {
      const v = G.tap();
      spawnParticle(`+${Fmt.short(v)}`, x, y);
      squish();
      update();
    };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const r = k.particles.getBoundingClientRect();
      doTap(e.clientX - r.left, e.clientY - r.top);
    });
    // Keyboard / screen reader activation (no pointer)
    btn.addEventListener('click', (e) => {
      if (e.detail === 0) doTap(k.particles.clientWidth / 2, k.particles.clientHeight / 2);
    });
  }

  function squish() {
    if (FX.reduceMotion) return;
    const face = k.tapFace;
    face.classList.remove('squish');
    void face.offsetWidth;
    face.classList.add('squish');
  }

  function spawnParticle(text, x, y, extra = '') {
    if (FX.reduceMotion || !root) return;
    const layer = k.particles;
    if (layer.childElementCount > 24) layer.firstElementChild.remove();
    const p = document.createElement('span');
    p.className = 'particle ' + extra;
    p.textContent = text;
    p.style.left = `${x + (Math.random() - 0.5) * 30}px`;
    p.style.top = `${y - 10}px`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 50}px`);
    layer.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  // ───────── Buy amount ─────────
  function syncSeg() {
    if (!root) return;
    const buttons = [...k.seg.querySelectorAll('button')];
    const i = buttons.findIndex((b) => b.dataset.amount === G.buyAmount);
    buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
    k.seg.style.setProperty('--i', i);
  }

  // ───────── Per-tick update ─────────
  function update() {
    if (!root) return;
    UI.setText(k.reps, Fmt.whole(G.s.reps));
    UI.setText(k.rate, Fmt.rate(G.incomePerSec));
    UI.setText(k.tapValue, `+${Fmt.short(G.tapValue)}`);
    k.autoChip.hidden = G.autoTapsPerSec <= 0;
    UI.syncPills(root);
    k.tasksDot.hidden = G.tasksClaimable === 0;
    UI.setText(k.seasonDays, `${G.seasonDaysLeft}d left`);
    updateStations();
  }

  return {
    render,
    update,
    renderSeason,
    renderGolden,
    syncSeg,
    bump,
    onStructure() { renderStations(); renderSeason(); if (k.homeGym) k.homeGym.innerHTML = UI.homeGymCard(); },
    autoTapParticle(v) {
      if (!root || document.hidden) return;
      const layer = k.particles;
      spawnParticle(`+${Fmt.short(v)}`, layer.clientWidth / 2 + (Math.random() - 0.5) * 90, layer.clientHeight * 0.45, 'auto');
    },
    spawnGoldenParticle(text) {
      if (root) spawnParticle(text, k.particles.clientWidth / 2, k.particles.clientHeight * 0.3, 'gold');
    },
    unmount() { root = null; rows = []; },
  };
})();
