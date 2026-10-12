# Iron Empire

A calm, premium gym idle tycoon that runs in any browser. Buy equipment and watch it appear in your gym while little members walk in and use it. Schedule classes into your real day, open on-trend gyms across North America, and franchise for Golden Plates. The look is "Oat & Sage Studio" in light mode and "Midnight Iron" in dark mode.

No ads, no purchases, no accounts. It's plain HTML, CSS and JavaScript with no build step.

## Play

- **Online:** https://eseto9.github.io/Iron-Temple-Tycoon/
- **iPhone:** open the link in Safari, then tap **Share → Add to Home Screen**. It launches full screen like an app.
- **Windows:** open the link, or double-click `index.html` in a downloaded copy. The map needs an internet connection; without one it falls back to a city list.

Progress saves to the browser's local storage every 5 seconds and whenever the page is hidden. Each browser and device keeps its own save.

## How the game works

| Tab | What you do |
| --- | --- |
| **Gym** | Watch your living gym. Level 12 stations (income doubles at Lv 25, 50, 100, 200…) and tap golden members when they walk in. |
| **Map** | Open up to 3 gyms in each of 26 cities and pick each gym's focus. |
| **Classes** | Schedule one class per real-time slot of your day. |
| **Upgrades** | Coin upgrades (Reps, reset on franchise) and Protein upgrades (permanent). |
| **Staff** | Hire one trainer per station to double its income until your next franchise. |
| **Prestige** | Open a Franchise for Golden Plates and spend them on 6 permanent upgrades. |

**The systems that make it different**

- **Living gym:** a drawn room with windows that follow the real time of day, a mirror wall and a clock.
  - Every station you buy appears as real equipment, and each milestone adds another unit, for example a second treadmill or a fourth spin bike.
  - Members walk the aisles (grid pathfinding around equipment) and use what you own: they run, squat, bench, cycle, box, do yoga, and sit in the sauna or plunge.
  - A live class pulls a crowd, and a golden member with a crown walks in now and then. Tap them for a bonus.
  - Tap any equipment to jump to its station.
- **Focus and city trends:** each station belongs to one of four focuses: Strength, Cardio, Functional or Recovery.
  - Every city has a trend, for example "Austin loves Functional".
  - A map gym that matches its city's trend earns x2.
  - Every map gym also lifts your home stations of the same focus by +5%.
- **Real-time classes:** the day is split into 7 slots based on your device's clock.
  - A class triples its station's income while its slot is live, or x5 at the 5–8 AM and 5–8 PM peaks.
  - Each class can run once a day.
  - Classes don't run while you're away.

**Currencies**
- **Reps:** the main currency.
- **Protein:** earned from tasks, milestones, golden members and the season pass.
- **Golden Plates:** earned from franchising and every 10th season tier.

## Structure

```
index.html            app shell, script order
css/app.css           design tokens (light + dark), every component style
js/config.js          GameConfig: economy, stations, focuses, classes, upgrades, cities, tasks
js/format.js          1.20K / 3.45M / 8.10B / 11.7T / aa, ab… formatting
js/fx.js              haptics, synthesized sounds, confetti
js/state.js           save data, economy math, classes, loop, offline earnings, tasks
js/ui/components.js   icons, pills, cards, bottom sheets, toasts
js/ui/floor.js        living gym (canvas room, equipment art, members, pathfinding)
js/ui/gym.js          Gym tab (living gym, season, stations)
js/ui/map.js          Map tab (Leaflet + Esri gray canvas tiles, trends, focus picker)
js/ui/screens.js      Upgrades, Staff, Prestige tabs
js/ui/classes.js      Classes tab and class picker
js/ui/sheets.js       Welcome Back, Season Pass, Tasks, Settings, Franchise, Records, Debug, onboarding
js/app.js             tab routing, click delegation, lifecycle
```

## Tuning

Everything lives in `js/config.js`:

- **Stations:** `stations` sets cost, income, focus, trainer and trainer cost.
- **Focus and trends:** `focuses`, `focusBonusPerGym`, `trendMultiplier`, and each city's `trend`.
- **Classes:** `classMultiplier`, `peakClassMultiplier`, `timeSlots`, `slotUnlockCosts`, and `classes` (the class names).
- **Living gym:** `floor` in `config.js` sets member counts. Equipment placement, art and how many units each station can show are the `KITS` table in `js/ui/floor.js`.
- **Map scale:** `mapBaseCost`, `mapCostGrowth`, `mapBaseIncome` and `mapIncomeGrowth`.
- **Prestige:** `prestigeDivisor` and `chainBonusPerGym`.
- **Everything else:** upgrades, `season`, `dailyTasks` and `weeklyTasks`, offline rate and cap, and starting values.

## Debug menu

In Settings, tap the version line five times, or add `#debug` to the URL. The menu can add currency, skip time, simulate a 3-hour absence, spawn a golden member, add season points and complete tasks.

## Notes

- iPhone Safari has no web vibration API, so haptics only fire on Android and other supporting browsers. Sound is off by default; turn it on in Settings.
- When you ship an update, bump the `?v=` number on the script and stylesheet tags in `index.html` so phones fetch the new files.
- The previous game in this repository, Iron Temple Tycoon, is still in the git history (commit `e7f2259`).
