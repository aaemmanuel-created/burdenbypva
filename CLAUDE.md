# CLAUDE.md — BURDEN by PVA

BURDEN by PVA is a global Christian fundraising platform. The current implementation is a Vite + React web app in `burden-app/` and an Expo wrapper in `burden-native/`. See `BURDEN_blueprint.md` and `BURDEN_master_prompt.md` for the full product spec.

## ⚠️ Read the shared workflow first

Before doing anything, also read:

- **`../_workflow/HOUSEPVA-WORKFLOW.md`** — the cross-app dispatch / build / permissions workflow. Defines the **Standard build loop** that this folder's `.claude/settings.json` enforces, and the parity rule (every change ships to web + iOS + Android).
- **`../_workflow/DISPATCH-PROMPTS/`** — drop-in prompts for bugfix, feature, OTA push, dependency bump, store-readiness, brand pass, cleanup, inbox drain, and parity check.
- **`../_workflow/INBOX.md`** — one-line dispatch requests Emmanuel drops in from his phone.

**Phone continuation — `/remote-control`.** Run Claude Code's `/remote-control` once at session start to make this session resumable from the Claude mobile app's Code tab. Combined with the per-app stable preview URL, that's the full "see the change on my phone, give the next instruction from my phone" loop — no extra infra needed. Full how-to: [`../_workflow/STABLE-PREVIEW-SETUP.md`](../_workflow/STABLE-PREVIEW-SETUP.md) §6.1 — don't duplicate it here.

The "Auto-permissions" agreement below is now actually executable via `.claude/settings.json` (see `../_workflow/proposed-settings/INSTALL.md` if it isn't installed yet).

BURDEN has **three surfaces** that must stay at feature parity: web (`burden-app/`), iOS and Android (`burden-native/`). End every change-the-app session with a parity status line per `HOUSEPVA-WORKFLOW.md` §1.

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

- `burden-app/` — the working web app (Vite 6 + React 18, no auth). Gifts persist in localStorage and each has a five-step tracking timeline (`src/lib/giftTimeline.js`, mirrored in `burden-native/src/lib/giftTimeline.ts`).
- Community pieces on every burden (2026-10-22, studied from GoFundMe with REA): **Updates** from the team, **Words of support** (givers' messages, never with the amount), **Fundraisers** ("Carrying it with others" — anyone raises among their circle; gifts still go to the church) and a **Share** sheet. Logic in `src/lib/community.{js,ts}`, UI in `src/components/Community.{jsx,tsx}`, Fundraise screen on both; demo content in `src/data/community.json` (identical copy in each app). Share links are `?burden=<id>[&f=<fundraiser>]` on the web URL. Own fundraisers and messages live on the device only (web localStorage, native memory) until the payment server stores them.
- Payments added 2026-10-22 (studied from MTN MoMo / expressPay with REA): **approve-on-your-phone MoMo** (Give → Paystack → network + number → "Check your phone"), **monthly gifts that repeat** (Stripe subscription / Paystack saved card / a fresh MoMo prompt each month; stop from the gift page), **church payouts to a verified MoMo wallet or bank** (`run-payouts`, only with `PAYOUTS_LIVE=true`), **USSD giving** (`ussd` function, needs a rented short code) and **QR posters** (Share → QR poster). Setup: `PAYMENTS-SETUP.md` → "Mobile money, monthly gifts, payouts and USSD". Each church's `payoutTo` is in the mock data; server burden list for USSD is `supabase/functions/_shared/burdens.ts` — keep both in step.
- Added 2026-10-24: **review queue for words of support** (rules → a person for anything flagged; scams never shown; only approved words are public — Emmanuel chose no AI check, 2026-10-24), **receipts** (email / SMS), **7-day refunds**, **Gift Aid declarations + HMRC export**, **sanctions screening** (OFAC + UK lists) and **live exchange rates** — all through one intake step (`supabase/functions/_shared/intake.ts`). The phone app now has the four burden sections, saves its state (AsyncStorage) and has haptics. Setup: `PAYMENTS-SETUP.md` → "Review queue and money duties".
- Added 2026-10-25: **church dashboard** (web only, `src/screens/Church.jsx`, "For churches" in the footer; Supabase Auth email code; demo mode without a server), **church-posted updates** (shown on the burden page), **notifications** (`notify-sweep` emails + Expo pushes; update emails opt-in), **languages** (`src/i18n/strings.json`, identical in both apps: en + fr/sw/pt/es drafted by Claude — needs native-speaker review; main giver journey only, church content untranslated; picker in the web footer and the phone's About tab), **accessibility** (axe-core WCAG 2.2 AA pass on web; grey text now #676762; blue tiles now start at #3563a6 with #ebf0fa muted text, so text on them passes AA). Setup: `PAYMENTS-SETUP.md` → "Church accounts and notifications".
- Added 2026-10-26: **giver accounts** (email code; web Profile, phone Giving tab; gifts and fundraisers follow the person — `lib/account.{js,ts}`, `lib/auth.{js,ts}`), **fundraisers on the server** (shared links work for everyone; starting one needs an account), **church burden editing** (dashboard → Edit burden; a BURDEN reviewer approves; goal not editable), **church applications with KYB checks**, **Report links** on updates / words / fundraisers, and the **BURDEN team console** (web footer → BURDEN team, `src/screens/Admin.jsx`, `functions/admin`) with an append-only **audit log**. Rules mirrored between `supabase/functions/_shared/admin-logic.ts` and `burden-app/src/lib/trust.js` — keep in step. Demo sign-in code 123456. Approved wording shows on the web only so far (phone shows shipped text). Setup: `PAYMENTS-SETUP.md` → "Giver accounts, church applications and the BURDEN team console".
- `supabase/` — payment server: Stripe + Paystack + Flutterwave via hosted checkout, gifts + timeline events in Postgres, **test mode only**. Without `VITE_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` the apps fall back to the demo checkout. Setup + go-live checklist: `PAYMENTS-SETUP.md`. Tests: `node --test 'supabase/tests/*.test.ts'`.
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
