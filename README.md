# Iron Empire

A calm, premium gym idle tycoon that runs in any browser. Tap to lift, buy equipment stations that earn while you rest, hire trainers, open gyms across North America, then franchise for Golden Plates and permanent bonuses. The look is "Oat & Sage Studio" in light mode and "Midnight Iron" in dark mode.

No ads, no purchases, no accounts. It's plain HTML, CSS and JavaScript with no build step.

## Play

- **Online:** https://eseto9.github.io/Iron-Temple-Tycoon/
- **iPhone:** open the link in Safari, then tap **Share → Add to Home Screen**. It launches full screen like an app.
- **Windows:** open the link, or double-click `index.html` in a downloaded copy. The map needs an internet connection; without one it falls back to a city list.

Progress saves to the browser's local storage every 5 seconds and whenever the page is hidden. Each browser and device keeps its own save.

## How the game works

| Tab | What you do |
| --- | --- |
| **Gym** | Tap the barbell, buy and level 12 stations (income doubles at Lv 25, 50, 100, 200…), welcome golden members, level the seasonal Resolution Rack |
| **Map** | Open up to 3 gyms in each of 26 cities. Map gyms earn forever and survive franchising |
| **Upgrades** | Coin upgrades (Reps, reset on franchise) and Protein upgrades (permanent) |
| **Staff** | Hire one trainer per station to double its income until your next franchise |
| **Prestige** | Open a Franchise for Golden Plates; spend them on 6 permanent upgrades |

**Currencies**
- **Reps:** the main currency.
- **Protein:** earned from tasks, station milestones, golden members and the season pass.
- **Golden Plates:** earned from franchising and every 10th season tier.

The clipboard button on the Gym tab opens daily and weekly **Tasks**.

## Structure

```
index.html            app shell, shared SVG gradients, script order
manifest.webmanifest  home-screen install
css/app.css           design tokens (light + dark), every component style
js/config.js          GameConfig: all economy numbers, stations, upgrades, cities, tasks
js/format.js          1.20K / 3.45M / 8.10B / 11.7T / aa, ab… formatting
js/fx.js              haptics, synthesized sounds, confetti
js/state.js           save data, economy math, actions, 10 Hz loop, offline earnings, tasks
js/ui/components.js   icons, pills, cards, bottom sheets, toasts
js/ui/gym.js          Gym tab
js/ui/map.js          Map tab (Leaflet + Esri gray canvas tiles)
js/ui/screens.js      Upgrades, Staff, Prestige tabs
js/ui/sheets.js       Welcome Back, Season Pass, Tasks, Settings, Franchise, Records, Debug, onboarding
js/app.js             tab routing, click delegation, lifecycle
icons/                app icons
```

## Tuning the economy

Every number lives in `js/config.js`:

- **`stations`:** cost, income per level, trainer name and trainer cost. The order of the list is the unlock order.
- **`coinUpgrades` / `proteinUpgrades`:** each has an `effect`: `station`, `global`, `tap`, `milestone`, `golden`, `goldenRate`, `autoTap`, `offlineCap` or `offlineRate`.
- **Map:**
  - `cities` sets each city's tier.
  - `locations` sets cost and income multipliers per location.
  - `mapBaseCost`, `mapCostGrowth`, `mapBaseIncome` and `mapIncomeGrowth` set the overall scale.
- **Prestige:** `prestigeDivisor` and `chainBonusPerGym`. Plates = √(Reps this franchise ÷ divisor) × (1 + 0.1 × gyms).
- **Other knobs:** `goldenUpgrades`, `season`, `dailyTasks` and `weeklyTasks`, plus the offline rate and cap, and starting values.

## Renaming and reskinning

- **Colors:** edit the variables at the top of `css/app.css`. Each one has a light and a dark value; both dark blocks must match.
- **Names and emoji:** stations, upgrades, cities and the season all live in `js/config.js`.
- **Font:** `--font` in `css/app.css`. It uses SF Pro Rounded on Apple devices and falls back to Nunito elsewhere.

## Debug menu

In Settings, tap the version line five times, or add `#debug` to the URL. The menu can add currency, skip time, simulate a 3-hour absence, spawn a golden member, add season points and complete tasks.

## Notes

- iPhone Safari has no web vibration API, so haptics only fire on Android and other browsers that support it. Sound is off by default; turn it on in Settings.
- When you ship an update, bump the `?v=` number on the script and stylesheet tags in `index.html` so phones fetch the new files.
- The previous game in this repository, Iron Temple Tycoon, is still in the git history (commit `e7f2259`).
