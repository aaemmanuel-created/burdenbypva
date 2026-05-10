# CLAUDE.md — BURDEN by PVA

BURDEN by PVA is a global Christian fundraising platform. The current implementation is a Vite + React web app in `burden-app/`. See `BURDEN_blueprint.md` and `BURDEN_master_prompt.md` for the full product spec.

---

## ⚠️ WORKING AGREEMENTS — READ FIRST

These two rules govern how every session on this project should run. They override the default cautious behaviour.

### 1. Auto-permissions and seamless build-and-deploy to TestFlight

**Intent.** Emmanuel edits this project remotely via Dispatch. He expects a seamless build-and-deploy cycle: don't pause to confirm routine tool calls, and after code changes ship the build to TestFlight so he can test immediately on his phone.

**What this means inside the session:**
- Run dev / build / lint / test commands without asking. Assume *yes* for `npm`, `vite`, `git status`/`diff`/`log`, and any file read or edit inside `burden-app/`.
- After any meaningful code change, build the app and trigger the TestFlight upload as a single follow-on step. Do not wait for confirmation.
- Report build status, version number, and the TestFlight build URL (or App Store Connect link) in the response so Emmanuel can open it on his phone.

**Caveats — these MUST be set up before the agreement above is actually executable:**

- **Permission prompts are a harness setting, not a CLAUDE.md instruction.** To actually skip the prompts, this project needs `.claude/settings.json` with a `permissions.allow` list — for example `npm`, `vite`, `git status`, `git diff`, `Read`, `Edit`, `Write`. CLAUDE.md alone cannot grant tool permissions; it can only state intent. If prompts are still appearing, the settings file is missing or incomplete — fix the settings file first and tell Emmanuel.
- **TestFlight needs a native iOS wrapper.** The current `burden-app/` is a pure web build (Vite). TestFlight only accepts native iOS builds. To ship to TestFlight, BURDEN needs either an **Expo / React Native** wrapper (same approach as `../PILLAR by PVA/pillar-app/` and `../RENEW by PVA/renew-native/`, with `eas.json` configured and EAS Build secrets in place) or a **Capacitor** wrapper. Neither exists yet. Until one is scaffolded with valid Apple Developer signing credentials, "deploy" should fall back to a hosted web preview (the existing `npm run deploy` script in `burden-app/package.json` ships to GitHub Pages).
- If a TestFlight wrapper does exist by the time you're reading this, the build command lives in that wrapper's folder (typically `eas build --platform ios --profile production --auto-submit`). Use it. Do not try to upload `dist/` from the web build — it will not work.

**Summary:** the spirit of this rule is *fast feedback, no friction*. Honour the spirit. If the literal mechanism (TestFlight) isn't wired up, fall back to web preview and tell Emmanuel what's missing — don't silently fail.

### 2. Context summary report at ~900K tokens

When the conversation crosses roughly 900K tokens of context — or earlier, if a lot has been built and the session feels long — write a **`CONTEXT-SUMMARY.md`** in this project root.

Capture:

- **Session highlights** — what was worked on, in roughly chronological order.
- **Decisions and rationale** — choices made and why, especially anything that diverged from the blueprint.
- **Current state of the app** — what's built and working, what's broken, what's mid-flight.
- **Open issues / next steps** — TODOs, questions waiting on Emmanuel, the recommended next move for the next session.

Overwrite the file each time — it is not an append-only log. The next session reads this first to pick up where the last one left off.

**Caveat:** the assistant cannot see live token counts. The 900K threshold is a soft heuristic — write the summary when the transcript feels long, when significant work has accumulated, or whenever Emmanuel asks. Err on the side of writing it slightly early.

---

## Project layout

- `burden-app/` — the working web app (Vite 6 + React 18, JetBrains Mono, no auth, no real payment processor yet — donations are a mock checkout that records into in-memory state)
- `BURDEN_blueprint.md`, `BURDEN_blueprint.docx`, `BURDEN_master_prompt.md` — full product spec
- `.claude/launch.json` — preview-server config (port 5174)
- `Screenshot *.png` — reference screenshots from earlier discovery
- `DELETE_REVIEW_*` folders — temporary docx-extract scratch directories, safe to delete after review

## Tech baseline

- Vite 6, React 18, no router library (state-based routing in `src/App.jsx`)
- JetBrains Mono throughout, warm-paper background `#f7f6f2`, hairline-rule design system
- Mock data in `src/data/mock.js` — five verified churches across Nairobi, Lagos, Accra, London, Manila with five live campaigns
- Same web stack as `../RENEW by PVA/`. `../PILLAR by PVA/pillar-app/` is the reference for any future Expo / React Native target.

## Brand guardrails (do not soften)

- Reverent, plain-spoken, never manipulative. No urgency exploitation, no spiritual-reward-for-giving language.
- No tradition-specific religious iconography by default — churches brand their own pages.
- Every donation must show where the money goes (itemised allocation in plain language).
- Every church must show its verification tier (Basic / Verified / Premium Trust).
- $1 USD minimum, currency-formatted with `Intl.NumberFormat`.
