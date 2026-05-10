# BURDEN by PVA — Native (Expo)

Expo + React Native + TypeScript build of BURDEN, mirroring the web app.
JetBrains Mono throughout, same minimal aesthetic, same mock data.

## Local dev

```bash
npm install
npm run ios          # opens iOS simulator (Xcode required)
npm run android      # opens Android emulator
npm run web          # quickest sanity check — runs in the browser
npm run start        # opens Expo Dev Tools (scan QR with Expo Go)
```

## Build for TestFlight

Requires:
- Apple Developer account ($99/year)
- EAS CLI logged in: `npx eas-cli login`
- One-time: `npx eas-cli build:configure`

```bash
npx eas-cli build --platform ios --profile production --auto-submit
```

This builds in EAS's cloud, signs with the App Store profile, and submits to App Store Connect.
TestFlight processes the build (~10–30 min) and Emmanuel can install it from the TestFlight app.

For a quick internal build (no App Store):

```bash
npx eas-cli build --platform ios --profile preview
```

## Where things live

- `App.tsx` — root: font loader, splash, providers, navigation container
- `src/navigation/RootNavigator.tsx` — stack + tab structure
- `src/screens/` — DiscoverScreen, CampaignScreen, GiveScreen, GivingScreen, AboutScreen
- `src/components/UI.tsx` — shared primitives (Label, Rule, Button, Progress, Badge)
- `src/context/GiftsContext.tsx` — in-memory gift store
- `src/data/mock.ts` — same five churches and campaigns as the web app
- `src/constants/theme.ts` — colour palette, font names, money formatter
- `assets/fonts/` — JetBrains Mono Regular + Bold (copied from PILLAR)
- `app.config.ts`, `eas.json` — Expo and EAS configuration

## Notes vs PILLAR

PILLAR brings Firebase auth, Sentry, three context providers, and a much larger surface
area. BURDEN-native is intentionally lean — same MVP scope as the web build. Auth,
real payments, and persistence land later.
