/* GameConfig: every tunable number in the game lives here.
   Change values, reload, play. See README → "Tuning the economy". */
const CFG = {
  version: '1.3',

  // Starting state
  startingReps: 25,
  startingProtein: 0,
  startingGoldenPlates: 0,
  startingStationLevels: { freeWeights: 1 },

  // Loop & saving
  tickMs: 100,
  autosaveMs: 5000,
  saveKey: 'ironEmpire.save.v1',

  /* Stations: cost(level) = baseCost × growth^level × homeGymCostMultiplier.
     Early stations grow slowly (1.07) so they stay worth buying all game; later ones grow faster.
     cap = most units the station shows on your gym floor (one more per milestone). */
  milestoneMultiplier: 2,
  milestoneProtein: 1, // Protein paid for every milestone reached
  /** Gym Size bonus: all station income × mult for every `every` total station levels. */
  sizeBonus: { every: 25, mult: 1.1 },

  // Unlock order matters: each station unlocks once the previous one is open (Lv ≥ 1).
  stations: [
    { id: 'freeWeights',     focus: 'strength',   name: 'Free Weights',        tint: '#FDE7C8', baseCost: 4,      baseIncome: 1,     growth: 1.07, cap: 4, trainer: 'Head Coach',          trainerCost: 800 },
    { id: 'treadmillRow',    focus: 'cardio',     name: 'Treadmill Row',       tint: '#D9EEDD', baseCost: 60,     baseIncome: 12,    growth: 1.15, cap: 6, trainer: 'Cardio Captain',      trainerCost: 1.2e4 },
    { id: 'squatRack',       focus: 'strength',   name: 'Squat Rack',          tint: '#F9DCD6', baseCost: 720,    baseIncome: 75,    growth: 1.14, cap: 4, trainer: 'Strength Coach',      trainerCost: 1.44e5 },
    { id: 'benchPress',      focus: 'strength',   name: 'Bench Press Zone',    tint: '#E4DDF8', baseCost: 8.6e3,  baseIncome: 330,   growth: 1.13, cap: 4, trainer: 'Powerlifting Mentor', trainerCost: 1.7e6 },
    { id: 'cableMachines',   focus: 'functional', name: 'Cable Machines',      tint: '#D8EEF3', baseCost: 1.04e5, baseIncome: 1.6e3, growth: 1.12, cap: 4, trainer: 'Form Specialist',     trainerCost: 2.1e7 },
    { id: 'smoothieBar',     focus: 'recovery',   name: 'Smoothie Bar',        tint: '#FBE0EC', baseCost: 1.24e6, baseIncome: 5.5e3, growth: 1.11, cap: 1, trainer: 'Nutritionist',        trainerCost: 2.5e8 },
    { id: 'spinStudio',      focus: 'cardio',     name: 'Spin Studio',         tint: '#FFF0C2', baseCost: 1.49e7, baseIncome: 1.8e4, growth: 1.10, cap: 8, trainer: 'Spin Instructor',     trainerCost: 3e9 },
    { id: 'boxingRing',      focus: 'cardio',     name: 'Boxing Ring',         tint: '#F7D9CF', baseCost: 1.79e8, baseIncome: 5.4e4, growth: 1.09, cap: 1, trainer: 'Boxing Coach',        trainerCost: 3.6e10 },
    { id: 'yogaLoft',        focus: 'recovery',   name: 'Yoga Loft',           tint: '#E2F0E4', baseCost: 2.15e9, baseIncome: 1.6e5, growth: 1.08, cap: 6, trainer: 'Yoga Teacher',        trainerCost: 4.3e11 },
    { id: 'saunaPlunge',     focus: 'recovery',   name: 'Sauna & Cold Plunge', tint: '#DCE8F8', baseCost: 2.58e10, baseIncome: 5e5,  growth: 1.07, cap: 1, trainer: 'Recovery Therapist',  trainerCost: 5.2e12 },
    { id: 'crossfitBox',     focus: 'functional', name: 'CrossFit Box',        tint: '#F5E3D3', baseCost: 3.1e11, baseIncome: 1.5e6, growth: 1.07, cap: 2, trainer: 'WOD Coach',           trainerCost: 6.2e13 },
    { id: 'olympicPlatform', focus: 'strength',   name: 'Olympic Platform',    tint: '#FBEFC9', baseCost: 3.7e12, baseIncome: 4.5e6, growth: 1.07, cap: 4, trainer: 'Olympic Coach',       trainerCost: 7.4e14 },
  ],

  /* ───────── Focus: every station and map gym has one ─────────
     Each map gym adds focusBonusPerGym to your home stations of the same focus. */
  focuses: [
    { id: 'strength',   name: 'Strength',   icon: 'strength',   tint: '#FDE7C8', signature: 'squatRack' },
    { id: 'cardio',     name: 'Cardio',     icon: 'cardio',     tint: '#D9EEDD', signature: 'treadmillRow' },
    { id: 'functional', name: 'Functional', icon: 'functional', tint: '#D8EEF3', signature: 'cableMachines' },
    { id: 'recovery',   name: 'Recovery',   icon: 'recovery',   tint: '#E4DDF8', signature: 'yogaLoft' },
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
  floor: { minMembers: 2, maxMembers: 18, classCrowd: 3 },

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
    { id: 'classPassCards',  name: 'Class Pass Cards',      icon: 'ticket',   cost: 5e3,    effect: { kind: 'class', value: 1.5 } },
    { id: 'chalkBucket',     name: 'Chalk Bucket',          icon: 'station',  cost: 1e4,    effect: { kind: 'station', station: 'freeWeights', value: 3 } },
    { id: 'treadmillTVs',    name: 'Treadmill TVs',         icon: 'station',  cost: 1.5e5,  effect: { kind: 'station', station: 'treadmillRow', value: 3 } },
    { id: 'premiumPlates',   name: 'Premium Plates',        icon: 'station',  cost: 1.8e6,  effect: { kind: 'station', station: 'squatRack', value: 3 } },
    { id: 'classSchedule',   name: 'Bigger Class Schedule', icon: 'calendar', cost: 5e6,    effect: { kind: 'global', value: 1.5 } },
    { id: 'benchSpotters',   name: 'Bench Spotters',        icon: 'station',  cost: 2.2e7,  effect: { kind: 'station', station: 'benchPress', value: 3 } },
    { id: 'vipLounge',       name: 'VIP Golden Lounge',     icon: 'sofa',     cost: 5e7,    effect: { kind: 'golden', value: 3 } },
    { id: 'coachCert',       name: 'Coach Certification',   icon: 'station',  cost: 2.6e8,  effect: { kind: 'station', station: 'cableMachines', value: 3 } },
    { id: 'grassFedWhey',    name: 'Grass-Fed Whey',        icon: 'station',  cost: 3.1e9,  effect: { kind: 'station', station: 'smoothieBar', value: 3 } },
    { id: 'loyaltyProgram',  name: 'Loyalty Program',       icon: 'card',     cost: 5e9,    effect: { kind: 'milestone', value: 1.5 } },
    { id: 'spinPlaylists',   name: 'Spin Playlists',        icon: 'station',  cost: 3.7e10, effect: { kind: 'station', station: 'spinStudio', value: 3 } },
    { id: 'challengeMonth',  name: 'Challenge Month',       icon: 'trophy',   cost: 1.5e11, effect: { kind: 'global', value: 2 } },
    { id: 'proGloves',       name: 'Pro Gloves',            icon: 'station',  cost: 4.5e11, effect: { kind: 'station', station: 'boxingRing', value: 3 } },
    { id: 'soundBath',       name: 'Sound Bath Sessions',   icon: 'station',  cost: 5.4e12, effect: { kind: 'station', station: 'yogaLoft', value: 3 } },
    { id: 'eucalyptusSteam', name: 'Eucalyptus Steam',      icon: 'station',  cost: 6.5e13, effect: { kind: 'station', station: 'saunaPlunge', value: 3 } },
    { id: 'communityWall',   name: 'Community PR Wall',     icon: 'wall',     cost: 4e14,   effect: { kind: 'global', value: 2 } },
    { id: 'competitionFloor',name: 'Competition Floor',     icon: 'station',  cost: 7.8e14, effect: { kind: 'station', station: 'crossfitBox', value: 3 } },
    { id: 'chalkCloud',      name: 'Chalk Cloud',           icon: 'station',  cost: 9.3e15, effect: { kind: 'station', station: 'olympicPlatform', value: 3 } },
  ],

  /* ───────── Protein upgrades: permanent forever. Protein comes from tasks, milestones,
     golden members and the season pass. ───────── */
  proteinUpgrades: [
    { id: 'peakPlanner',    name: 'Peak Planner',      icon: 'planner', cost: 15,  detail: 'Class bonuses x1.5',                    effect: { kind: 'class', value: 1.5 } },
    { id: 'diamondRegister',name: 'Diamond Register',  icon: 'register', cost: 25,  detail: 'All income x1.5',                       effect: { kind: 'global', value: 1.5 } },
    { id: 'goldenBell',     name: 'Golden Bell',       icon: 'bell', cost: 35,  detail: 'Golden members visit twice as often',   effect: { kind: 'goldenRate', value: 2 } },
    { id: 'memberReferrals',name: 'Member Referrals',  icon: 'handshake', cost: 45,  detail: 'All income x1.25',                      effect: { kind: 'global', value: 1.25 } },
    { id: 'recoverySuite',  name: 'Recovery Suite',    icon: 'bath', cost: 60,  detail: '+4h offline cap',                       effect: { kind: 'offlineCap', value: 4 } },
    { id: 'ironWill',       name: 'Iron Will',         icon: 'flame', cost: 120, detail: 'All income x2',                         effect: { kind: 'global', value: 2 } },
    { id: 'restfulNights',  name: 'Restful Nights',    icon: 'moon', cost: 150, detail: 'Offline earnings rate x1.5',            effect: { kind: 'offlineRate', value: 1.5 } },
    { id: 'trendScout',     name: 'Trend Scout',       icon: 'scope', cost: 220, detail: 'Trend-matching map gyms x1.5',          effect: { kind: 'trend', value: 1.5 } },
  ],

  /* ───────── Map: 26 cities, 3 locations each ─────────
     gym cost  = mapBaseCost  × mapCostGrowth^(tier-1)   × location.costMult
     gym income= mapBaseIncome× mapIncomeGrowth^(tier-1) × location.incomeMult  (Reps/s, kept forever) */
  mapBaseCost: 2e6,
  mapCostGrowth: 15,
  mapBaseIncome: 6000,
  mapIncomeGrowth: 11,
  locations: [
    { id: 'suburb',   name: 'Suburb Strip', tag: 'Steady', icon: 'suburb', costMult: 1,    incomeMult: 1 },
    { id: 'downtown', name: 'Downtown',     tag: 'Busy',   icon: 'downtown', costMult: 1.45, incomeMult: 1.6 },
    { id: 'prime',    name: 'Prime Corner', tag: 'Prime',  icon: 'prime', costMult: 2.1,  incomeMult: 2.5 },
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

  /* ───────── Map gym equipment ─────────
     Every map gym has its own floor. Buy equipment for it: each unit adds unitIncome × size of the
     gym's base income (x focusBonus when it matches the gym's focus). Cost = gym price × costFactor
     × size × costGrowth^(equipment already in that gym). */
  gear: {
    costFactor: 0.25, costGrowth: 1.45, unitIncome: 0.35, focusBonus: 2,
    maxPerType: 6, capacity: 20, starterUnits: 2,
    // Big pieces count for more (cost, income and room space) and max out sooner.
    size: { smoothieBar: 2.5, boxingRing: 3, saunaPlunge: 3, crossfitBox: 2.5 },
    maxBig: 2,
  },

  /* ───────── Franchise (prestige) ─────────
     Golden Plates = floor( sqrt(repsThisFranchise / prestigeDivisor) × (1 + chainBonusPerGym × gyms) ) */
  prestigeDivisor: 1e12,
  chainBonusPerGym: 0.1,

  // Golden Plate upgrades: permanent, survive franchising
  goldenUpgrades: [
    { id: 'signaturePump',     name: 'Signature Pump',     detail: '+10% global income per level', icon: 'bolt', maxLevel: 50, baseCost: 1, costGrowth: 1.35 },
    { id: 'nightShift',        name: 'Night Shift',        detail: '+15% offline earnings rate',  icon: 'moon', maxLevel: 20, baseCost: 1, costGrowth: 1.5 },
    { id: 'lockerRoom',        name: 'Locker Room',        detail: '+2h offline cap',             icon: 'locker', maxLevel: 16, baseCost: 2, costGrowth: 1.5 },
    { id: 'primeTime',         name: 'Prime Time',         detail: '+20% class bonus per level',  icon: 'clock', maxLevel: 20, baseCost: 1, costGrowth: 1.45 },
    { id: 'starterMembership', name: 'Starter Membership', detail: 'Start each franchise x10 richer', icon: 'ticket', maxLevel: 12, baseCost: 3, costGrowth: 1.7 },
    { id: 'luckyPlates',       name: 'Lucky Plates',       detail: 'Golden members pay +50%',     icon: 'clover', maxLevel: 6,  baseCost: 5, costGrowth: 2 },
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
    lengthDays: 20,
    tiers: 30,
    pointsPerTier: 4,
    station: { id: 'resolutionRack', name: 'Resolution Rack', tint: '#FCE1CC', baseCost: 500, baseIncome: 20, growth: 1.12, cap: 1, seasonal: true },
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
    { id: 'class',    metric: 'classes',  target: 2,   reward: 5,  label: (n) => `Schedule ${n} classes`, icon: 'calendar' },
    { id: 'levels',   metric: 'levels',   target: 25,  reward: 5,  label: (n) => `Buy ${n} station levels`, icon: 'strength' },
    { id: 'golden',   metric: 'golden',   target: 2,   reward: 6,  label: (n) => `Welcome ${n} golden members`, icon: 'golden' },
    { id: 'earn',     metric: 'reps',     target: 'income', minutes: 30, reward: 5, label: (n) => `Earn ${Fmt.short(n)} Reps`, icon: 'coin' },
    { id: 'upgrade',  metric: 'upgrades', target: 1,   reward: 5,  label: () => 'Buy 1 upgrade', icon: 'arrowUp' },
    { id: 'trainer',  metric: 'trainers', target: 1,   reward: 6,  label: () => 'Hire 1 trainer', icon: 'whistle' },
    { id: 'season',   metric: 'seasonPts', target: 3,  reward: 5,  label: (n) => `Earn ${n} season points`, icon: 'target' },
    { id: 'gym',      metric: 'gyms',     target: 1,   reward: 10, label: () => 'Open a new gym', icon: 'pin' },
  ],
  weeklyTasks: [
    { id: 'wLevels',   metric: 'levels',   target: 300,  reward: 25, label: (n) => `Buy ${n} station levels`, icon: 'strength' },
    { id: 'wGolden',   metric: 'golden',   target: 15,   reward: 30, label: (n) => `Welcome ${n} golden members`, icon: 'golden' },
    { id: 'wTrainers', metric: 'trainers', target: 5,    reward: 25, label: (n) => `Hire ${n} trainers`, icon: 'whistle' },
    { id: 'wGyms',     metric: 'gyms',     target: 3,    reward: 40, label: (n) => `Open ${n} gyms on the map`, icon: 'pin' },
    { id: 'wFranchise',metric: 'franchises', target: 1,  reward: 50, label: () => 'Open a franchise', icon: 'star' },
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
