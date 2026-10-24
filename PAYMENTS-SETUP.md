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

## Mobile money, monthly gifts, payouts and USSD (added 2026-10-22)

_Studied from MTN MoMo and expressPay with REA. Test mode only, like everything above._

**What was added**

| Feature | Where | What the donor or church sees |
|---|---|---|
| **Approve on your phone** | `momo-charge`, `momo-otp`, `_shared/momo.ts` | On the Give screen, Paystack → "Approve on my phone": pick MTN / Telecel / AirtelTigo, type the number, and a prompt arrives on the phone to approve with the PIN. A "Check your phone" screen waits, then opens the gift. Telecel sometimes sends a code first, which the screen asks for. The PIN never touches BURDEN. |
| **Monthly gifts that repeat** | `recurring_plans` table, `_shared/plans.ts`, `run-recurring`, `cancel-recurring` | Stripe cards become a Stripe subscription. Paystack cards reuse their saved authorisation. Mobile money sends a fresh prompt each month, so nothing is taken without the donor's PIN. Flutterwave: first gift only. The gift page shows "Monthly gift" with **Stop monthly gift**. After three failed months a plan stops by itself. |
| **Church payouts to MoMo or bank** | `church_payout_accounts` table, `church-payout-account`, `run-payouts` | Each burden says where the church is paid, e.g. "verified MTN MoMo business wallet". Live payouts send Paystack gifts after the hold, **only when `PAYOUTS_LIVE=true`**. Test payouts stay simulated, but name the account. |
| **USSD giving** | `ussd`, `_shared/ussd-logic.ts`, `_shared/burdens.ts` | Dial a short code → 1 Give → choose a burden → amount in GHS → confirm → the same MoMo prompt. Works on any phone, no data. |
| **QR posters** | apps only (`Poster` screen) | Share → "QR poster for church". The website prints it; the phone shows it full size. |

**Extra setup steps**

1. Run the new migration and deploy the new functions:
   ```bash
   supabase db push
   ```
   ```bash
   supabase functions deploy
   ```
2. Add the cron secret (make up a long random string):
   ```bash
   supabase secrets set CRON_SECRET=<random string>
   ```
3. Schedule the two daily jobs in Supabase → Integrations → Cron (pg_cron + pg_net): a daily `POST` to `…/functions/v1/run-recurring` and to `…/functions/v1/run-payouts`, each with the header `x-burden-cron: <CRON_SECRET>`.
4. **Stripe webhook:** add the event `invoice.paid` to the existing endpoint, so later months of a Stripe monthly gift are recorded.
5. **Register a church's payout account** (a BURDEN reviewer, not the church):
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/church-payout-account -H "x-burden-admin-key: <CHURCH_ADMIN_KEY>" -H "Content-Type: application/json" -d '{"church_id":"ch_accra_st_andrew","method":"momo","network":"mtn","account_name":"St Andrew Presbyterian Church","account_number":"0241234567","verified":true}'
   ```
   For a bank account use `"method":"bank"` plus `"bank_code"` from Paystack's bank list.
6. **Paystack transfers:** in the Paystack dashboard, turn off "OTP for transfers", otherwise API payouts wait for a code. Payouts come from your Paystack balance, so the balance must hold the collected GHS.
7. **USSD (optional, costs money):** rent a short code from a gateway (expressPay, Africa's Talking, Hubtel, Arkesel …). Point its callback at `https://<project>.supabase.co/functions/v1/ussd?key=<USSD_SHARED_SECRET>` and set the secret:
   ```bash
   supabase secrets set USSD_SHARED_SECRET=<random string>
   ```
   Then show the code in the apps: `VITE_BURDEN_USSD_CODE` (web) and `EXPO_PUBLIC_BURDEN_USSD_CODE` (native). Posters then add "No smartphone? Dial …". The handler expects the Africa's Talking format (`text` = the whole path joined by `*`); other gateways may need a small adapter.

**Test in Paystack's test mode before going further:** a MoMo test charge (Paystack publishes test mobile money numbers), a monthly card gift, and the USSD placeholder email (`<number>@ussd.burden.invalid` — Paystack needs an email; check it is accepted).

**Not built — diaspora remittance (MoMo Remittances API).** MTN only opens that product to licensed money-transfer operators, and BURDEN collects gifts for churches, not person-to-person transfers. Diaspora donors are already covered: they give by card (Stripe) and the church is paid locally (MoMo or bank) after the hold. Revisit only if BURDEN partners with a licensed remittance company.

