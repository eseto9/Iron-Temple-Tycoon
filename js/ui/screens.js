/* Tabs 3–5: Upgrades, Staff, Prestige. Each renders once, then update() keeps
   prices and pills current; onStructure() re-renders after a purchase. */

/** Buttons carry data-need="reps|protein|plates:amount"; this enables the ones you can afford. */
function syncAffordability(root) {
  const bal = { reps: G.s.reps, protein: G.s.protein, plates: G.s.goldenPlates };
  root.querySelectorAll('[data-need]').forEach((btn) => {
    const [cur, amt] = btn.dataset.need.split(':');
    const off = bal[cur] + 1e-9 < Number(amt);
    if (btn.disabled !== off) btn.disabled = off;
  });
}

function makeScreen(build) {
  let root = null;
  return {
    render(el) { root = el; root.innerHTML = build(); this.update(); },
    update() { if (!root) return; UI.syncPills(root); syncAffordability(root); },
    onStructure() {
      if (!root) return;
      const y = window.scrollY;
      root.innerHTML = build();
      window.scrollTo(0, y);
      this.update();
    },
    unmount() { root = null; },
  };
}

// ───────── Upgrades ─────────
const UpgradesScreen = makeScreen(() => {
  const owned = CFG.coinUpgrades.filter((u) => G.s.coinUpgrades.includes(u.id));
  const available = CFG.coinUpgrades.filter((u) => !G.s.coinUpgrades.includes(u.id));
  const coinRow = (u) => {
    const locked = G.coinUpgradeLocked(u);
    const st = u.effect.station && G.station(u.effect.station);
    return `
      <article class="card upg-row ${locked ? 'locked' : ''}">
        ${locked ? `<div class="badge lock-badge" style="width:48px;height:48px">${Icons.lock(18)}</div>` : UI.badge(u.emoji, st ? st.tint : '#EFE5D6', 48)}
        <div class="grow">
          <h3>${esc(u.name)}</h3>
          <p class="small muted">${locked ? `Open ${esc(st.name)} first` : esc(G.upgradeEffectText(u))}</p>
        </div>
        ${locked ? `<span class="lock-tag">${Icons.lock(14)}</span>` : UI.priceButton({ action: 'coin-upgrade', id: u.id, cost: Fmt.short(u.cost), icon: Icons.reps(15), extra: `data-need="reps:${u.cost}"` })}
      </article>`;
  };
  const proteinRow = (u) => {
    const have = G.s.proteinUpgrades.includes(u.id);
    const locked = G.proteinUpgradeLocked(u);
    return `
      <article class="card upg-row ${have ? 'owned' : ''} ${locked ? 'locked' : ''}">
        ${UI.badge(u.emoji, '#D6F2F8', 48)}
        <div class="grow">
          <h3>${esc(u.name)}</h3>
          <p class="small muted">${locked ? `Needs ${esc(CFG.proteinUpgrades.find((x) => x.id === u.requires).name)} first` : esc(u.detail)}</p>
        </div>
        ${have ? `<span class="owned-chip">${Icons.check(14)} Owned</span>`
          : locked ? `<span class="lock-tag">${Icons.lock(14)}</span>`
          : UI.priceButton({ action: 'protein-upgrade', id: u.id, cost: u.cost, icon: Icons.protein(15), accent: 'aqua', extra: `data-need="protein:${u.cost}"` })}
      </article>`;
  };
  return `
    <header class="topbar">${UI.pills('reps', 'protein', 'plates')}</header>
    <h1 class="page-title">Upgrades</h1>
    ${UI.homeGymCard()}
    ${UI.sectionHead('Coin Upgrades', 'Paid in Reps · last for this gym only and reset when you franchise.', Icons.reps(22))}
    <div class="list">
      ${available.length ? available.map(coinRow).join('') : '<div class="card empty-state"><div class="empty-emoji">🏅</div><h3>Every coin upgrade owned</h3><p class="muted small">This gym is fully kitted out.</p></div>'}
    </div>
    ${owned.length ? `
      <details class="owned-list card">
        <summary><span class="grow">Owned this franchise</span><span class="chip chip-sage">${owned.length}</span></summary>
        <div class="owned-chips">${owned.map((u) => `<span class="chip">${u.emoji} ${esc(u.name)}</span>`).join('')}</div>
      </details>` : ''}
    ${UI.sectionHead('Protein Upgrades', 'Paid in Protein from tasks, milestones and golden members · permanent forever.', Icons.protein(22))}
    <div class="list">${CFG.proteinUpgrades.map(proteinRow).join('')}</div>`;
});

