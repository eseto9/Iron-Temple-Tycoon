/* Game state, economy and loop. UI code reads from G and calls its actions;
   G tells the UI what changed through G.on(event, fn). */
const G = (() => {
  const listeners = {};
  const SEASON = CFG.season;
  const DAY = 86400e3;
  const STATS = ['taps', 'levels', 'golden', 'reps', 'upgrades', 'trainers', 'seasonPts', 'gyms', 'franchises'];

  function newStats() {
    return Object.fromEntries(STATS.map((k) => [k, 0]));
  }

  function newSave(now = Date.now()) {
    return {
      version: 2,
      reps: CFG.startingReps,
      lifetimeReps: 0,
      runReps: 0, // Reps earned since the last franchise; drives Golden Plates
      protein: CFG.startingProtein,
      goldenPlates: CFG.startingGoldenPlates,
      stationLevels: { ...CFG.startingStationLevels },
      franchiseCount: 0,
      trainers: [],
      coinUpgrades: [],
      proteinUpgrades: [],
      goldenUpgradeLevels: {},
      gyms: [], // "cityId:locationId"
      seasonEndsAt: now + SEASON.lengthDays * DAY,
      seasonRackLevel: 0,
      seasonClaimed: [],
      stats: newStats(),
      bestIncome: 0,
      tasks: null,
      lastActiveAt: now,
      settings: { sound: false, haptics: true, appearance: 'system' },
      onboarded: false,
    };
  }

  function load() {
    const fresh = newSave();
    try {
      const raw = localStorage.getItem(CFG.saveKey);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      // Lenient merge: fields added in later builds get defaults.
      return {
        ...fresh,
        ...parsed,
        settings: { ...fresh.settings, ...(parsed.settings || {}) },
        stats: { ...fresh.stats, ...(parsed.stats || {}) },
      };
    } catch {
      return fresh;
    }
  }

  const has = (list, id) => list.includes(id);

  const G = {
    s: load(),
    now: Date.now(),
    buyAmount: 'x1',
    goldenCustomer: null,
    nextGoldenCustomerAt: Date.now() + 25e3,
    lastTick: Date.now(),
    lastSave: Date.now(),
    lastTaskCheck: 0,
    autoTapCarry: 0,
    loopId: null,

    on(event, fn) { (listeners[event] ||= []).push(fn); },
    emit(event, data) { (listeners[event] || []).forEach((fn) => fn(data)); },

    // ───────── Persistence ─────────
    save() {
      this.s.lastActiveAt = Date.now();
      this.lastSave = this.s.lastActiveAt;
      try { localStorage.setItem(CFG.saveKey, JSON.stringify(this.s)); } catch { /* storage full or blocked */ }
    },
    resetProgress() {
      const settings = this.s.settings;
      this.s = newSave();
      this.s.settings = settings;
      this.s.onboarded = true;
      this.ensureTasks(true);
      this.save();
      this.emit('structure');
    },

    // ───────── Upgrade effects ─────────
    /** Product of `value` over owned upgrades (coin + protein) whose effect matches. */
    effectProduct(kind, filter = () => true) {
      let m = 1;
      for (const u of CFG.coinUpgrades) if (u.effect.kind === kind && filter(u.effect) && has(this.s.coinUpgrades, u.id)) m *= u.effect.value;
      for (const u of CFG.proteinUpgrades) if (u.effect.kind === kind && filter(u.effect) && has(this.s.proteinUpgrades, u.id)) m *= u.effect.value;
      return m;
    },
    effectSum(kind) {
      let n = 0;
      for (const u of CFG.proteinUpgrades) if (u.effect.kind === kind && has(this.s.proteinUpgrades, u.id)) n += u.effect.value;
      return n;
    },
    upgradeEffectText(u) {
      const e = u.effect;
      if (e.kind === 'station') return `${CFG.stations.find((s) => s.id === e.station).name} income x${e.value}`;
      if (e.kind === 'global') return `All station income x${e.value}`;
      if (e.kind === 'tap') return `Tap payout x${e.value}`;
      if (e.kind === 'milestone') return `Every milestone bonus x${e.value}`;
      if (e.kind === 'golden') return `Golden members pay x${e.value}`;
      return u.detail || '';
    },

    // ───────── Economy ─────────
    get allStations() { return [SEASON.station, ...CFG.stations]; },
    station(id) { return this.allStations.find((s) => s.id === id); },
    level(st) { return st.seasonal ? this.s.seasonRackLevel : (this.s.stationLevels[st.id] || 0); },
    golden(id) { return this.s.goldenUpgradeLevels[id] || 0; },
    get homeGymLevel() { return this.s.franchiseCount + 1; },
    get homeGymIncomeMult() { return Math.pow(CFG.homeGymIncomeGrowth, this.s.franchiseCount); },
    get homeGymCostMult() { return Math.pow(CFG.homeGymCostGrowth, this.s.franchiseCount); },
    get pumpMult() { return 1 + CFG.signaturePumpPerLevel * this.golden('signaturePump'); },
    get proteinGlobalMult() {
      let m = 1;
      for (const u of CFG.proteinUpgrades) if (u.effect.kind === 'global' && has(this.s.proteinUpgrades, u.id)) m *= u.effect.value;
      return m;
    },
    /** Applies to station income: Home Gym × Signature Pump × coin & protein "global" upgrades. */
    get globalMult() { return this.homeGymIncomeMult * this.pumpMult * this.effectProduct('global'); },
    get milestoneFactor() { return CFG.milestoneMultiplier * this.effectProduct('milestone'); },
    stationMult(st) {
      const trainer = has(this.s.trainers, st.id) ? 2 : 1;
      return trainer * this.effectProduct('station', (e) => e.station === st.id);
    },
    /** Income of one station before global multipliers. */
    stationRaw(st) {
      const lvl = this.level(st);
      if (lvl <= 0) return 0;
      return st.baseIncome * lvl * Math.pow(this.milestoneFactor, milestoneCount(lvl)) * this.stationMult(st);
    },
    stationIncome(st) { return this.stationRaw(st) * this.globalMult; },
    /** Income one more level would add (shown on unopened stations). */
    stationIncomePerLevel(st) {
      const lvl = Math.max(1, this.level(st));
      return st.baseIncome * Math.pow(this.milestoneFactor, milestoneCount(lvl)) * this.stationMult(st) * this.globalMult;
    },
    get stationIncomeTotal() { return this.allStations.reduce((sum, st) => sum + this.stationRaw(st), 0) * this.globalMult; },

    // Map chain income: kept across franchises; boosted by Signature Pump and Protein upgrades.
    city(id) { return CFG.cities.find((c) => c.id === id); },
    location(id) { return CFG.locations.find((l) => l.id === id); },
    gymCost(city, loc) { return CFG.mapBaseCost * Math.pow(CFG.mapCostGrowth, city.tier - 1) * loc.costMult; },
    gymBaseIncome(city, loc) { return CFG.mapBaseIncome * Math.pow(CFG.mapIncomeGrowth, city.tier - 1) * loc.incomeMult; },
    gymIncome(city, loc) { return this.gymBaseIncome(city, loc) * this.pumpMult * this.proteinGlobalMult; },
    hasGym(cityId, locId) { return has(this.s.gyms, `${cityId}:${locId}`); },
    gymsIn(cityId) { return this.s.gyms.filter((g) => g.startsWith(cityId + ':')).length; },
    get gymCount() { return this.s.gyms.length; },
    get cityCount() { return new Set(this.s.gyms.map((g) => g.split(':')[0])).size; },
    get chainIncome() {
      return this.s.gyms.reduce((sum, g) => {
        const [c, l] = g.split(':');
        return sum + this.gymIncome(this.city(c), this.location(l));
      }, 0);
    },

    get incomePerSec() { return this.stationIncomeTotal + this.chainIncome; },
    get autoTapsPerSec() { return this.effectSum('autoTap'); },
    get tapValue() {
      const hands = 1 + CFG.strongHandsPerLevel * this.golden('strongHands');
      const v = CFG.baseTapPower * hands * this.effectProduct('tap') + this.incomePerSec * CFG.tapIncomeShare;
      return v < 1000 ? Math.max(1, Math.round(v)) : v; // whole Reps per tap reads cleaner
    },
    get offlineRate() {
      return CFG.baseOfflineRate * (1 + CFG.nightShiftPerLevel * this.golden('nightShift')) * this.effectProduct('offlineRate');
    },
    get offlineCapSec() {
      return (CFG.baseOfflineCapHours + CFG.lockerRoomHoursPerLevel * this.golden('lockerRoom') + this.effectSum('offlineCap')) * 3600;
    },

    isUnlocked(st) {
      if (st.seasonal) return true;
      const i = CFG.stations.indexOf(st);
      return i <= 0 || this.level(CFG.stations[i - 1]) > 0;
    },
    previousStation(st) { return CFG.stations[CFG.stations.indexOf(st) - 1]; },

    quote(st, amount = this.buyAmount) {
      const g = CFG.stationCostGrowth;
      const base = st.baseCost * this.homeGymCostMult * Math.pow(g, this.level(st));
      const costOf = (n) => (n === 1 ? base : (base * (Math.pow(g, n) - 1)) / (g - 1));
      let n = amount === 'x10' ? 10 : 1;
      if (amount === 'MAX') {
        n = Math.floor(Math.log((this.s.reps * (g - 1)) / base + 1) / Math.log(g));
        while (n > 0 && costOf(n) > this.s.reps + 1e-9) n--;
        n = Math.max(1, Math.min(n, 5000));
      }
      const cost = costOf(n);
      return { count: n, cost, affordable: this.s.reps + 1e-9 >= cost };
    },

    spend(amount) {
      if (this.s.reps + 1e-9 < amount) { FX.haptic('denied'); return false; }
      this.s.reps = Math.max(0, this.s.reps - amount);
      return true;
    },
    earn(amount) {
      this.s.reps += amount;
      this.s.lifetimeReps += amount;
      this.s.runReps += amount;
      this.s.stats.reps += amount;
    },

    // ───────── Actions ─────────
    buy(st) {
      if (!this.isUnlocked(st)) return false;
      const q = this.quote(st);
      if (!q.affordable || !this.spend(q.cost)) { FX.haptic('denied'); return false; }
      const before = this.level(st);
      const after = before + q.count;
      if (st.seasonal) {
        this.s.seasonRackLevel = after;
        this.s.stats.seasonPts += q.count;
      } else this.s.stationLevels[st.id] = after;
      this.s.stats.levels += q.count;
      FX.haptic('purchase');
      FX.sound('buy');

      const gained = milestoneCount(after) - milestoneCount(before);
      if (before === 0 && !st.seasonal) {
        this.emit('milestone', { emoji: st.emoji, title: `${st.name} is open!`, subtitle: 'New station earning Reps', celebrate: false });
        this.emit('structure');
      } else if (gained > 0) {
        const protein = gained * CFG.milestoneProtein;
        this.s.protein += protein;
        this.emit('milestone', {
          emoji: st.emoji,
          title: `${st.name} income x${+Math.pow(this.milestoneFactor, gained).toFixed(2)}!`,
          subtitle: `Level ${previousMilestone(after)} milestone · +${protein} Protein`,
          celebrate: true,
        });
        FX.haptic('milestone');
      }
      if (st.seasonal) this.emit('season');
      this.emit('purchase', st);
      return true;
    },

    tap(auto = false) {
      const v = this.tapValue;
      this.earn(v);
      if (!auto) {
        this.s.stats.taps++;
        FX.haptic('tap');
        FX.sound('tap');
      }
      return v;
    },

    // Coin & Protein upgrades
    coinUpgradeLocked(u) {
      return u.effect.kind === 'station' && this.level(this.station(u.effect.station)) <= 0;
    },
    buyCoinUpgrade(u) {
      if (has(this.s.coinUpgrades, u.id) || this.coinUpgradeLocked(u) || !this.spend(u.cost)) return false;
      this.s.coinUpgrades.push(u.id);
      this.s.stats.upgrades++;
      FX.haptic('purchase');
      FX.sound('buy');
      this.emit('structure');
      return true;
    },
    proteinUpgradeLocked(u) { return !!u.requires && !has(this.s.proteinUpgrades, u.requires); },
    buyProteinUpgrade(u) {
      if (has(this.s.proteinUpgrades, u.id) || this.proteinUpgradeLocked(u)) return false;
      if (this.s.protein < u.cost) { FX.haptic('denied'); return false; }
      this.s.protein -= u.cost;
      this.s.proteinUpgrades.push(u.id);
      this.s.stats.upgrades++;
      FX.haptic('milestone');
      FX.sound('milestone');
      this.emit('structure');
      return true;
    },

    // Staff
    hireTrainer(st) {
      if (has(this.s.trainers, st.id) || this.level(st) <= 0) return false;
      if (!this.spend(st.trainerCost * this.homeGymCostMult)) return false;
      this.s.trainers.push(st.id);
      this.s.stats.trainers++;
      FX.haptic('milestone');
      FX.sound('buy');
      this.emit('structure');
      return true;
    },
    trainerCost(st) { return st.trainerCost * this.homeGymCostMult; },

    // Map
    openGym(city, loc) {
      if (this.hasGym(city.id, loc.id) || !this.spend(this.gymCost(city, loc))) return false;
      this.s.gyms.push(`${city.id}:${loc.id}`);
      this.s.stats.gyms++;
      FX.haptic('milestone');
      this.emit('milestone', { emoji: loc.emoji, title: `${city.name} ${loc.name} is open!`, subtitle: `+${Fmt.rate(this.gymIncome(city, loc))} for your chain, forever`, celebrate: true });
      this.emit('structure');
      return true;
    },

    // Golden Plates
    get chainMult() { return 1 + CFG.chainBonusPerGym * this.gymCount; },
    get pendingPlates() { return Math.floor(Math.sqrt(this.s.runReps / CFG.prestigeDivisor) * this.chainMult); },
    /** Reps this franchise needed for the next Golden Plate. */
    get nextPlateAt() { return Math.pow((this.pendingPlates + 1) / this.chainMult, 2) * CFG.prestigeDivisor; },
    goldenUpgradeCost(u) { return Math.ceil(u.baseCost * Math.pow(u.costGrowth, this.golden(u.id))); },
    buyGoldenUpgrade(u) {
      const lvl = this.golden(u.id);
      const cost = this.goldenUpgradeCost(u);
      if (lvl >= u.maxLevel || this.s.goldenPlates < cost) { FX.haptic('denied'); return false; }
      this.s.goldenPlates -= cost;
      this.s.goldenUpgradeLevels[u.id] = lvl + 1;
      FX.haptic('milestone');
      FX.sound('coin');
      this.emit('structure');
      return true;
    },
    get franchiseStartReps() {
      return CFG.startingReps * Math.pow(CFG.starterMembershipRepsMultiplier, this.golden('starterMembership'));
    },
    openFranchise() {
      const plates = this.pendingPlates;
      if (plates < 1) return 0;
      Object.assign(this.s, {
        goldenPlates: this.s.goldenPlates + plates,
        franchiseCount: this.s.franchiseCount + 1,
        reps: this.franchiseStartReps,
        runReps: 0,
        stationLevels: { ...CFG.startingStationLevels },
        trainers: [],
        coinUpgrades: [],
      });
      this.s.stats.franchises++;
      this.buyAmount = 'x1';
      FX.haptic('prestige');
      FX.sound('milestone');
      this.save();
      this.emit('structure');
      return plates;
    },

    // Golden member
    catchGoldenCustomer() {
      if (!this.goldenCustomer) return null;
      const gc = CFG.goldenCustomer;
      const lucky = 1 + CFG.luckyPlatesPerLevel * this.golden('luckyPlates');
      const reps = Math.max(gc.minimum, this.incomePerSec * gc.incomeSeconds) * lucky * this.effectProduct('golden');
      this.earn(reps);
      const protein = Math.random() < gc.proteinChance ? 1 : 0;
      this.s.protein += protein;
      this.s.stats.golden++;
      this.goldenCustomer = null;
      this.scheduleGoldenCustomer();
      FX.haptic('milestone');
      FX.sound('coin');
      this.emit('golden');
      return { reps, protein };
    },
    scheduleGoldenCustomer() {
      const gc = CFG.goldenCustomer;
      const gap = (gc.minGapSec + Math.random() * (gc.maxGapSec - gc.minGapSec)) / this.effectProduct('goldenRate');
      this.nextGoldenCustomerAt = Date.now() + gap * 1000;
    },

    // Season
    get seasonPoints() { return this.s.seasonRackLevel; },
    get seasonTier() { return Math.min(SEASON.tiers, Math.floor(this.seasonPoints / SEASON.pointsPerTier)); },
    get seasonDaysLeft() { return Math.max(0, Math.ceil((this.s.seasonEndsAt - this.now) / DAY)); },
    get seasonClaimable() {
      let n = 0;
      for (let t = 1; t <= this.seasonTier; t++) if (!has(this.s.seasonClaimed, t)) n++;
      return n;
    },
    rewardValue(reward) {
      return reward.kind === 'repsMinutes' ? Math.max(100, this.incomePerSec * 60 * reward.amount) : reward.amount;
    },
    claimSeasonReward(tier) {
      if (tier > this.seasonTier || has(this.s.seasonClaimed, tier)) return false;
      const reward = CFG.seasonReward(tier);
      if (reward.kind === 'protein') this.s.protein += reward.amount;
      else if (reward.kind === 'goldenPlates') this.s.goldenPlates += reward.amount;
      else this.earn(this.rewardValue(reward));
      this.s.seasonClaimed.push(tier);
      FX.haptic('purchase');
      FX.sound('coin');
      this.emit('season');
      return true;
    },
    rolloverSeasonIfNeeded() {
      if (this.now < this.s.seasonEndsAt) return;
      Object.assign(this.s, { seasonEndsAt: this.now + SEASON.lengthDays * DAY, seasonRackLevel: 0, seasonClaimed: [] });
      this.emit('structure');
      this.emit('season');
    },

    // ───────── Tasks ─────────
    dayKey(d = new Date()) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; },
    weekKey(d = new Date()) {
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
      return this.dayKey(monday);
    },
    rollTasks(defs, key) {
      return {
        key,
        base: { ...this.s.stats },
        claimed: [],
        list: defs.map((d) => ({
          id: d.id,
          target: d.target === 'income' ? Math.max(5000, Math.round(this.incomePerSec * 60 * d.minutes)) : d.target,
        })),
      };
    },
    ensureTasks(force = false) {
      const day = this.dayKey(), week = this.weekKey();
      const t = (this.s.tasks ||= {});
      let changed = false;
      if (force || !t.daily || t.daily.key !== day) {
        // Deterministic daily pick: always "tap", plus a shuffle seeded by the date.
        let seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
        const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
        const rest = CFG.dailyTasks.slice(1).sort(() => rand() - 0.5);
        t.daily = this.rollTasks([CFG.dailyTasks[0], ...rest.slice(0, CFG.dailyTaskCount - 1)], day);
        changed = true;
      }
      if (force || !t.weekly || t.weekly.key !== week) {
        t.weekly = this.rollTasks(CFG.weeklyTasks, week);
        changed = true;
      }
      if (changed) this.emit('tasks');
    },
    taskDef(id) { return CFG.dailyTasks.find((d) => d.id === id) || CFG.weeklyTasks.find((d) => d.id === id); },
    taskProgress(period, task) {
      const def = this.taskDef(task.id);
      return Math.max(0, this.s.stats[def.metric] - (period.base[def.metric] || 0));
    },
    get tasksClaimable() {
      const t = this.s.tasks;
      if (!t) return 0;
      let n = 0;
      for (const p of [t.daily, t.weekly]) for (const task of p.list) if (!has(p.claimed, task.id) && this.taskProgress(p, task) >= task.target) n++;
      return n;
    },
    claimTask(periodName, id) {
      const p = this.s.tasks[periodName];
      const task = p.list.find((x) => x.id === id);
      if (!task || has(p.claimed, id) || this.taskProgress(p, task) < task.target) return 0;
      const reward = this.taskDef(id).reward;
      p.claimed.push(id);
      this.s.protein += reward;
      FX.haptic('milestone');
      FX.sound('coin');
      this.emit('tasks');
      return reward;
    },

    // ───────── Offline & loop ─────────
    /** Credits time away. Returns a report for the Welcome Back sheet, or null. */
    applyOfflineProgress() {
      const now = Date.now();
      const awaySec = (now - this.s.lastActiveAt) / 1000;
      this.s.lastActiveAt = now;
      this.lastTick = now;
      this.now = now;
      if (!(awaySec > 1)) return null;
      const countedSec = Math.min(awaySec, this.offlineCapSec);
      const earned = this.incomePerSec * countedSec * this.offlineRate;
      if (earned <= 0) return null;
      this.earn(earned);
      this.save();
      if (awaySec < CFG.welcomeBackMinimumSec) return null;
      return { awaySec, countedSec, earned, rate: this.offlineRate, capped: awaySec > countedSec + 1 };
    },

    tick() {
      const t = Date.now();
      // Short throttling gaps are credited at full rate; long ones go through offline progress.
      const dt = Math.min(Math.max((t - this.lastTick) / 1000, 0), 60);
      this.lastTick = t;
      this.now = t;
      const income = this.incomePerSec;
      if (income > 0) this.earn(income * dt);
      if (income > this.s.bestIncome) this.s.bestIncome = income;

      const autoTaps = this.autoTapsPerSec;
      if (autoTaps > 0) {
        this.autoTapCarry += autoTaps * dt;
        while (this.autoTapCarry >= 1) {
          this.autoTapCarry -= 1;
          this.emit('autotap', this.tap(true));
        }
      }

      this.rolloverSeasonIfNeeded();
      if (t - this.lastTaskCheck > 5000) { this.lastTaskCheck = t; this.ensureTasks(); }

      if (this.goldenCustomer && t > this.goldenCustomer.expiresAt) {
        this.goldenCustomer = null;
        this.scheduleGoldenCustomer();
        this.emit('golden');
      } else if (!this.goldenCustomer && t >= this.nextGoldenCustomerAt) {
        this.goldenCustomer = { id: t, expiresAt: t + CFG.goldenCustomer.lifetimeSec * 1000, side: Math.random() < 0.5 ? -1 : 1 };
        this.emit('golden');
      }

      if (t - this.lastSave >= CFG.autosaveMs) this.save();
      this.emit('tick');
    },

    start() {
      if (this.loopId) return;
      this.lastTick = Date.now();
      this.ensureTasks();
      this.loopId = setInterval(() => this.tick(), CFG.tickMs);
    },
    stop() {
      clearInterval(this.loopId);
      this.loopId = null;
    },

    // ───────── Debug ─────────
    debug: {
      addReps(n) { G.earn(n); G.emit('tick'); },
      addProtein(n) { G.s.protein += n; G.emit('tick'); },
      addPlates(n) { G.s.goldenPlates += n; G.emit('tick'); },
      skip(sec) { G.earn(G.incomePerSec * sec); G.emit('tick'); },
      simulateOffline(hours) {
        G.s.lastActiveAt = Date.now() - hours * 3600e3;
        const report = G.applyOfflineProgress();
        if (report) G.emit('welcome', report);
      },
      goldenCustomerNow() { G.nextGoldenCustomerAt = 0; },
      seasonPoints(n) { G.s.seasonRackLevel += n; G.s.stats.seasonPts += n; G.emit('season'); G.emit('structure'); },
      completeTasks() {
        for (const p of [G.s.tasks.daily, G.s.tasks.weekly]) p.base = Object.fromEntries(Object.keys(G.s.stats).map((k) => [k, -1e18]));
        G.emit('tasks');
      },
    },
  };

  // Saves from the first build stored Protein upgrades under another name and had a premium track.
  if (G.s.premiumUpgrades && !G.s.proteinUpgrades?.length) G.s.proteinUpgrades = [];
  delete G.s.premiumUpgrades;
  if (!Array.isArray(G.s.seasonClaimed)) G.s.seasonClaimed = G.s.seasonClaimedFree || [];
  ['seasonClaimedFree', 'seasonClaimedPremium', 'hasSeasonPremium', 'freeRushEndsAt', 'freeRushReadyAt', 'preWorkoutEndsAt', 'restBoostEndsAt', 'totalTaps']
    .forEach((k) => delete G.s[k]);

  return G;
})();
