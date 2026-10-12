/* The living gym: a drawn room where every piece of equipment you own appears, laid out in
   rows that grow the room. Members walk the aisles (grid pathfinding) and always have something
   to do: train on equipment, join a class, drink at the cooler, stretch, or chat in the lobby.
   The same engine draws your Home Gym and every map gym. Room units: 360 wide, height grows. */
const Floor = (() => {
  const W = 360, WALL = 56, CELL = 6, COLS = W / CELL;
  const MIN_H = 300, MAX_VIEW = 470; // tallest the canvas gets on screen (px)
  const SPEED = 30; // room units per second

  const C = {
    wood: '#EAD9BC', wall: '#F4ECE0', wallLow: '#EBDFCD', baseboard: '#CDB89A',
    metal: '#AEB4BC', steel: '#5A5F6B', dark: '#3A3F47', rubber: '#4A4F57', mat: 'rgba(58,63,71,.14)',
    sage: '#4F9D69', clay: '#E07B39', gold: '#E6B422', lav: '#8B6FD6', ink: '#2B211B',
  };
  const SKIN = ['#F6D3B8', '#EBBE9B', '#D29A72', '#A9714E', '#7C4F37'];
  const HAIR = ['#2B211B', '#5A3A28', '#9C5A33', '#D8B56C', '#1F1F24', '#B9B3AA', '#7A3B2E'];
  const SHIRT = ['#4F9D69', '#8B6FD6', '#35C3DD', '#E07B39', '#F2A7B8', '#6C8EBF', '#FFFFFF', '#E6B422', '#9FC9A7'];
  const PANTS = ['#2B2F38', '#3E4A61', '#5A5F6B', '#6B5547', '#2F4A3E'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const rand = (a, b) => a + Math.random() * (b - a);

  // ───────── Drawing helpers ─────────
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const box = (ctx, x, y, w, h, r, fill) => { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); };
  function line(ctx, x1, y1, x2, y2, w, col) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
  }
  const circ = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  function shadow(ctx, x, y, rx, ry, a = 0.16) {
    if (rx <= 0) return;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(43,33,27,${a})`; ctx.fill();
  }
  function dumbbell(ctx, x, y, len, col) {
    line(ctx, x - len / 2, y, x + len / 2, y, 1.1, '#7B8088');
    box(ctx, x - len / 2 - 1.4, y - 2, 2.8, 4, 1, col);
    box(ctx, x + len / 2 - 1.4, y - 2, 2.8, 4, 1, col);
  }
  function barbell(ctx, x, y, len, plate = '#2B2F38', ph = 7) {
    line(ctx, x - len / 2, y, x + len / 2, y, 1.3, '#C3C8CF');
    box(ctx, x - len / 2 + 1, y - ph / 2, 3, ph, 1, plate);
    box(ctx, x + len / 2 - 4, y - ph / 2, 3, ph, 1, plate);
  }

  /* ───────── Equipment: one unit each, drawn from its top-left (x, y) ─────────
     w/h: floor footprint. top: how far art rises above y (racks, rigs). spots: where members
     use it, relative to (x, y). busy[i] tells whether spot i is in use. */
  const TYPES = {
    freeWeights: {
      w: 32, h: 42, top: 0, spots: [{ x: 16, y: 38, pose: 'curl', face: 'down' }],
      draw(ctx, x, y) {
        box(ctx, x, y + 12, 32, 30, 4, C.mat);
        box(ctx, x + 1, y, 30, 11, 2, '#8A7660');
        box(ctx, x + 1, y, 30, 3, 2, '#9E8A72');
        ['#E07B39', '#4F9D69', '#8B6FD6'].forEach((c, k) => dumbbell(ctx, x + 7 + k * 9, y + 6, 6, c));
        box(ctx, x + 8, y + 16, 16, 6, 2, '#3E4A61');
        line(ctx, x + 10, y + 22, x + 10, y + 25, 1.2, C.dark);
        line(ctx, x + 22, y + 22, x + 22, y + 25, 1.2, C.dark);
      },
    },
    treadmillRow: {
      w: 27, h: 46, top: 0, spots: [{ x: 13.5, y: 34, pose: 'run', face: 'up' }],
      draw(ctx, x, y, busy, t) {
        shadow(ctx, x + 13, y + 44, 14, 3);
        box(ctx, x, y + 8, 27, 36, 5, C.steel);
        box(ctx, x + 4, y + 12, 19, 29, 2, '#2B2F38');
        ctx.save(); rr(ctx, x + 4, y + 12, 19, 29, 2); ctx.clip();
        const off = busy[0] ? (t * 40) % 6 : 0;
        for (let yy = y + 12 + off; yy < y + 42; yy += 6) line(ctx, x + 5, yy, x + 22, yy, 0.6, 'rgba(255,255,255,.12)');
        ctx.restore();
        line(ctx, x + 2, y + 7, x + 2, y + 24, 1.4, C.metal);
        line(ctx, x + 25, y + 7, x + 25, y + 24, 1.4, C.metal);
        box(ctx, x + 1, y, 25, 9, 3, C.dark);
        box(ctx, x + 5, y + 2, 17, 4, 1, busy[0] ? '#86E3A6' : '#4F9D69');
      },
    },
    squatRack: {
      w: 26, h: 50, top: 20, spots: [{ x: 13, y: 38, pose: 'squat', face: 'down' }],
      draw(ctx, x, y, busy) {
        box(ctx, x, y + 14, 26, 34, 3, '#D8B98C');
        line(ctx, x + 3, y + 18, x + 3, y - 18, 2.2, C.dark);
        line(ctx, x + 23, y + 18, x + 23, y - 18, 2.2, C.dark);
        line(ctx, x + 3, y - 18, x + 23, y - 18, 2.2, C.dark);
        line(ctx, x + 1, y + 2, x + 5, y + 2, 1.4, C.metal);
        line(ctx, x + 21, y + 2, x + 25, y + 2, 1.4, C.metal);
        if (!busy[0]) barbell(ctx, x + 13, y + 1, 32, '#3E4A61', 8);
      },
    },
    benchPress: {
      w: 36, h: 40, top: 8, spots: [{ x: 18, y: 30, pose: 'press', face: 'down' }],
      draw(ctx, x, y, busy) {
        box(ctx, x + 2, y + 4, 32, 34, 4, C.mat);
        line(ctx, x + 7, y + 8, x + 7, y - 6, 1.8, C.dark);
        line(ctx, x + 29, y + 8, x + 29, y - 6, 1.8, C.dark);
        box(ctx, x + 13, y + 8, 10, 28, 3, '#8A4B3A');
        box(ctx, x + 13, y + 8, 10, 3, 2, '#A35D49');
        if (!busy[0]) barbell(ctx, x + 18, y - 4, 32, '#2B2F38', 8);
      },
    },
    cableMachines: {
      w: 46, h: 30, top: 10, spots: [{ x: 38, y: 26, pose: 'pull', face: 'left' }],
      draw(ctx, x, y, busy, t) {
        box(ctx, x, y + 16, 26, 12, 2, C.steel);
        line(ctx, x + 3, y + 26, x + 3, y - 8, 2, C.dark);
        line(ctx, x + 21, y + 26, x + 21, y - 8, 2, C.dark);
        line(ctx, x + 3, y - 8, x + 21, y - 8, 2, C.dark);
        box(ctx, x + 8, y + 2, 8, 20, 1, '#2B2F38');
        const lift = busy[0] ? (Math.sin(t * 3) + 1) * 3 : 0;
        for (let k = 0; k < 4; k++) line(ctx, x + 8, y + 6 + k * 4 - (k === 0 ? lift : 0), x + 16, y + 6 + k * 4 - (k === 0 ? lift : 0), 0.6, 'rgba(255,255,255,.25)');
        circ(ctx, x + 21, y - 6, 2.4, C.metal);
        const hy = busy[0] ? y + 6 + (Math.sin(t * 3) + 1) * 4 : y + 12;
        line(ctx, x + 21, y - 6, busy[0] ? x + 32 : x + 23, hy, 0.6, '#222');
        if (!busy[0]) box(ctx, x + 21, hy, 4, 2, 1, C.clay);
      },
    },
    smoothieBar: {
      w: 62, h: 54, top: 2, spots: [0, 1, 2].map((i) => ({ x: 8, y: 18 + i * 15, pose: 'sit', face: 'right' })),
      draw(ctx, x, y, busy, t) {
        box(ctx, x + 22, y, 38, 50, 4, '#C99A6B');
        box(ctx, x + 20, y - 2, 22, 54, 4, '#F4ECE0');
        box(ctx, x + 20, y - 2, 22, 4, 2, '#E3D5C0');
        ['#F2A7B8', '#9FC9A7', '#F2C94C'].forEach((c, k) => { box(ctx, x + 27, y + 6 + k * 13, 5, 7, 1.5, c); line(ctx, x + 30, y + 4 + k * 13, x + 31, y + 7 + k * 13, 0.7, '#fff'); });
        box(ctx, x + 35, y + 8, 6, 10, 2, '#cfe7ee');
        drawPerson(ctx, STAFF.barista, x + 52, y + 34, t, 'mix', 'left');
        [0, 1, 2].forEach((i) => { circ(ctx, x + 8, y + 16 + i * 15, 4.5, '#8A6A52'); circ(ctx, x + 8, y + 16 + i * 15, 3.4, '#A6835F'); });
      },
    },
    spinStudio: {
      w: 25, h: 38, top: 0, spots: [{ x: 12.5, y: 25, pose: 'cycle', face: 'down' }],
      draw(ctx, x, y, busy, t) {
        box(ctx, x - 1, y + 2, 27, 36, 4, 'rgba(139,111,214,.12)');
        shadow(ctx, x + 12.5, y + 34, 9, 2.5);
        line(ctx, x + 4, y + 34, x + 21, y + 34, 2, C.dark);
        line(ctx, x + 12.5, y + 33, x + 12.5, y + 14, 2, C.dark);
        circ(ctx, x + 12.5, y + 30, 5, C.steel);
        circ(ctx, x + 12.5, y + 30, 2, C.metal);
        if (busy[0]) { const a = t * 12; line(ctx, x + 12.5, y + 30, x + 12.5 + Math.cos(a) * 4, y + 30 + Math.sin(a) * 4, 0.8, '#fff'); }
        line(ctx, x + 5, y + 22, x + 20, y + 22, 1.6, C.dark);
        box(ctx, x + 9.5, y + 9, 6, 3, 1.5, '#2B2F38');
      },
    },
    boxingRing: {
      w: 80, h: 64, top: 12,
      spots: [{ x: 28, y: 44, pose: 'punch', face: 'right' }, { x: 52, y: 44, pose: 'punch', face: 'left' }],
      draw(ctx, x, y) {
        box(ctx, x, y + 4, 80, 60, 4, '#4E6FA3');
        box(ctx, x + 4, y + 8, 72, 52, 3, '#6C8EBF');
        [[x + 2, y + 6, '#D9534F'], [x + 78, y + 6, '#3E6FD8'], [x + 2, y + 62, '#fff'], [x + 78, y + 62, '#fff']]
          .forEach(([px, py, c]) => line(ctx, px, py, px, py - 12, 2.4, c));
        for (let k = 0; k < 3; k++) {
          line(ctx, x + 2, y + 2 - k * 3.5, x + 78, y + 2 - k * 3.5, 0.9, '#F4ECE0');
          line(ctx, x + 2, y + 2 - k * 3.5, x + 2, y + 58 - k * 3.5, 0.9, '#F4ECE0');
          line(ctx, x + 78, y + 2 - k * 3.5, x + 78, y + 58 - k * 3.5, 0.9, '#F4ECE0');
        }
      },
      front(ctx, x, y) { for (let k = 0; k < 3; k++) line(ctx, x + 2, y + 58 - k * 3.5, x + 78, y + 58 - k * 3.5, 0.9, '#F4ECE0'); },
    },
    yogaLoft: {
      w: 26, h: 48, top: 0, spots: [{ x: 13, y: 36, pose: 'yoga', face: 'down' }],
      draw(ctx, x, y, busy, t, i) {
        box(ctx, x + 2, y + 4, 22, 42, 3, ['#C8B6EE', '#A9D3B4', '#F6C7A6'][i % 3]);
        box(ctx, x + 2, y + 4, 22, 4, 2, 'rgba(255,255,255,.35)');
      },
    },
    saunaPlunge: {
      w: 62, h: 66, top: 22,
      spots: [{ x: 18, y: 56, pose: 'sit', face: 'down', towel: true }, { x: 50, y: 50, pose: 'soak', face: 'down' }],
      draw(ctx, x, y, busy, t) {
        box(ctx, x, y, 36, 42, 4, '#C9935F');
        for (let k = 1; k < 6; k++) line(ctx, x + 1, y + k * 7, x + 35, y + k * 7, 0.6, 'rgba(110,70,30,.35)');
        box(ctx, x - 1, y - 2, 38, 6, 3, '#A8743F');
        box(ctx, x + 10, y + 10, 16, 11, 2, '#FFD9A0');
        box(ctx, x + 10, y + 10, 16, 11, 2, `rgba(255,170,90,${0.25 + Math.sin(t * 2) * 0.1})`);
        box(ctx, x + 4, y + 46, 28, 5, 2, '#B7834F');
        for (let k = 0; k < 3; k++) {
          const sy = (t * 8 + k * 6) % 16;
          circ(ctx, x + 12 + k * 6, y - 4 - sy, 1.6 + sy / 10, `rgba(255,255,255,${0.5 - sy / 34})`);
        }
        box(ctx, x + 39, y + 30, 22, 32, 8, '#E4ECF1');
        box(ctx, x + 41.5, y + 32.5, 17, 27, 6, '#7CC9E6');
        box(ctx, x + 43, y + 34, 8, 3, 2, 'rgba(255,255,255,.5)');
      },
    },
    crossfitBox: {
      w: 72, h: 50, top: 22,
      spots: [{ x: 15, y: 44, pose: 'jump', face: 'down' }, { x: 37, y: 24, pose: 'pullup', face: 'up' }, { x: 59, y: 44, pose: 'swing', face: 'down' }],
      draw(ctx, x, y) {
        box(ctx, x, y + 4, 72, 46, 4, C.mat);
        line(ctx, x + 4, y + 8, x + 4, y - 18, 2.2, C.dark);
        line(ctx, x + 68, y + 8, x + 68, y - 18, 2.2, C.dark);
        line(ctx, x + 4, y - 18, x + 68, y - 18, 2.2, C.dark);
        line(ctx, x + 18, y - 18, x + 18, y - 6, 0.6, '#222');
        ctx.beginPath(); ctx.arc(x + 18, y - 4, 2, 0, 7); ctx.strokeStyle = '#C99A6B'; ctx.lineWidth = 1; ctx.stroke();
        box(ctx, x + 6, y + 24, 18, 14, 2, '#C99A6B'); box(ctx, x + 6, y + 24, 18, 4, 2, '#DDB487');
        [0, 1].forEach((k) => { circ(ctx, x + 54 + k * 12, y + 30, 3.6, k ? '#E07B39' : '#2B2F38'); line(ctx, x + 52 + k * 12, y + 26.5, x + 56 + k * 12, y + 26.5, 1, '#222'); });
      },
    },
    olympicPlatform: {
      w: 40, h: 44, top: 0, spots: [{ x: 20, y: 32, pose: 'clean', face: 'down' }],
      draw(ctx, x, y, busy, t, i) {
        box(ctx, x, y + 2, 40, 40, 3, C.rubber);
        box(ctx, x + 9.5, y + 2, 21, 40, 1, '#D8B98C');
        if (!busy[0]) barbell(ctx, x + 20, y + 36, 36, i % 2 ? '#3E6FD8' : '#D9534F', 11);
      },
    },
    resolutionRack: {
      w: 48, h: 30, top: 14, spots: [{ x: 24, y: 26, pose: 'curl', face: 'down' }],
      draw(ctx, x, y) {
        box(ctx, x, y + 6, 48, 22, 4, 'rgba(224,123,57,.18)');
        box(ctx, x + 4, y, 40, 8, 2, C.clay);
        for (let k = 0; k < 4; k++) dumbbell(ctx, x + 10 + k * 9.5, y + 4, 5, '#FFF4E6');
        line(ctx, x + 44, y + 6, x + 44, y - 14, 1, C.dark);
        ctx.beginPath(); ctx.moveTo(x + 44, y - 14); ctx.lineTo(x + 54, y - 11); ctx.lineTo(x + 44, y - 8); ctx.fillStyle = C.clay; ctx.fill();
      },
    },
  };

  const STAFF = {
    barista: { skin: '#EBBE9B', hair: '#5A3A28', style: 'bun', shirt: '#4F9D69', pants: '#2B2F38', apron: true, phase: 0 },
    desk: { skin: '#D29A72', hair: '#1F1F24', style: 'short', shirt: '#2F7A4A', pants: '#2B2F38', phase: 1.3 },
  };

  // ───────── People ─────────
  function newLook(golden = false) {
    return {
      skin: pick(SKIN), hair: pick(HAIR), style: pick(['short', 'bun', 'pony', 'short', 'bald', 'long']),
      shirt: golden ? '#F2C94C' : pick(SHIRT), pants: pick(PANTS), golden, phase: Math.random() * 10,
    };
  }

  /** Draws a little person with feet at (x, y). */
  function drawPerson(ctx, look, x, y, t, pose = 'idle', face = 'down', moving = false) {
    const ph = t * (pose === 'run' ? 14 : pose === 'cycle' ? 9 : 7) + look.phase;
    ctx.save();
    ctx.translate(x, y);
    if (face === 'left') ctx.scale(-1, 1);
    const profile = face === 'left' || face === 'right';
    shadow(ctx, 0, 0, pose === 'press' || pose === 'soak' ? 0 : 5, 1.8);
    if (look.golden) {
      ctx.beginPath(); ctx.ellipse(0, -12, 12, 16, 0, 0, 7);
      ctx.fillStyle = `rgba(242,201,76,${0.22 + Math.sin(t * 4) * 0.08})`; ctx.fill();
    }
    const hipY = -9;
    const head = (hy) => {
      circ(ctx, 0, hy, 4.3, look.skin);
      ctx.fillStyle = look.hair;
      if (look.style !== 'bald') {
        ctx.beginPath();
        if (face === 'up') ctx.arc(0, hy, 4.5, 0, Math.PI * 2);
        else ctx.arc(0, hy - 0.6, 4.5, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
        if (look.style === 'bun') circ(ctx, 0, hy - 5, 2.2, look.hair);
        if (look.style === 'pony') { ctx.beginPath(); ctx.ellipse(profile ? -4.5 : 0, hy + (profile ? 0 : -4), 1.8, 3, 0.4, 0, 7); ctx.fill(); }
        if (look.style === 'long' && face !== 'up') { box(ctx, -4.6, hy - 2, 2, 6, 1, look.hair); box(ctx, 2.6, hy - 2, 2, 6, 1, look.hair); }
        if (look.style === 'long' && face === 'up') box(ctx, -4, hy, 8, 6, 2, look.hair);
      }
      if (look.cap) { box(ctx, -4.6, hy - 5, 9.2, 3.2, 1.5, look.cap); if (face !== 'up') box(ctx, profile ? 1 : -3, hy - 2.6, profile ? 5 : 6, 1.4, 0.7, look.cap); }
      if (face === 'down') { circ(ctx, -1.5, hy + 0.4, 0.55, C.ink); circ(ctx, 1.5, hy + 0.4, 0.55, C.ink); }
      else if (profile) circ(ctx, 2.2, hy + 0.3, 0.55, C.ink);
      if (look.golden) { ctx.fillStyle = '#E6B422'; ctx.beginPath(); ctx.moveTo(-3, hy - 4.5); ctx.lineTo(-2, hy - 7.5); ctx.lineTo(0, hy - 5.5); ctx.lineTo(2, hy - 7.5); ctx.lineTo(3, hy - 4.5); ctx.fill(); }
    };
    const torso = (top, h = 10) => {
      box(ctx, -4.6, top, 9.2, h, 3, look.towel ? '#FFFFFF' : look.shirt);
      if (look.apron) box(ctx, -3.4, top + 3, 6.8, h - 2, 1.5, '#F4ECE0');
      if (look.whistle) { line(ctx, -2, top + 0.5, 0, top + 4, 0.5, '#E6B422'); circ(ctx, 0.5, top + 4.5, 1, '#C3C8CF'); }
    };
    const legs = (hip, lx, rx, ly = 0, ry = 0) => {
      line(ctx, -2, hip, lx, ly, 2.6, look.pants);
      line(ctx, 2, hip, rx, ry, 2.6, look.pants);
      circ(ctx, lx, ly, 1.3, '#F4F4F4'); circ(ctx, rx, ry, 1.3, '#F4F4F4');
    };
    const arms = (sh, l, r, held) => {
      line(ctx, -4.4, sh, l[0], l[1], 2, look.skin);
      line(ctx, 4.4, sh, r[0], r[1], 2, look.skin);
      if (held === 'db') { dumbbell(ctx, l[0], l[1], 3.5, '#5A5F6B'); dumbbell(ctx, r[0], r[1], 3.5, '#5A5F6B'); }
      if (held === 'glove') { circ(ctx, l[0], l[1], 1.9, '#D9534F'); circ(ctx, r[0], r[1], 1.9, '#D9534F'); }
      if (held === 'board') { box(ctx, r[0] - 1, r[1] - 4, 5, 6, 1, '#C99A6B'); box(ctx, r[0], r[1] - 3, 3, 4, 0.5, '#fff'); }
    };
    const lying = (lift) => {
      box(ctx, -4.4, -18, 8.8, 13, 3, look.shirt);
      line(ctx, -2, -5, -3, 3, 2.6, look.pants); line(ctx, 2, -5, 3, 3, 2.6, look.pants);
      circ(ctx, 0, -20.5, 4.1, look.skin);
      ctx.fillStyle = look.hair; ctx.beginPath(); ctx.arc(0, -21.5, 4.2, Math.PI, 0); ctx.fill();
      line(ctx, -4, -14, -5.5, -14 - lift * 0.3, 2, look.skin); line(ctx, 4, -14, 5.5, -14 - lift * 0.3, 2, look.skin);
    };

    switch (pose) {
      case 'run':
      case 'walk': {
        const sw = Math.sin(ph) * (pose === 'run' ? 3.2 : moving ? 2.4 : 0);
        ctx.translate(0, -Math.abs(Math.sin(ph)) * (pose === 'run' ? 1.4 : moving ? 0.8 : 0));
        if (profile) legs(hipY, sw, -sw); else legs(hipY, -2 + sw * 0.3, 2 - sw * 0.3, -Math.max(0, sw) * 0.6, -Math.max(0, -sw) * 0.6);
        torso(-18.5);
        if (profile) arms(-16.5, [-sw * 0.9, -10], [sw * 0.9, -10]);
        else arms(-16.5, [-5.6, -10.5 - Math.max(0, sw) * 0.6], [5.6, -10.5 - Math.max(0, -sw) * 0.6]);
        head(-23);
        break;
      }
      case 'curl': {
        const c = (Math.sin(ph * 0.6) + 1) / 2;
        legs(hipY, -2, 2); torso(-18.5);
        arms(-16.5, [-5.8, -10 - c * 6], [5.8, -10 - (1 - c) * 6], 'db');
        head(-23);
        break;
      }
      case 'squat': {
        const d = (1 - Math.cos(ph * 0.5)) / 2 * 5;
        ctx.translate(0, d);
        legs(hipY, -3.5 - d * 0.4, 3.5 + d * 0.4, -d, -d);
        torso(-18.5);
        barbell(ctx, 0, -17, 26, '#3E4A61', 7);
        arms(-16.5, [-6.5, -17], [6.5, -17]);
        head(-23);
        break;
      }
      case 'press': {
        const p = (Math.sin(ph * 0.6) + 1) / 2;
        lying(2 + p * 4);
        ctx.save(); ctx.translate(0, -14); ctx.scale(1 + p * 0.12, 1 + p * 0.12); barbell(ctx, 0, 0, 30, '#2B2F38', 8); ctx.restore();
        break;
      }
      case 'pull': {
        const p = (Math.sin(t * 3) + 1) / 2;
        legs(hipY, -1.5, 2.5); torso(-18.5);
        arms(-16.5, [6, -22 + p * 8], [5, -21 + p * 8]);
        head(-23);
        break;
      }
      case 'punch': {
        const a = Math.sin(ph * 1.4);
        ctx.translate(0, -Math.abs(Math.sin(ph * 0.9)) * 1.2);
        legs(hipY, -3, 3); torso(-18.5);
        arms(-16.5, [a > 0 ? 9 : 4, -15.5], [a < 0 ? 9 : 4, -17.5], 'glove');
        head(-23);
        break;
      }
      case 'cycle': {
        legs(-10, -2.5 + Math.cos(ph) * 1.4, 2.5 - Math.cos(ph) * 1.4, -4 + Math.sin(ph) * 2, -4 - Math.sin(ph) * 2);
        torso(-19, 9); arms(-17, [-6, -12], [6, -12]); head(-23.5);
        break;
      }
      case 'yoga': {
        const stage = Math.floor((t + look.phase) / 3.2) % 3;
        if (stage === 2) {
          lying(-6);
          line(ctx, -4, -12, -7, -20, 2, look.skin); line(ctx, 4, -12, 7, -20, 2, look.skin);
        } else if (stage === 0) {
          legs(hipY, -1, 1); line(ctx, 2, -6, 4.5, -4, 2.6, look.pants);
          torso(-18.5); arms(-16.5, [-1.5, -28], [1.5, -28]); head(-23);
        } else {
          legs(hipY, -6, 6); torso(-18.5); arms(-16.5, [-11, -16], [11, -16]); head(-23);
        }
        break;
      }
      case 'sit': {
        if (profile) { line(ctx, 0, -6, 5, -5, 2.6, look.pants); line(ctx, 5, -5, 5, 0, 2.6, look.pants); }
        else legs(-6, -2.5, 2.5, -1, -1);
        torso(-15.5, 10);
        const sip = Math.sin(ph * 0.4) > 0.6;
        arms(-13.5, [-5.5, -8], profile ? [sip ? 3 : 6, sip ? -18 : -9] : [5.5, -9]);
        if (profile && sip) box(ctx, 2, -21, 2.4, 4, 1, '#F2A7B8');
        head(-20);
        break;
      }
      case 'soak': {
        ctx.beginPath(); ctx.ellipse(0, -5, 7, 2.6, 0, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
        box(ctx, -4.4, -9, 8.8, 4, 2, look.skin);
        head(-12.5 + Math.sin(t * 1.5) * 0.3);
        break;
      }
      case 'jump': {
        const h = Math.max(0, Math.sin(ph * 0.7)) * 8;
        ctx.translate(0, -h);
        legs(hipY, -2.5, 2.5, h > 3 ? -2 : 0, h > 3 ? -2 : 0);
        torso(-18.5); arms(-16.5, [-6, h > 3 ? -21 : -11], [6, h > 3 ? -21 : -11]); head(-23);
        break;
      }
      case 'pullup': {
        const u = (1 - Math.cos(ph * 0.5)) / 2 * 4;
        ctx.translate(0, -6 - u);
        legs(hipY, -1.5, 1.5, -1, -1);
        torso(-18.5); arms(-16.5, [-4, -27 + u], [4, -27 + u]); head(-23);
        break;
      }
      case 'swing': {
        const s = (Math.sin(ph * 0.7) + 1) / 2;
        legs(hipY, -3, 3); torso(-18.5);
        const hy = -9 - s * 9;
        arms(-16.5, [-1, hy], [1, hy]);
        circ(ctx, 0, hy + 2.4, 2.8, '#2B2F38');
        head(-23);
        break;
      }
      case 'clean': {
        const c = (Math.sin(ph * 0.45 - 1.5) + 1) / 2;
        const d = c < 0.35 ? (0.35 - c) * 10 : 0;
        ctx.translate(0, d);
        legs(hipY, -3 - d * 0.3, 3 + d * 0.3, -d, -d);
        torso(-18.5);
        const by = -4 - d - c * 26;
        arms(-16.5, [-6, by], [6, by]);
        head(-23);
        barbell(ctx, 0, by, 32, '#D9534F', 10);
        break;
      }
      case 'aerobics': {
        const j = Math.sin(ph * 0.9) > 0;
        ctx.translate(0, j ? -1.5 : 0);
        legs(hipY, j ? -5 : -1.5, j ? 5 : 1.5);
        torso(-18.5);
        arms(-16.5, j ? [-7, -26] : [-6, -9], j ? [7, -26] : [6, -9]);
        head(-23);
        break;
      }
      case 'drink': {
        const sip = Math.sin(ph * 0.35) > 0.2;
        legs(hipY, -2, 2); torso(-18.5);
        arms(-16.5, [-5.6, -10], sip ? [2.5, -22] : [6, -12]);
        box(ctx, sip ? 1.5 : 5, sip ? -26 : -15, 2.6, 5, 1, '#9ED3EA');
        head(-23);
        break;
      }
      case 'stretch': {
        const side = Math.sin(ph * 0.35);
        legs(hipY, -4, 4);
        ctx.save(); ctx.translate(0, hipY); ctx.rotate(side * 0.28); ctx.translate(0, -hipY);
        torso(-18.5); arms(-16.5, [-2, -28], [2, -28]); head(-23);
        ctx.restore();
        break;
      }
      case 'chat': {
        const talk = Math.sin(ph * 0.8);
        legs(hipY, -2, 2); torso(-18.5);
        arms(-16.5, [-5.6, -10], [6 + talk, -14 - Math.max(0, talk) * 3]);
        head(-23);
        if (Math.sin(t * 0.9 + look.phase) > 0.4) {
          box(ctx, 2, -36, 12, 7, 3, 'rgba(255,255,255,.95)');
          [5, 8, 11].forEach((dx) => circ(ctx, dx, -32.5, 0.8, '#9A8B7E'));
        }
        break;
      }
      case 'coach': {
        legs(hipY, -2, 2); torso(-18.5);
        arms(-16.5, [-5.6, -10], [6, -13], 'board');
        head(-23);
        break;
      }
      case 'mix': {
        legs(hipY, -2, 2); torso(-18.5);
        const sh = Math.sin(t * 9) * 1.5;
        arms(-16.5, [5 + sh, -16], [6, -14 + sh]);
        head(-23);
        break;
      }
      default: { // idle / waiting (golden member)
        const sway = Math.sin(t * 1.3 + look.phase) * 0.4;
        ctx.translate(sway, 0);
        legs(hipY, -2, 2); torso(-18.5);
        const wave = Math.sin(t * 2 + look.phase) > 0.3;
        arms(-16.5, [-5.6, -10], wave ? [7, -22] : [5.6, -10]);
        head(-23);
      }
    }
    ctx.restore();
  }

  // ───────── Gym models: what's in each gym ─────────
  function homeUnits(st) {
    const lvl = G.level(st);
    return lvl <= 0 ? 0 : Math.min(st.cap || 1, 1 + milestoneCount(lvl));
  }
  /** What a gym contains: equipment counts, how busy it is, and any live class. */
  function modelFor(key) {
    if (key === 'home') {
      const counts = [...CFG.stations, CFG.season.station].map((st) => [st.id, homeUnits(st)]).filter(([, n]) => n > 0);
      const f = CFG.floor;
      const live = G.liveClass;
      const members = Math.min(f.maxMembers, f.minMembers + Math.floor(Math.sqrt(G.totalLevels) * 1.2)) + (live ? f.classCrowd : 0);
      return { key, home: true, counts, members, live: live && live.station.id };
    }
    const g = G.mapGym(key);
    if (!g) return modelFor('home');
    const gear = G.gearOf(key);
    const counts = CFG.stations.map((st) => [st.id, gear[st.id] || 0]).filter(([, n]) => n > 0);
    const units = counts.reduce((a, [, n]) => a + n, 0);
    return { key, home: false, gym: g, counts, members: Math.min(CFG.floor.maxMembers, 2 + Math.round(units * 1.1)), live: null };
  }

  /** Packs units into centered rows; returns placed units, lobby activities, decor and room height. */
  function layout(m) {
    const rows = [];
    let row = [], x = 0, rowH = 0, prev = null;
    const flush = () => { if (row.length) rows.push({ units: row, w: x, h: rowH }); row = []; x = 0; rowH = 0; };
    for (const [type, n] of m.counts) {
      const T = TYPES[type];
      for (let i = 0; i < n; i++) {
        let gap = row.length ? (prev === type ? 5 : 12) : 0;
        if (x + gap + T.w > W - 24) { flush(); gap = 0; }
        row.push({ type, i, dx: x + gap });
        x += gap + T.w;
        rowH = Math.max(rowH, T.h);
        prev = type;
      }
    }
    flush();
    const placed = [];
    let y = WALL + 22;
    rows.forEach((r, ri) => {
      const top = Math.max(...r.units.map((u) => TYPES[u.type].top));
      if (ri > 0) y += Math.max(0, top - 6);
      const ox = (W - r.w) / 2;
      r.units.forEach((u) => placed.push({ ...u, x: ox + u.dx, y, w: TYPES[u.type].w, h: TYPES[u.type].h }));
      y += r.h + 24;
    });
    const H = Math.max(MIN_H, y + 66);
    // Lobby along the bottom: front desk, cooler, stretch mats and a chat corner.
    const ly = H - 34;
    const decor = [
      { kind: 'plant', x: 10, y: H - 8 }, { kind: 'plant', x: W - 10, y: H - 8 },
      { kind: 'desk', x: W / 2 - 64, y: ly },
      { kind: 'cooler', x: W - 36, y: ly + 6 },
      { kind: 'mats', x: 22, y: ly - 8 },
    ];
    const acts = [
      { key: 'act:cooler', x: W - 48, y: ly + 8, pose: 'drink', face: 'right' },
      { key: 'act:mat0', x: 31, y: ly + 6, pose: 'stretch', face: 'down' },
      { key: 'act:mat1', x: 59, y: ly + 6, pose: 'stretch', face: 'down' },
      { key: 'act:chat0', x: W / 2 + 40, y: ly + 8, pose: 'chat', face: 'right' },
      { key: 'act:chat1', x: W / 2 + 56, y: ly + 8, pose: 'chat', face: 'left' },
      { key: 'act:chat2', x: W / 2 + 74, y: ly - 14, pose: 'chat', face: 'right' },
      { key: 'act:chat3', x: W / 2 + 90, y: ly - 14, pose: 'chat', face: 'left' },
    ];
    return { placed, decor, acts, H };
  }

  // ───────── Scene state ─────────
  let root = null, k = {}, canvas = null, ctx = null, scale = 1, dpr = 1, offX = 0;
  let rafId = 0, watchdog = 0, lastFrame = 0;
  const startT = performance.now();
  let gymKey = 'home', model = null, room = null, H = MIN_H, ROWS = Math.ceil(MIN_H / CELL);
  let people = [], spots = [], crowd = [], fx = [], blocked = null;
  let nextId = 1, lastPuff = 0, lastNote = 0, nextArrival = 0;
  const seenCounts = {}; // gymKey → { type: n } so new equipment pops in
  const born = {};

  const now = () => (performance.now() - startT) / 1000;
  const door = () => ({ x: W / 2, y: H + 14 });

  /** Rebuilds the room for the current gym; new equipment pops in. */
  function rebuild() {
    const t = now();
    model = modelFor(gymKey);
    room = layout(model);
    if (room.H !== H) { H = room.H; ROWS = Math.ceil(H / CELL); resize(); }
    const seen = seenCounts[gymKey];
    if (seen) for (const u of room.placed) if (u.i >= (seen[u.type] || 0)) { born[`${gymKey}:${u.type}:${u.i}`] = t; burst(u); }
    seenCounts[gymKey] = Object.fromEntries(model.counts);

    const old = new Map([...spots, ...crowd].map((s) => [s.key, s]));
    const keep = (key, props) => Object.assign(old.get(key) || { key, taken: null }, props);
    spots = [];
    for (const u of room.placed) {
      TYPES[u.type].spots.forEach((sp, si) => {
        const ay = Math.min(u.y + u.h + 6, H - 8);
        spots.push(keep(`${u.type}:${u.i}:${si}`, { st: u.type, x: u.x + sp.x, y: u.y + sp.y, pose: sp.pose, face: sp.face, towel: sp.towel, ax: u.x + sp.x, ay, equipment: true }));
      });
    }
    for (const a of room.acts) spots.push(keep(a.key, { ...a, ax: a.x, ay: a.y, equipment: false }));
    crowd = [];
    if (model.live) {
      const units = room.placed.filter((u) => u.type === model.live);
      if (units.length) {
        const x0 = Math.min(...units.map((u) => u.x)), x1 = Math.max(...units.map((u) => u.x + u.w));
        const yb = Math.min(Math.max(...units.map((u) => u.y + u.h)) + 14, H - 10);
        for (let c = 0; c < 4; c++) {
          const cx = x0 + 8 + (c * (x1 - x0 - 16)) / 3;
          crowd.push(keep(`crowd:${c}`, { st: model.live, x: cx, y: yb, pose: 'aerobics', face: 'up', ax: cx, ay: yb, equipment: false }));
        }
      }
    }
    blocked = new Uint8Array(COLS * ROWS);
    const block = (x, y, w, h) => {
      for (let r = Math.max(0, Math.floor(y / CELL)); r <= Math.min(ROWS - 1, Math.floor((y + h) / CELL)); r++)
        for (let c = Math.max(0, Math.floor(x / CELL)); c <= Math.min(COLS - 1, Math.floor((x + w) / CELL)); c++) blocked[r * COLS + c] = 1;
    };
    block(0, 0, W, WALL + 4);
    room.placed.forEach((u) => block(u.x, u.y, u.w, u.h));
    room.decor.forEach((d) => {
      if (d.kind === 'desk') block(d.x - 22, d.y - 12, 44, 14);
      else if (d.kind !== 'mats') block(d.x - 6, d.y - 8, 12, 10);
    });
    const keys = new Set([...spots, ...crowd].map((s) => s.key));
    people.forEach((p) => {
      if (p.spot && !keys.has(p.spot.key)) { p.spot = null; p.state = 'walk'; p.path = []; p.goal = null; }
      if (p.goal?.spot && !keys.has(p.goal.spot.key)) { p.goal = null; p.path = []; }
    });
  }

  function burst(u) {
    if (FX.reduceMotion) return;
    for (let n = 0; n < 14; n++) fx.push({ kind: 'dust', x: u.x + u.w / 2 + rand(-10, 10), y: u.y + u.h - 4, vx: rand(-14, 14), vy: rand(-22, -6), life: 0, max: rand(0.6, 1.1) });
    fx.push({ kind: 'text', text: 'NEW!', x: u.x + u.w / 2, y: u.y - 6, vy: -14, life: 0, max: 1.8, color: C.clay, size: 9 });
  }

  // ───────── Pathfinding (BFS on a 6-unit grid, no corner cutting) ─────────
  const cellOf = (x, y) => [Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))), Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL)))];
  const free = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !blocked[r * COLS + c];
  function nearestFree(c, r) {
    if (free(c, r)) return [c, r];
    for (let d = 1; d < 14; d++) for (let dc = -d; dc <= d; dc++) for (const dr of [-d, d]) {
      if (free(c + dc, r + dr)) return [c + dc, r + dr];
      if (free(c + dr, r + dc)) return [c + dr, r + dc];
    }
    return [c, r];
  }
  function findPath(x1, y1, x2, y2) {
    const [sc, sr] = nearestFree(...cellOf(x1, y1));
    const [gc, gr] = nearestFree(...cellOf(x2, y2));
    const start = sr * COLS + sc, goal = gr * COLS + gc;
    const prev = new Int32Array(COLS * ROWS).fill(-1);
    prev[start] = start;
    const q = [start];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur === goal) break;
      const c = cur % COLS, r = (cur / COLS) | 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (!free(nc, nr)) continue;
        if (dc && dr && (!free(c + dc, r) || !free(c, r + dr))) continue;
        const ni = nr * COLS + nc;
        if (prev[ni] !== -1) continue;
        prev[ni] = cur;
        q.push(ni);
      }
    }
    if (prev[goal] === -1) return [{ x: x2, y: y2 }];
    const cells = [];
    for (let cur = goal; cur !== start; cur = prev[cur]) cells.push(cur);
    cells.reverse();
    const pts = [];
    let lastDir = null;
    cells.forEach((cell, i) => {
      const c = cell % COLS, r = (cell / COLS) | 0;
      const next = cells[i + 1];
      const dir = next === undefined ? null : `${(next % COLS) - c},${((next / COLS) | 0) - r}`;
      if (dir !== lastDir || next === undefined) pts.push({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 });
      lastDir = dir;
    });
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  // ───────── Member behaviour: always busy ─────────
  /** How many members this gym shows: never more than there are things to do. */
  function targetCount() {
    return Math.max(1, Math.min(model.members, spots.length + crowd.length));
  }
  function chooseGoal(p) {
    if (p.leaving) { const d = door(); p.goal = { x: d.x, y: d.y, leave: true }; }
    else if (p.golden) p.goal = { x: rand(W / 2 - 50, W / 2 + 50), y: H - 52, stay: true };
    else {
      const freeCrowd = p.classGoer ? crowd.filter((s) => !s.taken) : [];
      const freeEquip = spots.filter((s) => s.equipment && !s.taken);
      const freeActs = spots.filter((s) => !s.equipment && !s.taken);
      const classSpots = model.live ? freeEquip.filter((s) => s.st === model.live) : [];
      let s = null;
      if (freeCrowd.length) s = pick(freeCrowd);
      else if (classSpots.length && Math.random() < 0.65) s = pick(classSpots);
      else if (freeEquip.length && Math.random() < 0.85) s = pick(freeEquip);
      else if (freeActs.length) s = pick(freeActs);
      else if (freeEquip.length) s = pick(freeEquip);
      if (s) { s.taken = p.id; p.goal = { spot: s, x: s.ax, y: s.ay }; }
      else p.goal = { x: rand(30, W - 30), y: rand(WALL + 16, H - 20) }; // nothing free: keep walking
    }
    p.path = findPath(p.x, p.y, p.goal.x, p.goal.y);
    p.state = 'walk';
  }
  function addPerson(golden = false) {
    const d = door();
    const p = { id: nextId++, x: d.x + rand(-10, 10), y: d.y, look: newLook(golden), state: 'walk', path: [{ x: d.x, y: H - 12 }], face: 'up', goal: null, spot: null, until: 0, classGoer: false, golden };
    people.push(p);
    return p;
  }
  function releaseSpot(p) {
    if (p.spot) { p.spot.taken = null; p.spot = null; }
    if (p.goal?.spot) p.goal.spot.taken = null;
  }
  function syncCount() {
    const want = targetCount();
    const active = people.filter((p) => !p.leaving && !p.golden);
    if (active.length < want && now() > nextArrival) {
      const p = addPerson();
      p.classGoer = !!model.live && active.filter((x) => x.classGoer).length < CFG.floor.classCrowd;
      nextArrival = now() + 0.7;
    } else if (active.length > want) {
      const p = active[active.length - 1];
      p.leaving = true;
      releaseSpot(p);
      chooseGoal(p);
    }
    UI.setText(k.count, `${active.length} member${active.length === 1 ? '' : 's'} training`);
  }
  function step(p, dt, t) {
    if (p.state === 'walk') {
      if (!p.path.length) {
        if (!p.goal) { chooseGoal(p); return; }
        if (p.goal.leave) { p.gone = true; return; }
        if (p.goal.spot) {
          const s = p.goal.spot;
          const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy);
          if (d > 0.8) { p.x += (dx / d) * Math.min(d, SPEED * dt); p.y += (dy / d) * Math.min(d, SPEED * dt); return; }
          p.spot = s; p.state = 'use'; p.until = t + (s.equipment ? rand(8, 16) : rand(4, 8)); p.face = s.face;
          return;
        }
        if (p.goal.stay) { p.state = 'wait'; p.face = 'down'; return; }
        p.goal = null; // reached a wander point: pick something to do next frame
        return;
      }
      const wp = p.path[0];
      const dx = wp.x - p.x, dy = wp.y - p.y, d = Math.hypot(dx, dy);
      const sp = (p.golden ? 24 : SPEED) * dt;
      if (d <= sp) { p.x = wp.x; p.y = wp.y; p.path.shift(); }
      else { p.x += (dx / d) * sp; p.y += (dy / d) * sp; }
      p.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      return;
    }
    if (p.state === 'wait' || t < p.until) return;
    // Done: step back into the aisle, then on to the next thing.
    const s = p.spot;
    releaseSpot(p);
    p.goal = null;
    p.state = 'walk';
    p.path = s ? [{ x: s.ax, y: s.ay }] : [];
  }

  // ───────── Drawing the room ─────────
  function drawRoom(ctx) {
    ctx.fillStyle = C.wood; ctx.fillRect(0, WALL, W, H - WALL);
    for (let y = WALL + 10, row = 0; y < H; y += 10, row++) {
      line(ctx, 0, y, W, y, 0.6, 'rgba(150,110,60,.13)');
      for (let x = (row % 2) * 30; x < W; x += 60) line(ctx, x, y - 10, x, y, 0.6, 'rgba(150,110,60,.10)');
    }
    const g = ctx.createLinearGradient(0, 0, 0, WALL);
    g.addColorStop(0, C.wall); g.addColorStop(1, C.wallLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, WALL);
    ctx.fillStyle = C.baseboard; ctx.fillRect(0, WALL - 4, W, 4);
    const d = new Date();
    const hr = d.getHours() + d.getMinutes() / 60;
    const sky = hr < 5 || hr >= 21 ? ['#2B3A5C', '#47557A'] : hr < 8 ? ['#F6C9A0', '#BFD8EE'] : hr < 17 ? ['#A9D3F0', '#DCEFFA'] : hr < 20 ? ['#F2A97E', '#F6D5A8'] : ['#4A4F7A', '#8A7AA8'];
    [[16, 10], [292, 10]].forEach(([wx, wy]) => {
      box(ctx, wx - 2, wy - 2, 56, 34, 3, '#D9CBB6');
      const sg = ctx.createLinearGradient(0, wy, 0, wy + 30);
      sg.addColorStop(0, sky[0]); sg.addColorStop(1, sky[1]);
      rr(ctx, wx, wy, 52, 30, 2); ctx.fillStyle = sg; ctx.fill();
      line(ctx, wx + 26, wy, wx + 26, wy + 30, 1.4, '#D9CBB6');
      line(ctx, wx, wy + 15, wx + 52, wy + 15, 1.4, '#D9CBB6');
      if (hr < 5 || hr >= 21) circ(ctx, wx + 40, wy + 7, 2.5, '#F4ECE0');
    });
    box(ctx, 84, 8, 120, 36, 2, '#D6E2E6');
    for (let x = 94; x < 204; x += 26) line(ctx, x, 40, x + 12, 12, 2, 'rgba(255,255,255,.55)');
    box(ctx, 84, 8, 120, 2, 1, '#C3CDD1');
    ctx.fillStyle = '#4F9D69'; ctx.font = '800 8px ui-rounded, Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(model.home ? 'IRON EMPIRE' : model.gym.city.name.toUpperCase(), 240, 40);
    circ(ctx, 240, 18, 10, '#FFFFFF'); ctx.beginPath(); ctx.arc(240, 18, 10, 0, 7); ctx.strokeStyle = C.dark; ctx.lineWidth = 1.2; ctx.stroke();
    const ha = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, ma = d.getMinutes() / 60 * Math.PI * 2;
    line(ctx, 240, 18, 240 + Math.sin(ha) * 5, 18 - Math.cos(ha) * 5, 1.4, C.ink);
    line(ctx, 240, 18, 240 + Math.sin(ma) * 7.5, 18 - Math.cos(ma) * 7.5, 0.9, C.ink);
    box(ctx, 14, H - 58, W - 28, 48, 10, 'rgba(201,154,107,.12)');
    box(ctx, W / 2 - 22, H - 8, 44, 8, 3, '#8A6A52');
  }

  function drawDecor(ctx, d, t) {
    if (d.kind === 'plant') {
      shadow(ctx, d.x, d.y + 1, 6, 2);
      box(ctx, d.x - 4.5, d.y - 7, 9, 8, 2, '#C9935F');
      circ(ctx, d.x - 3, d.y - 11, 4.5, '#5E9E6E'); circ(ctx, d.x + 3, d.y - 12, 4.5, '#6FAE7E'); circ(ctx, d.x, d.y - 16, 4.5, '#88C496');
    } else if (d.kind === 'cooler') {
      shadow(ctx, d.x, d.y + 1, 5, 2);
      box(ctx, d.x - 4, d.y - 12, 8, 13, 2, '#E9EEF1');
      box(ctx, d.x - 3.5, d.y - 20, 7, 8, 3, '#9ED3EA');
    } else if (d.kind === 'mats') {
      box(ctx, d.x - 2, d.y, 22, 16, 3, '#C8B6EE');
      box(ctx, d.x + 26, d.y, 22, 16, 3, '#A9D3B4');
    } else if (d.kind === 'desk') {
      drawPerson(ctx, STAFF.desk, d.x, d.y - 8, t, Math.sin(t * 0.6) > 0.7 ? 'idle' : 'mix', 'down');
      box(ctx, d.x - 22, d.y - 10, 44, 12, 3, '#C99A6B');
      box(ctx, d.x - 22, d.y - 10, 44, 3, 2, '#DDB487');
      box(ctx, d.x + 8, d.y - 15, 9, 6, 1, '#3A3F47');
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 4.5px ui-rounded, Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('WELCOME', d.x - 6, d.y - 2.5);
    }
  }

  function frame() {
    rafId = 0;
    if (!root) return;
    const t = now();
    const dt = Math.min(0.25, Math.max(0, t - (lastFrame || t)));
    lastFrame = t;
    if (document.hidden) { schedule(); return; }

    syncCount();
    if (model.home) {
      const gc = G.goldenCustomer;
      const gp = people.find((p) => p.golden);
      if (gc && !gp) addPerson(true);
      if (!gc && gp && !gp.leaving) { gp.leaving = true; chooseGoal(gp); }
    }
    people.forEach((p) => step(p, dt, t));
    people = people.filter((p) => !p.gone);

    if (!FX.reduceMotion && t - lastPuff > 0.9) {
      lastPuff = t;
      const busy = people.filter((p) => p.state === 'use' && p.spot?.equipment);
      if (busy.length) {
        const p = pick(busy);
        const each = model.home
          ? G.stationIncome(G.station(p.spot.st)) / Math.max(1, model.counts.find(([ty]) => ty === p.spot.st)?.[1] || 1)
          : G.gymIncome(model.gym.city, model.gym.loc, model.gym.focus, model.key) / Math.max(1, spots.filter((s) => s.equipment).length);
        fx.push({ kind: 'text', text: `+${Fmt.short(each)}`, x: p.x, y: p.y - 30, vy: -16, life: 0, max: 1.3, color: '#3E9A5E', size: 7.5 });
      }
    }
    if (model.live && !FX.reduceMotion && t - lastNote > 0.6) {
      lastNote = t;
      const units = room.placed.filter((x) => x.type === model.live);
      if (units.length) {
        const u = pick(units);
        fx.push({ kind: 'text', text: pick(['♪', '♫']), x: rand(u.x, u.x + u.w), y: u.y - 4, vy: -12, vx: rand(-4, 4), life: 0, max: 1.6, color: C.lav, size: 10 });
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, 0);
    drawRoom(ctx);
    const items = [];
    for (const u of room.placed) {
      const T = TYPES[u.type];
      const busy = T.spots.map((_, si) => people.some((p) => p.state === 'use' && p.spot && p.spot.key === `${u.type}:${u.i}:${si}`));
      const b = born[`${gymKey}:${u.type}:${u.i}`];
      items.push({
        y: u.y,
        draw: () => {
          if (b !== undefined && t - b < 0.7) {
            const q = (t - b) / 0.7, s = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2);
            ctx.save(); ctx.translate(u.x + u.w / 2, u.y + u.h); ctx.scale(s, s); ctx.translate(-(u.x + u.w / 2), -(u.y + u.h));
            T.draw(ctx, u.x, u.y, busy, t, u.i); ctx.restore();
          } else T.draw(ctx, u.x, u.y, busy, t, u.i);
        },
      });
      if (T.front) items.push({ y: u.y + u.h, draw: () => T.front(ctx, u.x, u.y) });
    }
    if (model.live) {
      const units = room.placed.filter((u) => u.type === model.live);
      if (units.length) {
        const x0 = Math.min(...units.map((u) => u.x)) - 4, x1 = Math.max(...units.map((u) => u.x + u.w)) + 4;
        const y0 = Math.min(...units.map((u) => u.y)) - 4, y1 = Math.max(...units.map((u) => u.y + u.h)) + 4;
        items.push({ y: y0 - 1, draw: () => { ctx.save(); rr(ctx, x0, y0, x1 - x0, y1 - y0, 8); ctx.strokeStyle = `rgba(79,157,105,${0.45 + Math.sin(t * 3) * 0.2})`; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.restore(); } });
      }
    }
    room.decor.forEach((d) => items.push({ y: d.kind === 'mats' ? d.y - 1 : d.y, draw: () => drawDecor(ctx, d, t) }));
    for (const p of people) {
      const pose = p.state === 'use' && p.spot ? p.spot.pose : p.state === 'wait' ? 'idle' : 'walk';
      const look = p.spot?.towel ? { ...p.look, towel: true } : p.look;
      items.push({ y: p.state === 'use' ? p.y + 0.5 : p.y, draw: () => drawPerson(ctx, look, p.x, p.y, t, pose, p.face, p.state === 'walk') });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    fx = fx.filter((e) => (e.life += dt) < e.max);
    for (const e of fx) {
      const a = 1 - e.life / e.max;
      if (e.kind === 'dust') {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 30 * dt;
        circ(ctx, e.x, e.y, 2.2 * a + 0.5, `rgba(205,184,154,${a})`);
      } else {
        e.y += e.vy * dt; e.x += (e.vx || 0) * dt;
        ctx.globalAlpha = a; ctx.fillStyle = e.color; ctx.textAlign = 'center';
        ctx.font = `900 ${e.size}px ui-rounded, Nunito, system-ui, sans-serif`;
        ctx.fillText(e.text, e.x, e.y); ctx.globalAlpha = 1;
      }
    }
    const hr = new Date().getHours();
    if (hr >= 21 || hr < 5) { ctx.fillStyle = 'rgba(30,30,60,.10)'; ctx.fillRect(0, 0, W, H); }
    schedule();
  }

  function schedule() { if (root && !rafId) rafId = requestAnimationFrame(frame); }

  function resize() {
    if (!root || !k.stage) return;
    const w = k.stage.clientWidth;
    if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    scale = Math.min(w / W, MAX_VIEW / H);
    offX = (w - W * scale) / 2;
    const h = H * scale;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = `${h}px`;
  }

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left - offX) / scale, y = (e.clientY - r.top) / scale;
    const gp = people.find((p) => p.golden && !p.leaving);
    if (gp && Math.abs(x - gp.x) < 12 && y > gp.y - 30 && y < gp.y + 6) {
      const got = G.catchGoldenCustomer();
      if (got) fx.push({ kind: 'text', text: `+${Fmt.short(got.reps)}${got.protein ? ' +1 Protein' : ''}`, x: gp.x, y: gp.y - 34, vy: -14, life: 0, max: 2, color: '#C99A10', size: 11 });
      return;
    }
    const u = room.placed.find((v) => x >= v.x - 3 && x <= v.x + v.w + 3 && y >= v.y - TYPES[v.type].top && y <= v.y + v.h + 3);
    if (u) GymScreen.scrollToStation(u.type);
  }

  /** Seeds members already training so a gym never opens empty. */
  function seedPeople() {
    people = [];
    const want = targetCount();
    const open = spots.filter((s) => !s.taken);
    for (let i = 0; i < want; i++) {
      const p = addPerson();
      const s = open.splice((Math.random() * open.length) | 0, 1)[0];
      if (s) { s.taken = p.id; p.spot = s; p.x = s.x; p.y = s.y; p.state = 'use'; p.face = s.face; p.until = now() + rand(1, 10); p.path = []; }
    }
  }

  function render(container, key = gymKey) {
    root = container;
    gymKey = key;
    root.innerHTML = `
      <div class="floor-stage" data-k="stage">
        <canvas class="floor-canvas" data-k="canvas" role="img" aria-label="Your gym floor, with members using the equipment you own"></canvas>
        <span class="floor-golden-hint" data-k="goldHint" hidden>${Pics.get('golden', 16)} A golden member is here. Tap them!</span>
      </div>
      <div class="floor-bar">
        <span class="floor-count num">${Pics.get('people', 16)}<span data-k="count"></span></span>
        <button class="floor-class" data-action="tab" data-tab="classes" data-k="classChip"></button>
      </div>`;
    k = {};
    root.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    canvas = k.canvas;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', resize);
    fx = []; spots = []; crowd = [];
    rebuild();
    seedPeople();
    resize();
    setTimeout(() => { resize(); lastFrame = now(); schedule(); }, 0);
    clearInterval(watchdog);
    // If frames are throttled (background panes), keep the picture moving anyway.
    watchdog = setInterval(() => { if (root && now() - lastFrame > 0.4) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } frame(); } }, 250);
    update();
  }

  function update() {
    if (!root) return;
    if (model.home) {
      const live = G.liveClass;
      k.classChip.hidden = false;
      const html = live
        ? `${Pics.get('music', 14)} ${esc(CFG.classes[live.station.id])} x${+live.mult.toFixed(1)} · ${Fmt.duration(G.slotSecondsLeft)} left`
        : `${Pics.get('calendar', 14)} No class now · ${G.currentSlot.name}`;
      if (k.classChip.innerHTML !== html) k.classChip.innerHTML = html;
      k.classChip.classList.toggle('on', !!live);
    } else k.classChip.hidden = true;
    k.goldHint.hidden = !(model.home && G.goldenCustomer);
  }

  return {
    TYPES,
    drawPerson,
    render,
    update,
    get gymKey() { return gymKey; },
    renderGolden() { update(); },
    /** After purchases, class changes, new equipment or a new time slot. */
    refresh() { if (root) { rebuild(); update(); } },
    debugPeople: () => people.map((p) => `${p.golden ? 'GOLD ' : ''}${p.state}${p.spot ? ':' + p.spot.key : ''} ${p.x | 0},${p.y | 0} path ${p.path.length}`),
    unmount() {
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(watchdog);
      rafId = 0;
      window.removeEventListener('resize', resize);
      people.forEach(releaseSpot);
      root = null;
    },
  };
})();
