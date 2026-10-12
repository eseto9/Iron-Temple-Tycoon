/* Tab 2: Map. Leaflet map of North America with 26 cities; each city has 3 gym locations.
   Falls back to a city list when the map library can't load (offline). */
const MapScreen = (() => {
  let root = null;
  let map = null;
  let cluster = null;
  const markers = {};
  let pickedFocus = null; // focus chosen in the open city sheet

  const tagClass = { Steady: 'tag-steady', Busy: 'tag-busy', Prime: 'tag-prime' };

  function statusText() {
    return `${G.cityCount}/${CFG.cities.length} cities · ${G.gymCount} gym${G.gymCount === 1 ? '' : 's'} · pinch to zoom, drag to explore`;
  }

  function pinHtml(city) {
    const n = G.gymsIn(city.id);
    const state = n === 0 ? '' : n === CFG.locations.length ? 'full' : 'owned';
    return `<div class="city-pin ${state}" aria-label="${esc(city.name)}">
      <span class="pin-trend">${G.focus(city.trend).emoji}</span>${n ? `<span class="pin-count">${n}</span>` : ''}
    </div>`;
  }

  function makeIcon(city) {
    return L.divIcon({ html: pinHtml(city), className: 'pin-wrap', iconSize: [40, 40], iconAnchor: [20, 20] });
  }

  function render(el) {
    root = el;
    root.innerHTML = `
      <div class="map-canvas" id="map-canvas"></div>
      <div class="map-top">${UI.pills('reps', 'protein', 'income')}</div>
      <div class="map-status" data-k="status">${statusText()}</div>`;
    UI.syncPills(root);

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
          <span class="chip trend-chip">📈 Loves ${trend.emoji} ${trend.name}</span>
        </div>
        ${n < CFG.locations.length ? `
          <div class="focus-pick">
            <p class="small"><strong>Gym focus</strong> <span class="muted">· matching the trend pays x${+(CFG.trendMultiplier * G.effectProduct('trend')).toFixed(2)}, and every ${pf.name} gym lifts your home ${pf.name} stations +${Math.round(CFG.focusBonusPerGym * 100)}%</span></p>
            <div class="focus-grid four">${CFG.focuses.map((f) => `
              <button class="focus-btn ${f.id === pick ? 'on' : ''}" data-action="pick-focus" data-id="${f.id}" style="--tint:${f.tint}" aria-pressed="${f.id === pick}">
                <span>${f.emoji}</span>${f.name}${f.id === city.trend ? '<i class="trend-dot" title="Trending here"></i>' : ''}
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
                ${UI.badge(loc.emoji, loc.tag === 'Prime' ? '#FBEFC9' : loc.tag === 'Busy' ? '#E4DDF8' : '#EADFD5', 48)}
                <div class="grow">
                  <div class="row gap-6 wrap"><h3>${loc.name}</h3><span class="loc-tag ${tagClass[loc.tag]}">${loc.tag}</span></div>
                  <p class="small income-text num">+${Fmt.rate(G.gymIncome(city, loc, focusId))}${f ? ` <span class="muted">· ${f.emoji} ${f.name}${onTrend ? ' 📈' : ''}</span>` : ''}</p>
                </div>
                ${gym ? `<span class="owned-chip">${Icons.check(14)} Open</span>`
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

  function refresh() {
    if (!root) return;
    UI.setText(root.querySelector('[data-k="status"]'), statusText());
    for (const city of CFG.cities) markers[city.id]?.setIcon(makeIcon(city));
    if (!window.L) renderFallback();
    const body = Sheet.body;
    const cityId = body?.querySelector('[data-city-sheet]')?.dataset.citySheet;
    if (cityId) {
      body.innerHTML = citySheetHtml(G.city(cityId));
      syncAffordability(body);
    }
  }

  return {
    render,
    openCity,
    get pickedFocus() { return pickedFocus; },
    pickFocus(id) {
      pickedFocus = id;
      FX.haptic('select');
      const body = Sheet.body;
      const cityId = body?.querySelector('[data-city-sheet]')?.dataset.citySheet;
      if (cityId) { body.innerHTML = citySheetHtml(G.city(cityId)); syncAffordability(body); }
    },
    update() { if (root) UI.syncPills(root); },
    onStructure: refresh,
    unmount() {
      if (map) { map.remove(); map = null; }
      cluster = null;
      root = null;
    },
  };
})();