// ───────── Staff ─────────
const StaffScreen = makeScreen(() => {
  const row = (st) => {
    const open = G.level(st) > 0;
    const hired = G.s.trainers.includes(st.id);
    const cost = G.trainerCost(st);
    return `
      <article class="card upg-row ${open ? '' : 'locked'} ${hired ? 'owned' : ''}">
        ${open ? UI.badge(st.emoji, st.tint, 48) : `<div class="badge lock-badge" style="width:48px;height:48px">${Icons.lock(18)}</div>`}
        <div class="grow">
          <h3>${esc(st.trainer)}</h3>
          <p class="small muted">${open ? `Doubles ${esc(st.name)} income` : `Open ${esc(st.name)} first`}</p>
        </div>
        ${hired ? `<span class="owned-chip">${Icons.check(14)} Hired</span>`
          : !open ? `<span class="lock-tag">${Icons.lock(14)}</span>`
          : UI.priceButton({ action: 'hire', id: st.id, cost: Fmt.short(cost), icon: Icons.reps(15), label: 'HIRE', extra: `data-need="reps:${cost}"` })}
      </article>`;
  };
  const hired = G.s.trainers.length;
  return `
    <header class="topbar">${UI.pills('reps', 'protein', 'plates')}</header>
    <div><h1 class="page-title">Staff</h1><p class="muted">Double station income until your next franchise.</p></div>
    ${UI.homeGymCard()}
    <div class="list-head row"><h2 class="grow">Trainers</h2><span class="chip chip-sage">${hired}/${CFG.stations.length} hired</span></div>
    <div class="list">${CFG.stations.map(row).join('')}</div>`;
});

// ───────── Prestige ─────────
const PrestigeScreen = (() => {
  const screen = makeScreen(() => {
    const pending = G.pendingPlates;
    const progress = Math.min(1, G.s.runReps / G.nextPlateAt);
    const row = (u) => {
      const lvl = G.golden(u.id);
      const maxed = lvl >= u.maxLevel;
      const cost = G.goldenUpgradeCost(u);
      return `
        <article class="card upg-row ${maxed ? 'owned' : ''}">
          ${UI.badge(u.emoji, '#FBEFC9', 48)}
          <div class="grow">
            <h3>${esc(u.name)}</h3>
            <p class="small muted"><span class="num strong">Lv ${lvl}/${u.maxLevel}</span> · ${esc(u.detail)}</p>
            ${UI.progress(lvl / u.maxLevel, 'var(--gold)')}
          </div>
          ${maxed ? `<span class="owned-chip gold">MAX</span>`
            : UI.priceButton({ action: 'golden-upgrade', id: u.id, cost, icon: Icons.plates(15), accent: 'gold', label: 'LEVEL', extra: `data-need="plates:${cost}"` })}
        </article>`;
    };
    return `
      <header class="topbar">${UI.pills('reps', 'protein', 'plates')}</header>
      <h1 class="page-title">Prestige</h1>
      <section class="card prestige-hero">
        <div class="hero-star" aria-hidden="true">${Icons.plates(92)}</div>
        <h2><span class="num" data-k="platesBig">${Fmt.whole(G.s.goldenPlates)}</span> Golden Plates</h2>
        <p class="muted">You'll bank <strong class="gold-text num" data-k="pending">+${Fmt.whole(pending)}</strong> when you open your next franchise.</p>
        <div class="hero-progress">
          ${UI.progress(progress, 'linear-gradient(90deg,#F2C94C,#D39E12)', 'nextPlateBar')}
          <p class="tiny muted num" data-k="nextPlate">${Fmt.whole(G.s.runReps)} / ${Fmt.whole(G.nextPlateAt)} Reps to the next plate</p>
        </div>
        <div class="chip-row">
          <span class="chip">🗺️ ${G.gymCount} gym${G.gymCount === 1 ? '' : 's'} in your chain</span>
          <span class="chip chip-gold">Chain bonus x${G.chainMult.toFixed(1)}</span>
        </div>
        <button class="btn btn-gold big" data-action="franchise" data-k="franchiseBtn" ${pending < 1 ? 'disabled' : ''}>⭐️ Open a Franchise</button>
        <button class="pill-btn" data-action="records">🏆 Records</button>
      </section>
      ${UI.sectionHead('Golden Plate Upgrades', 'Permanent. They survive every franchise.', Icons.plates(22))}
      <div class="list">${CFG.goldenUpgrades.map(row).join('')}</div>
      <p class="tiny muted center">Plates = √(Reps this franchise ÷ ${Fmt.short(CFG.prestigeDivisor)}) × chain bonus. Each map gym adds +${Math.round(CFG.chainBonusPerGym * 100)}%.</p>`;
  });

  let lastPending = -1;
  return {
    ...screen,
    render(el) { lastPending = G.pendingPlates; screen.render.call(this, el); },
    update() {
      screen.update.call(this);
      const root = document.querySelector('.screen-prestige');
      if (!root) return;
      const pending = G.pendingPlates;
      if (pending !== lastPending) { lastPending = pending; this.onStructure(); return; }
      UI.setText(root.querySelector('[data-k="nextPlate"]'), `${Fmt.whole(G.s.runReps)} / ${Fmt.whole(G.nextPlateAt)} Reps to the next plate`);
      UI.setStyle(root.querySelector('[data-k="nextPlateBar"]'), 'width', `${Math.min(1, G.s.runReps / G.nextPlateAt) * 100}%`);
      UI.setText(root.querySelector('[data-k="platesBig"]'), Fmt.whole(G.s.goldenPlates));
    },
  };
})();
