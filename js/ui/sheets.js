/* Bottom sheets and full-screen overlays. */
const Sheets = (() => {
  const head = (title, subtitle = '') => `
    <div class="sheet-head">
      <div><h2>${title}</h2>${subtitle ? `<p class="muted small">${subtitle}</p>` : ''}</div>
      <button class="round-btn small" data-action="sheet-close" aria-label="Close">${Icons.close()}</button>
    </div>`;

  /** Re-renders a sheet body in place, keeping its scroll position. */
  function rerender(body, html) {
    const top = body.scrollTop;
    body.innerHTML = html;
    body.scrollTop = top;
  }

  // ───────── Welcome back (offline earnings) ─────────
  function welcome(report) {
    const body = Sheet.open(`
      <div class="welcome">
        <div class="welcome-emoji" aria-hidden="true">🌙</div>
        <h2>Welcome back!</h2>
        <p class="muted">Your gym kept lifting while you were away.</p>
        <div class="welcome-amount">${Icons.reps(40)}<span class="num" data-count>0</span></div>
        <div class="chip-row">
          <span class="chip">Away ${Fmt.duration(report.awaySec)}</span>
          ${report.capped ? `<span class="chip chip-clay">Capped at ${Fmt.duration(report.countedSec)}</span>` : ''}
          <span class="chip">Offline rate ${Math.round(report.rate * 100)}%</span>
        </div>
        <button class="btn btn-sage big" data-action="sheet-close">Collect</button>
        <p class="tiny muted">Raise the cap and rate with Night Shift, Locker Room and Recovery Suite.</p>
      </div>`, { className: 'compact' });

    const out = body.querySelector('[data-count]');
    const target = report.earned;
    if (FX.reduceMotion) { out.textContent = Fmt.whole(target); return; }
    const start = performance.now(), dur = 1400;
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      out.textContent = Fmt.whole(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
      else FX.haptic('milestone');
    })(start);
  }

  // ───────── Season pass (free track) ─────────
  function season() {
    const cell = (tier) => {
      const reward = CFG.seasonReward(tier);
      const reached = tier <= G.seasonTier;
      const claimed = G.s.seasonClaimed.includes(tier);
      const icon = reward.kind === 'protein' ? Icons.protein(22) : reward.kind === 'goldenPlates' ? Icons.plates(22) : Icons.reps(22);
      const name = reward.kind === 'protein' ? 'Protein' : reward.kind === 'goldenPlates' ? `Golden Plate${reward.amount > 1 ? 's' : ''}` : 'Reps';
      const amount = reward.kind === 'repsMinutes' ? Fmt.short(G.rewardValue(reward)) : reward.amount;
      let action = '';
      if (claimed) action = `<span class="claimed">${Icons.check(14)}</span>`;
      else if (reached) action = `<button class="btn btn-clay tiny-btn" data-claim="${tier}">Claim</button>`;
      return `
        <div class="reward ${claimed ? 'is-claimed' : ''} ${!reached ? 'dim' : ''} ${reward.kind === 'goldenPlates' ? 'special' : ''}">
          ${icon}<span class="grow"><strong class="num">${amount}</strong> <span class="muted small">${name}</span></span>${action}
        </div>`;
    };
    const render = () => {
      const tier = G.seasonTier, per = CFG.season.pointsPerTier;
      const toNext = tier >= CFG.season.tiers ? 0 : per - (G.seasonPoints % per);
      let rowsHtml = '';
      for (let t = 1; t <= CFG.season.tiers; t++) {
        rowsHtml += `<div class="tier-row ${t <= tier ? 'reached' : ''}"><span class="tier-num num">${t}</span>${cell(t)}</div>`;
      }
      return `
        ${head(`${CFG.season.emoji} ${esc(CFG.season.name)}`, `${G.seasonDaysLeft} days left · level the Resolution Rack to earn points`)}
        <div class="card season-hero">
          <div class="row gap-8"><strong class="num">Tier ${tier}/${CFG.season.tiers}</strong><span class="muted small num">${G.seasonPoints} pts</span></div>
          ${UI.progress(tier >= CFG.season.tiers ? 1 : (G.seasonPoints % per) / per, 'linear-gradient(90deg,#F0A15F,var(--clay))')}
          <p class="tiny muted">${toNext ? `${toNext} more Resolution Rack level${toNext > 1 ? 's' : ''} to the next tier` : 'Season complete. Legendary consistency.'}</p>
        </div>
        <p class="tiny muted">Every 10th tier pays Golden Plates. Rewards and the Resolution Rack reset when the season ends.</p>
        <div class="tier-list">${rowsHtml}</div>`;
    };

    const body = Sheet.open(render(), { className: 'tall' });
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-claim]');
      if (btn && G.claimSeasonReward(Number(btn.dataset.claim))) rerender(body, render());
    });
  }

  // ───────── Tasks ─────────
  function tasks() {
    const resetIn = (period) => {
      const now = new Date();
      const next = period === 'daily'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - ((now.getDay() + 6) % 7)));
      return Fmt.duration((next - now) / 1000);
    };
    const row = (periodName, task) => {
      const p = G.s.tasks[periodName];
      const def = G.taskDef(task.id);
      const progress = Math.min(task.target, G.taskProgress(p, task));
      const done = progress >= task.target;
      const claimed = p.claimed.includes(task.id);
      const fmt = (n) => (def.metric === 'reps' ? Fmt.short(n) : Fmt.whole(n));
      return `
        <div class="card task ${claimed ? 'is-claimed' : ''}">
          ${UI.badge(def.emoji, done ? '#D9EEDD' : '#EFE7DC', 44)}
          <div class="grow">
            <h3>${esc(def.label(task.target))}</h3>
            <div class="ms-row">${UI.progress(progress / task.target, done ? 'var(--sage1)' : 'var(--aqua2)')}<span class="tiny muted num">${fmt(progress)}/${fmt(task.target)}</span></div>
          </div>
          ${claimed
            ? `<span class="claimed big">${Icons.check(16)}</span>`
            : `<button class="buy aqua small-buy" data-task="${task.id}" data-period="${periodName}" ${done ? '' : 'disabled'}>
                 <span class="buy-label">${done ? 'CLAIM' : 'REWARD'}</span>
                 <span class="buy-cost">${Icons.protein(15)}<span class="num">${def.reward}</span></span>
               </button>`}
        </div>`;
    };
    const render = () => {
      G.ensureTasks();
      const t = G.s.tasks;
      return `
        ${head('Tasks', 'Goals that pay Protein, your permanent-upgrade currency')}
        <div class="balance-row">${UI.pill('protein', Fmt.whole(G.s.protein))}</div>
        <div class="list-head row"><h3 class="grow">Daily</h3><span class="chip">Resets in ${resetIn('daily')}</span></div>
        ${t.daily.list.map((x) => row('daily', x)).join('')}
        <div class="list-head row"><h3 class="grow">Weekly</h3><span class="chip">Resets in ${resetIn('weekly')}</span></div>
        ${t.weekly.list.map((x) => row('weekly', x)).join('')}`;
    };
    const body = Sheet.open(render(), { className: 'tall' });
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-task]');
      if (!btn) return;
      const reward = G.claimTask(btn.dataset.period, btn.dataset.task);
      if (reward) {
        Toast.show({ emoji: '💎', title: `+${reward} Protein`, subtitle: 'Task complete. Nice work!' });
        rerender(body, render());
      }
    });
  }

  // ───────── Settings ─────────
  let versionTaps = 0;
  function settings() {
    const st = G.s.settings;
    const toggle = (key, label, sub) => `
      <label class="setting">
        <span class="grow"><strong>${label}</strong>${sub ? `<span class="muted tiny">${sub}</span>` : ''}</span>
        <input type="checkbox" class="switch" data-setting="${key}" ${st[key] ? 'checked' : ''}>
      </label>`;
    const debugVisible = location.hash.includes('debug') || versionTaps >= 5;
    const body = Sheet.open(`
      ${head('Settings')}
      <div class="card settings-group">
        ${toggle('sound', 'Sound', 'Soft taps and chimes')}
        ${toggle('haptics', 'Haptics', 'Vibration where the device supports it')}
      </div>
      <div class="card settings-group">
        <div class="setting"><span class="grow"><strong>Appearance</strong></span></div>
        <div class="seg seg-wide" data-k="appearance" style="--n:3">
          <span class="seg-thumb" aria-hidden="true"></span>
          ${['system', 'light', 'dark'].map((a) => `<button data-appearance="${a}">${a[0].toUpperCase() + a.slice(1)}</button>`).join('')}
        </div>
      </div>
      <div class="card settings-group">
        <button class="setting link" data-settings-action="privacy"><span class="grow"><strong>Privacy</strong><span class="muted tiny">No accounts, no ads, no tracking. Your save stays in this browser.</span></span>${Icons.chevron()}</button>
        ${debugVisible ? `<button class="setting link" data-settings-action="debug"><span class="grow"><strong>Debug menu</strong><span class="muted tiny">Add currency, skip time</span></span>${Icons.chevron()}</button>` : ''}
        <button class="setting link danger" data-settings-action="reset"><span class="grow"><strong>Reset progress</strong></span>${Icons.chevron()}</button>
      </div>
      <p class="tiny muted center" data-settings-action="version">Iron Empire · v${CFG.version}</p>`);

    const seg = body.querySelector('[data-k="appearance"]');
    const syncAppearance = () => {
      const opts = ['system', 'light', 'dark'];
      seg.style.setProperty('--i', opts.indexOf(G.s.settings.appearance));
      seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.appearance === G.s.settings.appearance)));
    };
    syncAppearance();

    body.addEventListener('change', (e) => {
      const key = e.target.dataset.setting;
      if (!key) return;
      G.s.settings[key] = e.target.checked;
      FX.haptic('select');
      G.save();
    });
    body.addEventListener('click', (e) => {
      const ap = e.target.closest('[data-appearance]');
      if (ap) {
        G.s.settings.appearance = ap.dataset.appearance;
        App.applyAppearance();
        syncAppearance();
        G.save();
        return;
      }
      const action = e.target.closest('[data-settings-action]')?.dataset.settingsAction;
      if (action === 'reset') confirmReset();
      else if (action === 'debug') debug();
      else if (action === 'privacy') Toast.show({ emoji: '🔒', title: 'Private by design', subtitle: 'Everything stays on this device' });
      else if (action === 'version' && ++versionTaps === 5) { Toast.show({ emoji: '🛠️', title: 'Debug menu unlocked' }); settings(); }
    });
  }

  function confirmReset() {
    const body = Sheet.open(`
      <div class="welcome">
        <div class="welcome-emoji" aria-hidden="true">🧹</div>
        <h2>Reset all progress?</h2>
        <p class="muted">Every currency, station, gym and upgrade goes back to the start. This can't be undone.</p>
        <button class="btn btn-danger big" data-confirm-reset>Reset everything</button>
        <button class="btn btn-ghost big" data-action="sheet-close">Keep my gym</button>
      </div>`, { className: 'compact' });
    body.querySelector('[data-confirm-reset]').addEventListener('click', () => {
      G.resetProgress();
      Sheet.close();
      App.showTab('gym');
      Toast.show({ emoji: '🌱', title: 'Fresh start', subtitle: 'Your garage gym awaits' });
    });
  }

  // ───────── Franchise ─────────
  function franchise() {
    const plates = G.pendingPlates;
    const body = Sheet.open(`
      <div class="welcome">
        <div class="franchise-star" aria-hidden="true">${Icons.plates(84)}</div>
        <h2>Open a Franchise?</h2>
        <p class="muted">Sell this gym to a new owner and start fresh in a bigger one.</p>
        <div class="welcome-amount gold-text">+<span class="num">${Fmt.whole(plates)}</span>${Icons.plates(36)}</div>
        <div class="keep-grid">
          <div class="card keep"><p class="tiny upper muted">You keep</p><ul>
            <li>Golden Plates & upgrades</li><li>Protein & Protein upgrades</li><li>Your map chain (${G.gymCount} gym${G.gymCount === 1 ? '' : 's'})</li><li>Season progress & tasks</li></ul></div>
          <div class="card keep reset"><p class="tiny upper muted">Starts over</p><ul>
            <li>Reps → ${Fmt.whole(G.franchiseStartReps)}</li><li>Stations</li><li>Trainers</li><li>Coin upgrades</li></ul></div>
        </div>
        <p class="small">Home Gym becomes <strong>Level ${G.homeGymLevel + 1}</strong>: station income x${Fmt.short(G.homeGymIncomeMult * CFG.homeGymIncomeGrowth)}, costs x${Fmt.short(G.homeGymCostMult * CFG.homeGymCostGrowth)}.</p>
        <button class="btn btn-gold big" data-confirm-franchise>Open the franchise</button>
        <button class="btn btn-ghost big" data-action="sheet-close">Not yet</button>
      </div>`);
    body.querySelector('[data-confirm-franchise]').addEventListener('click', () => {
      const got = G.openFranchise();
      Sheet.close();
      if (got) {
        App.showTab('gym');
        setTimeout(() => Toast.show({ emoji: '⭐️', title: `+${got} Golden Plates banked`, subtitle: `Welcome to Home Gym Level ${G.homeGymLevel}`, celebrate: true }), 350);
      }
    });
  }

  // ───────── Records (personal stats) ─────────
  function records() {
    const s = G.s, st = s.stats;
    const item = (emoji, label, value) => `<div class="record"><span class="record-emoji">${emoji}</span><span class="grow muted small">${label}</span><strong class="num">${value}</strong></div>`;
    Sheet.open(`
      ${head('Your records', 'Personal bests across every franchise')}
      <div class="card records">
        ${item('🪙', 'Lifetime Reps', Fmt.whole(s.lifetimeReps))}
        ${item('📈', 'Best income', Fmt.rate(s.bestIncome))}
        ${item('👆', 'Total taps', Fmt.whole(st.taps))}
        ${item('🏋️', 'Station levels bought', Fmt.whole(st.levels))}
        ${item('🤩', 'Golden members welcomed', Fmt.whole(st.golden))}
        ${item('🧑‍🏫', 'Trainers hired', Fmt.whole(st.trainers))}
        ${item('🗺️', 'Gyms in your chain', `${G.gymCount} in ${G.cityCount} cities`)}
        ${item('⭐️', 'Franchises opened', Fmt.whole(s.franchiseCount))}
      </div>`);
  }

  // ───────── Debug ─────────
  function debug() {
    const groups = [
      ['Reps', [['+1K', () => G.debug.addReps(1e3)], ['+1M', () => G.debug.addReps(1e6)], ['+1B', () => G.debug.addReps(1e9)], ['+1T', () => G.debug.addReps(1e12)]]],
      ['Currencies', [['+100 Protein', () => G.debug.addProtein(100)], ['+10 Plates', () => G.debug.addPlates(10)]]],
      ['Time', [['Skip 1h', () => G.debug.skip(3600)], ['Skip 1d', () => G.debug.skip(86400)], ['Offline 3h', () => { Sheet.close(); setTimeout(() => G.debug.simulateOffline(3), 350); }]]],
      ['Events', [['Golden member', () => G.debug.goldenCustomerNow()], ['+20 season pts', () => G.debug.seasonPoints(20)], ['Complete tasks', () => G.debug.completeTasks()]]],
    ];
    const actions = [];
    const body = Sheet.open(`
      ${head('Debug menu', 'For testing only')}
      ${groups.map(([title, items]) => `
        <div class="card settings-group">
          <p class="muted tiny upper">${title}</p>
          <div class="debug-grid">${items.map(([label, fn]) => { actions.push(fn); return `<button class="btn btn-ghost" data-debug="${actions.length - 1}">${label}</button>`; }).join('')}</div>
        </div>`).join('')}`);
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-debug]');
      if (!b) return;
      actions[Number(b.dataset.debug)]();
      FX.haptic('select');
      b.classList.remove('flash');
      void b.offsetWidth;
      b.classList.add('flash');
    });
  }

  // ───────── First-launch onboarding ─────────
  function onboarding(done) {
    const cards = [
      { emoji: '🏋️', title: 'Welcome to your Home Gym', text: 'A garage, a few dumbbells and a big dream. Tap the barbell to lift and earn Reps.' },
      { emoji: '🌿', title: 'Build calm, steady income', text: 'Buy stations that earn while you rest. Hire trainers, collect upgrades, finish tasks for Protein.' },
      { emoji: '✨', title: 'Grow into an empire', text: 'Open gyms across the map, then franchise for Golden Plates and permanent bonuses.' },
    ];
    const el = document.createElement('div');
    el.className = 'onboarding';
    el.innerHTML = `
      <div class="ob-track">${cards.map((c) => `
        <section class="ob-card">
          <div class="ob-art" aria-hidden="true">${c.emoji}</div>
          <h2>${c.title}</h2>
          <p class="muted">${c.text}</p>
        </section>`).join('')}</div>
      <div class="ob-dots">${cards.map((_, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}</div>
      <button class="btn btn-sage big ob-next">Next</button>`;
    document.body.appendChild(el);
    const track = el.querySelector('.ob-track');
    const next = el.querySelector('.ob-next');
    const page = () => Math.round(track.scrollLeft / track.clientWidth);
    const sync = () => {
      const p = page();
      el.querySelectorAll('.ob-dots span').forEach((d, i) => d.classList.toggle('on', i === p));
      next.textContent = p === cards.length - 1 ? 'Let’s lift' : 'Next';
    };
    track.addEventListener('scroll', sync, { passive: true });
    next.addEventListener('click', () => {
      const p = page();
      if (p < cards.length - 1) track.scrollTo({ left: (p + 1) * track.clientWidth, behavior: 'smooth' });
      else {
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 400);
        FX.haptic('milestone');
        done();
      }
    });
  }

  return { welcome, season, tasks, settings, franchise, records, debug, onboarding };
})();
