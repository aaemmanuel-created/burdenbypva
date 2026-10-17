# BURDEN payments + gift tracking — setup guide

_Added 2026-10-15. Test mode only: no real money can move until the go-live checklist at the bottom is done._

## What was built

- **Gift tracking timeline** (web + iOS/Android). Every gift shows five steps, in the same style as Remitly's tracker:
  **Burden shared → Payment confirmed → Held securely (3 days) → Paid to church → Church confirms**.
  Each gift has its own page, reached from Giving history. A declined or abandoned payment shows in red with a plain-English reason and a "Try again" button.
- **Three payment providers.** The donor picks one on the Give screen:
  | Option on the Give screen | Provider | Charges in |
  |---|---|---|
  | Card, Apple Pay or Google Pay | Stripe | USD |
  | Mobile money or card — Ghana & Nigeria | Paystack | `PAYSTACK_CURRENCY` (default GHS) |
  | Mobile money, M-Pesa or card — across Africa | Flutterwave | `FLUTTERWAVE_CURRENCY` (default USD) |
- **The payment server** (`supabase/`). This is a database for gifts and their timeline steps, plus seven small functions. The donor always pays on the provider's own secure page, so BURDEN never sees card numbers or MoMo PINs.

Until the server is connected, the apps keep working exactly as before on the **demo checkout**. The timeline still shows, but no money is involved.

## How the money flow works

```
Give screen ──► create-gift ──► provider's hosted checkout page ──► checkout-return ──► back to the app
                   │                         │                                            │
                   └ gift row + "Burden shared" └ webhook ──► "Payment confirmed" + "Held"   └ gift-status (polls)
```

- **create-gift** recomputes the fee on the server (it never trusts the app's figure), records the gift and opens the provider's checkout.
- **Webhooks** (`stripe-webhook`, `paystack-webhook`, `flutterwave-webhook`) check each provider's signature. For Paystack and Flutterwave, the server also asks the provider's API to confirm the payment before believing it. The amount and currency must match exactly, otherwise the gift is marked failed.
- **gift-status** also asks the provider directly while a payment is unconfirmed, so the timeline still moves if a webhook is slow.
- **Held → Paid to church.** In test mode this is *simulated* once the hold ends (`HOLD_HOURS`, default 72). Live gifts are never auto-paid-out by this code.
- **Church confirms** is recorded by calling `church-confirm` with the `CHURCH_ADMIN_KEY`. A church admin screen for this doesn't exist yet.

## Setting up test mode (about 30 minutes, all on your Mac)

You need to do these steps yourself, because they mean creating accounts and handling secret keys.

1. **Create the accounts (all free, test mode is on by default):**
   - Supabase: supabase.com → New project (region: London/eu-west-2). Note the **Project URL** and **anon/publishable key**.
   - Stripe: dashboard.stripe.com → Developers → API keys → copy the **test secret key** (`sk_test_…`).
   - Paystack: dashboard.paystack.com → Settings → API Keys → **test secret key** (`sk_test_…`). Your country (Ghana) sets the currency: GHS.
   - Flutterwave: app.flutterwave.com → Settings → API keys → **test secret key** (`FLWSECK_TEST-…`).

2. **Install the Supabase CLI and link the project** (from this folder):
   ```bash
   brew install supabase/tap/supabase
   ```
   ```bash
   supabase login
   ```
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Create the tables, then deploy the functions:**
   ```bash
   supabase db push
   ```
   ```bash
   supabase functions deploy
   ```

4. **Store the secret keys on the server.** Never put these in the app or in git.
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... PAYSTACK_SECRET_KEY=sk_test_... FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-... CHURCH_ADMIN_KEY=<make up a long random string>
   ```
   Optional settings: `PAYSTACK_CURRENCY` (GHS), `PAYSTACK_USD_RATE` (15, a fixed **test** rate), `FLUTTERWAVE_CURRENCY` (USD), `FLUTTERWAVE_USD_RATE` (1), `HOLD_HOURS` (72; set it to `0.05` to watch the payout step happen within 3 minutes while testing), and `ALLOWED_RETURN_URLS`.

5. **Point each provider's webhook at the server.** Then store the signing secrets:
   - Stripe → Developers → Webhooks → Add endpoint `https://<project>.supabase.co/functions/v1/stripe-webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Copy the signing secret, then run `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
   - Paystack → Settings → API Keys & Webhooks → Test Webhook URL `https://<project>.supabase.co/functions/v1/paystack-webhook` (it signs with your secret key, so there's no extra secret).
   - Flutterwave → Settings → Webhooks → URL `https://<project>.supabase.co/functions/v1/flutterwave-webhook`, make up a **secret hash**, then run `supabase secrets set FLUTTERWAVE_WEBHOOK_HASH=<that hash>`

6. **Connect the apps.** The project URL and anon key are public by design, so it's fine for them to be in the app.
   - Web: create `burden-app/.env.production` (and `.env.local` for `npm run dev`) containing
     `VITE_SUPABASE_URL=https://<project>.supabase.co` and `VITE_SUPABASE_ANON_KEY=<anon key>`.
   - Native: add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the `env` block of each profile in `burden-native/eas.json`.

7. **Make a test gift.** Each provider publishes test card numbers and test mobile-money numbers in its docs (Stripe: "Testing"; Paystack: "Test Payments"; Flutterwave: "Testing helpers"). Stripe's is `4242 4242 4242 4242`, any future date, any CVC.

Run the server unit tests any time with:
```bash
node --test 'supabase/tests/*.test.ts'
```

## Go-live checklist (NOT done — needed before real money)

1. **Legal entity.** BURDEN must be a registered company or charity that can open live provider accounts. The blueprint recommends a UK CIO (charity), which also unlocks Gift Aid and Apple's charity rule. Get counsel review first (blueprint §15).
2. **Provider approval (KYB)** for each live account. Each provider will ask what BURDEN is, because collecting money *on behalf of churches* is a marketplace model.
3. **Real payouts to churches.** Stripe Connect accounts, Paystack subaccounts and Flutterwave transfers each need church onboarding and verification. Today "Paid to church" is simulated in test mode only.
4. **Refunds** (7-day self-serve window), **monthly repeat charges**, **emailed receipts / tax receipts**, **sanctions screening**, and a **live FX rate source** (test mode uses fixed rates).
5. **Apple App Store.** Guideline 3.2.1(vi) lets approved charities take donations outside in-app purchase. The native app already sends donors to the provider's web page, which matches the blueprint's plan.
6. **Donor accounts.** Gifts are currently remembered per device (web: browser storage; native: until the app closes). Logging in would let donors see their gifts on any device.
7. Only then: set `PAYMENTS_LIVE=true` on the server. Until that's set, the server refuses any live key, even if one is entered by mistake.
