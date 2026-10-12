/* Tab 2: Map. Leaflet map of North America with 26 cities; each city has 3 gym locations.
   Falls back to a city list when the map library can't load (offline). */
const MapScreen = (() => {
  let root = null;
  let map = null;
  let cluster = null;
  const markers = {};
  let pickedFocus = null; // focus chosen in the open city sheet

  const tagClass = { Steady: 'tag-steady', Busy: 'tag-busy', Prime: 'tag-prime' };

  const pinState = {}; // city → last drawn state, so pins only redraw when something changes
  const locTint = (loc) => (loc.tag === 'Prime' ? '#FBEFC9' : loc.tag === 'Busy' ? '#E4DDF8' : '#EADFD5');

  function statusText() {
    return `${G.cityCount}/${CFG.cities.length} cities · ${G.gymCount} gym${G.gymCount === 1 ? '' : 's'} · pinch to zoom, drag to explore`;
  }
  /** Cheapest unopened spot in a city, or null. */
  function cheapestIn(city) {
    let best = null;
    for (const loc of CFG.locations) if (!G.hasGym(city.id, loc.id)) {
      const cost = G.gymCost(city, loc);
      if (!best || cost < best.cost) best = { loc, cost };
    }
    return best;
  }
  const affordable = (city) => { const c = cheapestIn(city); return !!c && c.cost <= G.s.reps; };

  function pinHtml(city) {
    const n = G.gymsIn(city.id);
    const state = n === 0 ? '' : n === CFG.locations.length ? 'full' : 'owned';
    const c = cheapestIn(city);
    return `<div class="city-pin ${state} ${affordable(city) ? 'can-afford' : ''}" aria-label="${esc(city.name)}">
      <span class="pin-trend">${Pics.get(G.focus(city.trend).icon, 20)}</span>${n ? `<span class="pin-count">${n}</span>` : ''}
      ${c ? `<span class="pin-price num">${Fmt.short(c.cost)}</span>` : ''}
    </div>`;
  }
  const pinKey = (city) => `${G.gymsIn(city.id)}:${affordable(city)}:${G.homeGymLevel}`;

  function makeIcon(city) {
    return L.divIcon({ html: pinHtml(city), className: 'pin-wrap', iconSize: [40, 40], iconAnchor: [20, 20] });
  }

  function render(el) {
    root = el;
    root.innerHTML = `
      <div class="map-canvas" id="map-canvas"></div>
      <div class="map-top">${UI.pills('reps', 'protein', 'income')}</div>
      <div class="map-bottom">
        <button class="map-next card" data-action="cheapest-gyms" data-k="next"></button>
        <div class="map-status" data-k="status">${statusText()}</div>
      </div>`;
    UI.syncPills(root);
    updateNext();

    if (!window.L) { renderFallback(); return; }

    const dark = document.documentElement.dataset.theme === 'dark'
      || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    map = L.map('map-canvas', { zoomControl: false, minZoom: 2, maxZoom: 11, worldCopyJump: true, tap: true });
    // Esri's soft gray canvas: calm, label-light and free to use with attribution.
    const tone = dark ? 'Dark' : 'Light';
    const esri = (name) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${tone}_Gray_${name}/MapServer/tile/{z}/{y}/{x}`;
    L.tileLayer(esri('Base'), { maxZoom: 16, attribution: 'Tiles © Esri' }).addTo(map);
    L.tileLayer(esri('Reference'), { maxZoom: 16 }).addTo(map);
    map.fitBounds(L.latLngBounds(CFG.cities.map((c) => [c.lat, c.lng])), { padding: [30, 30] });

    cluster = L.markerClusterGroup
      ? L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 28,
          iconCreateFunction: (c) => L.divIcon({ html: `<div class="cluster-pin">${c.getChildCount()}</div>`, className: 'pin-wrap', iconSize: [44, 44] }),
        })
      : L.layerGroup();
    for (const city of CFG.cities) {
      const m = L.marker([city.lat, city.lng], { icon: makeIcon(city), title: city.name, keyboard: true });
      m.on('click', () => openCity(city));
      markers[city.id] = m;
      pinState[city.id] = pinKey(city);
      cluster.addLayer(m);
    }
    map.addLayer(cluster);
    // The map sizes itself before layout settles on some phones.
    setTimeout(() => map && map.invalidateSize(), 60);
  }

  function renderFallback() {
    const byTier = {};
    CFG.cities.forEach((c) => (byTier[c.tier] ||= []).push(c));
    root.classList.add('map-fallback');
    root.querySelector('.map-canvas').innerHTML = `
      <div class="fallback-list">
        <h1 class="page-title">Gym chain</h1>
        <p class="muted small">The map needs an internet connection. You can still open gyms from this list.</p>
        ${Object.entries(byTier).map(([tier, cities]) => `
          <div class="list-head"><h3>Tier ${tier}</h3></div>
          <div class="city-grid">${cities.map((c) => `
            <button class="card city-card" data-action="open-city" data-id="${c.id}">
              <strong>${esc(c.name)}</strong><span class="muted tiny">${esc(c.region)} · ${G.gymsIn(c.id)}/3</span>
            </button>`).join('')}</div>`).join('')}
      </div>`;
  }

  function citySheetHtml(city) {
    const n = G.gymsIn(city.id);
    const trend = G.focus(city.trend);
    const pick = pickedFocus || city.trend;
    const pf = G.focus(pick);
    return `
      <div class="city-sheet" data-city-sheet="${city.id}">
        <div class="sheet-head">
          <div><h2>${esc(city.name)}</h2><p class="muted small">${esc(city.region)}</p></div>
          ${UI.pill('reps', Fmt.whole(G.s.reps))}
        </div>
        <div class="row gap-8 wrap">
          <span class="chip chip-sage">Tier ${city.tier} · ${n}/${CFG.locations.length} gyms open</span>
          <span class="chip trend-chip">${Pics.get('chart', 14)} Loves ${Pics.get(trend.icon, 14)} ${trend.name}</span>
        </div>
        ${n < CFG.locations.length ? `
          <div class="focus-pick">
            <p class="small"><strong>Gym focus</strong> <span class="muted">· matching the trend pays x${+(CFG.trendMultiplier * G.effectProduct('trend')).toFixed(2)}, and every ${pf.name} gym lifts your home ${pf.name} stations +${Math.round(CFG.focusBonusPerGym * 100)}%</span></p>
            <div class="focus-grid four">${CFG.focuses.map((f) => `
              <button class="focus-btn ${f.id === pick ? 'on' : ''}" data-action="pick-focus" data-id="${f.id}" style="--tint:${f.tint}" aria-pressed="${f.id === pick}">
                ${Pics.get(f.icon, 22)}${f.name}${f.id === city.trend ? '<i class="trend-dot" title="Trending here"></i>' : ''}
              </button>`).join('')}</div>
          </div>` : ''}
        <div class="list">
          ${CFG.locations.map((loc) => {
            const gym = G.gymAt(city.id, loc.id);
            const focusId = gym ? gym.focus : pick;
            const f = G.focus(focusId);
            const cost = G.gymCost(city, loc);
            const onTrend = focusId === city.trend;
            return `
              <article class="card upg-row ${gym ? 'owned' : ''}">
                ${UI.iconBadge(loc.icon, locTint(loc), 48)}
                <div class="grow">
                  <div class="row gap-6 wrap"><h3>${loc.name}</h3><span class="loc-tag ${tagClass[loc.tag]}">${loc.tag}</span></div>
                  <p class="small income-text num">+${Fmt.rate(G.gymIncome(city, loc, focusId, gym ? `${city.id}:${loc.id}` : undefined))}${f ? ` <span class="muted">· ${f.name}${onTrend ? ' · on trend' : ''}</span>` : ''}</p>
                </div>
                ${gym ? `<button class="btn btn-ghost tiny-btn" data-action="visit-gym" data-id="${city.id}:${loc.id}">Visit</button>`
                  : UI.priceButton({ action: 'open-gym', id: `${city.id}:${loc.id}`, cost: Fmt.short(cost), icon: Icons.reps(15), label: 'OPEN', extra: `data-need="reps:${cost}"` })}
              </article>`;
          }).join('')}
        </div>
        <p class="tiny muted center">Map gyms earn forever. They survive franchising and grow your Golden Plate bonus.</p>
        <button class="text-btn" data-action="sheet-close">Close</button>
      </div>`;
  }

  function openCity(city) {
    FX.haptic('select');
    pickedFocus = city.trend;
    Sheet.open(citySheetHtml(city));
    syncAffordability(Sheet.body);
  }

  /** The "next gym" bar: cheapest place you haven't opened, with progress toward it. */
  function updateNext() {
    const el = root?.querySelector('[data-k="next"]');
    if (!el) return;
    const next = G.cheapestGyms(1)[0];
    if (!next) { el.hidden = true; return; }
    const ready = G.s.reps >= next.cost;
    const pct = Math.min(1, G.s.reps / next.cost) * 100;
    const sig = `${next.city.id}${next.loc.id}${ready}${pct.toFixed(0)}`;
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    el.innerHTML = `
      ${UI.iconBadge(next.loc.icon, locTint(next.loc), 40)}
      <span class="grow next-text">
        <span class="tiny muted upper">${ready ? 'Ready to open' : 'Next cheapest gym'}</span>
        <strong>${esc(next.city.name)} · ${next.loc.name}</strong>
        <span class="bar"><span class="bar-fill" style="width:${pct.toFixed(1)}%"></span></span>
      </span>
      <span class="next-price ${ready ? 'ready' : ''}">${Icons.reps(14)}<span class="num">${Fmt.short(next.cost)}</span></span>
      <span class="muted">${Icons.chevron(16)}</span>`;
  }

  function cheapestSheetHtml() {
    const list = G.cheapestGyms(15);
    return `
      <div class="cheap-sheet" data-cheap-sheet>
        <div class="sheet-head">
          <div><h2>Gyms by price</h2><p class="muted small">Every spot you have not opened yet, cheapest first. Opening from here uses the city's trending focus (x${CFG.trendMultiplier}). Tap a city to pick a different focus.</p></div>
          <button class="round-btn small" data-action="sheet-close" aria-label="Close">${Icons.close()}</button>
        </div>
        <div class="balance-row">${UI.pill('reps', Fmt.whole(G.s.reps))}</div>
        <div class="list">
          ${list.map(({ city, loc, cost }) => {
            const trend = G.focus(city.trend);
            return `
              <article class="card upg-row cheap-row">
                <button class="cheap-info" data-action="open-city" data-id="${city.id}" aria-label="${esc(city.name)} details">
                  ${UI.iconBadge(loc.icon, locTint(loc), 44)}
                  <span class="grow">
                    <strong>${esc(city.name)} · ${loc.name}</strong>
                    <span class="small muted">Tier ${city.tier} · ${Pics.get(trend.icon, 13)} ${trend.name} · <span class="income-text">+${Fmt.rate(G.gymIncome(city, loc, city.trend))}</span></span>
                  </span>
                </button>
                ${UI.priceButton({ action: 'open-gym-trend', id: `${city.id}:${loc.id}`, cost: Fmt.short(cost), icon: Icons.reps(15), label: 'OPEN', extra: `data-need="reps:${cost}"` })}
              </article>`;
          }).join('') || '<div class="card empty-state"><h3>Every gym is open</h3><p class="muted small">Your chain covers the whole map.</p></div>'}
        </div>
      </div>`;
  }

  function openCheapest() {
    FX.haptic('select');
    Sheet.open(cheapestSheetHtml(), { className: 'tall' });
    syncAffordability(Sheet.body);
  }

  function refresh() {
    if (!root) return;
    UI.setText(root.querySelector('[data-k="status"]'), statusText());
    for (const city of CFG.cities) { markers[city.id]?.setIcon(makeIcon(city)); pinState[city.id] = pinKey(city); }
    if (!window.L) renderFallback();
    const nx = root.querySelector('[data-k="next"]');
    if (nx) nx.dataset.sig = '';
    updateNext();
    const body = Sheet.body;
    const cityId = body?.querySelector('[data-city-sheet]')?.dataset.citySheet;
    if (cityId) {
      body.innerHTML = citySheetHtml(G.city(cityId));
      syncAffordability(body);
    } else if (body?.querySelector('[data-cheap-sheet]')) {
      const y = body.scrollTop;
      body.innerHTML = cheapestSheetHtml();
      body.scrollTop = y;
      syncAffordability(body);
    }
  }

  let slow = 0;

  return {
    render,
    openCity,
    openCheapest,
    get pickedFocus() { return pickedFocus; },
    pickFocus(id) {
      pickedFocus = id;
      FX.haptic('select');
      const body = Sheet.body;
      const cityId = body?.querySelector('[data-city-sheet]')?.dataset.citySheet;
      if (cityId) { body.innerHTML = citySheetHtml(G.city(cityId)); syncAffordability(body); }
    },
    update() {
      if (!root) return;
      UI.syncPills(root);
      updateNext();
      // Pins glow when you can afford a gym there; recheck twice a second.
      if (++slow % 5 === 0) for (const city of CFG.cities) {
        const key = pinKey(city);
        if (pinState[city.id] !== key) { pinState[city.id] = key; markers[city.id]?.setIcon(makeIcon(city)); }
      }
    },
    onStructure: refresh,
    unmount() {
      if (map) { map.remove(); map = null; }
      cluster = null;
      root = null;
    },
  };
})();
