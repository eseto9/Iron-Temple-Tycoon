/* GameConfig: every tunable number in the game lives here.
   Change values, reload, play. See README → "Tuning the economy". */
const CFG = {
  version: '1.2',

  // Starting state
  startingReps: 500,
  startingProtein: 0,
  startingGoldenPlates: 0,
  startingStationLevels: { freeWeights: 1 },

  // Loop & saving
  tickMs: 100,
  autosaveMs: 5000,
  saveKey: 'ironEmpire.save.v1',

  // Stations: cost(level) = baseCost × costGrowth^level × homeGymCostMultiplier
  stationCostGrowth: 1.15,
  milestoneMultiplier: 2,
  milestoneProtein: 1, // Protein paid for every milestone reached

  // Unlock order matters: each station unlocks once the previous one is open (Lv ≥ 1).
  stations: [
    { id: 'freeWeights', focus: 'strength',     name: 'Free Weights',        emoji: '🏋️', tint: '#FDE7C8', baseCost: 15.65, baseIncome: 0.5,   trainer: 'Head Coach',          trainerCost: 1.5e3 },
    { id: 'treadmillRow', focus: 'cardio',    name: 'Treadmill Row',       emoji: '🏃', tint: '#D9EEDD', baseCost: 300,   baseIncome: 4,     trainer: 'Cardio Captain',      trainerCost: 4e4 },
    { id: 'squatRack', focus: 'strength',       name: 'Squat Rack',          emoji: '🦵', tint: '#F9DCD6', baseCost: 4.5e3, baseIncome: 30,    trainer: 'Strength Coach',      trainerCost: 6e5 },
    { id: 'benchPress', focus: 'strength',      name: 'Bench Press Zone',    emoji: '💪', tint: '#E4DDF8', baseCost: 6e4,   baseIncome: 220,   trainer: 'Powerlifting Mentor', trainerCost: 8e6 },
    { id: 'cableMachines', focus: 'functional',   name: 'Cable Machines',      emoji: '⛓️', tint: '#D8EEF3', baseCost: 9e5,   baseIncome: 1600,  trainer: 'Form Specialist',     trainerCost: 1.2e8 },
    { id: 'smoothieBar', focus: 'recovery',     name: 'Smoothie Bar',        emoji: '🥤', tint: '#FBE0EC', baseCost: 1.4e7, baseIncome: 1.2e4, trainer: 'Nutritionist',        trainerCost: 2e9 },
    { id: 'spinStudio', focus: 'cardio',      name: 'Spin Studio',         emoji: '🚴', tint: '#FFF0C2', baseCost: 2.2e8, baseIncome: 9e4,   trainer: 'Spin Instructor',     trainerCost: 3e10 },
    { id: 'boxingRing', focus: 'cardio',      name: 'Boxing Ring',         emoji: '🥊', tint: '#F7D9CF', baseCost: 3.5e9, baseIncome: 7e5,   trainer: 'Boxing Coach',        trainerCost: 5e11 },
    { id: 'yogaLoft', focus: 'recovery',        name: 'Yoga Loft',           emoji: '🧘', tint: '#E2F0E4', baseCost: 6e10,  baseIncome: 5.5e6, trainer: 'Yoga Teacher',        trainerCost: 8e12 },
    { id: 'saunaPlunge', focus: 'recovery',     name: 'Sauna & Cold Plunge', emoji: '🧖', tint: '#DCE8F8', baseCost: 1e12,  baseIncome: 4.5e7, trainer: 'Recovery Therapist',  trainerCost: 1.5e14 },
    { id: 'crossfitBox', focus: 'functional',     name: 'CrossFit Box',        emoji: '🤸', tint: '#F5E3D3', baseCost: 1.8e13, baseIncome: 3.8e8, trainer: 'WOD Coach',           trainerCost: 2.5e15 },
    { id: 'olympicPlatform', focus: 'strength', name: 'Olympic Platform',    emoji: '🥇', tint: '#FBEFC9', baseCost: 3.5e14, baseIncome: 3.2e9, trainer: 'Olympic Coach',       trainerCost: 5e16 },
  ],

  /* ───────── Focus: every station and map gym has one ─────────
     Each map gym adds focusBonusPerGym to your home stations of the same focus. */
  focuses: [
    { id: 'strength',   name: 'Strength',   emoji: '🏋️', tint: '#FDE7C8' },
    { id: 'cardio',     name: 'Cardio',     emoji: '🏃', tint: '#D9EEDD' },
    { id: 'functional', name: 'Functional', emoji: '⛓️', tint: '#D8EEF3' },
    { id: 'recovery',   name: 'Recovery',   emoji: '🧘', tint: '#E4DDF8' },
  ],
  focusBonusPerGym: 0.05,
  trendMultiplier: 2, // map gyms whose focus matches the city's trend

  /* ───────── Classes: real local time ─────────
     A scheduled class multiplies its station's income while its slot is live. Each class once per day. */
  classMultiplier: 3,
  peakClassMultiplier: 5,
  timeSlots: [
    { id: 'early',     name: 'Early Birds', start: 5,  end: 8,  peak: true },
    { id: 'morning',   name: 'Morning',     start: 8,  end: 11 },
    { id: 'lunch',     name: 'Lunch Hour',  start: 11, end: 14 },
    { id: 'afternoon', name: 'Afternoon',   start: 14, end: 17 },
    { id: 'evening',   name: 'After Work',  start: 17, end: 20, peak: true },
    { id: 'night',     name: 'Night Owls',  start: 20, end: 23 },
    { id: 'late',      name: 'Late Night',  start: 23, end: 5 },
  ],
  slotUnlockCosts: [0, 0, 2e4, 2e6, 2e8, 2e10, 2e12], // by how many slots are already open
  classes: {
    freeWeights: 'Dumbbell Basics', treadmillRow: 'Treadmill Intervals', squatRack: 'Squat Clinic',
    benchPress: 'Bench Club', cableMachines: 'Cable Sculpt', smoothieBar: 'Smoothie Social',
    spinStudio: 'Spin 45', boxingRing: 'Boxing Bootcamp', yogaLoft: 'Sunrise Flow',
    saunaPlunge: 'Contrast Therapy', crossfitBox: 'WOD Hour', olympicPlatform: 'Barbell Club',
  },

  // Gym floor
  floor: { minMembers: 2, maxMembers: 14, classCrowd: 3 },

  // Offline earnings
  baseOfflineRate: 0.5,
  baseOfflineCapHours: 2,
  welcomeBackMinimumSec: 60,

  // Golden members: a tappable bonus that drops by the Gym tab now and then.
  goldenCustomer: { minGapSec: 70, maxGapSec: 140, lifetimeSec: 12, incomeSeconds: 60, minimum: 40, proteinChance: 0.25 },

  // Home Gym level (+1 with every franchise)
  homeGymIncomeGrowth: 2,
  homeGymCostGrowth: 1.5,

  /* ───────── Coin upgrades: Reps, last for this gym only (reset on franchise) ─────────
     effect kinds: station (one station × value), global (all station income), class,
     milestone (milestone factor × value), golden (golden member payout) */
  coinUpgrades: [
    { id: 'chalkBucket',     name: 'Chalk Bucket',          emoji: '🪣', cost: 2.5e3,  effect: { kind: 'station', station: 'freeWeights', value: 3 } },
    { id: 'classPassCards',  name: 'Class Pass Cards',      emoji: '🎫', cost: 1e4,    effect: { kind: 'class', value: 1.5 } },
    { id: 'treadmillTVs',    name: 'Treadmill TVs',         emoji: '📺', cost: 4e4,    effect: { kind: 'station', station: 'treadmillRow', value: 3 } },
    { id: 'premiumPlates',   name: 'Premium Plates',        emoji: '⚫️', cost: 4e5,    effect: { kind: 'station', station: 'squatRack', value: 3 } },
    { id: 'classSchedule',   name: 'Bigger Class Schedule', emoji: '🗓️', cost: 2e6,    effect: { kind: 'global', value: 1.5 } },
    { id: 'benchSpotters',   name: 'Bench Spotters',        emoji: '🙌', cost: 6e6,    effect: { kind: 'station', station: 'benchPress', value: 3 } },
    { id: 'vipLounge',       name: 'VIP Golden Lounge',     emoji: '🛋️', cost: 5e7,    effect: { kind: 'golden', value: 3 } },
    { id: 'coachCert',       name: 'Coach Certification',   emoji: '📜', cost: 9e7,    effect: { kind: 'station', station: 'cableMachines', value: 3 } },
    { id: 'grassFedWhey',    name: 'Grass-Fed Whey',        emoji: '🥛', cost: 1.4e9,  effect: { kind: 'station', station: 'smoothieBar', value: 3 } },
    { id: 'loyaltyProgram',  name: 'Loyalty Program',       emoji: '💳', cost: 5e9,    effect: { kind: 'milestone', value: 1.5 } },
    { id: 'spinPlaylists',   name: 'Spin Playlists',        emoji: '🎧', cost: 2e10,   effect: { kind: 'station', station: 'spinStudio', value: 3 } },
    { id: 'challengeMonth',  name: 'Challenge Month',       emoji: '🏆', cost: 1.5e11, effect: { kind: 'global', value: 2 } },
    { id: 'proGloves',       name: 'Pro Gloves',            emoji: '🥊', cost: 3e11,   effect: { kind: 'station', station: 'boxingRing', value: 3 } },
    { id: 'soundBath',       name: 'Sound Bath Sessions',   emoji: '🔔', cost: 5e12,   effect: { kind: 'station', station: 'yogaLoft', value: 3 } },
    { id: 'eucalyptusSteam', name: 'Eucalyptus Steam',      emoji: '🌿', cost: 8e13,   effect: { kind: 'station', station: 'saunaPlunge', value: 3 } },
    { id: 'communityWall',   name: 'Community PR Wall',     emoji: '🧱', cost: 4e14,   effect: { kind: 'global', value: 2 } },
    { id: 'competitionFloor',name: 'Competition Floor',     emoji: '🏟️', cost: 1.5e15, effect: { kind: 'station', station: 'crossfitBox', value: 3 } },
    { id: 'chalkCloud',      name: 'Chalk Cloud',           emoji: '☁️', cost: 3e16,   effect: { kind: 'station', station: 'olympicPlatform', value: 3 } },
  ],

  /* ───────── Protein upgrades: permanent forever. Protein comes from tasks, milestones,
     golden members and the season pass. ───────── */
  proteinUpgrades: [
    { id: 'peakPlanner',    name: 'Peak Planner',      emoji: '🗓️', cost: 15,  detail: 'Class bonuses x1.5',                    effect: { kind: 'class', value: 1.5 } },
    { id: 'diamondRegister',name: 'Diamond Register',  emoji: '💎', cost: 25,  detail: 'All income x1.5',                       effect: { kind: 'global', value: 1.5 } },
    { id: 'goldenBell',     name: 'Golden Bell',       emoji: '🛎️', cost: 35,  detail: 'Golden members visit twice as often',   effect: { kind: 'goldenRate', value: 2 } },
    { id: 'memberReferrals',name: 'Member Referrals',  emoji: '🤝', cost: 45,  detail: 'All income x1.25',                      effect: { kind: 'global', value: 1.25 } },
    { id: 'recoverySuite',  name: 'Recovery Suite',    emoji: '🛁', cost: 60,  detail: '+4h offline cap',                       effect: { kind: 'offlineCap', value: 4 } },
    { id: 'ironWill',       name: 'Iron Will',         emoji: '🔥', cost: 120, detail: 'All income x2',                         effect: { kind: 'global', value: 2 } },
    { id: 'restfulNights',  name: 'Restful Nights',    emoji: '🌙', cost: 150, detail: 'Offline earnings rate x1.5',            effect: { kind: 'offlineRate', value: 1.5 } },
    { id: 'trendScout',     name: 'Trend Scout',       emoji: '🔭', cost: 220, detail: 'Trend-matching map gyms x1.5',          effect: { kind: 'trend', value: 1.5 } },
  ],

  /* ───────── Map: 26 cities, 3 locations each ─────────
     gym cost  = mapBaseCost  × mapCostGrowth^(tier-1)   × location.costMult
     gym income= mapBaseIncome× mapIncomeGrowth^(tier-1) × location.incomeMult  (Reps/s, kept forever) */
  mapBaseCost: 2e6,
  mapCostGrowth: 15,
  mapBaseIncome: 2500,
  mapIncomeGrowth: 11,
  locations: [
    { id: 'suburb',   name: 'Suburb Strip', tag: 'Steady', emoji: '🏘️', costMult: 1,    incomeMult: 1 },
    { id: 'downtown', name: 'Downtown',     tag: 'Busy',   emoji: '🏙️', costMult: 1.45, incomeMult: 1.6 },
    { id: 'prime',    name: 'Prime Corner', tag: 'Prime',  emoji: '🌆', costMult: 2.1,  incomeMult: 2.5 },
  ],
  cities: [
    { id: 'boise', trend: 'cardio',        name: 'Boise',          region: 'Idaho',          tier: 1, lat: 43.615,  lng: -116.2023 },
    { id: 'albuquerque', trend: 'recovery',  name: 'Albuquerque',    region: 'New Mexico',     tier: 1, lat: 35.0844, lng: -106.6504 },
    { id: 'omaha', trend: 'strength',        name: 'Omaha',          region: 'Nebraska',       tier: 1, lat: 41.2565, lng: -95.9345 },
    { id: 'kansasCity', trend: 'strength',   name: 'Kansas City',    region: 'Missouri',       tier: 1, lat: 39.0997, lng: -94.5786 },
    { id: 'saltLake', trend: 'cardio',     name: 'Salt Lake City', region: 'Utah',           tier: 1, lat: 40.7608, lng: -111.891 },
    { id: 'nashville', trend: 'functional',    name: 'Nashville',      region: 'Tennessee',      tier: 2, lat: 36.1627, lng: -86.7816 },
    { id: 'portland', trend: 'recovery',     name: 'Portland',       region: 'Oregon',         tier: 2, lat: 45.5152, lng: -122.6784 },
    { id: 'minneapolis', trend: 'functional',  name: 'Minneapolis',    region: 'Minnesota',      tier: 2, lat: 44.9778, lng: -93.265 },
    { id: 'orlando', trend: 'cardio',      name: 'Orlando',        region: 'Florida',        tier: 2, lat: 28.5383, lng: -81.3792 },
    { id: 'phoenix', trend: 'recovery',      name: 'Phoenix',        region: 'Arizona',        tier: 2, lat: 33.4484, lng: -112.074 },
    { id: 'denver', trend: 'cardio',       name: 'Denver',         region: 'Colorado',       tier: 3, lat: 39.7392, lng: -104.9903 },
    { id: 'atlanta', trend: 'strength',      name: 'Atlanta',        region: 'Georgia',        tier: 3, lat: 33.749,  lng: -84.388 },
    { id: 'austin', trend: 'functional',       name: 'Austin',         region: 'Texas',          tier: 3, lat: 30.2672, lng: -97.7431 },
    { id: 'montreal', trend: 'recovery',     name: 'Montréal',       region: 'Québec',         tier: 3, lat: 45.5019, lng: -73.5674 },
    { id: 'vancouver', trend: 'recovery',    name: 'Vancouver',      region: 'British Columbia', tier: 3, lat: 49.2827, lng: -123.1207 },
    { id: 'dallas', trend: 'strength',       name: 'Dallas',         region: 'Texas',          tier: 4, lat: 32.7767, lng: -96.797 },
    { id: 'philadelphia', trend: 'cardio', name: 'Philadelphia',   region: 'Pennsylvania',   tier: 4, lat: 39.9526, lng: -75.1652 },
    { id: 'miami', trend: 'functional',        name: 'Miami',          region: 'Florida',        tier: 4, lat: 25.7617, lng: -80.1918 },
    { id: 'seattle', trend: 'cardio',      name: 'Seattle',        region: 'Washington',     tier: 4, lat: 47.6062, lng: -122.3321 },
    { id: 'boston', trend: 'strength',       name: 'Boston',         region: 'Massachusetts',  tier: 4, lat: 42.3601, lng: -71.0589 },
    { id: 'chicago', trend: 'functional',      name: 'Chicago',        region: 'Illinois',       tier: 5, lat: 41.8781, lng: -87.6298 },
    { id: 'toronto', trend: 'cardio',      name: 'Toronto',        region: 'Ontario',        tier: 5, lat: 43.6532, lng: -79.3832 },
    { id: 'sanFrancisco', trend: 'recovery', name: 'San Francisco',  region: 'California',     tier: 5, lat: 37.7749, lng: -122.4194 },
    { id: 'mexicoCity', trend: 'cardio',   name: 'Mexico City',    region: 'CDMX',           tier: 5, lat: 19.4326, lng: -99.1332 },
    { id: 'losAngeles', trend: 'recovery',   name: 'Los Angeles',    region: 'California',     tier: 6, lat: 34.0522, lng: -118.2437 },
    { id: 'newYork', trend: 'strength',      name: 'New York',       region: 'New York',       tier: 6, lat: 40.7128, lng: -74.006 },
  ],

  /* ───────── Franchise (prestige) ─────────
     Golden Plates = floor( sqrt(repsThisFranchise / prestigeDivisor) × (1 + chainBonusPerGym × gyms) ) */
  prestigeDivisor: 1e12,
  chainBonusPerGym: 0.1,

  // Golden Plate upgrades: permanent, survive franchising
  goldenUpgrades: [
    { id: 'signaturePump',     name: 'Signature Pump',     detail: '+10% global income per level', emoji: '💥', maxLevel: 50, baseCost: 1, costGrowth: 1.35 },
    { id: 'nightShift',        name: 'Night Shift',        detail: '+15% offline earnings rate',  emoji: '🌙', maxLevel: 20, baseCost: 1, costGrowth: 1.5 },
    { id: 'lockerRoom',        name: 'Locker Room',        detail: '+2h offline cap',             emoji: '🔐', maxLevel: 16, baseCost: 2, costGrowth: 1.5 },
    { id: 'primeTime',         name: 'Prime Time',         detail: '+20% class bonus per level',  emoji: '⏰', maxLevel: 20, baseCost: 1, costGrowth: 1.45 },
    { id: 'starterMembership', name: 'Starter Membership', detail: 'Start each franchise x10 richer', emoji: '🎟️', maxLevel: 12, baseCost: 3, costGrowth: 1.7 },
    { id: 'luckyPlates',       name: 'Lucky Plates',       detail: 'Golden members pay +50%',     emoji: '🍀', maxLevel: 6,  baseCost: 5, costGrowth: 2 },
  ],
  signaturePumpPerLevel: 0.10,
  nightShiftPerLevel: 0.15,
  lockerRoomHoursPerLevel: 2,
  primeTimePerLevel: 0.2,
  starterMembershipRepsMultiplier: 10,
  luckyPlatesPerLevel: 0.5,

  // Season (free track only)
  season: {
    name: 'Summer Shred Season',
    emoji: '☀️',
    lengthDays: 20,
    tiers: 30,
    pointsPerTier: 4,
    station: { id: 'resolutionRack', name: 'Resolution Rack', emoji: '🎯', tint: '#FCE1CC', baseCost: 1000, baseIncome: 6, seasonal: true },
  },
  seasonReward(tier) {
    if (tier % 10 === 0) return { kind: 'goldenPlates', amount: tier / 10 };
    if (tier % 5 === 0) return { kind: 'protein', amount: 15 };
    return tier % 2 === 0 ? { kind: 'protein', amount: 4 } : { kind: 'repsMinutes', amount: 10 };
  },

  /* ───────── Tasks: daily (4 picked per day) and weekly (all) ─────────
     metric: which lifetime stat to count. target: number, or 'income' = minutes of income at roll time. */
  dailyTaskCount: 4,
  dailyTasks: [
    { id: 'class',    metric: 'classes',  target: 2,   reward: 5,  label: (n) => `Schedule ${n} classes`, emoji: '🗓️' },
    { id: 'levels',   metric: 'levels',   target: 25,  reward: 5,  label: (n) => `Buy ${n} station levels`, emoji: '🏋️' },
    { id: 'golden',   metric: 'golden',   target: 2,   reward: 6,  label: (n) => `Welcome ${n} golden members`, emoji: '🤩' },
    { id: 'earn',     metric: 'reps',     target: 'income', minutes: 30, reward: 5, label: (n) => `Earn ${Fmt.short(n)} Reps`, emoji: '🪙' },
    { id: 'upgrade',  metric: 'upgrades', target: 1,   reward: 5,  label: () => 'Buy 1 upgrade', emoji: '⚡️' },
    { id: 'trainer',  metric: 'trainers', target: 1,   reward: 6,  label: () => 'Hire 1 trainer', emoji: '🧑‍🏫' },
    { id: 'season',   metric: 'seasonPts', target: 3,  reward: 5,  label: (n) => `Earn ${n} season points`, emoji: '🎯' },
    { id: 'gym',      metric: 'gyms',     target: 1,   reward: 10, label: () => 'Open a new gym', emoji: '🗺️' },
  ],
  weeklyTasks: [
    { id: 'wLevels',   metric: 'levels',   target: 300,  reward: 25, label: (n) => `Buy ${n} station levels`, emoji: '🏋️' },
    { id: 'wGolden',   metric: 'golden',   target: 15,   reward: 30, label: (n) => `Welcome ${n} golden members`, emoji: '🤩' },
    { id: 'wTrainers', metric: 'trainers', target: 5,    reward: 25, label: (n) => `Hire ${n} trainers`, emoji: '🧑‍🏫' },
    { id: 'wGyms',     metric: 'gyms',     target: 3,    reward: 40, label: (n) => `Open ${n} gyms on the map`, emoji: '🗺️' },
    { id: 'wFranchise',metric: 'franchises', target: 1,  reward: 50, label: () => 'Open a franchise', emoji: '⭐️' },
  ],
};

/* Milestones: 25, 50, 100, then every 100 (200, 300, …). Each multiplies that station's income. */
function milestoneCount(level) {
  let n = 0;
  if (level >= 25) n++;
  if (level >= 50) n++;
  if (level >= 100) n += Math.floor(level / 100);
  return n;
}
function nextMilestone(level) {
  if (level < 25) return 25;
  if (level < 50) return 50;
  return (Math.floor(level / 100) + 1) * 100;
}
function previousMilestone(level) {
  if (level < 25) return 0;
  if (level < 50) return 25;
  if (level < 100) return 50;
  return Math.floor(level / 100) * 100;
}
