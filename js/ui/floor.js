/* The living gym on the Gym tab: a drawn room where every station you buy appears as
   real equipment, more units arrive at milestones, and members walk the aisles (Sims-style
   pathfinding) to use it. Drawn on a canvas in "room units" (360 × 300), scaled to fit. */
const Floor = (() => {
  const W = 360, H = 300, WALL = 56, CELL = 6, COLS = W / CELL, ROWS = H / CELL;
  const DOOR = { x: 180, y: 314 };
  const SPEED = 30; // room units per second

  const C = {
    wood: '#EAD9BC', woodDark: '#DCC6A2', wall: '#F4ECE0', wallLow: '#EBDFCD', baseboard: '#CDB89A',
    metal: '#AEB4BC', steel: '#5A5F6B', dark: '#3A3F47', rubber: '#4A4F57', mat: 'rgba(58,63,71,.14)',
    sage: '#4F9D69', clay: '#E07B39', gold: '#E6B422', lav: '#8B6FD6', aqua: '#35C3DD', ink: '#2B211B',
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

  /* ───────── Equipment kits ─────────
     fp: footprint [x, y, w, h] (y = back edge). max: most units a station can show.
     units(f): per-unit bounds and the spot where a member uses it.
     base / unit / front: draw calls (front is drawn after people, e.g. ring ropes). */
  const KITS = {
    freeWeights: {
      fp: [14, 64, 78, 42], max: 3,
      units: (f) => [0, 1, 2].map((i) => ({ x: f.x + 4 + i * 25, y: f.y + 14, w: 22, h: 26, spot: { x: f.x + 15 + i * 25, y: f.y + 36, pose: 'curl', face: 'down' } })),
      base(ctx, f) {
        box(ctx, f.x, f.y + 12, f.w, f.h - 12, 4, C.mat);
        box(ctx, f.x + 2, f.y, f.w - 4, 11, 2, '#8A7660');
        box(ctx, f.x + 2, f.y, f.w - 4, 3, 2, '#9E8A72');
        const cols = ['#E07B39', '#4F9D69', '#8B6FD6', '#35C3DD'];
        for (let k = 0; k < 7; k++) dumbbell(ctx, f.x + 9 + k * 10, f.y + 6, 6, cols[k % 4]);
      },
      unit(ctx, u) {
        box(ctx, u.x + 3, u.y + 2, 16, 6, 2, '#3E4A61');
        line(ctx, u.x + 5, u.y + 8, u.x + 5, u.y + 11, 1.2, C.dark);
        line(ctx, u.x + 17, u.y + 8, u.x + 17, u.y + 11, 1.2, C.dark);
      },
    },
    treadmillRow: {
      fp: [100, 60, 94, 46], max: 3,
      units: (f) => [0, 1, 2].map((i) => ({ x: f.x + 3 + i * 31, y: f.y, w: 27, h: 46, spot: { x: f.x + 16 + i * 31, y: f.y + 34, pose: 'run', face: 'up' } })),
      unit(ctx, u, busy, t) {
        shadow(ctx, u.x + 13, u.y + 44, 14, 3);
        box(ctx, u.x, u.y + 8, 27, 36, 5, C.steel);
        box(ctx, u.x + 4, u.y + 12, 19, 29, 2, '#2B2F38');
        ctx.save(); rr(ctx, u.x + 4, u.y + 12, 19, 29, 2); ctx.clip();
        const off = busy ? (t * 40) % 6 : 0;
        for (let yy = u.y + 12 + off; yy < u.y + 42; yy += 6) line(ctx, u.x + 5, yy, u.x + 22, yy, 0.6, 'rgba(255,255,255,.12)');
        ctx.restore();
        line(ctx, u.x + 2, u.y + 7, u.x + 2, u.y + 24, 1.4, C.metal);
        line(ctx, u.x + 25, u.y + 7, u.x + 25, u.y + 24, 1.4, C.metal);
        box(ctx, u.x + 1, u.y, 25, 9, 3, C.dark);
        box(ctx, u.x + 5, u.y + 2, 17, 4, 1, busy ? '#86E3A6' : '#4F9D69');
      },
    },
    squatRack: {
      fp: [208, 58, 52, 50], max: 2,
      units: (f) => [0, 1].map((i) => ({ x: f.x + i * 27, y: f.y, w: 25, h: 50, spot: { x: f.x + 12.5 + i * 27, y: f.y + 38, pose: 'squat', face: 'down' } })),
      unit(ctx, u, busy) {
        box(ctx, u.x, u.y + 14, 25, 34, 3, '#D8B98C');
        line(ctx, u.x + 3, u.y + 18, u.x + 3, u.y - 18, 2.2, C.dark);
        line(ctx, u.x + 22, u.y + 18, u.x + 22, u.y - 18, 2.2, C.dark);
        line(ctx, u.x + 3, u.y - 18, u.x + 22, u.y - 18, 2.2, C.dark);
        line(ctx, u.x + 1, u.y + 2, u.x + 5, u.y + 2, 1.4, C.metal);
        line(ctx, u.x + 20, u.y + 2, u.x + 24, u.y + 2, 1.4, C.metal);
        if (!busy) barbell(ctx, u.x + 12.5, u.y + 1, 32, '#3E4A61', 8);
      },
    },
    benchPress: {
      fp: [272, 64, 76, 40], max: 2,
      units: (f) => [0, 1].map((i) => ({ x: f.x + i * 39, y: f.y, w: 36, h: 40, spot: { x: f.x + 18 + i * 39, y: f.y + 30, pose: 'press', face: 'down' } })),
      unit(ctx, u, busy) {
        box(ctx, u.x + 2, u.y + 4, 32, 34, 4, C.mat);
        line(ctx, u.x + 7, u.y + 8, u.x + 7, u.y - 6, 1.8, C.dark);
        line(ctx, u.x + 29, u.y + 8, u.x + 29, u.y - 6, 1.8, C.dark);
        box(ctx, u.x + 13, u.y + 8, 10, 28, 3, '#8A4B3A');
        box(ctx, u.x + 13, u.y + 8, 10, 3, 2, '#A35D49');
        if (!busy) barbell(ctx, u.x + 18, u.y - 4, 32, '#2B2F38', 8);
      },
    },
    cableMachines: {
      fp: [14, 124, 50, 62], max: 2,
      units: (f) => [0, 1].map((i) => ({ x: f.x, y: f.y + i * 32, w: 50, h: 30, spot: { x: f.x + 38, y: f.y + 26 + i * 32, pose: 'pull', face: 'left' } })),
      unit(ctx, u, busy, t) {
        box(ctx, u.x, u.y + 16, 26, 12, 2, C.steel);
        line(ctx, u.x + 3, u.y + 26, u.x + 3, u.y - 8, 2, C.dark);
        line(ctx, u.x + 21, u.y + 26, u.x + 21, u.y - 8, 2, C.dark);
        line(ctx, u.x + 3, u.y - 8, u.x + 21, u.y - 8, 2, C.dark);
        box(ctx, u.x + 8, u.y + 2, 8, 20, 1, '#2B2F38');
        const lift = busy ? (Math.sin(t * 3) + 1) * 3 : 0;
        for (let k = 0; k < 4; k++) line(ctx, u.x + 8, u.y + 6 + k * 4 - (k === 0 ? lift : 0), u.x + 16, u.y + 6 + k * 4 - (k === 0 ? lift : 0), 0.6, 'rgba(255,255,255,.25)');
        circ(ctx, u.x + 21, u.y - 6, 2.4, C.metal);
        const hy = busy ? u.y + 6 + (Math.sin(t * 3) + 1) * 4 : u.y + 12;
        line(ctx, u.x + 21, u.y - 6, busy ? u.x + 32 : u.x + 23, hy, 0.6, '#222');
        if (!busy) box(ctx, u.x + 21, hy, 4, 2, 1, C.clay);
      },
    },
    smoothieBar: {
      fp: [292, 126, 60, 52], max: 3,
      units: (f) => [0, 1, 2].map((i) => ({ x: f.x, y: f.y + 6 + i * 15, w: 16, h: 14, spot: { x: f.x + 8, y: f.y + 16 + i * 15, pose: 'sit', face: 'right' } })),
      base(ctx, f, n, t) {
        box(ctx, f.x + 20, f.y, 38, 50, 4, '#C99A6B');
        box(ctx, f.x + 18, f.y - 2, 22, 54, 4, '#F4ECE0');
        box(ctx, f.x + 18, f.y - 2, 22, 4, 2, '#E3D5C0');
        const cups = ['#F2A7B8', '#9FC9A7', '#F2C94C'];
        cups.forEach((c, k) => { box(ctx, f.x + 25, f.y + 6 + k * 13, 5, 7, 1.5, c); line(ctx, f.x + 28, f.y + 4 + k * 13, f.x + 29, f.y + 7 + k * 13, 0.7, '#fff'); });
        box(ctx, f.x + 33, f.y + 8, 6, 10, 2, '#cfe7ee');
        drawPerson(ctx, BARISTA, f.x + 50, f.y + 32, t, 'idle', 'left');
      },
      unit(ctx, u) {
        circ(ctx, u.x + 8, u.y + 8, 4.5, '#8A6A52');
        circ(ctx, u.x + 8, u.y + 8, 3.4, '#A6835F');
      },
    },
    spinStudio: {
      fp: [80, 132, 104, 38], max: 4,
      units: (f) => [0, 1, 2, 3].map((i) => ({ x: f.x + 1 + i * 26, y: f.y, w: 24, h: 38, spot: { x: f.x + 13 + i * 26, y: f.y + 25, pose: 'cycle', face: 'down' } })),
      base(ctx, f) { box(ctx, f.x, f.y + 2, f.w, f.h - 2, 4, 'rgba(139,111,214,.12)'); },
      unit(ctx, u, busy, t) {
        shadow(ctx, u.x + 12, u.y + 34, 9, 2.5);
        line(ctx, u.x + 4, u.y + 34, u.x + 20, u.y + 34, 2, C.dark);
        line(ctx, u.x + 12, u.y + 33, u.x + 12, u.y + 14, 2, C.dark);
        circ(ctx, u.x + 12, u.y + 30, 5, C.steel);
        circ(ctx, u.x + 12, u.y + 30, 2, C.metal);
        if (busy) { const a = t * 12; line(ctx, u.x + 12, u.y + 30, u.x + 12 + Math.cos(a) * 4, u.y + 30 + Math.sin(a) * 4, 0.8, '#fff'); }
        line(ctx, u.x + 5, u.y + 22, u.x + 19, u.y + 22, 1.6, C.dark);
        box(ctx, u.x + 9, u.y + 9, 6, 3, 1.5, '#2B2F38');
      },
    },
    boxingRing: {
      fp: [198, 120, 80, 64], max: 2,
      units: (f) => [0, 1].map((i) => ({ x: f.x + 12 + i * 30, y: f.y + 10, w: 26, h: 40, spot: { x: f.x + 28 + i * 24, y: f.y + 44, pose: 'punch', face: i ? 'left' : 'right' } })),
      base(ctx, f) {
        box(ctx, f.x, f.y + 4, f.w, f.h - 4, 4, '#4E6FA3');
        box(ctx, f.x + 4, f.y + 8, f.w - 8, f.h - 12, 3, '#6C8EBF');
        [[f.x + 2, f.y + 6, '#D9534F'], [f.x + f.w - 2, f.y + 6, '#3E6FD8'], [f.x + 2, f.y + f.h - 2, '#fff'], [f.x + f.w - 2, f.y + f.h - 2, '#fff']]
          .forEach(([x, y, c]) => { line(ctx, x, y, x, y - 12, 2.4, c); });
        for (let k = 0; k < 3; k++) {
          line(ctx, f.x + 2, f.y + 6 - 4 - k * 3.5, f.x + f.w - 2, f.y + 6 - 4 - k * 3.5, 0.9, '#F4ECE0');
          line(ctx, f.x + 2, f.y + 2 - k * 3.5, f.x + 2, f.y + f.h - 6 - k * 3.5, 0.9, '#F4ECE0');
          line(ctx, f.x + f.w - 2, f.y + 2 - k * 3.5, f.x + f.w - 2, f.y + f.h - 6 - k * 3.5, 0.9, '#F4ECE0');
        }
      },
      unit() {},
      front(ctx, f) {
        for (let k = 0; k < 3; k++) line(ctx, f.x + 2, f.y + f.h - 6 - k * 3.5, f.x + f.w - 2, f.y + f.h - 6 - k * 3.5, 0.9, '#F4ECE0');
      },
    },
    yogaLoft: {
      fp: [14, 204, 88, 50], max: 3,
      units: (f) => [0, 1, 2].map((i) => ({ x: f.x + 4 + i * 29, y: f.y + 4, w: 22, h: 42, spot: { x: f.x + 15 + i * 29, y: f.y + 34, pose: 'yoga', face: 'down' } })),
      base(ctx, f) {
        box(ctx, f.x, f.y, f.w, f.h, 6, 'rgba(159,201,167,.18)');
        circ(ctx, f.x + f.w - 4, f.y + 4, 5, '#6FAE7E');
        circ(ctx, f.x + f.w - 7, f.y + 1, 3.5, '#88C496');
      },
      unit(ctx, u, busy, t, i) {
        box(ctx, u.x, u.y, 22, 42, 3, ['#C8B6EE', '#A9D3B4', '#F6C7A6'][i]);
        box(ctx, u.x, u.y, 22, 4, 2, 'rgba(255,255,255,.35)');
      },
    },
    saunaPlunge: {
      fp: [292, 190, 60, 66], max: 2,
      units: (f) => [
        { x: f.x, y: f.y, w: 36, h: 52, spot: { x: f.x + 18, y: f.y + 54, pose: 'sit', face: 'down', towel: true } },
        { x: f.x + 38, y: f.y + 28, w: 22, h: 32, spot: { x: f.x + 49, y: f.y + 48, pose: 'soak', face: 'down' } },
      ],
      unit(ctx, u, busy, t, i) {
        if (i === 0) {
          box(ctx, u.x, u.y, 36, 42, 4, '#C9935F');
          for (let k = 1; k < 6; k++) line(ctx, u.x + 1, u.y + k * 7, u.x + 35, u.y + k * 7, 0.6, 'rgba(110,70,30,.35)');
          box(ctx, u.x - 1, u.y - 2, 38, 6, 3, '#A8743F');
          box(ctx, u.x + 10, u.y + 10, 16, 11, 2, '#FFD9A0');
          box(ctx, u.x + 10, u.y + 10, 16, 11, 2, `rgba(255,170,90,${0.25 + Math.sin(t * 2) * 0.1})`);
          box(ctx, u.x + 4, u.y + 44, 28, 5, 2, '#B7834F');
          for (let k = 0; k < 3; k++) {
            const sy = (t * 8 + k * 6) % 16;
            circ(ctx, u.x + 12 + k * 6, u.y - 4 - sy, 1.6 + sy / 10, `rgba(255,255,255,${0.5 - sy / 34})`);
          }
        } else {
          box(ctx, u.x, u.y, 22, 32, 8, '#E4ECF1');
          box(ctx, u.x + 2.5, u.y + 2.5, 17, 27, 6, '#7CC9E6');
          box(ctx, u.x + 4, u.y + 4, 8, 3, 2, 'rgba(255,255,255,.5)');
        }
      },
    },
    crossfitBox: {
      fp: [112, 202, 72, 50], max: 3,
      units: (f) => [
        { x: f.x + 6, y: f.y + 18, w: 18, h: 26, spot: { x: f.x + 15, y: f.y + 44, pose: 'jump', face: 'down' } },
        { x: f.x + 28, y: f.y + 2, w: 18, h: 26, spot: { x: f.x + 37, y: f.y + 24, pose: 'pullup', face: 'up' } },
        { x: f.x + 50, y: f.y + 18, w: 20, h: 26, spot: { x: f.x + 59, y: f.y + 44, pose: 'swing', face: 'down' } },
      ],
      base(ctx, f) {
        box(ctx, f.x, f.y + 4, f.w, f.h - 4, 4, C.mat);
        line(ctx, f.x + 4, f.y + 8, f.x + 4, f.y - 18, 2.2, C.dark);
        line(ctx, f.x + f.w - 4, f.y + 8, f.x + f.w - 4, f.y - 18, 2.2, C.dark);
        line(ctx, f.x + 4, f.y - 18, f.x + f.w - 4, f.y - 18, 2.2, C.dark);
        line(ctx, f.x + 18, f.y - 18, f.x + 18, f.y - 6, 0.6, '#222');
        ctx.beginPath(); ctx.arc(f.x + 18, f.y - 4, 2, 0, 7); ctx.strokeStyle = '#C99A6B'; ctx.lineWidth = 1; ctx.stroke();
      },
      unit(ctx, u, busy, t, i) {
        if (i === 0) { box(ctx, u.x, u.y + 6, 18, 14, 2, '#C99A6B'); box(ctx, u.x, u.y + 6, 18, 4, 2, '#DDB487'); }
        if (i === 2) { [0, 1].forEach((k) => { circ(ctx, u.x + 4 + k * 12, u.y + 12, 3.6, k ? '#E07B39' : '#2B2F38'); line(ctx, u.x + 2 + k * 12, u.y + 8.5, u.x + 6 + k * 12, u.y + 8.5, 1, '#222'); }); }
      },
    },
    olympicPlatform: {
      fp: [198, 204, 80, 44], max: 2,
      units: (f) => [0, 1].map((i) => ({ x: f.x + i * 41, y: f.y, w: 39, h: 42, spot: { x: f.x + 19.5 + i * 41, y: f.y + 30, pose: 'clean', face: 'down' } })),
      unit(ctx, u, busy, t, i) {
        box(ctx, u.x, u.y + 2, 39, 40, 3, C.rubber);
        box(ctx, u.x + 9, u.y + 2, 21, 40, 1, '#D8B98C');
        if (!busy) barbell(ctx, u.x + 19.5, u.y + 36, 36, i ? '#3E6FD8' : '#D9534F', 11);
      },
    },
    resolutionRack: {
      fp: [96, 262, 48, 28], max: 1,
      units: (f) => [{ x: f.x, y: f.y, w: 48, h: 28, spot: { x: f.x + 24, y: f.y + 24, pose: 'curl', face: 'down' } }],
      unit(ctx, u) {
        box(ctx, u.x, u.y + 6, 48, 22, 4, 'rgba(224,123,57,.18)');
        box(ctx, u.x + 4, u.y, 40, 8, 2, C.clay);
        for (let k = 0; k < 4; k++) dumbbell(ctx, u.x + 10 + k * 9.5, u.y + 4, 5, '#FFF4E6');
        line(ctx, u.x + 44, u.y + 6, u.x + 44, u.y - 14, 1, C.dark);
        ctx.beginPath(); ctx.moveTo(u.x + 44, u.y - 14); ctx.lineTo(u.x + 54, u.y - 11); ctx.lineTo(u.x + 44, u.y - 8); ctx.fillStyle = C.clay; ctx.fill();
      },
    },
  };
  const DECOR = [
    { x: 8, y: 280, kind: 'plant' }, { x: 352, y: 280, kind: 'plant' }, { x: 276, y: 284, kind: 'cooler' }, { x: 70, y: 186, kind: 'plant' },
  ];
  const BARISTA = { skin: '#EBBE9B', hair: '#5A3A28', style: 'bun', shirt: '#4F9D69', pants: '#2B2F38', apron: true, phase: 0 };

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

    let bob = 0, hipY = -9, legSwing = 0, armL = [-5.5, -10], armR = [5.5, -10];
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
      if (face === 'down') { circ(ctx, -1.5, hy + 0.4, 0.55, C.ink); circ(ctx, 1.5, hy + 0.4, 0.55, C.ink); }
      else if (profile) circ(ctx, 2.2, hy + 0.3, 0.55, C.ink);
      if (look.golden) { ctx.fillStyle = '#E6B422'; ctx.beginPath(); ctx.moveTo(-3, hy - 4.5); ctx.lineTo(-2, hy - 7.5); ctx.lineTo(0, hy - 5.5); ctx.lineTo(2, hy - 7.5); ctx.lineTo(3, hy - 4.5); ctx.fill(); }
    };
    const torso = (top, h = 10) => {
      box(ctx, -4.6, top, 9.2, h, 3, look.towel ? '#FFFFFF' : look.shirt);
      if (look.apron) box(ctx, -3.4, top + 3, 6.8, h - 2, 1.5, '#F4ECE0');
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
    };

    switch (pose) {
      case 'run':
      case 'walk': {
        const sw = Math.sin(ph) * (pose === 'run' ? 3.2 : moving ? 2.4 : 0);
        bob = -Math.abs(Math.sin(ph)) * (pose === 'run' ? 1.4 : moving ? 0.8 : 0);
        ctx.translate(0, bob);
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
        box(ctx, -4.4, -18, 8.8, 13, 3, look.shirt);
        line(ctx, -2, -5, -3, 3, 2.6, look.pants); line(ctx, 2, -5, 3, 3, 2.6, look.pants);
        circ(ctx, 0, -20.5, 4.1, look.skin);
        ctx.fillStyle = look.hair; ctx.beginPath(); ctx.arc(0, -21.5, 4.2, Math.PI, 0); ctx.fill();
        const lift = 2 + p * 4;
        line(ctx, -4, -14, -5.5, -14 - lift * 0.3, 2, look.skin); line(ctx, 4, -14, 5.5, -14 - lift * 0.3, 2, look.skin);
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
        const a = Math.sin(ph * 1.4), hop = -Math.abs(Math.sin(ph * 0.9)) * 1.2;
        ctx.translate(0, hop);
        legs(hipY, -3, 3);
        torso(-18.5);
        arms(-16.5, [a > 0 ? 9 : 4, -15.5], [a < 0 ? 9 : 4, -17.5], 'glove');
        head(-23);
        break;
      }
      case 'cycle': {
        const a = ph;
        legs(-10, -2.5 + Math.cos(a) * 1.4, 2.5 - Math.cos(a) * 1.4, -4 + Math.sin(a) * 2, -4 - Math.sin(a) * 2);
        torso(-19, 9);
        arms(-17, [-6, -12], [6, -12]);
        head(-23.5);
        break;
      }
      case 'yoga': {
        const stage = Math.floor((t + look.phase) / 3.2) % 3;
        if (stage === 2) {
          box(ctx, -4.4, -15, 8.8, 11, 3, look.shirt);
          line(ctx, -2, -4, -3, 4, 2.6, look.pants); line(ctx, 2, -4, 3, 4, 2.6, look.pants);
          circ(ctx, 0, -18, 4, look.skin);
          ctx.fillStyle = look.hair; ctx.beginPath(); ctx.arc(0, -19, 4.1, Math.PI, 0); ctx.fill();
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
        arms(-13.5, [-5.5, -8], [profile ? 6 : 5.5, -9]);
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
      default: { // idle / chat
        const sway = Math.sin(t * 1.3 + look.phase) * 0.4;
        ctx.translate(sway, 0);
        legs(hipY, -2, 2); torso(-18.5);
        const wave = Math.sin(t * 0.7 + look.phase) > 0.92;
        arms(-16.5, [-5.6, -10], wave ? [7, -22] : [5.6, -10]);
        head(-23);
      }
    }
    ctx.restore();
  }

  // ───────── Scene state ─────────
  let root = null, k = {}, canvas = null, ctx = null, scale = 1, dpr = 1;
  let rafId = 0, watchdog = 0, lastFrame = 0, startT = performance.now();
  let people = [], spots = [], crowd = [], fx = [];
  let unitCounts = {}, born = {}, blocked = null, nextId = 1, lastPuff = 0, lastNote = 0;

  const stationKit = (id) => KITS[id];
  const fpOf = (kit) => ({ x: kit.fp[0], y: kit.fp[1], w: kit.fp[2], h: kit.fp[3] });
  const now = () => (performance.now() - startT) / 1000;

  function unitsFor(st) {
    const lvl = G.level(st);
    if (lvl <= 0) return 0;
    return Math.min(KITS[st.id].max, 1 + milestoneCount(lvl));
  }
  const stationsInRoom = () => G.allStations.filter((st) => KITS[st.id] && unitsFor(st) > 0);

  /** Rebuilds spots and the walkable grid; animates equipment that just arrived. */
  function rebuild() {
    const t = now();
    const live = G.liveClass;
    const oldSpots = new Map(spots.map((s) => [s.key, s]));
    const oldCrowd = new Map(crowd.map((s) => [s.key, s]));
    spots = [];
    crowd = [];
    for (const st of G.allStations) {
      const kit = KITS[st.id];
      if (!kit) continue;
      const n = unitsFor(st);
      const was = unitCounts[st.id] ?? n; // first build: no pop-in
      if (n > was) for (let i = was; i < n; i++) { born[`${st.id}:${i}`] = t; burst(st, i); }
      unitCounts[st.id] = n;
      const f = fpOf(kit);
      kit.units(f).slice(0, n).forEach((u, i) => {
        const key = `${st.id}:${i}`;
        // Reuse the spot object so members holding it stay in sync.
        const s = Object.assign(oldSpots.get(key) || { key, taken: null }, { st: st.id, ...u.spot, ax: u.spot.x, ay: Math.min(f.y + f.h + 5, 292) });
        spots.push(s);
      });
      if (live && live.station.id === st.id) {
        for (let c = 0; c < 4; c++) {
          const cx = f.x + 8 + (c * (f.w - 16)) / 3, cy = Math.min(f.y + f.h + 12, 292);
          crowd.push(Object.assign(oldCrowd.get(`crowd:${c}`) || { key: `crowd:${c}`, taken: null }, { st: st.id, x: cx, y: cy, pose: 'aerobics', face: 'up', ax: cx, ay: cy }));
        }
      }
    }
    // Walkable grid: walls, open equipment and decor are blocked.
    blocked = new Uint8Array(COLS * ROWS);
    const block = (x, y, w, h) => {
      for (let r = Math.max(0, Math.floor(y / CELL)); r <= Math.min(ROWS - 1, Math.floor((y + h) / CELL)); r++)
        for (let c = Math.max(0, Math.floor(x / CELL)); c <= Math.min(COLS - 1, Math.floor((x + w) / CELL)); c++) blocked[r * COLS + c] = 1;
    };
    block(0, 0, W, WALL + 4);
    for (const st of stationsInRoom()) { const f = fpOf(KITS[st.id]); block(f.x, f.y, f.w, f.h); }
    DECOR.forEach((d) => block(d.x - 6, d.y - 6, 12, 10));
    // Release people from spots that no longer exist.
    const keys = new Set([...spots, ...crowd].map((s) => s.key));
    people.forEach((p) => { if (p.spot && !keys.has(p.spot.key)) { p.spot = null; p.state = 'idle'; p.until = 0; } });
  }

  function burst(st, i) {
    const kit = KITS[st.id];
    const u = kit.units(fpOf(kit))[i];
    if (!u || FX.reduceMotion) return;
    for (let n = 0; n < 14; n++) fx.push({ kind: 'dust', x: u.x + u.w / 2 + rand(-10, 10), y: u.y + u.h - 4, vx: rand(-14, 14), vy: rand(-22, -6), life: 0, max: rand(0.6, 1.1) });
    fx.push({ kind: 'text', text: i === 0 ? 'NEW!' : '+1 unit', x: u.x + u.w / 2, y: u.y - 4, vy: -14, life: 0, max: 1.8, color: C.clay, size: 9 });
  }

  // ───────── Pathfinding (BFS on a 6-unit grid, no corner cutting) ─────────
  const cellOf = (x, y) => [Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))), Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL)))];
  const free = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !blocked[r * COLS + c];
  function nearestFree(c, r) {
    if (free(c, r)) return [c, r];
    for (let d = 1; d < 12; d++) for (let dc = -d; dc <= d; dc++) for (const dr of [-d, d]) {
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
    // Keep only turning points.
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

  // ───────── Member behaviour ─────────
  function targetCount() {
    const f = CFG.floor;
    const base = Math.min(f.maxMembers, f.minMembers + Math.floor(Math.sqrt(G.totalLevels) * 1.2));
    return base + (G.liveClass ? f.classCrowd : 0);
  }
  function idlePoint() {
    for (let tries = 0; tries < 40; tries++) {
      const x = rand(20, 340), y = rand(WALL + 10, 292);
      const [c, r] = cellOf(x, y);
      if (free(c, r)) return { x, y };
    }
    return { x: 180, y: 280 };
  }
  function chooseGoal(p) {
    if (p.leaving) { p.goal = { x: DOOR.x, y: DOOR.y, leave: true }; }
    else {
      const freeCrowd = p.classGoer ? crowd.filter((s) => !s.taken) : [];
      const freeSpots = spots.filter((s) => !s.taken);
      const live = G.liveClass;
      const classSpots = live ? freeSpots.filter((s) => s.st === live.station.id) : [];
      let s = null;
      if (freeCrowd.length) s = pick(freeCrowd);
      else if (classSpots.length && !p.look.golden && Math.random() < 0.65) s = pick(classSpots);
      else if (freeSpots.length && !p.look.golden && Math.random() < 0.72) s = pick(freeSpots);
      if (s) { s.taken = p.id; p.goal = { spot: s, x: s.ax, y: s.ay }; }
      else p.goal = idlePoint();
    }
    p.path = findPath(p.x, p.y, p.goal.x, p.goal.y);
    p.state = 'walk';
  }
  function addPerson(golden = false) {
    const p = { id: nextId++, x: DOOR.x + rand(-10, 10), y: DOOR.y, look: newLook(golden), state: 'walk', path: [{ x: DOOR.x, y: 288 }], face: 'up', goal: null, spot: null, until: 0, classGoer: false, golden };
    people.push(p);
    return p;
  }
  function syncCount() {
    const want = targetCount();
    const active = people.filter((p) => !p.leaving && !p.golden);
    if (active.length < want) {
      // Stagger arrivals so people walk in one by one.
      if (!syncCount.next || now() > syncCount.next) {
        const p = addPerson();
        p.classGoer = !!G.liveClass && active.filter((x) => x.classGoer).length < CFG.floor.classCrowd;
        syncCount.next = now() + 0.7;
      }
    } else if (active.length > want) {
      const p = active[active.length - 1];
      p.leaving = true;
      releaseSpot(p);
      chooseGoal(p);
    }
    UI.setText(k.count, `👥 ${active.length} member${active.length === 1 ? '' : 's'} training`);
  }
  function releaseSpot(p) {
    if (p.spot) { p.spot.taken = null; p.spot = null; }
    if (p.goal?.spot) { p.goal.spot.taken = null; }
  }

  function step(p, dt, t) {
    if (p.state === 'walk') {
      if (!p.path.length) {
        if (!p.goal) { chooseGoal(p); return; }
        if (p.goal.leave) { p.gone = true; return; }
        if (p.goal.spot) {
          const s = p.goal.spot;
          // Final step from the aisle onto the equipment.
          const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy);
          if (d > 0.8) { p.x += (dx / d) * Math.min(d, SPEED * dt); p.y += (dy / d) * Math.min(d, SPEED * dt); return; }
          p.spot = s; p.state = 'use'; p.until = t + rand(8, 16); p.face = s.face;
          return;
        }
        p.state = 'idle'; p.until = t + rand(2, 5); p.face = Math.random() < 0.5 ? 'down' : pick(['left', 'right']);
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
    if (t < p.until || (p.golden && !p.leaving)) return;
    // Done using or idling: step back into the aisle, then head somewhere new.
    const s = p.spot;
    releaseSpot(p);
    p.goal = null;
    p.state = 'walk';
    p.path = s ? [{ x: s.ax, y: s.ay }] : [];
  }

  // ───────── Frame ─────────
  function drawRoom(ctx, t) {
    // Floor: warm wood planks.
    ctx.fillStyle = C.wood; ctx.fillRect(0, WALL, W, H - WALL);
    for (let y = WALL + 10, row = 0; y < H; y += 10, row++) {
      line(ctx, 0, y, W, y, 0.6, 'rgba(150,110,60,.13)');
      for (let x = (row % 2) * 30; x < W; x += 60) line(ctx, x, y - 10, x, y, 0.6, 'rgba(150,110,60,.10)');
    }
    // Back wall.
    const g = ctx.createLinearGradient(0, 0, 0, WALL);
    g.addColorStop(0, C.wall); g.addColorStop(1, C.wallLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, WALL);
    ctx.fillStyle = C.baseboard; ctx.fillRect(0, WALL - 4, W, 4);
    // Windows show the real sky.
    const hr = new Date().getHours() + new Date().getMinutes() / 60;
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
    // Mirror wall with soft reflections.
    box(ctx, 84, 8, 120, 36, 2, '#D6E2E6');
    for (let x = 94; x < 204; x += 26) line(ctx, x, 40, x + 12, 12, 2, 'rgba(255,255,255,.55)');
    box(ctx, 84, 8, 120, 2, 1, '#C3CDD1');
    // Logo + real clock.
    ctx.fillStyle = '#4F9D69'; ctx.font = '800 9px ui-rounded, Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('IRON EMPIRE', 240, 40);
    const d = new Date();
    circ(ctx, 240, 18, 10, '#FFFFFF'); ctx.beginPath(); ctx.arc(240, 18, 10, 0, 7); ctx.strokeStyle = C.dark; ctx.lineWidth = 1.2; ctx.stroke();
    const ha = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, ma = d.getMinutes() / 60 * Math.PI * 2;
    line(ctx, 240, 18, 240 + Math.sin(ha) * 5, 18 - Math.cos(ha) * 5, 1.4, C.ink);
    line(ctx, 240, 18, 240 + Math.sin(ma) * 7.5, 18 - Math.cos(ma) * 7.5, 0.9, C.ink);
    // Doormat.
    box(ctx, 158, 292, 44, 8, 3, '#8A6A52');
  }

  function drawDecor(ctx, d) {
    if (d.kind === 'plant') {
      shadow(ctx, d.x, d.y + 1, 6, 2);
      box(ctx, d.x - 4.5, d.y - 7, 9, 8, 2, '#C9935F');
      circ(ctx, d.x - 3, d.y - 11, 4.5, '#5E9E6E'); circ(ctx, d.x + 3, d.y - 12, 4.5, '#6FAE7E'); circ(ctx, d.x, d.y - 16, 4.5, '#88C496');
    } else if (d.kind === 'cooler') {
      shadow(ctx, d.x, d.y + 1, 5, 2);
      box(ctx, d.x - 4, d.y - 12, 8, 13, 2, '#E9EEF1');
      box(ctx, d.x - 3.5, d.y - 20, 7, 8, 3, '#9ED3EA');
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
    // Golden member walks in when G spawns one.
    const gc = G.goldenCustomer;
    const gp = people.find((p) => p.golden);
    if (gc && !gp) { const p = addPerson(true); p.goldenId = gc.id; }
    if (!gc && gp && !gp.leaving) { gp.leaving = true; chooseGoal(gp); }

    people.forEach((p) => step(p, dt, t));
    people = people.filter((p) => !p.gone);

    // Income puffs and class notes.
    if (!FX.reduceMotion && t - lastPuff > 0.9) {
      lastPuff = t;
      const busy = people.filter((p) => p.state === 'use' && p.spot);
      if (busy.length) {
        const p = pick(busy);
        fx.push({ kind: 'text', text: `+${Fmt.short(G.stationIncome(G.station(p.spot.st)))}`, x: p.x, y: p.y - 30, vy: -16, life: 0, max: 1.3, color: '#3E9A5E', size: 7.5 });
      }
    }
    const live = G.liveClass;
    if (live && !FX.reduceMotion && t - lastNote > 0.6 && KITS[live.station.id]) {
      lastNote = t;
      const f = fpOf(KITS[live.station.id]);
      fx.push({ kind: 'text', text: pick(['♪', '♫']), x: rand(f.x, f.x + f.w), y: f.y - 2, vy: -12, vx: rand(-4, 4), life: 0, max: 1.6, color: C.lav, size: 10 });
    }

    // Draw.
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawRoom(ctx, t);
    const items = [];
    for (const st of stationsInRoom()) {
      const kit = KITS[st.id], f = fpOf(kit), n = unitCounts[st.id] || 0;
      if (kit.base) items.push({ y: f.y - 0.5, draw: () => kit.base(ctx, f, n, t) });
      kit.units(f).slice(0, n).forEach((u, i) => {
        const busy = people.some((p) => p.spot && p.spot.key === `${st.id}:${i}` && p.state === 'use');
        const b = born[`${st.id}:${i}`];
        items.push({
          y: u.y,
          draw: () => {
            if (b !== undefined && t - b < 0.7) {
              const q = (t - b) / 0.7, s = 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2);
              ctx.save(); ctx.translate(u.x + u.w / 2, u.y + u.h); ctx.scale(s, s); ctx.translate(-(u.x + u.w / 2), -(u.y + u.h));
              kit.unit(ctx, u, busy, t, i); ctx.restore();
            } else kit.unit(ctx, u, busy, t, i);
          },
        });
      });
      if (kit.front) items.push({ y: f.y + f.h, draw: () => kit.front(ctx, f, n, t) });
      if (live && live.station === st) items.push({ y: f.y - 1, draw: () => { ctx.save(); rr(ctx, f.x - 3, f.y - 3, f.w + 6, f.h + 6, 8); ctx.strokeStyle = `rgba(79,157,105,${0.45 + Math.sin(t * 3) * 0.2})`; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.restore(); } });
    }
    DECOR.forEach((d) => items.push({ y: d.y, draw: () => drawDecor(ctx, d) }));
    for (const p of people) {
      const pose = p.state === 'use' && p.spot ? p.spot.pose : 'walk';
      const look = p.spot?.towel ? { ...p.look, towel: true } : p.look;
      items.push({ y: p.state === 'use' && p.spot ? p.y + 0.5 : p.y, draw: () => drawPerson(ctx, look, p.x, p.y, t, pose, p.face, p.state === 'walk') });
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    // Effects on top.
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
    // Evening/night: a soft dim over the room.
    const hr = new Date().getHours();
    if (hr >= 21 || hr < 5) { ctx.fillStyle = 'rgba(30,30,60,.10)'; ctx.fillRect(0, 0, W, H); }
    schedule();
  }

  function schedule() {
    if (root && !rafId) rafId = requestAnimationFrame(frame);
  }

  function resize() {
    if (!root) return;
    const w = k.stage.clientWidth;
    if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    scale = w / W;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(H * scale * dpr);
    canvas.style.height = `${H * scale}px`;
  }

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    const gp = people.find((p) => p.golden && !p.leaving);
    if (gp && Math.abs(x - gp.x) < 12 && y > gp.y - 30 && y < gp.y + 6) {
      const got = G.catchGoldenCustomer();
      if (got) fx.push({ kind: 'text', text: `+${Fmt.short(got.reps)}${got.protein ? ' 💎' : ''} ✨`, x: gp.x, y: gp.y - 34, vy: -14, life: 0, max: 2, color: '#C99A10', size: 11 });
      return;
    }
    for (const st of stationsInRoom()) {
      const f = fpOf(KITS[st.id]);
      if (x >= f.x - 4 && x <= f.x + f.w + 4 && y >= f.y - 20 && y <= f.y + f.h + 4) {
        GymScreen.scrollToStation(st.id);
        return;
      }
    }
  }

  function render(container) {
    root = container;
    root.innerHTML = `
      <div class="floor-stage" data-k="stage">
        <canvas class="floor-canvas" data-k="canvas" role="img" aria-label="Your gym floor, with members using the equipment you've bought"></canvas>
        <span class="floor-golden-hint" data-k="goldHint" hidden>🤩 A golden member is here. Tap them!</span>
      </div>
      <div class="floor-bar">
        <span class="floor-count num" data-k="count"></span>
        <button class="floor-class" data-action="tab" data-tab="classes" data-k="classChip"></button>
      </div>`;
    k = {};
    root.querySelectorAll('[data-k]').forEach((el) => (k[el.dataset.k] = el));
    canvas = k.canvas;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', resize);
    people = []; fx = []; spots = []; crowd = [];
    rebuild();
    // Start with a few members already training so the room never looks empty.
    const want = targetCount();
    for (let i = 0; i < want; i++) {
      const p = addPerson();
      const s = spots.find((x) => !x.taken);
      if (s && Math.random() < 0.8) { s.taken = p.id; p.spot = s; p.x = s.x; p.y = s.y; p.state = 'use'; p.face = s.face; p.until = now() + rand(1, 9); p.path = []; }
      else { const ip = idlePoint(); p.x = ip.x; p.y = ip.y; p.state = 'idle'; p.until = now() + rand(0.5, 4); p.path = []; }
    }
    setTimeout(() => { resize(); lastFrame = now(); schedule(); }, 0);
    // If frames are throttled (background panes), keep the picture current anyway.
    watchdog = setInterval(() => { if (root && now() - lastFrame > 0.4) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } frame(); } }, 250);
  }

  function update() {
    if (!root) return;
    const live = G.liveClass;
    UI.setText(k.classChip, live
      ? `🎵 ${CFG.classes[live.station.id]} x${+live.mult.toFixed(1)} · ${Fmt.duration(G.slotSecondsLeft)} left`
      : `🗓️ No class now · ${G.currentSlot.name}`);
    k.classChip.classList.toggle('on', !!live);
    k.goldHint.hidden = !G.goldenCustomer;
  }

  return {
    render,
    update,
    renderGolden() { update(); },
    /** For the console: what every member is doing right now. */
    debugPeople: () => people.map((p) => `${p.golden ? 'GOLD ' : ''}${p.state}${p.spot ? ':' + p.spot.key : ''} ${p.x | 0},${p.y | 0} until ${(p.until - now()).toFixed(1)}s path ${p.path.length}`),
    /** After purchases, class changes or a new time slot. */
    refresh() { if (root) { rebuild(); update(); } },
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
