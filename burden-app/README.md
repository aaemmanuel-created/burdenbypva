# BURDEN by PVA — Web App

Vite + React 18 web build of BURDEN. JetBrains Mono throughout, minimal aesthetic.

## Local dev

```bash
npm install
npm run dev          # http://localhost:5174/burdenbypva/
```

## Build

```bash
npm run build        # outputs to dist/
npm run preview      # serves dist/ locally to verify
```

## Deploy

Two paths:

### Automatic (GitHub Actions)

Push to `main`. `.github/workflows/deploy.yml` builds and publishes to GitHub Pages.

One-time setup on the repo:
1. **Settings → Pages → Source** = "GitHub Actions"
2. The first deploy populates the URL; it will look like
   `https://<user>.github.io/burdenbypva/` (matches the `base: '/burdenbypva/'` in `vite.config.js`).

If the repo name isn't `burdenbypva`, update `base` in `vite.config.js` accordingly.

### Manual

```bash
npm run deploy       # runs vite build + gh-pages -d dist
```

This pushes `dist/` to a `gh-pages` branch. Requires push access and a configured remote.

## Where things live

- `src/App.jsx` — state-based router (no router library)
- `src/screens/` — Home, Discover, Campaign, Give, History, About
- `src/components/` — Header, Footer, UI kit
- `src/data/mock.js` — five verified churches and live campaigns
- `src/theme.js` — design tokens

## Notes

- No real payment processor wired up yet. The Give checkout records an in-memory gift and shows a thank-you screen — useful for demos, not for production.
- For TestFlight / native iOS, see `../burden-native/`.
