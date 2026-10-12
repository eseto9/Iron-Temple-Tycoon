/* Pictures for the whole app, no emoji:
   - Pics: hand-drawn SVG icons (upgrades, places, focuses, tasks, UI).
   - Art: images rendered from the same canvas drawings as the gym floor
     (each station's equipment, and a coach figure for every trainer). */
const Pics = (() => {
  const svg = (body, size) => `<svg class="pic" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
  const ink = '#2B211B', sage = '#4F9D69', sageD = '#2F7A4A', clay = '#E07B39', gold = '#E6B422', goldL = '#F7D66A',
    lav = '#8B6FD6', aqua = '#35C3DD', cream = '#FFF7EA', wood = '#C99A6B', woodD = '#8A6A52', steel = '#5A5F6B', rose = '#F2A7B8';
  const P = {
    home: `<path d="M5 15 16 6l11 9v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="${cream}" stroke="${woodD}" stroke-width="1.6"/><path d="M3.5 15.5 16 5l12.5 10.5" fill="none" stroke="${clay}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="19" width="6" height="9" rx="1.5" fill="${sage}"/><rect x="7.5" y="16" width="4" height="4" rx="1" fill="${aqua}"/>`,
    sun: `<circle cx="16" cy="16" r="6.5" fill="${goldL}" stroke="${gold}" stroke-width="1.5"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="15" y="2.5" width="2" height="5" rx="1" fill="${clay}" transform="rotate(${a} 16 16)"/>`).join('')}`,
    calendar: `<rect x="5" y="7" width="22" height="20" rx="4" fill="${cream}" stroke="${woodD}" stroke-width="1.5"/><path d="M5 11a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v2H5z" fill="${clay}"/><rect x="10" y="4" width="2.4" height="6" rx="1.2" fill="${ink}"/><rect x="19.6" y="4" width="2.4" height="6" rx="1.2" fill="${ink}"/><rect x="9" y="16" width="4" height="3.4" rx="1" fill="${sage}"/><rect x="14" y="16" width="4" height="3.4" rx="1" fill="${lav}"/><rect x="19" y="16" width="4" height="3.4" rx="1" fill="${aqua}"/><rect x="9" y="21" width="4" height="3.4" rx="1" fill="${gold}"/>`,
    ticket: `<path d="M4 10a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6z" fill="${lav}"/><path d="M20 9v14" stroke="${cream}" stroke-width="1.4" stroke-dasharray="2 2"/><circle cx="12" cy="16" r="3.4" fill="${goldL}"/>`,
    sofa: `<rect x="5" y="9" width="22" height="10" rx="4" fill="${goldL}"/><rect x="3" y="14" width="26" height="9" rx="3.5" fill="${gold}"/><rect x="8" y="16" width="16" height="5" rx="2" fill="${goldL}"/><rect x="5" y="23" width="2.4" height="4" rx="1" fill="${woodD}"/><rect x="24.6" y="23" width="2.4" height="4" rx="1" fill="${woodD}"/>`,
    card: `<rect x="4" y="8" width="24" height="16" rx="3.5" fill="${aqua}"/><rect x="4" y="12" width="24" height="3.4" fill="${ink}" opacity=".7"/><rect x="8" y="18.5" width="9" height="2.4" rx="1.2" fill="${cream}"/><circle cx="23" cy="19.6" r="2.4" fill="${goldL}"/>`,
    trophy: `<path d="M10 5h12v6a6 6 0 0 1-12 0z" fill="${goldL}" stroke="${gold}" stroke-width="1.4"/><path d="M10 7H6a4 4 0 0 0 4 6M22 7h4a4 4 0 0 1-4 6" fill="none" stroke="${gold}" stroke-width="1.8"/><rect x="14.5" y="16" width="3" height="5" fill="${gold}"/><rect x="10" y="21" width="12" height="5" rx="1.6" fill="${woodD}"/>`,
    wall: `<rect x="4" y="6" width="24" height="20" rx="3" fill="${clay}"/>${[[4, 6, 11], [16, 6, 12], [4, 13, 6], [11, 13, 10], [22, 13, 6], [4, 20, 11], [16, 20, 12]].map(([x, y, w]) => `<rect x="${x + 0.8}" y="${y + 0.8}" width="${w - 1.6}" height="5.4" rx="1" fill="#F0A06A"/>`).join('')}<path d="M9 12l2.2 2.2L15 10" fill="none" stroke="${cream}" stroke-width="1.6"/>`,
    planner: `<rect x="7" y="5" width="18" height="23" rx="3" fill="${cream}" stroke="${woodD}" stroke-width="1.5"/><rect x="12" y="3" width="8" height="5" rx="2" fill="${sage}"/><path d="M11 14l2.4 2.4L18 12" fill="none" stroke="${sage}" stroke-width="2" stroke-linecap="round"/><rect x="11" y="20" width="10" height="2" rx="1" fill="${lav}"/><rect x="11" y="24" width="7" height="2" rx="1" fill="${aqua}"/>`,
    register: `<rect x="5" y="14" width="22" height="13" rx="3" fill="${aqua}"/><rect x="8" y="6" width="16" height="9" rx="2" fill="${ink}"/><rect x="10" y="8" width="12" height="4" rx="1" fill="#86E3A6"/>${[9, 14, 19].map((x) => `<rect x="${x}" y="18" width="4" height="2.4" rx="1" fill="${cream}"/><rect x="${x}" y="22" width="4" height="2.4" rx="1" fill="${cream}"/>`).join('')}`,
    bell: `<path d="M8 22c1.5-1.5 2-3 2-7a6 6 0 0 1 12 0c0 4 .5 5.5 2 7z" fill="${goldL}" stroke="${gold}" stroke-width="1.5" stroke-linejoin="round"/><rect x="6" y="22" width="20" height="3" rx="1.5" fill="${gold}"/><circle cx="16" cy="7" r="1.8" fill="${gold}"/><circle cx="16" cy="27" r="2" fill="${woodD}"/>`,
    handshake: `<path d="M3 13l6-4 5 2 4-2 5 2 6 2v8l-5 2-8 4-5-4-8-2z" fill="#EBBE9B"/><path d="M9 9l-6 4v8l3 1" fill="${sage}"/><path d="M29 13l-6-2v12l6-2z" fill="${lav}"/><path d="M12 17l3 3M15 15l3 3M18 13l3 3" stroke="#A9714E" stroke-width="1.3" stroke-linecap="round"/>`,
    bath: `<path d="M4 15h24v4a7 7 0 0 1-7 7h-10a7 7 0 0 1-7-7z" fill="${cream}" stroke="${aqua}" stroke-width="1.6"/><path d="M6 16h20v3a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="#9ED3EA"/><path d="M8 15V7a3 3 0 0 1 6 0" fill="none" stroke="${steel}" stroke-width="1.8"/><circle cx="13" cy="6" r="1.6" fill="#fff" stroke="${aqua}"/><circle cx="18" cy="10" r="2" fill="#fff" stroke="${aqua}"/><circle cx="22" cy="7" r="1.4" fill="#fff" stroke="${aqua}"/>`,
    flame: `<path d="M16 3c1 5 8 7 8 15a8 8 0 0 1-16 0c0-4 2-6 3-8 1 3 3 3 3 3-1-4 0-7 2-10z" fill="${clay}"/><path d="M16 14c.5 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1.5-3 2-4 .5 1.5 1.5 1.5 1.5 1.5-.5-2 0-3.5.5-5.5z" fill="${goldL}"/>`,
    moon: `<path d="M20 4a11 11 0 1 0 8 17A9 9 0 0 1 20 4z" fill="#C8B6EE" stroke="${lav}" stroke-width="1.4"/><circle cx="10" cy="9" r="1.2" fill="${goldL}"/><circle cx="6" cy="17" r=".9" fill="${goldL}"/>`,
    scope: `<rect x="6" y="9" width="18" height="7" rx="3" fill="${lav}" transform="rotate(-25 15 12.5)"/><rect x="21" y="5" width="6" height="8" rx="2" fill="${ink}" transform="rotate(-25 24 9)"/><path d="M14 17l-5 10M16 17l5 10M15 17v10" stroke="${woodD}" stroke-width="1.8" stroke-linecap="round"/>`,
    bolt: `<path d="M18 3L6 18h8l-2 11 12-15h-8z" fill="${goldL}" stroke="${gold}" stroke-width="1.5" stroke-linejoin="round"/>`,
    locker: `<rect x="6" y="4" width="20" height="24" rx="3" fill="${aqua}"/><rect x="8" y="6" width="7.5" height="20" rx="1.5" fill="#7FD7E8"/><rect x="16.5" y="6" width="7.5" height="20" rx="1.5" fill="#7FD7E8"/>${[9, 12].map((y) => `<rect x="9.5" y="${y}" width="4.5" height="1.2" rx=".6" fill="${cream}"/><rect x="18" y="${y}" width="4.5" height="1.2" rx=".6" fill="${cream}"/>`).join('')}<circle cx="14" cy="18" r="1" fill="${ink}"/><circle cx="18" cy="18" r="1" fill="${ink}"/>`,
    clock: `<circle cx="16" cy="17" r="11" fill="${cream}" stroke="${clay}" stroke-width="2"/><path d="M16 10v7l5 3" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/><rect x="5" y="3" width="6" height="4" rx="2" fill="${clay}" transform="rotate(-30 8 5)"/><rect x="21" y="3" width="6" height="4" rx="2" fill="${clay}" transform="rotate(30 24 5)"/>`,
    clover: `${[[16, 10], [22, 16], [16, 22], [10, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${sage}"/>`).join('')}<circle cx="16" cy="16" r="3" fill="${sageD}"/><path d="M18 20q3 5 7 7" fill="none" stroke="${sageD}" stroke-width="2" stroke-linecap="round"/>`,
    suburb: `<rect x="3" y="15" width="12" height="11" fill="${cream}" stroke="${woodD}" stroke-width="1.2"/><path d="M2 16l7-6 7 6" fill="${clay}"/><rect x="16" y="12" width="13" height="14" fill="#F6E5CF" stroke="${woodD}" stroke-width="1.2"/><path d="M15 13l7.5-6 7.5 6" fill="${sage}"/><rect x="7" y="20" width="4" height="6" fill="${sage}"/><rect x="20" y="17" width="5" height="4" fill="${aqua}"/><rect x="2" y="26" width="28" height="2" rx="1" fill="${woodD}"/>`,
    downtown: `<rect x="4" y="12" width="8" height="15" fill="#C8B6EE"/><rect x="12" y="5" width="9" height="22" fill="${lav}"/><rect x="21" y="9" width="7" height="18" fill="#A48BE6"/>${[8, 12, 16, 20].map((y) => `<rect x="14.5" y="${y}" width="4" height="2" fill="${cream}"/>`).join('')}${[15, 19, 23].map((y) => `<rect x="6" y="${y}" width="4" height="2" fill="${cream}"/><rect x="22.5" y="${y - 3}" width="4" height="2" fill="${cream}"/>`).join('')}<rect x="2" y="27" width="28" height="2" rx="1" fill="${woodD}"/>`,
    prime: `<rect x="8" y="7" width="16" height="20" rx="1.5" fill="${goldL}" stroke="${gold}" stroke-width="1.3"/><path d="M6 8h20l-3-4H9z" fill="${gold}"/>${[11, 16, 21].map((y) => `<rect x="11" y="${y}" width="4" height="3" fill="#fff"/><rect x="17" y="${y}" width="4" height="3" fill="#fff"/>`).join('')}<path d="M16 1.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L13 3.8l2-.3z" fill="${clay}"/><rect x="3" y="27" width="26" height="2" rx="1" fill="${woodD}"/>`,
    strength: `<rect x="3" y="12" width="3.5" height="8" rx="1.2" fill="${ink}"/><rect x="6.5" y="9" width="4.5" height="14" rx="1.6" fill="${clay}"/><rect x="11" y="14.5" width="10" height="3" rx="1.5" fill="#B9BEC6"/><rect x="21" y="9" width="4.5" height="14" rx="1.6" fill="${clay}"/><rect x="25.5" y="12" width="3.5" height="8" rx="1.2" fill="${ink}"/>`,
    cardio: `<path d="M5 20c0-3 2-5 5-5l4-5 3 2-2 3h4c4 0 7 2 8 5v2H5z" fill="${aqua}"/><path d="M5 22h23v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="${ink}"/><path d="M13 18h4M15 15.5h4" stroke="${cream}" stroke-width="1.3" stroke-linecap="round"/><path d="M22 6c1.5-2 4.5-1 4 1.6-.4 2-4 4-4 4s-3.6-2-4-4C17.5 5 20.5 4 22 6z" fill="${rose}"/>`,
    functional: `<path d="M11 11a5 5 0 0 1 10 0" fill="none" stroke="${ink}" stroke-width="2.6"/><circle cx="16" cy="19" r="8.5" fill="${clay}"/><rect x="12" y="10" width="8" height="3.4" rx="1.6" fill="${ink}"/><circle cx="13" cy="17" r="2" fill="#F0A06A"/>`,
    recovery: `${[-50, -25, 0, 25, 50].map((a, i) => `<ellipse cx="16" cy="13" rx="3.6" ry="8" fill="${['#C8B6EE', '#A9D3B4', rose, '#A9D3B4', '#C8B6EE'][i]}" transform="rotate(${a} 16 21)"/>`).join('')}<path d="M5 23h22" stroke="${sage}" stroke-width="2" stroke-linecap="round"/><path d="M8 26h16" stroke="${aqua}" stroke-width="2" stroke-linecap="round"/>`,
    golden: `<circle cx="16" cy="17" r="10" fill="${goldL}" stroke="${gold}" stroke-width="1.5"/><path d="M9 9l2-5 3 3 2-4 2 4 3-3 2 5z" fill="${gold}"/><circle cx="12.5" cy="16" r="1.4" fill="${ink}"/><circle cx="19.5" cy="16" r="1.4" fill="${ink}"/><path d="M12 20.5q4 3.5 8 0" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`,
    people: `<circle cx="11" cy="10" r="4" fill="#EBBE9B"/><path d="M4 24a7 7 0 0 1 14 0z" fill="${sage}"/><circle cx="21.5" cy="12" r="3.4" fill="#A9714E"/><path d="M15.5 25a6 6 0 0 1 12 0z" fill="${lav}"/>`,
    music: `<path d="M12 7l13-3v16" fill="none" stroke="${lav}" stroke-width="2.6" stroke-linejoin="round"/><path d="M12 7v16" stroke="${lav}" stroke-width="2.6"/><ellipse cx="9" cy="23" rx="4" ry="3" fill="${lav}"/><ellipse cx="22" cy="20" rx="4" ry="3" fill="${lav}"/>`,
    whistle: `<path d="M5 15a7 7 0 0 0 13.5 3H27v-6H11a7 7 0 0 0-6 3z" fill="#B9BEC6" stroke="${steel}" stroke-width="1.4"/><circle cx="11.5" cy="16" r="2.4" fill="${steel}"/><path d="M27 12c2-4-2-8-6-6" fill="none" stroke="${clay}" stroke-width="1.6"/>`,
    target: `<circle cx="16" cy="16" r="12" fill="${cream}" stroke="${clay}" stroke-width="2"/><circle cx="16" cy="16" r="7.5" fill="none" stroke="${clay}" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="${clay}"/><path d="M16 16l11-11M23 4h4v4" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`,
    pin: `<path d="M16 29s9-9.5 9-16a9 9 0 0 0-18 0c0 6.5 9 16 9 16z" fill="${clay}"/><circle cx="16" cy="13" r="3.6" fill="${cream}"/>`,
    coin: `<circle cx="16" cy="16" r="12" fill="${goldL}" stroke="${gold}" stroke-width="1.6"/><circle cx="16" cy="16" r="8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/><circle cx="16" cy="16" r="3" fill="#A97A0B"/>`,
    arrowUp: `<circle cx="16" cy="16" r="12" fill="${sage}"/><path d="M16 23V10M10 15l6-6 6 6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    chart: `<rect x="5" y="18" width="5" height="9" rx="1.2" fill="${aqua}"/><rect x="13.5" y="12" width="5" height="15" rx="1.2" fill="${lav}"/><rect x="22" y="6" width="5" height="21" rx="1.2" fill="${sage}"/><path d="M5 13l8-6 5 4 9-7" fill="none" stroke="${clay}" stroke-width="2" stroke-linecap="round"/>`,
    star: `<circle cx="16" cy="16" r="13" fill="${goldL}"/><path d="M16 6.5l2.8 6 6.4.6-4.8 4.3 1.4 6.3L16 20.4l-5.8 3.3 1.4-6.3-4.8-4.3 6.4-.6z" fill="#fff"/>`,
    broom: `<path d="M21 3L13 17" stroke="${woodD}" stroke-width="2.4" stroke-linecap="round"/><path d="M9 15l7 4-3 9c-4 0-8-2-9-5z" fill="${goldL}" stroke="${gold}" stroke-width="1.2"/><path d="M8 20l4 2M7 23l4 2" stroke="${gold}" stroke-width="1"/>`,
    seedling: `<path d="M16 28V15" stroke="${sageD}" stroke-width="2.4" stroke-linecap="round"/><path d="M16 16c-1-6-6-8-11-7 0 5 4 9 11 7z" fill="${sage}"/><path d="M16 13c1-5 5-7 10-6 0 4-4 8-10 6z" fill="#88C496"/><rect x="9" y="26" width="14" height="3" rx="1.5" fill="${wood}"/>`,
    lock: `<rect x="7" y="13" width="18" height="14" rx="3.5" fill="${sage}"/><path d="M11 13V9a5 5 0 0 1 10 0v4" fill="none" stroke="${ink}" stroke-width="2.4"/><circle cx="16" cy="20" r="2" fill="${cream}"/>`,
    sparkle: `<path d="M16 3l2.5 8.5L27 14l-8.5 2.5L16 25l-2.5-8.5L5 14l8.5-2.5z" fill="${goldL}" stroke="${gold}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="25" cy="25" r="2" fill="${lav}"/>`,
    wrench: `<path d="M21 4a6 6 0 0 0-5.6 8.2L5 22.6 9.4 27l10.4-10.4A6 6 0 0 0 28 11l-3.6 3.6-3.4-.6-.6-3.4L24 7a6 6 0 0 0-3-3z" fill="#B9BEC6" stroke="${steel}" stroke-width="1.3" stroke-linejoin="round"/>`,
    map: `<path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3z" fill="#DCEBDF"/><path d="M11 5v19M21 8v19" stroke="${sage}" stroke-width="1.4"/><path d="M16 21s4-4 4-7a4 4 0 0 0-8 0c0 3 4 7 4 7z" fill="${clay}"/>`,
    plus: `<circle cx="16" cy="16" r="12" fill="${sage}"/><path d="M16 10v12M10 16h12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
  };
  return {
    get: (name, size = 24) => svg(P[name] || P.sparkle, size),
    has: (name) => name in P,
  };
})();

const Art = (() => {
  const cache = {};
  function render(key, w, h, paint) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    const s = 2; // retina
    c.width = w * s; c.height = h * s;
    const ctx = c.getContext('2d');
    ctx.scale(s, s);
    paint(ctx);
    return (cache[key] = c.toDataURL('image/png'));
  }
  const img = (src, size, cls = '') => `<img class="art ${cls}" src="${src}" width="${size}" height="${size}" alt="" draggable="false">`;

  /** The station's equipment, drawn exactly like it appears on the gym floor. */
  function station(id, size = 52) {
    const T = Floor.TYPES[id];
    if (!T) return Pics.get('sparkle', size);
    const src = render(`st:${id}`, 64, 64, (ctx) => {
      const bw = T.w + 8, bh = T.h + T.top + 6;
      const k = Math.min(56 / bw, 56 / bh);
      ctx.translate(32 - (T.w * k) / 2, 32 - ((T.h + T.top) * k) / 2 + T.top * k);
      ctx.scale(k, k);
      T.draw(ctx, 0, 0, T.spots.map(() => false), 0, 0);
    });
    return img(src, size);
  }

  /** A coach figure for each trainer, with a whistle, cap and clipboard. */
  function coach(stationId, size = 52) {
    const i = CFG.stations.findIndex((s) => s.id === stationId);
    const skins = ['#F6D3B8', '#EBBE9B', '#D29A72', '#A9714E', '#7C4F37'];
    const hairs = ['#2B211B', '#5A3A28', '#9C5A33', '#D8B56C', '#1F1F24', '#7A3B2E'];
    const shirts = ['#4F9D69', '#8B6FD6', '#E07B39', '#35C3DD', '#6C8EBF', '#F2A7B8'];
    const look = {
      skin: skins[i % 5], hair: hairs[(i * 2) % 6], style: ['short', 'bun', 'pony', 'short', 'long', 'bald'][i % 6],
      shirt: shirts[i % 6], pants: '#2B2F38', cap: i % 3 === 0 ? '#2F7A4A' : null, whistle: true, phase: 0,
    };
    const src = render(`coach:${stationId}`, 64, 64, (ctx) => {
      ctx.translate(32, 58);
      ctx.scale(2, 2);
      Floor.drawPerson(ctx, look, 0, 0, 0.6, 'coach', 'down');
    });
    return img(src, size);
  }

  return { station, coach, img };
})();
