/* Shared UI building blocks: icons, pills, sheets, toasts. */

const Icons = {
  /** Reps: a small gold weight plate. */
  reps: (size = 22) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="url(#gp)"/>
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#FFF3C4" stroke-opacity=".55" stroke-width="1.6"/>
      <circle cx="16" cy="16" r="4.2" fill="#A97A0B"/>
      <circle cx="16" cy="16" r="2.2" fill="#6E4F07"/>
    </svg>`,
  /** Protein: a blue crystal. */
  protein: (size = 22) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 4h14l6 8-13 17L3 12z" fill="url(#pc)"/>
      <path d="M3 12h26M9 4l7 25M23 4l-7 25M9 4l3 8M23 4l-3 8" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none"/>
    </svg>`,
  /** Golden Plates: gold star on a plate. */
  plates: (size = 22) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="url(#gs)"/>
      <path d="M16 6.5l2.8 6 6.4.6-4.8 4.3 1.4 6.3L16 20.4l-5.8 3.3 1.4-6.3-4.8-4.3 6.4-.6z" fill="#fff" fill-opacity=".92"/>
    </svg>`,
  /** Income: a green cash stack. */
  cash: (size = 18) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="12" width="24" height="14" rx="3" fill="var(--income)" opacity=".45"/>
      <rect x="5" y="8" width="24" height="14" rx="3" fill="var(--income)"/>
      <circle cx="17" cy="15" r="3.6" fill="none" stroke="#fff" stroke-width="1.8"/>
    </svg>`,
  lock: (size = 18) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A2.5 2.5 0 0 1 20 12.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5v-7A2.5 2.5 0 0 1 6.5 10zm2.2 0h5.6V7.5a2.8 2.8 0 0 0-5.6 0z"/>
    </svg>`,
  chevron: (size = 16) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`,
  bolt: (size = 20) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.6z"/></svg>`,
  rocket: (size = 20) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M14.5 3.2c2.6-1 5.3-1 6.3-.8.2 1 .2 3.7-.8 6.3-.9 2.3-2.7 4.4-5 6l.3 3.4c0 .3-.1.6-.4.8l-2.7 2a.6.6 0 0 1-.9-.3l-.9-3-3.3-3.3-3-.9a.6.6 0 0 1-.3-.9l2-2.7c.2-.3.5-.4.8-.4l3.4.3c1.6-2.3 3.7-4.1 6-5zM16 6.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM5.6 15.8c.8-.8 2.1-.8 2.8 0 .8.8.8 2 0 2.8-1 1-3.8 1.6-3.8 1.6s.6-2.8 1-4.4z"/>
    </svg>`,
  forward: (size = 20) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 6.2v11.6c0 .8.9 1.3 1.6.8L12 13.3v4.5c0 .8.9 1.3 1.6.8l8-5.8c.5-.4.5-1.2 0-1.6l-8-5.8c-.7-.5-1.6 0-1.6.8v4.5L4.6 5.4C3.9 4.9 3 5.4 3 6.2z"/></svg>`,
  clipboard: (size = 20) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="4.5" width="14" height="17" rx="3"/><path d="M9 4.5V3.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3v.7M8.5 11h7M8.5 15h5"/>
    </svg>`,
  gear: (size = 20) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>`,
  check: (size = 16) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  close: (size = 16) => `
    <svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  star: (size = 64) => Icons.plates(size),
  // Tab bar
  tabGym: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="1.5" y="8" width="3" height="8" rx="1.2"/><rect x="4.5" y="5.5" width="3.5" height="13" rx="1.4"/><rect x="8" y="10.8" width="8" height="2.4" rx="1.2"/><rect x="16" y="5.5" width="3.5" height="13" rx="1.4"/><rect x="19.5" y="8" width="3" height="8" rx="1.2"/></svg>`,
  tabMap: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></svg>`,
  tabUpgrades: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.3 9.7a1 1 0 0 1-1.4 0L13 9.8V17a1 1 0 1 1-2 0V9.8l-1.9 1.9a1 1 0 1 1-1.4-1.4l3.6-3.6a1 1 0 0 1 1.4 0l3.6 3.6a1 1 0 0 1 0 1.4z"/></svg>`,
  tabClasses: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h.5A2.5 2.5 0 0 1 21 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4H6V3a1 1 0 0 1 1-1zm12 8H5v8.5c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5zM8 12.5h3v3H8z"/></svg>`,
  tabStaff: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="8" r="3.6"/><path d="M2 19.2C2 15.9 5.1 13.5 9 13.5s7 2.4 7 5.7c0 .7-.5 1.3-1.2 1.3H3.2c-.7 0-1.2-.6-1.2-1.3z"/><circle cx="17" cy="9" r="2.8" opacity=".6"/><path d="M17.5 13.6c2.6.3 4.5 2 4.5 4.4 0 .6-.4 1-1 1h-3.3c.1-2-.6-3.9-2.1-5.2.6-.2 1.2-.2 1.9-.2z" opacity=".6"/></svg>`,
  tabPrestige: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z"/></svg>`,
  tabShop: () => `<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 7V6.5a6 6 0 0 1 12 0V7h1.3c.9 0 1.6.7 1.7 1.6l.9 11a2.2 2.2 0 0 1-2.2 2.4H4.3a2.2 2.2 0 0 1-2.2-2.4l.9-11C3.1 7.7 3.8 7 4.7 7zm2.2 0h7.6v-.5a3.8 3.8 0 0 0-7.6 0z"/></svg>`,
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const UI = {
  has: (list, id) => list.includes(id),
  setText(el, v) { if (el && el.textContent !== v) el.textContent = v; },
  setStyle(el, prop, v) { if (el && el.style[prop] !== v) el.style[prop] = v; },
  /** Updates every currency pill inside `root`. */
  syncPills(root) {
    const vals = { reps: Fmt.whole(G.s.reps), protein: Fmt.whole(G.s.protein), plates: Fmt.whole(G.s.goldenPlates), income: Fmt.rate(G.incomePerSec) };
    root.querySelectorAll('.pill [data-k]').forEach((el) => { if (el.dataset.k in vals) UI.setText(el, vals[el.dataset.k]); });
  },
  pills(...kinds) {
    return kinds.map((kd) => UI.pill(kd, '0')).join('');
  },
  sectionHead(title, caption = '', icon = '') {
    return `<div class="list-head"><h2>${icon}${title}</h2>${caption ? `<p class="muted small">${caption}</p>` : ''}</div>`;
  },
  /** Price button: accent = sage | aqua | gold. */
  priceButton({ action, id, cost, icon, accent = 'sage', label = 'BUY', disabled = false, extra = '' }) {
    return `<button class="buy ${accent}" data-action="${action}" data-id="${id}" ${disabled ? 'disabled' : ''} ${extra}>
      <span class="buy-label">${label}</span>
      <span class="buy-cost">${icon}<span class="num">${cost}</span></span>
    </button>`;
  },
  pill(kind, value, key) {
    const icon = { reps: Icons.reps(22), protein: Icons.protein(22), plates: Icons.plates(22), income: Icons.cash(20) }[kind];
    const label = { reps: 'Reps', protein: 'Protein', plates: 'Golden Plates', income: 'Income per second' }[kind];
    return `<div class="pill pill-${kind}" role="text" aria-label="${label}"><span class="pill-icon">${icon}</span><span class="num" data-k="${key || kind}">${value}</span></div>`;
  },

  /** Round pastel badge holding a picture (an <img> or <svg>). */
  badge(pic, tint, size = 52) {
    return `<div class="badge" style="--tint:${tint};width:${size}px;height:${size}px">${pic}</div>`;
  },
  /** Badge with a station's equipment art. */
  stationBadge(st, size = 52) { return UI.badge(Art.station(st.id, Math.round(size * 0.86)), st.tint, size); },
  /** Badge with an SVG icon. */
  iconBadge(name, tint = '#EFE7DC', size = 48) { return UI.badge(Pics.get(name, Math.round(size * 0.62)), tint, size); },
  /** Picture for an upgrade: station art for station boosts, otherwise its icon. */
  upgradePic(u, size = 30) {
    return u.icon === 'station' ? Art.station(u.effect.station, size) : Pics.get(u.icon, size);
  },
  upgradeBadge(u, tint, size = 48) {
    const st = u.effect?.station && CFG.stations.find((x) => x.id === u.effect.station);
    return UI.badge(UI.upgradePic(u, Math.round(size * (u.icon === 'station' ? 0.86 : 0.62))) + (u.icon === 'station' ? `<span class="badge-x">x${u.effect.value}</span>` : ''), tint || (st ? st.tint : '#EFE5D6'), size);
  },

  /** Live-updates the Gym Size part of a Home Gym card inside `root`. */
  syncSize(root) {
    const m = root.querySelector('[data-k="sizeMult"]');
    if (!m) return;
    UI.setText(m, Fmt.mult(G.sizeMult));
    UI.setStyle(root.querySelector('[data-k="sizeBar"]'), 'width', `${((G.totalLevels % CFG.sizeBonus.every) / CFG.sizeBonus.every) * 100}%`);
    UI.setText(root.querySelector('[data-k="sizeNext"]'), `${G.totalLevels}/${G.nextSizeAt} station levels → all income x${CFG.sizeBonus.mult} more. Levels on any station count, even Free Weights.`);
  },

  progress(fraction, color = 'var(--sage1)', key) {
    const pct = Math.max(0, Math.min(1, fraction)) * 100;
    return `<div class="bar"><div class="bar-fill" ${key ? `data-k="${key}"` : ''} style="width:${pct}%;background:${color}"></div></div>`;
  },

  homeGymCard() {
    const lvl = G.homeGymLevel;
    return `
      <section class="card home-card">
        <div class="row gap-14">
          ${UI.iconBadge('home', '#DCEBDF', 52)}
          <div class="grow">
            <div class="row gap-8"><h3>Home Gym</h3><span class="chip chip-sage">Level ${lvl}</span></div>
            <p class="muted small">Your next franchise grows the gym's income and costs.</p>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat"><span class="muted tiny">Station income</span><strong class="num">${Fmt.mult(G.homeGymIncomeMult)}</strong></div>
          <div class="stat"><span class="muted tiny">Cost</span><strong class="num">${Fmt.mult(G.homeGymCostMult)}</strong></div>
        </div>
        <div class="size-bonus">
          <div class="row gap-8"><strong class="small">Gym Size bonus</strong><span class="chip chip-sage num" data-k="sizeMult">${Fmt.mult(G.sizeMult)}</span></div>
          <div class="bar"><div class="bar-fill" data-k="sizeBar" style="width:${((G.totalLevels % CFG.sizeBonus.every) / CFG.sizeBonus.every) * 100}%"></div></div>
          <p class="tiny muted num" data-k="sizeNext">${G.totalLevels}/${G.nextSizeAt} station levels → all income x${CFG.sizeBonus.mult} more. Levels on any station count, even Free Weights.</p>
        </div>
      </section>`;
  },
};

/* ───────── Bottom sheets ───────── */
const Sheet = (() => {
  let current = null;

  function close() {
    if (!current) return;
    const { root, onClose } = current;
    current = null;
    root.classList.remove('open');
    root.addEventListener('transitionend', () => root.remove(), { once: true });
    setTimeout(() => root.remove(), 450);
    document.body.classList.remove('sheet-open');
    onClose?.();
  }

  function open(html, { onMount, onClose, className = '' } = {}) {
    if (current) { current.root.remove(); current = null; }
    const root = document.createElement('div');
    root.className = 'sheet-root';
    root.innerHTML = `
      <div class="sheet-backdrop" data-action="sheet-close"></div>
      <div class="sheet ${className}" role="dialog" aria-modal="true">
        <div class="grabber" aria-hidden="true"></div>
        <div class="sheet-body">${html}</div>
      </div>`;
    document.body.appendChild(root);
    document.body.classList.add('sheet-open');
    current = { root, onClose };
    enableSwipeToClose(root.querySelector('.sheet'));
    onMount?.(root.querySelector('.sheet-body'));
    setTimeout(() => root.classList.add('open'), 20);
    return root.querySelector('.sheet-body');
  }

  function enableSwipeToClose(sheet) {
    const grab = sheet.querySelector('.grabber');
    let startY = null;
    const target = (e) => e.target === grab || (sheet.querySelector('.sheet-body').scrollTop <= 0 && e.target.closest('.sheet-head'));
    sheet.addEventListener('pointerdown', (e) => {
      if (!target(e)) return;
      startY = e.clientY;
      sheet.style.transition = 'none';
      sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      sheet.style.transform = `translate(-50%, ${Math.max(0, e.clientY - startY)}px)`;
    });
    const end = (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      startY = null;
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (dy > 110) close();
    };
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
  }

  return { open, close, get isOpen() { return !!current; }, get body() { return current?.root.querySelector('.sheet-body'); } };
})();

/* ───────── Toasts & milestone banner ───────── */
const Toast = (() => {
  let timer = null;
  function show({ icon, title, subtitle = '', celebrate = false }) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast' + (celebrate ? ' celebrate' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="toast-icon"><span class="pulse-ring"></span>${icon || Pics.get('sparkle', 26)}</div>
      <div><strong>${esc(title)}</strong>${subtitle ? `<span class="muted small">${esc(subtitle)}</span>` : ''}</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 2600);
    if (celebrate) { FX.confetti(); FX.sound('milestone'); }
  }
  return { show };
})();
