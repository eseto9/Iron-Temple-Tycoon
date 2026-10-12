/* App shell: tab bar, routing, global events, lifecycle. */
const App = (() => {
  const tabs = [
    { id: 'gym', title: 'Gym', icon: Icons.tabGym, screen: GymScreen },
    { id: 'map', title: 'Map', icon: Icons.tabMap, screen: MapScreen },
    { id: 'classes', title: 'Classes', icon: Icons.tabClasses, screen: ClassesScreen },
    { id: 'upgrades', title: 'Upgrades', icon: Icons.tabUpgrades, screen: UpgradesScreen },
    { id: 'staff', title: 'Staff', icon: Icons.tabStaff, screen: StaffScreen },
    { id: 'prestige', title: 'Prestige', icon: Icons.tabPrestige, screen: PrestigeScreen },
  ];

  let current = 'gym';
  const scrollMemory = {};
  const screenEl = () => document.getElementById('screen');
  const currentScreen = () => tabs.find((t) => t.id === current).screen;

  function renderTabBar() {
    const bar = document.getElementById('tabbar');
    bar.style.setProperty('--n', tabs.length);
    bar.innerHTML = `
      <span class="tab-thumb" aria-hidden="true"></span>
      ${tabs.map((t) => `
        <button class="tab" role="tab" data-action="tab" data-tab="${t.id}" aria-label="${t.title}">
          ${t.icon()}<span>${t.title}</span><i class="tab-dot" data-tab-dot="${t.id}" hidden></i>
        </button>`).join('')}`;
    syncTabBar();
  }
  function syncTabBar() {
    const bar = document.getElementById('tabbar');
    bar.style.setProperty('--i', tabs.findIndex((t) => t.id === current));
    bar.querySelectorAll('.tab').forEach((b) => {
      const on = b.dataset.tab === current;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });
  }
  /** Small dots on tabs with something new to do. */
  function syncTabDots() {
    const dot = (id, on) => { const el = document.querySelector(`[data-tab-dot="${id}"]`); if (el && el.hidden === on) el.hidden = !on; };
    dot('prestige', G.pendingPlates >= 1 && current !== 'prestige');
    dot('staff', current !== 'staff' && CFG.stations.some((st) => G.level(st) > 0 && !G.s.trainers.includes(st.id) && G.s.reps >= G.trainerCost(st)));
  }

  function showTab(id) {
    if (Sheet.isOpen) Sheet.close();
    scrollMemory[current] = window.scrollY;
    currentScreen().unmount();
    current = id;
    syncTabBar();
    const el = screenEl();
    el.className = `screen screen-${id}`;
    document.body.classList.toggle('on-map', id === 'map');
    currentScreen().render(el);
    window.scrollTo(0, scrollMemory[id] || 0);
  }

  function applyAppearance() {
    const a = G.s.settings.appearance;
    if (a === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', a);
    const dark = a === 'dark' || (a === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#1C1713' : '#F5EFE6');
    if (current === 'map') showTab('map'); // swap map tiles
  }

  // ───────── Global click delegation ─────────
  const actions = {
    tab: (el) => { if (el.dataset.tab !== current) { FX.haptic('select'); showTab(el.dataset.tab); } },
    'sheet-close': () => Sheet.close(),
    'open-tasks': () => Sheets.tasks(),
    'open-settings': () => Sheets.settings(),
    'open-season': () => Sheets.season(),
    buy: (el) => {
      const st = G.station(el.dataset.id);
      if (st && G.buy(st)) { GymScreen.bump(st); GymScreen.update(); }
    },
    'buy-amount': (el) => {
      G.buyAmount = el.dataset.amount;
      FX.haptic('select');
      GymScreen.syncSeg();
      GymScreen.update();
    },
    'floor-tile': (el) => GymScreen.scrollToStation(el.dataset.id),
    'unlock-slot': (el) => {
      if (G.unlockSlot(el.dataset.id) && CFG.stations.some((st) => G.level(st) > 0)) openClassPicker(el.dataset.id);
    },
    'pick-class': (el) => openClassPicker(el.dataset.id),
    'pick-focus': (el) => MapScreen.pickFocus(el.dataset.id),
    'coin-upgrade': (el) => {
      const u = CFG.coinUpgrades.find((x) => x.id === el.dataset.id);
      if (u && G.buyCoinUpgrade(u)) Toast.show({ emoji: u.emoji, title: u.name, subtitle: G.upgradeEffectText(u) });
    },
    'protein-upgrade': (el) => {
      const u = CFG.proteinUpgrades.find((x) => x.id === el.dataset.id);
      if (u && G.buyProteinUpgrade(u)) Toast.show({ emoji: u.emoji, title: u.name, subtitle: `${u.detail} · forever`, celebrate: true });
    },
    hire: (el) => {
      const st = G.station(el.dataset.id);
      if (st && G.hireTrainer(st)) Toast.show({ emoji: '🧑‍🏫', title: `${st.trainer} hired`, subtitle: `${st.name} income x2` });
    },
    'golden-upgrade': (el) => {
      const u = CFG.goldenUpgrades.find((x) => x.id === el.dataset.id);
      if (u && G.buyGoldenUpgrade(u)) Toast.show({ emoji: u.emoji, title: `${u.name} Lv ${G.golden(u.id)}`, subtitle: u.detail });
    },
    franchise: () => Sheets.franchise(),
    records: () => Sheets.records(),
    'open-city': (el) => MapScreen.openCity(G.city(el.dataset.id)),
    'open-gym': (el) => {
      const [c, l] = el.dataset.id.split(':');
      G.openGym(G.city(c), G.location(l), MapScreen.pickedFocus || G.city(c).trend);
    },
  };

  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    actions[el.dataset.action]?.(el, e);
  }

  // ───────── Boot ─────────
  function boot() {
    applyAppearance();
    G.ensureTasks(); // replaces tasks from older builds before anything renders
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAppearance);
    renderTabBar();
    showTab('gym');
    document.addEventListener('click', onClick);

    let slow = 0;
    G.on('tick', () => {
      currentScreen().update();
      if (Sheet.isOpen) { UI.syncPills(Sheet.body); syncAffordability(Sheet.body); }
      if (++slow % 5 === 0) syncTabDots();
    });
    G.on('structure', () => currentScreen().onStructure?.());
    G.on('season', () => GymScreen.renderSeason());
    G.on('golden', () => Floor.renderGolden());
    G.on('purchase', () => { if (current === 'gym') Floor.refresh(); });
    G.on('milestone', (m) => Toast.show(m));
    G.on('welcome', (report) => Sheets.welcome(report));

    const report = G.applyOfflineProgress();
    G.start();

    if (!G.s.onboarded) {
      Sheets.onboarding(() => { G.s.onboarded = true; G.save(); });
    } else if (report) {
      Sheets.welcome(report);
    }

    // Lifecycle: save when hidden, credit offline time when back.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { G.save(); G.stop(); }
      else {
        const r = G.applyOfflineProgress();
        G.start();
        if (r) Sheets.welcome(r);
      }
    });
    window.addEventListener('pagehide', () => G.save());
  }

  return { boot, applyAppearance, showTab };
})();

document.addEventListener('DOMContentLoaded', App.boot);
