/* Tab: Classes. Schedule classes into real local-time slots. A running class
   multiplies its station's income (more at peak hours). Each class once per day. */
const hourLabel = (h) => `${h % 12 || 12} ${h % 24 < 12 ? 'AM' : 'PM'}`;
function slotRange(slot) {
  const a = hourLabel(slot.start), b = hourLabel(slot.end);
  const [an, as] = a.split(' '), [bn, bs] = b.split(' ');
  return as === bs ? `${an}–${bn} ${bs}` : `${a}–${b}`;
}

const ClassesScreen = (() => {
  const screen = makeScreen(() => {
    const now = G.currentSlot;
    const live = G.liveClass;
    const nowUnlocked = G.slotUnlocked(now.id);
    const cost = G.nextSlotCost;

    const slotRow = (slot) => {
      const unlocked = G.slotUnlocked(slot.id);
      const stId = G.s.schedule.classes[slot.id];
      const st = stId && G.station(stId);
      const mult = +G.classMultBase(slot).toFixed(1);
      return `
        <article class="card slot-row ${slot.id === now.id ? 'now' : ''} ${unlocked ? '' : 'locked'}">
          <div class="slot-time">
            <strong class="num">${slotRange(slot)}</strong>
            <span class="muted tiny">${slot.name}</span>
            ${slot.peak ? '<span class="peak-chip">PEAK</span>' : ''}
          </div>
          <div class="grow slot-class">
            ${!unlocked ? `<span class="muted small">${Icons.lock(13)} Locked</span>`
              : st ? `<span class="slot-pic">${Art.station(st.id, 34)}</span><span><strong>${esc(CFG.classes[st.id])}</strong><span class="muted tiny">${esc(st.name)} x${mult}</span></span>`
              : '<span class="muted small">Empty slot</span>'}
          </div>
          ${!unlocked
            ? UI.priceButton({ action: 'unlock-slot', id: slot.id, cost: Fmt.short(cost), icon: Icons.reps(15), label: cost ? 'UNLOCK' : 'FREE', extra: `data-need="reps:${cost}"` })
            : `<button class="btn btn-ghost tiny-btn" data-action="pick-class" data-id="${slot.id}">${st ? 'Change' : 'Choose'}</button>`}
        </article>`;
    };

    return `
      <header class="topbar">${UI.pills('reps', 'protein', 'plates')}</header>
      <div>
        <h1 class="page-title">Classes</h1>
        <p class="muted">Schedule classes in your real local time. While a class runs, its station earns x${CFG.classMultiplier}, or x${CFG.peakClassMultiplier} at peak hours. Each class runs once a day.</p>
      </div>
      <section class="card class-now ${live ? 'live' : ''}">
        <div class="row gap-8 wrap">
          <span class="chip ${live ? 'chip-sage' : ''}">${live ? '● Live now' : 'Now'}</span>
          <span class="muted small">${now.name} · ${slotRange(now)}</span>
          ${now.peak ? '<span class="peak-chip">PEAK</span>' : ''}
        </div>
        ${live ? `
          <div class="class-live">
            ${UI.stationBadge(live.station, 64)}
            <div class="grow">
              <h2>${esc(CFG.classes[live.station.id])}</h2>
              <p class="muted small">${esc(live.station.name)} income <strong class="income-text">x${+live.mult.toFixed(1)}</strong></p>
            </div>
          </div>` : `
          <div class="class-live">
            ${UI.iconBadge('calendar', '#EFE7DC', 64)}
            <div class="grow">
              <h2>Nothing scheduled</h2>
              <p class="muted small">${nowUnlocked ? 'Pick a class for this slot to boost a station right now.' : 'Unlock this time slot to run a class in it.'}</p>
            </div>
          </div>
          ${nowUnlocked ? `<button class="btn btn-sage big" data-action="pick-class" data-id="${now.id}">Choose a class</button>` : ''}`}
        <p class="tiny muted num" data-k="slotLeft">${Fmt.duration(G.slotSecondsLeft)} until ${G.slotAt(new Date(G.now + G.slotSecondsLeft * 1000 + 1000)).name}</p>
      </section>
      <div class="list-head row"><h2 class="grow">Today's schedule</h2><span class="chip">${G.s.schedule.unlocked.length}/${CFG.timeSlots.length} slots</span></div>
      <div class="list">${CFG.timeSlots.map(slotRow).join('')}</div>
      <p class="tiny muted center">Classes only run while the app is open. Offline earnings use your regular income.</p>`;
  });

  return {
    ...screen,
    update() {
      screen.update.call(this);
      const el = document.querySelector('.screen-classes [data-k="slotLeft"]');
      if (el) UI.setText(el, `${Fmt.duration(G.slotSecondsLeft)} until ${G.slotAt(new Date(G.now + G.slotSecondsLeft * 1000 + 1000)).name}`);
    },
  };
})();

/** Bottom sheet: pick which class runs in a slot. */
function openClassPicker(slotId) {
  const slot = CFG.timeSlots.find((t) => t.id === slotId);
  const mult = +G.classMultBase(slot).toFixed(1);
  const current = G.s.schedule.classes[slotId];
  const open = CFG.stations.filter((st) => G.level(st) > 0);
  const render = () => `
    <div class="sheet-head">
      <div><h2>${slot.name} · ${slotRange(slot)}</h2><p class="muted small">Pick a class. Its station earns x${mult} during this slot${slot.peak ? ' (peak hours)' : ''}.</p></div>
      <button class="round-btn small" data-action="sheet-close" aria-label="Close">${Icons.close()}</button>
    </div>
    <div class="list">
      ${open.map((st) => {
        const other = G.classSlotOf(st.id);
        const here = other === slotId;
        const otherSlot = other && !here && CFG.timeSlots.find((t) => t.id === other);
        return `
          <button class="card upg-row pick-row ${here ? 'owned' : ''}" data-pick="${st.id}">
            ${UI.stationBadge(st, 46)}
            <div class="grow">
              <h3>${esc(CFG.classes[st.id])}</h3>
              <p class="small muted">${esc(st.name)} · now ${Fmt.rate(G.stationIncome(st) / G.stationBoosts(st).class)}${otherSlot ? ` · moves from ${otherSlot.name}` : ''}</p>
            </div>
            ${here ? `<span class="owned-chip">${Icons.check(14)} Scheduled</span>` : `<span class="chip chip-sage">x${mult}</span>`}
          </button>`;
      }).join('')}
    </div>
    ${current ? '<button class="text-btn" data-pick="">Clear this slot</button>' : ''}`;
  const body = Sheet.open(render(), { className: 'tall' });
  body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    G.setClass(slotId, b.dataset.pick || null);
    Sheet.close();
    if (b.dataset.pick) Toast.show({ icon: Art.station(b.dataset.pick, 36), title: `${CFG.classes[b.dataset.pick]} scheduled`, subtitle: `${slot.name} · ${slotRange(slot)} · x${mult}` });
  });
}
