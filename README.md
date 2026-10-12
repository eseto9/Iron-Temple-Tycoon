# Iron Empire

A calm, premium gym idle tycoon that runs in any browser. Open equipment stations and watch members fill your gym floor. Schedule classes in your real day and log your own workouts for a streak bonus. Then open on-trend gyms across North America and franchise for Golden Plates. The look is "Oat & Sage Studio" in light mode and "Midnight Iron" in dark mode.

No ads, no purchases, no accounts. It's plain HTML, CSS and JavaScript with no build step.

## Play

- **Online:** https://eseto9.github.io/Iron-Temple-Tycoon/
- **iPhone:** open the link in Safari, then tap **Share → Add to Home Screen**. It launches full screen like an app.
- **Windows:** open the link, or double-click `index.html` in a downloaded copy. The map needs an internet connection; without one it falls back to a city list.

Progress saves to the browser's local storage every 5 seconds and whenever the page is hidden. Each browser and device keeps its own save.

## How the game works

| Tab | What you do |
| --- | --- |
| **Gym** | Watch the living gym floor and log today's real-life workout. Level 12 stations (income doubles at Lv 25, 50, 100, 200…) and welcome golden members. |
| **Map** | Open up to 3 gyms in each of 26 cities and pick each gym's focus. |
| **Classes** | Schedule one class per real-time slot of your day. |
| **Upgrades** | Coin upgrades (Reps, reset on franchise) and Protein upgrades (permanent). |
| **Staff** | Hire one trainer per station to double its income until your next franchise. |
| **Prestige** | Open a Franchise for Golden Plates and spend them on 6 permanent upgrades. |

**The systems that make it different**

- **Living gym floor:** every station you open appears as a tile, and members walk between them. Busier gyms draw more members, and a running class draws a crowd. Tap a tile to jump to that station.
- **Focus and city trends:** each station belongs to one of four focuses: Strength, Cardio, Functional or Recovery.
  - Every city has a trend, for example "Austin loves Functional".
  - A map gym that matches its city's trend earns x2.
  - Every map gym also lifts your home stations of the same focus by +5%.
- **Real-time classes:** the day is split into 7 slots based on your device's clock.
  - A class triples its station's income while its slot is live, or x5 at the 5–8 AM and 5–8 PM peaks.
  - Each class can run once a day.
  - Classes don't run while you're away.
- **Real-life workouts:** once a day, honestly log a Strength, Cardio, Functional or Recovery workout.
  - You get Protein, and that focus's stations earn x2 until midnight.
  - Your streak adds +5% income per day, up to +50%.
  - The streak survives one rest day between workouts.

**Currencies**
- **Reps:** the main currency.
- **Protein:** earned from workouts, tasks, milestones, golden members and the season pass.
- **Golden Plates:** earned from franchising and every 10th season tier.

## Structure

```
index.html            app shell, script order
css/app.css           design tokens (light + dark), every component style
js/config.js          GameConfig: economy, stations, focuses, classes, workouts, upgrades, cities, tasks
js/format.js          1.20K / 3.45M / 8.10B / 11.7T / aa, ab… formatting
js/fx.js              haptics, synthesized sounds, confetti
js/state.js           save data, economy math, classes, workouts, loop, offline earnings, tasks
js/ui/components.js   icons, pills, cards, bottom sheets, toasts
js/ui/floor.js        living gym floor
js/ui/gym.js          Gym tab (floor, workout check-in, season, stations)
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
- **Workouts:** `workout` sets the focus multiplier, streak bonus and cap, Protein reward and rest-day grace.
- **Floor:** `floor` sets the minimum, maximum and class-crowd member counts.
- **Map scale:** `mapBaseCost`, `mapCostGrowth`, `mapBaseIncome` and `mapIncomeGrowth`.
- **Prestige:** `prestigeDivisor` and `chainBonusPerGym`.
- **Everything else:** upgrades, `season`, `dailyTasks` and `weeklyTasks`, offline rate and cap, and starting values.

## Debug menu

In Settings, tap the version line five times, or add `#debug` to the URL. The menu can add currency, skip time, simulate a 3-hour absence, spawn a golden member, add season points, complete tasks and start a new workout day.

## Notes

- iPhone Safari has no web vibration API, so haptics only fire on Android and other supporting browsers. Sound is off by default; turn it on in Settings.
- When you ship an update, bump the `?v=` number on the script and stylesheet tags in `index.html` so phones fetch the new files.
- The previous game in this repository, Iron Temple Tycoon, is still in the git history (commit `e7f2259`).
