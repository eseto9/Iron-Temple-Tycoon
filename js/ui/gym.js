/* Tab 1: Gym. A switcher picks which gym you're looking at: your Home Gym (stations,
   season, upgrades) or any map gym (its own floor and its own equipment to buy).
   Rendered once per view; numbers update in place every tick so nothing jumps. */
const GymScreen = (() => {
  let root = null;
  let k = {}; // data-k refs
  let rows = []; // home station rows: { st, el, refs }
  let view = 'home'; // 'home' or a map gym key "city:loc"

  function gymLabel(g) { return `${g.city.name} · ${g.loc.name.split(' ')[0]}`; }

  function switcherHtml() {
    const gyms = G.mapGyms;
    if (!gyms.length) return '';
    const chip = (key, pic, label) => `
      <button class="gym-chip ${view === key ? 'on' : ''}" data-action="view-gym" data-id="${key}" aria-pressed="${view === key}">
        ${pic}<span>${esc(label)}</span>
      </button>`;
    return `<nav class="gym-switch" aria-label="Choose a gym to look at">
      ${chip('home', Pics.get('home', 18), 'Home Gym')}
      ${gyms.map((g) => chip(g.key, Pics.get(g.loc.icon, 18), gymLabel(g))).join('')}
    </nav>`;
  }

  function render(container) {
    root = container;
    if (view !== 'home' && !G.mapGym(view)) view = 'home';
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

      <div data-k="switcher">${switcherHtml()}</div>
      <section class="card floor-card" data-k="floorHost"></section>
      <div class="gym-body" data-k="body"></div>`;
    k = {};
    root.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    Floor.render(k.floorHost, view);
    renderBody();
    update();
  }

  function renderBody() {
    rows = [];
    if (view === 'home') renderHome();
    else renderMapGym();
    root.querySelectorAll('.gym-body [data-k]').forEach((el) => (k[el.dataset.k] = el));
  }

  // ───────── Home Gym ─────────
  function renderHome() {
    k.body.innerHTML = `
      <button class="card season-card" data-action="open-season" aria-label="Open season pass">
        <div class="row gap-14">
          ${UI.iconBadge('sun', '#FCE1CC', 48)}
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
      <p class="muted small hint">Each station doubles at levels 25, 50, 100, 200…, and every milestone adds a new machine to your floor.</p>
      <div class="stations" data-k="stations"></div>`;
    k = { ...k };
    k.body.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    renderStations();
    renderSeason();
    syncSeg();
  }

  function stationRow(st) {
    const seasonal = !!st.seasonal;
    return `
      <article class="card station ${seasonal ? 'seasonal' : ''}" data-station="${st.id}">
        ${UI.stationBadge(st, 52)}
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
    if (!root || view !== 'home') return;
    const list = k.stations;
    const open = [CFG.season.station, ...CFG.stations.filter((st) => G.isUnlocked(st))];
    const locked = CFG.stations.filter((st) => !G.isUnlocked(st));
    let html = open.map(stationRow).join('');
    if (locked.length) {
      html += lockedRow(locked[0]);
      if (locked.length > 1) html += `<p class="more-note muted small">${locked.length - 1} more station${locked.length > 2 ? 's' : ''} to discover</p>`;
    } else {
      html += `<p class="more-note muted small">Every station is open. Time to think about a franchise.</p>`;
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
      const b = G.stationBoosts(st);
      const tags = (b.class > 1 ? ' · class' : '') + (b.trainer > 1 ? ' · coach' : '');
      UI.setText(refs.meta, lvl > 0 ? `Lv ${lvl} · ${Fmt.rate(income)}${tags}` : `+${Fmt.rate(income)} per level`);
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

  function bump(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function renderSeason() {
    if (!root || view !== 'home' || !k.seasonTier) return;
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

  function syncSeg() {
    if (!root || !k.seg) return;
    const buttons = [...k.seg.querySelectorAll('button')];
    const i = buttons.findIndex((b) => b.dataset.amount === G.buyAmount);
    buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
    k.seg.style.setProperty('--i', i);
  }

  // ───────── Map gym ─────────
  function renderMapGym() {
    const g = G.mapGym(view);
    const f = G.focus(g.focus);
    const trend = G.focus(g.city.trend);
    const used = G.gearSpaceUsed(view);
    const units = G.gearUnitCount(view);
    const base = G.gymBase(g.city, g.loc, g.focus);
    const gear = G.gearOf(view);
    // Focus-matching equipment first: it earns double here.
    const types = [...CFG.stations].sort((a, b) => (b.focus === g.focus) - (a.focus === g.focus));
    const row = (st) => {
      const n = gear[st.id] || 0;
      const blocked = G.gearBlocked(view, st.id);
      const cost = G.gearCost(view, st.id);
      const match = st.focus === g.focus;
      return `
        <article class="card upg-row gear-row" data-gear="${st.id}">
          ${UI.stationBadge(st, 50)}
          <div class="grow">
            <div class="row gap-6 wrap"><h3>${esc(st.name)}</h3>${match ? `<span class="match-tag">${Pics.get(f.icon, 12)} x${CFG.gear.focusBonus}</span>` : ''}</div>
            <p class="small muted num"><strong class="ink">${n}</strong>/${G.gearMax(st.id)} here · <span class="income-text">+${Fmt.rate(base * G.gearValue(st.id, g.focus))}</span> each</p>
          </div>
          ${blocked ? `<span class="owned-chip ${blocked === 'full' ? 'muted-chip' : ''}">${blocked === 'max' ? 'MAX' : 'Room full'}</span>`
            : UI.priceButton({ action: 'buy-gear', id: st.id, cost: Fmt.short(cost), icon: Icons.reps(15), label: n ? 'ADD' : 'ADD 1', extra: `data-need="reps:${cost}"` })}
        </article>`;
    };
    k.body.innerHTML = `
      <section class="card gym-head">
        <div class="row gap-14">
          ${UI.iconBadge(g.loc.icon, g.loc.tag === 'Prime' ? '#FBEFC9' : g.loc.tag === 'Busy' ? '#E4DDF8' : '#EADFD5', 54)}
          <div class="grow">
            <h3>${esc(g.city.name)} · ${esc(g.loc.name)}</h3>
            <p class="small muted">${esc(g.city.region)} · Tier ${g.city.tier}</p>
            <div class="row gap-6 wrap chips-line">
              <span class="chip focus-chip" style="--tint:${f.tint}">${Pics.get(f.icon, 14)} ${f.name} focus</span>
              ${g.focus === g.city.trend ? `<span class="chip trend-chip">${Pics.get('chart', 14)} On trend x${CFG.trendMultiplier}</span>` : `<span class="chip">Trend: ${trend.name}</span>`}
            </div>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat"><span class="muted tiny">This gym earns</span><strong class="num income-text" data-k="gymIncome">${Fmt.rate(G.gymIncome(g.city, g.loc, g.focus, view))}</strong></div>
          <div class="stat"><span class="muted tiny">Floor space</span><strong class="num">${used}/${CFG.gear.capacity}</strong></div>
        </div>
      </section>
      <div class="list-head"><h2>Equipment</h2><p class="muted small">${units} machine${units === 1 ? '' : 's'} on the floor. Each one adds income; ${f.name} equipment earns x${CFG.gear.focusBonus} here. Big pieces take more space.</p></div>
      <div class="list">${types.map(row).join('')}</div>`;
  }

  // ───────── Per-tick update ─────────
  function update() {
    if (!root) return;
    UI.setText(k.reps, Fmt.whole(G.s.reps));
    UI.setText(k.rate, Fmt.rate(G.incomePerSec));
    Floor.update();
    UI.syncPills(root);
    k.tasksDot.hidden = G.tasksClaimable === 0;
    if (view === 'home') {
      if (k.seasonDays) UI.setText(k.seasonDays, `${G.seasonDaysLeft}d left`);
      UI.syncSize(root);
      updateStations();
    } else {
      const g = G.mapGym(view);
      if (g && k.gymIncome) UI.setText(k.gymIncome, Fmt.rate(G.gymIncome(g.city, g.loc, g.focus, view)));
      syncAffordability(k.body);
    }
  }

  return {
    render,
    update,
    renderSeason,
    syncSeg,
    get view() { return view; },
    bump(st) { bump(rows.find((r) => r.st === st)?.el); },
    /** Switch which gym the tab shows. */
    show(key) {
      view = G.mapGym(key) ? key : 'home';
      if (!root) return;
      k.switcher.innerHTML = switcherHtml();
      Floor.unmount();
      Floor.render(k.floorHost, view);
      renderBody();
      update();
      FX.haptic('select');
    },
    onStructure() {
      if (!root) return;
      k.switcher.innerHTML = switcherHtml();
      if (view === 'home') { renderStations(); renderSeason(); if (k.homeGym) k.homeGym.innerHTML = UI.homeGymCard(); }
      else { const y = window.scrollY; renderBody(); window.scrollTo(0, y); }
      Floor.refresh();
    },
    onGear(key) {
      if (!root || key !== view) return;
      const y = window.scrollY;
      renderBody();
      window.scrollTo(0, y);
      Floor.refresh();
      bump(k.body.querySelector('.gym-head'));
    },
    scrollToStation(id) {
      const el = view === 'home' ? rows.find((r) => r.st.id === id)?.el : k.body.querySelector(`[data-gear="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: FX.reduceMotion ? 'auto' : 'smooth', block: 'center' });
      bump(el);
    },
    unmount() { Floor.unmount(); root = null; rows = []; },
  };
})();
