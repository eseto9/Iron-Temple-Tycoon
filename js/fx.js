/* Feedback: haptics, soft sounds, confetti. Everything respects settings and Reduce Motion. */
const FX = (() => {
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let audio = null;

  const patterns = { tap: 8, purchase: 14, milestone: [18, 40, 24], denied: [10, 30, 10], select: 6, prestige: [30, 50, 60] };

  function haptic(kind) {
    if (!G.s.settings.haptics || !navigator.vibrate) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // browsers block it before the first tap
    try { navigator.vibrate(patterns[kind] || 10); } catch { /* not supported */ }
  }

  // Soft synthesized sounds, no audio files needed.
  const tones = {
    tap: [[520, 0.05, 0.05]],
    buy: [[660, 0.07, 0.06], [880, 0.09, 0.05]],
    coin: [[880, 0.06, 0.06], [1320, 0.12, 0.05]],
    milestone: [[523, 0.1, 0.07], [659, 0.1, 0.07], [784, 0.18, 0.07]],
  };
  function sound(kind) {
    if (!G.s.settings.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      let t = audio.currentTime;
      for (const [freq, dur, vol] of tones[kind] || tones.tap) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
        t += dur * 0.7;
      }
    } catch { /* audio unavailable */ }
  }

  function confetti() {
    if (reduceMotionQuery.matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    document.body.appendChild(canvas);
    const dpr = window.devicePixelRatio || 1;
    const w = (canvas.width = innerWidth * dpr);
    const h = (canvas.height = innerHeight * dpr);
    const ctx = canvas.getContext('2d');
    const colors = ['#4F9D69', '#8B6FD6', '#35C3DD', '#E07B39', '#E6B422', '#F3B6C8'];
    const pieces = Array.from({ length: 90 }, () => ({
      x: w * (0.15 + Math.random() * 0.7),
      y: h * 0.28,
      vx: (Math.random() - 0.5) * 14 * dpr,
      vy: (-10 - Math.random() * 12) * dpr,
      size: (5 + Math.random() * 6) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      round: Math.random() < 0.3,
    }));
    const start = performance.now();
    (function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1.4) / 0.8);
      for (const p of pieces) {
        p.vy += 0.45 * dpr;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.size / 2, -p.size * 0.7, p.size, p.size * 1.4);
        ctx.restore();
      }
      if (t < 2.2) requestAnimationFrame(frame);
      else canvas.remove();
    })(start);
  }

  return {
    haptic,
    sound,
    confetti,
    get reduceMotion() { return reduceMotionQuery.matches; },
  };
})();
