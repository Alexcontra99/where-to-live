# @wtl/mobile — Where to Live (iOS)

Expo SDK 57 / React Native app for Luxembourg. Same computation, data and wording as the web prototype
(`prototipo/`): the engine is `@wtl/core` (a tested port of `prototipo/app.js`) and the data is `@wtl/data-lux`.

- Map: MapLibre with the geoportail.lu gray topographic WMTS base map (ACT, CC0), same URL and attribution as
  the prototype. The result grid is one GeoJSON fill layer built once; a new evaluation only swaps the colour
  expression (`src/lib/mapFill.ts`).
- Filters in a bottom sheet: commute (1–2 people, address search or tap on the map, public transport / walk /
  bike, max minutes, arrive around), rent, noise, near or far from (11 categories), my places, "Load an
  example", results summary. Tap a cell for its card.
- Computation runs on the JS thread in chunks (`engine.evaluateAsync`), debounced 300 ms, previous run aborted.
  `__DEV__` builds log timings with the `[wtl]` prefix.
- Last filters are kept on the device (AsyncStorage). No analytics, no accounts. Network: map tiles
  (`wmts1.geoportail.lu`) and address search (`apiv3.geoportail.lu`) only.

| Path                             | What                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| `app.config.ts`                  | Name, bundle id (placeholder), privacy manifest, plugins      |
| `eas.json`                       | EAS build profiles: `development`, `preview`, `production`    |
| `metro.config.js`                | Metro for the pnpm monorepo                                   |
| `src/app/`                       | Screens (expo-router): map (`index`), `sources`               |
| `src/components/`                | Map, filter sheet, cell card, controls                        |
| `src/lib/filters.ts`, `mapFill.ts`, `rent.ts` | Pure TS: UI ↔ engine adapter, map colours, rent wording (tested in `test/`) |

## Scripts

```sh
pnpm --filter @wtl/mobile start       # Metro for the development build (expo start --dev-client)
pnpm --filter @wtl/mobile typecheck
pnpm --filter @wtl/mobile lint
pnpm --filter @wtl/mobile test        # vitest: filters adapter, map colours, geocoder parsing
```

## Prerequisites

- Apple Developer Program membership (99 USD/year) — needed for any build on a real iPhone and for TestFlight.
- An Expo account (free tier is enough) and the EAS CLI: `npm i -g eas-cli`.
- Node 22 and pnpm 12 (versions pinned in `eas.json` for the cloud builds).
- No Mac needed: EAS builds in the cloud. (`expo prebuild -p ios` is skipped on Windows; EAS runs it.)

## Run on an iPhone from Windows (development build)

The app uses native modules (MapLibre), so Expo Go does not work: install a development build once, then
JavaScript changes load from your PC.

```sh
cd apps/mobile
eas login
eas build --profile development -p ios
```

1. The first time, EAS asks to log in to Apple, creates the bundle id and certificates, and asks to register
   your iPhone (scan the QR code it shows, install the profile, then on iOS 16+ turn on
   Settings → Privacy & Security → Developer Mode).
2. When the build finishes, open the link / QR code from the EAS page on the iPhone and install.
3. On the PC: `pnpm --filter @wtl/mobile start`, then open the app on the iPhone and pick the server
   (same Wi‑Fi; if it is not found, run `npx expo start --dev-client --tunnel` in `apps/mobile`).

Rebuild only when native dependencies or `app.config.ts` change.

## Ship to TestFlight

```sh
cd apps/mobile
eas build -p ios --profile production   # build number auto-increments (appVersionSource: remote)
eas submit -p ios                        # uploads the latest build to App Store Connect
```

The first `eas submit` creates the App Store Connect record (or asks for its ASC app id). After Apple's
processing (~15–30 min) add testers in App Store Connect → TestFlight. External testers need a short beta
review.

## App Store checklist

- [ ] Final name and bundle identifier: `IOS_BUNDLE_ID` in `app.config.ts` (`com.wheretolive.app` is a
      placeholder; it cannot change after the first upload).
- [ ] Privacy policy URL (the web session builds `/privacy` on the website) in App Store Connect **and** as a
      link on the in-app Sources screen (`src/app/sources.tsx`, guideline 5.1.1(i)); add the link once the page
      is live. The policy should mention that address searches and map tiles go to geoportail.lu.
- [ ] Support URL (a contact page or email on the website).
- [ ] Screenshots: 6.9" (1320 × 2868) and 6.5" (1284 × 2778) iPhone.
- [ ] App Privacy label: **Data Not Collected** (nothing leaves the device except tile and address-search
      requests to geoportail.lu; no analytics or tracking). Matches the privacy manifest in `app.config.ts`.
      Ale to confirm against geoportail.lu's terms: the typed addresses (possibly home or work) go to that
      third party, and whether it keeps them is not verified.
- [ ] Category: Lifestyle (or Navigation / Travel); age rating questionnaire: all "None".
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption = false` is already set (HTTPS only).
- [ ] Description, keywords, and the data sources and licences (Sources screen) in the listing.
- [ ] Icon and splash: `assets/icon.png` and `assets/splash-icon.png` are **placeholders** — replace before
      release (icon 1024 × 1024 PNG, no transparency).
- [ ] Native project check (not possible on Windows: `expo prebuild -p ios` skips iOS there; the
      `expo config --type introspect` output is only an approximation). Before the first store build, read the
      "Prebuild" and "Install pods" phases of the first `eas build --profile development -p ios` log, and
      download the build's `Info.plist` and `PrivacyInfo.xcprivacy` (or run `expo prebuild -p ios` in WSL /
      Linux). Check: the 3 API categories (UserDefaults, FileTimestamp, SystemBootTime), no `armv7` in
      `UIRequiredDeviceCapabilities`, and `NSLocationWhenInUseUsageDescription` as the only location key.
      After the first upload, check App Store Connect's email: no ITMS-91053 (privacy manifest) and no
      ITMS-90683 (missing purpose string; MapLibre links CoreLocation, so the location key is set although the
      app never asks for location).
- [ ] After the first `eas init`: `app.config.ts` is dynamic, so EAS cannot write the project id itself. Add
      `owner` and `extra: { eas: { projectId } }` to `app.config.ts` by hand and commit them.
- [ ] On a notched iPhone: the map's ⓘ attribution button (OSM / ACT) is visible and opens.

## Notes

- Bundle: the iOS Hermes bundle is ~11 MB (`npx expo export --platform ios`), mostly the Luxembourg dataset
  (`grid.json` 0.8 MB, `transit.json` 1.3 MB as JSON). Moving `transit.json` to an asset loaded at runtime would
  shrink it if start-up time becomes a problem.
- Privacy manifest (`ios.privacyManifests`): AsyncStorage → `NSPrivacyAccessedAPICategoryUserDefaults` (CA92.1);
  React Native core → FileTimestamp (C617.1) and SystemBootTime (35F9.1); no collected data types, no tracking.
  Third-party SDKs ship their own manifests.
- `expo-dev-client` adds a local-network permission (`NSLocalNetworkUsageDescription`, `NSBonjourServices`) to
  Info.plist; its build phase "Strip Local Network Keys for Release" removes it from non-Debug builds, so
  TestFlight / App Store builds do not ask for it.
- Rent: areas without a published rent (national model, `eur_m2` null) show "no rent data" in the results
  list, as the cell card does; Luxembourg City districts priced from the city's published average say "city
  average" (`AreaMatch.rentProvenance` from `@wtl/core`).
- Max commute minutes: typed values are kept as app.js does (`+value || 30`, no 5–90 clamp).
- There is no safety layer for Luxembourg yet.
