/* Idle-game number formatting: 0.5 · 523 · 1.20K · 3.45M · 8.10B · 11.7T · 1.00aa · 2.50ab … */
const Fmt = (() => {
  const named = ['', 'K', 'M', 'B', 'T'];

  function suffix(tier) {
    if (tier < named.length) return named[tier];
    const n = Math.min(tier - named.length, 26 * 26 - 1);
    return String.fromCharCode(97 + Math.floor(n / 26), 97 + (n % 26));
  }
  const digits = (s) => (s < 10 ? 2 : s < 100 ? 1 : 0);

  function short(value) {
    if (!isFinite(value)) return '∞';
    const sign = value < 0 ? '-' : '';
    const v = Math.abs(value);
    if (v < 1000) {
      if (Number.isInteger(v)) return sign + v;
      if (v < 100) return sign + String(Math.round(v * 10) / 10);
      return sign + Math.floor(v);
    }
    let tier = Math.max(1, Math.floor(Math.log10(v) / 3));
    let scaled = v / Math.pow(1000, tier);
    let text = scaled.toFixed(digits(scaled));
    if (parseFloat(text) >= 1000) {
      tier++;
      scaled /= 1000;
      text = scaled.toFixed(digits(scaled));
    }
    return sign + text + suffix(tier);
  }

  return {
    short,
    /** Balances: no fractions under 1,000. */
    whole: (v) => short(Math.floor(v)),
    rate: (v) => short(v) + '/s',
    /** "0:24", "4:12", "1:05:00" */
    countdown(sec) {
      const s = Math.max(0, Math.ceil(sec));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
      const pad = (x) => String(x).padStart(2, '0');
      return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
    },
    /** "3h 12m", "45m", "20s", "2d 4h" */
    duration(sec) {
      const s = Math.max(0, Math.floor(sec));
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
      if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
      if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
      if (m > 0) return `${m}m`;
      return `${s}s`;
    },
    mult: (x) => 'x' + x.toFixed(2),
  };
})();