## Review queue and money duties (added 2026-10-24)

**Words of support — automated review queue.** Each message is stored with its gift and checked by rules once the payment is confirmed (`_shared/moderation-logic.ts`):
- requests for money, wallet numbers, crypto and "investments" are **rejected** (never shown);
- links, emails, phone numbers, "WhatsApp me", urgency or "God will repay your giving" language, insults and shouting are **held** for a person;
- everything else is **approved** and appears on the burden page.
Only approved words are public (`support-messages`). A reviewer clears held ones with `moderation-queue` (GET to list, POST `{ "id": 12, "decision": "approve" }`, header `x-burden-admin-key`). The giver sees their own words as "waiting" until then.

**Receipts.** A numbered receipt is emailed when the payment is confirmed (Postmark). USSD givers, who have no email, get an SMS instead (Africa's Talking).
**Refunds.** "Ask for a refund" on the gift page for 7 days (`request-refund`). Stripe one-off gifts, Paystack and Flutterwave refund automatically; a Stripe monthly-subscription month is refunded by hand from the Stripe dashboard.
**Gift Aid.** UK givers can add the HMRC declaration (name, house, postcode). `gift-aid-export` gives a Charities Online CSV. Only gifts charged in pounds can be claimed, and only once BURDEN is registered with HMRC as a charity.
**Sanctions screening.** The US OFAC list and the UK list are reloaded daily (`sanctions-refresh`). Every named giver is screened before paying, and every church payout account when it is registered. An exact match is refused politely; a close match goes ahead but its payout waits in `screening-queue` for a person. In live mode, if the lists have never loaded, every gift waits for review. (The blueprint's paid service, ComplyAdvantage, is still the long-term recommendation; this covers the free public lists.)
**Exchange rates.** USD → GHS (and others) come from a public source (`open.er-api.com` by default), are cached for 12 hours and passed through with no margin. Live payments refuse to run on an older rate; test mode falls back to the fixed test rate.

**Extra setup steps**
1. Deploy: `supabase db push` then `supabase functions deploy` (two new migrations, eight new functions).
2. Secrets (all optional in test mode — each feature says what is missing in the logs and carries on):
   ```bash
   supabase secrets set POSTMARK_SERVER_TOKEN=<token> RECEIPT_FROM="BURDEN <receipts@your-domain>"
   ```
   ```bash
   supabase secrets set AT_USERNAME=<Africa's Talking username, or sandbox> AT_API_KEY=<key> SMS_SENDER_ID=<approved sender id>
   ```
   Optional: `FX_SOURCE_URL`, `OFAC_SDN_URL`, `UK_SANCTIONS_URL`.
3. Add a third daily cron job: `POST …/functions/v1/sanctions-refresh` with `x-burden-cron: <CRON_SECRET>`, and run it once by hand before the first gift.
4. Check `UK_SANCTIONS_URL` still serves the UK consolidated list CSV — the UK has been moving it to the FCDO's UK Sanctions List.
5. Postmark: verify the sending domain (SPF/DKIM) so receipts aren't treated as spam.

## Go-live checklist (NOT done — needed before real money)

1. **Legal entity.** BURDEN must be a registered company or charity that can open live provider accounts. The blueprint recommends a UK CIO (charity), which also unlocks Gift Aid and Apple's charity rule. Get counsel review first (blueprint §15).
2. **Provider approval (KYB)** for each live account. Each provider will ask what BURDEN is, because collecting money *on behalf of churches* is a marketplace model.
3. **Real payouts to churches.** Paystack gifts can now be paid to a church's verified MoMo wallet or bank (`run-payouts`, behind `PAYOUTS_LIVE=true`). Stripe and Flutterwave gifts still need Stripe Connect / Flutterwave transfers and church onboarding.
4. **Done in code, still to switch on:** receipts (Postmark), SMS receipts (Africa's Talking), 7-day refunds, Gift Aid declarations, sanctions screening and live exchange rates (see "Review queue and money duties"). **Still missing:** an annual tax statement per donor (needs donor accounts) and a paid screening service.
5. **Apple App Store.** Guideline 3.2.1(vi) lets approved charities take donations outside in-app purchase. The native app already sends donors to the provider's web page, which matches the blueprint's plan.
6. **Donor accounts.** Gifts are currently remembered per device (web: browser storage; native: until the app closes). Logging in would let donors see their gifts on any device.
7. Only then: set `PAYMENTS_LIVE=true` on the server. Until that's set, the server refuses any live key, even if one is entered by mistake.
