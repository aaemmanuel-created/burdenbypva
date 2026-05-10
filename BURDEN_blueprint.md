# BURDEN by PVA — Production Blueprint

**Status:** v1.0 founder-facing blueprint
**Audience:** Founder, prospective CTO, prospective compliance counsel, seed investors
**Disclaimer:** This document includes regulatory, tax, and legal references. It is not legal, accounting, or investment advice. Every regulatory and tax claim must be reviewed by qualified counsel in each operating jurisdiction before launch. Sections flagged "[counsel-review]" are particularly load-bearing.

---

## Table of contents

1. Product vision
2. Business model and revenue
3. Pilot market selection
4. Theological, editorial, and content policy
5. Core product modules
6. User roles and permissions
7. Main user journeys
8. MVP scope (and what to cut)
9. Recommended tech stack
10. System architecture
11. Database design
12. API design
13. Payment and donation flow
14. Tax receipting per jurisdiction
15. Compliance and legal considerations
16. Cybersecurity framework
17. Fraud and trust system
18. Product design and UX
19. Design system
20. Notification strategy
21. Analytics and KPIs
22. Admin and operations
23. AI / ML and ethics policy
24. Development roadmap
25. Engineering task backlog
26. Repository structure
27. Coding standards
28. Testing strategy
29. Deployment strategy
30. Open founder questions
31. Final deliverables (architecture diagram, ERD, prioritized backlog, 90-day plan, risk register)

---

## 1. Product vision

### Mission
BURDEN by PVA exists for the **effective allocation of capital to rescue the body of Christ** — directing the giving of believers worldwide toward the verified churches, ministries, and faith-based institutions whose work most urgently sustains and strengthens the global Church. Any believer can give as little as one dollar; every dollar moves with full transparency, full verification of the recipient, and a deliberate posture toward where it will do the most good for Christ's Church.

This mission has three load-bearing words.

- **Effective** — the platform is not neutral about outcomes. It surfaces strategic need, exposes impact, and helps donors give where it matters, not only where it feels meaningful. Effectiveness is measured against the recipient's stated purpose, evidenced by impact updates, audited annually.
- **Capital allocation** — giving is treated with the seriousness of investment, without losing the spirit of generosity. Donors see fee transparency, recipient verification, deployment plans, and outcomes. Capital flows to where it produces fruit.
- **Rescue the body of Christ** — the global Church is one body in many traditions, languages, and conditions. Some parts flourish; some are persecuted, under-resourced, or in disaster. BURDEN exists to move capital from the parts that have to the parts that need, faithfully and at scale.

The platform is not a neutral marketplace. It is a stewardship instrument.

### Problem
Three problems converge:

**Donor trust gap.** Most digital giving platforms either (a) do not verify recipients beyond a payment-processor-level KYC check, or (b) do verify them but never expose that verification to donors in a legible way. Donors who want to give to a small church in Lagos, Kingston, or Kuala Lumpur from London or Atlanta have no trustworthy bridge.

**Church technology gap.** Local churches outside North America and Western Europe overwhelmingly lack a global donation rail. They depend on diaspora giving routed through opaque channels — bank wires arranged by relatives, Western Union, informal hawala-style networks — where 5–15% of value is lost and no receipt or audit trail exists.

**Cross-border friction.** Existing global tools (PayPal, Wise, Stripe Atlas) are built for commerce, not charitable giving. They do not generate compliant tax receipts in the donor's jurisdiction, do not handle Gift Aid uplift, do not screen for sanctions automatically, and do not separate restricted from unrestricted gifts.

### Target users
- **Donors** — individual Christians, ages 16+, anywhere in the world the platform is legally available, giving anywhere from $1 to major-gift levels.
- **Churches** — local congregations of any Nicene-affirming Christian tradition, with recognized leadership and a legal or denominational entity status.
- **Ministries** — registered Christian non-profits including missions agencies, evangelistic organizations, and chaplaincies.
- **Faith-based institutions** — Christian schools, universities, seminaries, hospitals, orphanages, disaster-relief and humanitarian organizations operating under Christian governance.
- **Platform administrators** — internal staff: trust & safety reviewers, editorial curators, compliance officers, regional admins.

### Emotional and spiritual positioning
Reverent, never sentimental. Hopeful, never urgent. Confident, never triumphalist. The tone of voice is closer to a denominational annual report than a crowdfunding campaign — quiet, careful with words, and committed to plain truth. The product never implies that giving produces a spiritual return, never uses guilt or fear, and never uses countdown timers or scarcity language.

### Tagline
**Jesus is the eternal unifying agent.**

This is the official BURDEN tagline. It declares the platform's Christian identity openly and locates the unity of the global church — across tradition, region, and language — in the person of Jesus Christ rather than in the platform itself. It pairs naturally with the brand name: BURDEN is the work; Jesus is the One who unifies those who carry it together.

Implications for product copy:
- The tagline appears on marketing surfaces, the public footer, the App Store and Play Store listings, and the "About BURDEN" page. It does not appear inside the donation flow itself, so as not to attach spiritual content to a transactional moment.
- Translation is faithful, not adapted. The platform commissions native-speaker translations from theologically literate translators in each market language, with two reviewers per locale.
- The tagline confirms that BURDEN is unapologetically Christian and is not seeking neutrality on the question of identity — only on the question of denominational tradition. The eligibility policy in §4 stands: any Nicene-affirming tradition is welcome.

### Doctrinal scope
The platform is **explicitly Christian and ecumenical within historic orthodoxy**. Eligibility rests on two markers:

1. **Doctrinal:** the recipient organization affirms the Nicene Creed (381 AD form, including *filioque* in the West and without it in the East, both accepted) and the canonical 66-book Old/New Testament (or 73-book Catholic / 76-book Eastern Orthodox canons in those traditions).
2. **Operational:** registered legal entity in its jurisdiction, OR denominational endorsement letter from a recognized Christian denominational body, OR (rare) referral from two already-verified churches in the same country.

Eligible traditions: Roman Catholic; Eastern Orthodox; Oriental Orthodox; Anglican / Episcopal; Lutheran; Reformed / Presbyterian; Methodist; Baptist; Pentecostal and Charismatic; non-denominational evangelical; African Initiated Churches (Aladura, Kimbanguist, Ethiopian Orthodox Tewahedo) where Nicene affirmation is documented.

Ineligible (with brief rationale):
- **The Church of Jesus Christ of Latter-day Saints** — does not affirm the Nicene definition of the Trinity.
- **Jehovah's Witnesses** — does not affirm the Nicene definition of the Trinity.
- **Christian Science** — does not affirm Nicene Christology.
- **Unitarian Universalist congregations** — does not affirm Nicene Trinitarianism.
- **Prosperity-gospel ministries with documented financial-abuse findings** — assessed case-by-case via the trust & safety team using public regulatory rulings, court findings, or independent journalism from outlets the editorial board recognizes (Religion News Service, Christianity Today investigations, BBC, denominational accountability bodies).

This eligibility policy is published, not hidden. It is reviewed annually by an external advisory council (see §4) of theologians from at least four traditions.

---

## 2. Business model and revenue

### Fee structure
A two-component fee, transparent at checkout:

1. **Platform fee: 3.0% of donation amount**, capped at $25 per single donation.
2. **Payment processing pass-through** at provider cost (no markup):
   - Card (Stripe US): 2.9% + $0.30
   - Card (Stripe UK): 1.5% + £0.20
   - Card (international, non-EEA): 3.4% + £0.20
   - Apple Pay / Google Pay: same as underlying card
   - Bank debit / ACH (Stripe ACH): 0.8% capped at $5
   - UK Direct Debit (GoCardless): 1% capped at £2
   - Mobile money (Flutterwave, varies): 1.4–3.5%

**Donor cover toggle:** at checkout, donors are offered "Cover the fees so the church receives 100%" — pre-selected ON. Industry data (Donorbox, Givelify) shows ~75% donor uptake when default-on. This dramatically reduces church-side fee burden and improves trust.

### Benchmark comparison

| Platform | Platform fee | Payment fee | Notes |
|---|---|---|---|
| Tithe.ly | 0% on tithes (Tithe.ly Give) | 2.9% + $0.30 | Loses money on giving; monetizes via ChMS suite |
| Pushpay | Custom enterprise SaaS, ~$5k–$50k/yr | 2.9% + $0.30 | Mid-large US churches only |
| Givelify | 2.9% + $0.30 (no platform fee) | included | Donor-side simple, but no recurring giving until 2023 |
| GoFundMe Charity (defunct, now PayPal Giving Fund) | 0% | 1.99% + $0.49 | US-only effectively |
| Donorbox | 1.5% (Standard) / 1.75% (Pro) / negotiated | 2.9% + $0.30 | Closest competitor model |
| GiveCloud | 2% + Stripe | included | Canadian focus |

**Why 3% is defensible.** Lower than Donorbox Pro for SMB churches; supports cross-border verification overhead; allows the company to fund trust & safety as a moat. We will publish a pledge: platform fee never increases for any church for the lifetime of their account, only via opt-in to premium tiers.

### Revenue stack (year 1 → year 5)
- **Year 1–2:** Platform fee only.
- **Year 2:** Add **BURDEN Pro for Churches** at $29/mo or $290/yr — advanced analytics, custom subdomain (church.burden.org), larger media storage (5GB → 50GB), multi-user dashboards (up to 10 finance users), dedicated payout cadence (weekly → daily), in-app sermon embedding.
- **Year 3:** Add **BURDEN Connect** — embeddable widget partnerships with church-website builders (Subsplash, Clover Sites, Squarespace church templates) at revenue share.
- **Year 4–5:** Add **BURDEN for Denominations** — enterprise deal with denominational HQs (Anglican Communion offices, regional Catholic dioceses, Assemblies of God national bodies) for cross-church reporting, $25k–$250k ACV.

Float / treasury policy: funds are held in segregated FBO ("for benefit of") accounts at partner banks. **Interest accrued on held funds is donated quarterly to the BURDEN Foundation general assistance fund (verified churches whose campaigns failed to meet minimum, or disaster-response pool).** This is published. The company does not retain float interest. This is a critical trust signal and must not be quietly changed.

### Recommended legal structure
**Delaware Public Benefit Corporation (PBC)** as the operating company ("BURDEN PBC, Inc."), with a **UK Charitable Incorporated Organisation (CIO)** as the pilot-market charitable vehicle ("BURDEN Foundation UK"), and a US 501(c)(3) **fiscal-sponsorship arrangement** for year 1 (e.g., via Players Philanthropy Fund or NewWave Philanthropy) that can convert to a standalone US 501(c)(3) by year 2 if needed.

Why this structure:
- **PBC** lets the operating company raise venture capital while embedding mission lock — directors must consider stated public benefit alongside shareholder return. It is the structure used by Kickstarter (2015) and many faith-tech operators.
- **UK CIO** allows the pilot-market entity to receive donations as a registered charity, claim Gift Aid, and disburse to verified churches as restricted grants. This is materially better than operating as a payment-aggregator-only model in the UK.
- **US fiscal sponsor** lets US donors receive 501(c)(3) tax-deductible receipts on Day One without waiting 12–18 months for IRS determination.

[counsel-review] This structure has tax, securities, and charity-law implications in every market. Do not finalize until reviewed by US corporate counsel, UK charity counsel, and a tax adviser familiar with cross-border faith-based giving.

### Funding strategy
**Recommended path: mission-aligned seed VC + foundation grants.**

Plausible funders (pre-seed/seed):
1. **Faith Driven Investor** network (LP-style introductions, no direct fund but a network)
2. **Sovereign's Capital** — explicitly faith-driven VC, Atlanta/Singapore
3. **Praxis Labs** — Christian venture accelerator, NYC
4. **Maclellan Foundation** — historic faith-tech funder, grant capital
5. **Kingdom Capital** — early-stage Christian venture
6. **Templeton Religion Trust** — research/program grants for measurable faith outcomes

Realistic seed ask: $2.5M–$4M for 18-month runway through pilot launch and 5,000-church milestone.

### Exit considerations
Acquirers most likely:
- **Pushpay / Subsplash combined entity** (if they remain consolidated) — strategic fit, US-focused, would extend their global reach.
- **A denominational holding company** (Salvation Army-affiliated, Lutheran World Federation arms, etc.) — mission preservation but slow process.
- **Lightspeed Commerce / Shopify Foundation arm** — adjacent payment infrastructure.

**IPO is not realistic** at the likely TAM. Founder should optimize for mission durability, not exit multiple. The PBC structure and the "interest goes to assistance fund" pledge should both be preserved through any acquisition negotiation as conditions of sale.

---

## 3. Pilot market selection

### Scoring framework
Nine factors, scored 1–5, weighted by strategic importance:

| Factor | Weight | UK | US | Kenya | Singapore | Canada | Australia |
|---|---|---|---|---|---|---|---|
| Regulatory clarity for digital fundraising | 15% | 5 | 3 | 3 | 5 | 4 | 4 |
| Payment rail maturity (cards + wallets + bank) | 12% | 5 | 5 | 4 | 5 | 4 | 4 |
| Mobile money penetration | 8% | 1 | 1 | 5 | 1 | 1 | 1 |
| Church density & openness to digital giving | 10% | 4 | 5 | 5 | 3 | 4 | 4 |
| English-language coverage at launch | 8% | 5 | 5 | 5 | 5 | 5 | 5 |
| Diaspora giving corridor strength | 12% | 5 | 5 | 3 | 2 | 4 | 3 |
| Existing Christian fintech competitor density | 10% | 2 | 5 | 1 | 1 | 2 | 2 |
| Data-protection regime complexity | 10% | 4 | 5 | 4 | 4 | 4 | 4 |
| App Store charitable-donation carve-out clarity | 15% | 5 | 5 | 3 | 3 | 5 | 5 |
| **Weighted total** | | **4.20** | **4.32** | **3.55** | **3.30** | **3.85** | **3.65** |

US scores marginally higher on raw weights but loses on **competitor density** (Tithe.ly, Pushpay, Givelify, Subsplash, Donorbox, RebelGive, easyTithe, Vanco — at least 8 well-funded incumbents). UK has Stewardship.org.uk and Give.net but a much less crowded field, plus the Gift Aid uplift (25% gross-up of donor gift) is a tangible donor benefit competitors do not differentiate on globally.

### Recommendation: **United Kingdom** as pilot market

Reasons:
1. **Charity Commission for England and Wales** is the clearest charity regulator in the English-speaking world; registration paths are documented and predictable.
2. **Gift Aid** mechanics provide a 25% uplift on eligible donor gifts, paid by HMRC — a real product feature, not a marketing claim.
3. **Diaspora corridors:** UK→Nigeria, UK→Kenya, UK→Ghana, UK→Caribbean — high-volume Christian giving flows already exist informally.
4. **Smaller controlled scale** than the US — easier to recover from launch issues.
5. **Less competitor density** in the global Christian giving rail specifically; Stewardship and Give.net are domestic-focused.
6. **Apple App Store policy** has clear UK charitable-donation carve-outs; the iOS app can use a webview or native flow with the IAP carve-out for registered charities (Apple guideline 3.2.1(vi)).

### Expansion path

**Months 0–9 (Pilot):** UK only. Soft-launch private beta at month 4, public beta at month 7, general availability at month 9.

**Months 9–18 (Phase 2 — Diaspora corridors live):**
- **Kenya** — mobile money rails (M-Pesa) and a major UK→Kenya giving corridor.
- **United States** — largest Christian donor base in the world. Enter once UK pilot proves the verification model.

**Months 18–24 (Phase 3 — Reach):**
- **Nigeria** — largest Christian population in Africa, paired strategically with Kenya for shared payment-aggregator infrastructure (Flutterwave / Paystack).
- **Canada** — regulatory similarity to UK (CRA receipts), strong diaspora ties.
- **Australia** — DGR-status charity rules well-defined, English-language, pairs naturally with US/UK code base.

**Year 3+:** South Africa, Ghana, Singapore (regional hub for SE Asia), Philippines.

**Excluded indefinitely without specific reconsideration:** mainland China (Christian fundraising legally restricted under 2018 Religious Affairs Regulations), Saudi Arabia, Iran, North Korea, Eritrea (active Christian persecution; donor and recipient safety risk), and any country on the OFAC SDN comprehensive embargo list at the time of expansion review.

---

## 4. Theological, editorial, and content policy

### Eligibility statement (publish verbatim)
> BURDEN is a platform for verified Christian churches and Christian institutions. To raise funds on BURDEN, an organization must affirm the Nicene Creed (381 AD) and operate under recognized Christian leadership accountable to a denominational body, a registered governing board, or — for African Initiated Churches and other indigenous traditions — a documented elder council whose Christology aligns with Nicene Christianity. Organizations from any historic Christian tradition meeting these markers are welcome. The platform itself does not endorse any one tradition over another.

### Denominational neutrality rules (binding, internal)
1. The home discovery feed must surface verified churches across at least four traditions in any 20-card window, where four are present in the donor's region.
2. Featured Church and Featured Event surfaces are subject to a quarterly diversity audit by the editorial board.
3. No platform-authored copy quotes a denominational distinctive that another tradition would dispute (e.g., the platform itself does not write "the Pope teaches…" or "infant baptism is biblical…" in editorial copy; churches may write whatever they wish on their own page within content boundaries below).
4. Doctrinal disputes between users on impact-update comments default to a notice — "BURDEN does not mediate doctrinal disagreement; please continue this conversation in your local church community" — and the thread is closed, not deleted.

### Featured-church curation governance
- **Editorial board:** five members, rotating two-year terms, drawn from at least four traditions and at least three regions (one African, one Asian/Pacific, one Latin American, two North American/European).
- **Selection criteria:** verification tier ≥ Verified; trust score ≥ 80/100; no open trust & safety case in trailing 90 days; not previously featured in trailing 6 months; story merit (assessed against a published rubric — clarity of need, transparency of plan, evidence of impact).
- **Conflict-of-interest disclosures:** every editor declares affiliations annually; recusal mandatory if any candidate church shares denominational governance with the editor's home congregation.
- **Anti-bias safeguards:** pre-selection mix is reviewed for regional, denominational, language, and church-size diversity (the smallest 25% of churches by donation volume must occupy at least 25% of featured slots quarterly).

### Content boundaries (campaigns and impact updates)
**Prohibited content:**
1. Quid-pro-quo prosperity-gospel claims tying a donor's gift to specific material returns ("seed a $100 gift, reap a $1,000 harvest").
2. Partisan political endorsement of any candidate, party, or referendum question, in any country.
3. Fundraising for the legal defense of any individual under criminal indictment for crimes against minors, sexual assault, or financial fraud — regardless of the church's position on the indictment.
4. Hate speech targeted at any religious, ethnic, sexual-orientation, gender-identity, or national group, defined by the platform's published policy aligning with the EU Code of Conduct on illegal hate speech online.
5. Calls to physical action against named persons, communities, or institutions.
6. Solicitation for activities illegal in either the donor's or the recipient's jurisdiction.

**Sensitive but allowed (with editorial review):**
1. Disaster-response campaigns where governmental access is restricted.
2. Persecuted-church support, with extra care to avoid identifying individual at-risk persons or locations.
3. Historic theological controversies addressed pastorally (e.g., a Reformed church explaining its position on baptism on its own profile).

### Scripture-quoting and translation policy
- The platform itself, in editorial and transactional copy, never quotes Scripture inline. It may *allude* (e.g., "carry the burden together") but does not present chapter-and-verse Scripture as platform speech.
- Churches may quote Scripture freely on their own pages and campaigns. Long quotations (≥ 5 verses) must include a translation citation.
- Default translation menu for impact-update generators: ESV, NIV, NLT, NRSV, KJV (public domain), CSB, Douay-Rheims (public domain), and the donor's locale-default modern translation. Licensing must be confirmed for each — ESV and NIV require commercial-use review with Crossway and Biblica respectively. [counsel-review]
- For non-English markets, the platform will support at minimum: NVI (Spanish), Bíblia Sagrada NTLH (Portuguese), Louis Segond 1910 (French, public domain), Reina-Valera 1960 (Spanish), and locale-default Bibles in priority expansion markets.

### Brand voice rules (binding for product copy)
- Warm, hopeful, plain-spoken. Reverent but not pious.
- No urgency manipulation: never "only X hours left," "only X gifts needed," countdown timers on donation buttons. Progress bars are allowed and accurate.
- No implied spiritual reward for giving: never "God will bless your gift," "your faith is shown by your generosity."
- No shame: never "imagine if no one gave," "this church will close without you."
- Confirmation messages thank without flattery: "Thank you. Your gift of $25 to St. James Cathedral, Lagos has been received and will appear on their dashboard within five minutes."

---

## 5. Core product modules

Each module below has a single named owner in engineering (TBD at hiring) and a clear API surface. Modules marked **MVP** ship in the first release; others are deferred per §8.

| Module | MVP? | One-line purpose |
|---|---|---|
| **Donor App (web + mobile)** | MVP | Give, manage giving, see impact |
| **Church/Institution Dashboard** | MVP | Manage profile, campaigns, payouts, donors |
| **Admin Dashboard** | MVP | Trust & safety queues, verification, payouts oversight |
| **Campaign Management** | MVP | Create/edit/close campaigns, set goals, restrict purposes |
| **Event Highlighting** | v1.1 | Time-bound event campaigns (conferences, mission trips) |
| **Church Highlighting** | v1.1 | Editorial featured-church surface |
| **Global Donation Feed** | v1.1 | Anonymized real-time gift ticker (privacy-preserving) |
| **Giving History** | MVP | Donor's complete gift history, tax receipts |
| **Recurring Donations** | MVP | Monthly/quarterly/annual recurring giving with smart retries |
| **Currency Conversion** | MVP | Live FX with locked rate at donation, donor-facing transparency |
| **Payment Processing** | MVP | Cards, Apple/Google Pay, ACH/Direct Debit, mobile money |
| **Fraud Detection** | MVP (basic) | Risk scoring, velocity rules, manual review queue |
| **KYC/KYB Verification** | MVP | Church verification workflow with document upload |
| **Notifications** | MVP | Email + push; SMS in v1.1, WhatsApp in v2 |
| **Reporting and Analytics** | MVP (basic) | Donor and church dashboards; warehouse + BI in v1.1 |
| **Content Moderation** | MVP | Manual review of campaigns; ML-assisted in v1.1 |
| **User Authentication** | MVP | Email + passkey; Apple/Google SSO in v1.1 |
| **Role-Based Access Control** | MVP | RBAC across donor, church, admin scopes |
| **Multilingual Support** | MVP (en-GB, en-US) | i18n infrastructure shipped MVP; additional locales rolled in |
| **Prayer/Encouragement Feature** | v2 | Donor can leave a prayer note attached to a gift |
| **Testimonials and Impact Stories** | v1.1 | Church publishes verified impact updates |
| **Embeddable Donate Widgets** | v1.1 | iframe + JS snippet for church websites |
| **Public API and Webhooks** | v1.1 | Read-only public API; webhooks to churches in MVP |
| **Emergency / Disaster Campaigns** | v1.1 | Expedited verification path, broader sanctions screening |
| **Major-Gift Workflow** | v2 | $10k+ donations with extra verification + donor relations |
| **Employer Matching / DAF** | v2 | Integrate with Benevity, DAF Direct |
| **Anonymous / Privacy-Tiered Giving** | MVP | Three tiers — public, name-only, fully anonymous |
| **Sermon / Content Embedding** | v2 | Linked, not hosted — YouTube/Vimeo embeds with takedown policy |
| **Receipt and Tax Documentation Engine** | MVP | Per-jurisdiction receipts; Gift Aid declarations; annual giving statements |

---

## 6. User roles and permissions

RBAC built on a permission-grant model: roles bundle permissions; permissions are atomic strings (e.g., `donation:create`, `church:approve`). Permissions are checked at the API layer with policy classes. ABAC is layered for resource-scoped checks (e.g., a Church Admin can only edit *their* church).

| Role | View | Create | Edit | Approve | Cannot access |
|---|---|---|---|---|---|
| **Guest User** | Public church profiles, campaigns, impact updates | Donation (one-time, requires checkout-time email) | Own donation in 60s undo window | — | Recurring giving, donor profile, restricted campaigns |
| **Registered Donor** | Own giving history, receipts, saved churches | Recurring donation, prayer note (v2), comment on impact update | Own profile, payment methods, recurring schedule | — | Other donors' data; church admin; admin tools |
| **Church Representative** | Church profile, draft campaigns, basic analytics | Campaign drafts, impact updates (drafts) | Drafts only | — | Payouts, finance settings, KYB documents, donor PII |
| **Church Finance Officer** | All church data + donor giving on their church (limited PII per donor privacy tier) | Payout requests, tax-export reports | Bank/payout details (with re-auth) | Campaign content within published guardrails | Cannot delete audit logs; cannot bypass payout approval |
| **Church Admin** | Full church data | Campaigns, impact updates, staff invites | Profile, branding, staff roles | Publish campaigns, publish impact updates, approve Finance Officer payouts | Cannot edit verification status; cannot access platform-level admin |
| **Regional Moderator** | Churches and campaigns in assigned region | Trust & safety case notes, manual flags | Case status, internal notes | Routine verification approvals (verified tier only) | Cannot approve premium-trust tier; cannot move funds |
| **Editorial Curator** | All eligible verified churches and campaigns | Featured selections, editorial copy | Editorial slots and schedules | Featured surface assignments | Cannot access PII beyond what is publicly visible |
| **Trust & Safety Reviewer** | All cases, fraud flags, audit logs (read) | Cases, holds on suspicious campaigns/payouts | Case status, evidence | Hold actions; rescindable by Compliance Officer | Cannot move funds; cannot self-approve own holds |
| **Compliance Officer** | All compliance-relevant data | SAR drafts, audit exports, policy exceptions | Verification policies (with second approver) | Premium-trust tier, sanctions whitelist exceptions | Cannot edit own audit log entries; cannot approve own actions |
| **Platform Admin** | Operational dashboards, system health | Configuration changes (with approval workflow) | Most non-financial settings | User-management actions (with second approver for sensitive) | Cannot directly touch production database; cannot approve own permission grants |
| **Super Admin** | Everything | Role definitions, tenant-level settings | Anything (with hard audit + second approver on sensitive paths) | The break-glass approver of last resort | Even Super Admin cannot disable audit logging or delete audit records |

### Sensitive-action two-person rule (binding)
The following actions require a second approver from a different role family before execution:
- Move > $10,000 in any single transaction outside a scheduled payout
- Change a church's verification tier
- Add a country, payment method, or sanctions-list exception
- Access raw donor PII for more than 50 donors at once
- Disable or modify the audit logging pipeline
- Roll back a database migration that touches `donations`, `payouts`, or `audit_logs`

The second approver cannot be the originator's direct manager. Approvals are themselves audit-logged and tied to a hardware-key-backed identity (WebAuthn).

---

## 7. Main user journeys

Each journey is described as actor → trigger → steps → success criteria → failure modes.

### 7.1 Donor discovers a featured church
**Actor:** registered or guest donor in the UK pilot market.
**Trigger:** opens `burden.org` home or BURDEN mobile app.
**Steps:**
1. Home renders Featured Church card (curated weekly, regionally varied) plus a Discover grid.
2. Donor taps card → Church Profile loads with verification badge tier visible (Basic / Verified / Premium-Trust), trust score (e.g., 92/100), country, denomination, photo, mission statement (≤ 280 chars), three most recent impact updates.
3. Each Featured Church has a dedicated "Why featured" sentence written by the editorial board.
4. Donor taps "Give" → enters Donation Checkout.
**Success:** click-through rate ≥ 8% from featured card to donation checkout; conversion ≥ 25% checkout-to-confirmed-gift.
**Failure modes:** trust badge fails to load (donor sees skeletons, gives anyway = bad — block donate button until badge confirmed); discovery surface biased toward one denomination (caught by quarterly diversity audit).

### 7.2 Donor gives $1 (one-time)
1. Donation Checkout loads with amount selector defaulting to last-used or $10. Minimum is $1 USD or local equivalent.
2. Currency auto-detected from IP and donor profile, switchable in one tap.
3. Donor confirms purpose: General Fund (default) or named campaign (if they came from a campaign page).
4. Donor sets privacy tier: Public / Name only / Anonymous (default = Name only).
5. Donor sees fee transparency: "Your $10 → $9.41 to St. James Cathedral, Lagos. $0.59 covers fees. **Cover fees so they receive $10? [Yes ✓ / No]**" with toggle defaulted ON.
6. Payment method selection: saved card / Apple Pay / Google Pay / new card / bank.
7. Donor confirms with Face ID, passkey, or 3DS challenge as required by SCA rules.
8. Idempotency key generated client-side, sent with charge request.
9. Backend charges payment provider, records `donation` and `payment_transaction`.
10. On success, donor sees "Gift sent" screen with: amount, church, expected receipt timing, "see this on your dashboard" deep link.
11. Email receipt sent within 30 seconds; appears in donor's Tax Receipts inbox.
**Success:** end-to-end median latency from "Give" tap to confirmation screen ≤ 6 seconds; failure rate < 1%.
**Failure modes:** SCA challenge fails → retry path; card declined → smart suggestion of alternate method.

### 7.3 Donor sets up recurring giving
1. From any Church Profile or Donation Confirmation: "Make this a recurring gift?"
2. Donor selects frequency (weekly, fortnightly, monthly, quarterly, annual) and start date.
3. Donor sees lifetime total estimate at current frequency for one year.
4. Donor confirms, Stripe Subscription / Direct Debit Mandate created.
5. Donor receives a monthly summary email and an in-app card on the 1st of each month.
6. Smart retries: failed card → 1 retry at 24h, 1 retry at 72h, then donor notified to update payment method; after 14 days of failure, schedule paused (not cancelled) and donor and church both notified.
**Success:** voluntary churn < 4%/month, involuntary churn < 1.5%/month, payment method update rate on dunning > 40%.

### 7.4 Mobile money giving in Kenya (Phase 2)
1. Donor selects M-Pesa as payment method.
2. Backend calls Flutterwave (or Cellulant) → STK push to donor's M-Pesa registered number.
3. Donor approves on their phone with M-Pesa PIN.
4. Confirmation webhook signed and verified; donation finalized.
5. Receipt issued in KES with FX-conversion record (KES → USD reference rate at donation timestamp).
**Failure modes:** STK push timeout (60s) → donor sees retry option; partial confirmation drift → reconciled by hourly cron checking provider transaction status.

### 7.5 Anonymous gift
1. Donor selects "Fully anonymous."
2. Church sees: "Anonymous gift, $50, [campaign name], [date], country: United Kingdom." No name, no email, no donor-ID.
3. Donor still receives a tax receipt with their name; the church-facing record never includes it.
4. Anonymous gifts are tagged in fraud scoring — anonymity raises baseline risk score by +5 points (configurable), which tips marginal cases into review.
**Edge case:** in jurisdictions with charity-law transparency rules above a threshold (e.g., UK Charity Commission requires reporting individual gifts > £25,000 from related parties), the platform discloses to the church *only* "An anonymous gift exceeded reporting threshold; please consult counsel" — never the donor identity, but the church is informed they have a regulatory obligation.

### 7.6 Major-gift donor (> $10,000)
1. Donation Checkout flags amount → "Gift over $10,000 — please verify your identity for compliance."
2. Donor completes a one-time enhanced KYC (full legal name, address, source-of-funds attestation, ID document via Persona).
3. Donor is contacted within one business day by Donor Relations (a real human; SLA tracked) to confirm intent and offer alternate funding method (bank transfer, DAF, stock gift) if it would reduce fees or improve tax outcome.
4. Charge processed; payout to church may be batched into next scheduled payout cycle, not expedited (intentional friction to detect fraud).

### 7.7 Church registers on BURDEN
1. Church Admin signs up at `burden.org/for-churches` with email + passkey.
2. Three-step intake: organization details, leadership contacts, doctrinal affirmation (Nicene Creed checkbox + denominational selection).
3. Stripe Connect / Stripe Identity onboarding in parallel for the bank account (church-side KYB).
4. Document upload: incorporation/registration certificate, governance document (constitution/articles), proof of leadership (denominational letter, ordination certificate, board minutes).
5. Status: **Pending Review** — visible to church only, not yet on Discover.
6. Trust & Safety review SLA: 5 business days target, 10 business days max for pilot market; reviewer either approves to **Verified**, requests further documents, or declines with reason.

### 7.8 Church submits documents for verification
- Documents uploaded directly to encrypted S3 (server-side encryption with KMS, customer-managed key per tenant).
- Each document has metadata: type, uploader, upload timestamp, document hash, retention tier.
- Reviewer interface displays document with PII masking toggle; raw PII access requires re-authentication and is audit-logged.
- Document retention: 7 years post-account-closure for KYB documents (UK Money Laundering Regulations 2017, regulation 40); donor PII retained per per-jurisdiction policy in §15.

### 7.9 Church creates a fundraising campaign
1. Church Admin → "New Campaign."
2. Required fields: title (≤ 80 chars), purpose statement (≤ 500 chars), fundraising goal (or "ongoing"), end date (or "ongoing"), restricted-vs-unrestricted toggle, beneficiary statement ("Funds will be used for [X], [Y], [Z]"), category (Building / Mission / Relief / Education / Operations / Discipleship / Other).
3. Optional: hero photo, three update photos, video link.
4. Campaign auto-draft saved; "Submit for review."
5. Review SLA: 2 business days. Most campaigns from already-Verified churches auto-approve via content-moderation ML pass + light human spot-check (10% sample).
6. Published; church can edit factual updates but cannot edit the original purpose statement after first donation lands (audit trail visible to donors).

### 7.10 Institution creates an event fundraiser
- Same flow as 7.9 but with required event metadata: date, location (city/country, not full address), expected attendance, ticket-or-free.
- Event campaigns auto-close 7 days after event date; final reconciliation report sent to organizer 14 days after.

### 7.11 Disaster / emergency campaign with expedited verification
1. Already-verified church or institution requests "Emergency Mode" from their dashboard within 72 hours of a recognized disaster (cross-checked against ReliefWeb, IFRC, government emergency declarations).
2. Trust & Safety reviewer SLA collapses to 4 hours for expedited path.
3. Funds collected go into a held account; payouts begin only after reviewer + Compliance Officer dual-approval (not the standard single-approver flow).
4. Public campaign page shows a banner: "Emergency campaign — expedited verification. Funds released in tranches with public reporting at each disbursement."

### 7.12 Admin reviews and approves a church
1. Reviewer opens case from queue (sorted by SLA-risk).
2. Reviewer sees: doctrinal affirmation, documents (with hash + uploader), public web search summary (auto-generated by ML; reviewer must mark as "reviewed"), denominational endorsement status, Stripe KYB status.
3. Reviewer decides: **Approve to Verified**, **Request more info**, **Decline**.
4. On approve, second approver (Regional Moderator or Compliance Officer for sensitive cases) signs off with WebAuthn re-auth.
5. Church notified via email with welcome content and next-step prompts (create first campaign, add staff).

### 7.13 Admin flags suspicious activity
1. Trust & Safety dashboard surfaces fraud_flags by risk score.
2. Reviewer opens case, sees: triggering signals, related transactions, related users/churches.
3. Reviewer can: place a payout hold (prevents next scheduled disbursement), pause donation acceptance for the church (with church-facing notice), open a structured investigation case, or dismiss with rationale.
4. All actions are second-approver-gated as per §6.

### 7.14 Donor receives impact updates
1. After a campaign reaches 25%, 50%, 75%, 100% of goal — or every 30 days for ongoing campaigns — the church is prompted to publish an impact update.
2. Impact updates include: progress narrative (≤ 1,200 chars), at most three photos, optional one-minute video link.
3. Donors who gave to that campaign get an in-app notification + email.
4. Updates are timestamped and archived; cannot be silently deleted (only marked superseded with reason).

### 7.15 Donor disputes a donation or requests a refund
1. From Giving History, donor selects gift → "Request refund" or "Dispute."
2. Refund window: 7 days from gift, no-questions-asked, full refund minus non-refundable processing fees (donor sees the exact amount before confirming).
3. After 7 days: case opened, church notified, Trust & Safety mediates.
4. If church has not yet been paid out, refund is straightforward.
5. If church has been paid out, refund is processed from platform reserves and a clawback request is logged against the church's next payout (per terms of service).
**Failure mode:** mass refund event (e.g., scandal at a featured church) — incident response plan §16 invoked; refunds processed in bulk; communications drafted by Trust & Safety + Comms.

### 7.16 Church receives first payout
1. Church Admin sets up payout method (UK bank via Stripe Connect / mobile money in Phase 2 markets).
2. Holding period: 7 days from each donation for first 90 days post-verification, then 3 days steady-state.
3. Payouts batch weekly (Tuesday) for first 90 days, then daily (Pro tier) or weekly (free).
4. Payout statement includes: gross gifts, donor-covered fees, platform fee, processor fee, FX conversions, net to bank.
5. Each payout is downloadable as CSV + PDF for accounting.

---

## 8. MVP scope (and what to cut)

### MVP definition
A four-month build to a private beta in the United Kingdom only, then a three-month controlled public beta, totalling seven months from kickoff to general availability in market one.

### MVP feature list (ship)
- Donor account, login (email + passkey), profile, giving history, recurring giving, tax receipts inbox.
- Donor web app (Next.js), donor mobile app (React Native — iOS + Android), shared component library.
- Church account, dashboard, KYB intake, document upload, basic analytics, payout management.
- Admin: trust & safety queue, KYB review, manual fraud-flag review, second-approver workflow, audit log viewer.
- Campaign management (create, publish, edit non-load-bearing fields, close).
- Donation flow: one-time, recurring, multi-currency, $1 minimum, donor-covered fees default-on, idempotency, SCA-compliant.
- Payment providers: Stripe (cards, Apple Pay, Google Pay, ACH, UK Direct Debit via Stripe + GoCardless fallback). Mobile money deferred to Phase 2 (Kenya).
- Currency conversion: Stripe's underlying conversion + a published markup-free policy (we pass through Stripe's rate; we do not earn FX margin).
- Notifications: email (Postmark for transactional, Customer.io for lifecycle) + native push.
- Multilingual infrastructure: en-GB and en-US shipped MVP. Spanish (es-ES, es-MX), French (fr-FR), Portuguese (pt-BR), and Swahili (sw-KE) pre-translated for Phase 2 launch.
- Tax receipts: UK Gift Aid declarations + receipt generation; US 501(c)(3) substantiation receipts via fiscal sponsor.
- KYC for major-gift donors (>$10k) via Persona; KYB for churches via Stripe Identity + manual review.
- Sanctions screening on every donor and church via ComplyAdvantage (or Refinitiv World-Check One — pick one in §9, recommend ComplyAdvantage for SMB API ergonomics).
- Audit logs (append-only, signed, 7-year retention).
- Public church profile pages (SEO-optimised, JSON-LD `Organization`/`NGO` markup).
- Webhooks to churches (donation.created, donation.refunded, payout.completed).
- Basic accessibility — WCAG 2.2 AA on all donor-facing flows.

### v1.1 (months 8–12)
Embeddable donate widget; impact updates feature; SMS notifications; mobile money in Kenya; Featured Church / Featured Event editorial surface; public read-only API; ML-assisted content moderation; advanced church analytics; church custom subdomain (BURDEN Pro tier launch).

### v2 (year 2)
WhatsApp notifications; sermon embedding; major-gift workflow with relationship management; employer matching (Benevity); donor-advised fund integrations (DAF Direct, Fidelity Charitable); prayer/encouragement attached to gifts; group/team giving; legacy giving setup pages; DAF-Operator status migration if elected.

### Future advanced
Crypto/stablecoin giving (deferred until regulatory clarity in pilot markets stabilises); voice-led giving for low-literacy users; USSD fallback for low-bandwidth markets; offline-first mobile mode for unreliable-connectivity regions; on-platform church-to-church grant flows; denomination-level enterprise dashboards.

### What to cut from MVP (be honest)
- **Featured Church surface** — editorial governance is complex; ship Discover with a simple recency + diversity ranking algorithm, defer human curation to v1.1.
- **Public donation feed (anonymized ticker)** — emotional manipulation risk + privacy review + abuse vectors; not worth the MVP cycles.
- **Prayer notes attached to gifts** — content moderation surface area is not worth it pre-PMF.
- **Sermon embedding** — Apple App Store policy on third-party media plus moderation overhead.
- **Crypto** — regulatory complexity will dominate engineering bandwidth; do not begin.
- **WhatsApp** — Meta business verification for a regulated donations entity is a multi-month process; defer.
- **Native iOS in-app giving with Apple's IAP carve-out** — ship the iOS app with a webview-based giving flow at MVP (Apple permits charitable donations outside IAP per guideline 3.2.1(vi), but the documentation around it is fragile; webview flow is safer for launch). Migrate to native flow in v1.1 once App Store approval is confirmed.
- **Major-gift workflow** — manual handling for first 6 months; <50 such gifts expected.
- **ML fraud scoring** — start with rules + manual review, train on real data through year one.

---

## 9. Recommended tech stack

All choices are opinionated. Where I name a vendor, the rationale is in line with it.

### Frontend (web)
- **Next.js 15 (App Router)** on **React 19** — server components for SEO-critical pages (church profiles), edge rendering for low TTFB globally.
- **TypeScript 5.7** strict.
- **Tailwind CSS 4** for utility styling.
- **shadcn/ui** as the base component layer, customized to the BURDEN design system.
- **TanStack Query 5** for server state.
- **react-hook-form 7** + **Zod 3** for forms and validation.
- **next-intl 3** for i18n.

### Mobile
- **React Native 0.76** with **Expo SDK 52** (managed workflow with prebuild for native modules).
- Shared UI primitives via a `packages/ui-native` package; web and mobile diverge at the screen level but share design tokens and types.
- **Why React Native over Flutter or native:** code-sharing with web team; faster iteration; mature ecosystem for payments SDKs (Stripe React Native SDK); access to over-the-air update via EAS Update for non-binary fixes.
- **Why not native:** team size at MVP is ≤ 6 engineers; native dual-track is too expensive. Revisit at year 2 if performance demands it.

### Backend
- **NestJS 11** on **Node.js 22 LTS**, **TypeScript 5.7**.
- **Why NestJS:** opinionated module structure that maps cleanly to the modular monolith; first-class DI; mature ecosystem for the validation, queue, and microservice patterns we need.
- **Why not Go / Java / .NET:** team-size constraint and shared TypeScript across the monorepo wins.
- **Fastify** as the underlying HTTP adapter for performance.
- **BullMQ** on Redis for background jobs (payout reconciliation, webhook delivery, email batching).
- **tRPC** is *not* recommended despite the TypeScript fit — we need REST for the public API, mobile native, and church integrations.

### Database
- **PostgreSQL 17** on **AWS RDS Multi-AZ** (db.r7g.xlarge MVP, scale up to db.r7g.4xlarge by 100k MAU).
- **Redis 7.4** on **AWS ElastiCache** for cache, rate-limiting, BullMQ queues.
- **Read replica** for analytics/exports; primary for transactional writes only.
- **PgBouncer** for connection pooling.
- **Schema migrations via Prisma 5** (generated types + migration tooling) — acknowledging Prisma's runtime overhead, accept the trade-off for dev velocity at MVP; can migrate to **Drizzle** later if needed.
- **Logical backups + PITR** with 35-day window.

### Authentication
- **Clerk** for donor and church authentication — passkeys, social SSO, email magic links, organization model maps to multi-user church dashboards.
- **Why Clerk over Auth0 or Supabase Auth:** developer ergonomics; built-in organizations primitive (matches church-with-multiple-staff model); pricing model fits an MVP donor base.
- **Why not roll your own:** auth is a sinkhole; we'd rather fund Trust & Safety than NIH on auth.
- Internal admin auth: **Cognito + WebAuthn-required** with hardware key enrolment (YubiKey 5C) for all platform staff.

### Cloud hosting
- **AWS** as primary cloud.
- Region: `eu-west-2` (London) for pilot, `us-east-1` (N. Virginia) for US expansion, `af-south-1` (Cape Town) for Africa expansion.
- **AWS ECS Fargate** for backend services (no Kubernetes at MVP — operational overhead unjustified).
- **AWS Lambda** for event-driven workflows (webhook fanout, scheduled jobs, image processing).
- **AWS API Gateway** for the public API and webhook ingest.
- **AWS S3** for object storage (per-tenant prefix; SSE-KMS with customer-managed keys for sensitive document uploads).
- **AWS CloudFront** as CDN with **Lambda@Edge** for geo-aware routing and security headers.
- **AWS Route 53** for DNS with health checks.

### Payment providers
- **Stripe** as primary payment processor (cards, Apple Pay, Google Pay, ACH, SEPA Direct Debit, BACS Direct Debit via Stripe).
- **GoCardless** for UK Direct Debit redundancy and Gift Aid pre-built integrations.
- **Flutterwave** for African mobile money (Phase 2: Kenya M-Pesa, Nigeria, Ghana).
- **PayPal Giving Fund** considered as secondary in US — deferred until v1.1 due to integration complexity and brand-risk in tying to PayPal's policies.

### KYC/KYB
- **Persona** for donor identity verification (>$10k threshold) and church-leadership verification.
- **Stripe Identity** as the integrated path for church KYB during Stripe Connect onboarding.
- **ComplyAdvantage** for sanctions and PEP screening (better SMB API than World-Check; competitive accuracy).
- **Why Persona over Sumsub / Onfido / Veriff:** US/UK coverage parity, faith-tech-friendly ToS, configurable workflow templates, strong support tier at SMB pricing.

### Email
- **Postmark** for transactional email (donation receipts, password resets, security alerts) — best-in-class deliverability for transactional volume.
- **Customer.io** for lifecycle email (onboarding sequences, reactivation, monthly summaries).

### SMS / WhatsApp
- **Twilio** for SMS, with **Twilio WhatsApp Business API** for v2 WhatsApp.

### Analytics / observability
- **PostHog** (self-hosted in EU region for data residency) for product analytics + feature flags + experimentation.
- **Sentry** (EU data residency) for frontend, mobile, and backend error monitoring.
- **Datadog** for APM, logs, traces, alerts.
- **Snowflake** as the warehouse from year 2 (BigQuery as alternative; Snowflake chosen for partner ecosystem and Christian-non-profit standardization).
- **dbt Core** for warehouse modelling.

### CI / CD
- **GitHub Actions** for CI.
- **Turborepo** for monorepo orchestration.
- **Vercel** for the marketing site and Next.js preview deploys; **AWS ECS** for production backend deploys via GitHub OIDC + Terraform Cloud.
- **EAS Build + EAS Submit** for mobile.

### Infrastructure as code
- **Terraform 1.9** for AWS account-level and shared infrastructure.
- **AWS CDK (TypeScript)** for app-level infrastructure that's tightly coupled to the application code.
- **Atlantis** for Terraform PR automation.

### Admin tooling
- **Retool** for the internal admin console at MVP (faster than building it).
- Migrate to a custom admin app (`apps/admin`) by v1.1 once workflows stabilise, because Retool's audit-log fidelity and SSO/RBAC granularity are insufficient for SOC 2 Type II.

### Feature flags / experimentation
- **PostHog feature flags** (already in stack); **LaunchDarkly** is an alternative if scale demands.

### Translation management
- **Phrase** (formerly PhraseApp) for translation memory + workflow with paid translators.
- **Crowdin** as alternative; Phrase chosen for stronger TMS workflow.

### Other
- **Cloudflare Turnstile** for bot mitigation on public surfaces (registration, donation forms).
- **Cloudflare R2** is *not* used; we keep object storage on S3 to consolidate IAM and KMS policy. AWS WAF in front of CloudFront.
- **HashiCorp Vault** for secrets management; **AWS Secrets Manager** for AWS-native runtime secrets.
- **Doppler** considered and deferred — Vault is over-spec for MVP but worth the operational investment for SOC 2 readiness.

### Stack summary table
| Concern | Choice |
|---|---|
| Web | Next.js 15, React 19, TypeScript 5.7, Tailwind 4 |
| Mobile | React Native 0.76, Expo SDK 52 |
| Backend | NestJS 11, Node.js 22 LTS |
| DB | Postgres 17 RDS Multi-AZ, Redis 7.4 |
| Auth | Clerk (consumer) + Cognito + WebAuthn (staff) |
| Cloud | AWS multi-region, ECS Fargate + Lambda |
| Payments | Stripe + GoCardless + Flutterwave |
| KYC/KYB | Persona + Stripe Identity + ComplyAdvantage |
| Email | Postmark + Customer.io |
| SMS | Twilio |
| Analytics | PostHog + Datadog + Sentry + Snowflake |
| CI/CD | GitHub Actions + Turborepo + Terraform 1.9 |
| Admin | Retool (MVP) → custom (v1.1) |

---

## 10. System architecture

### Architectural style: **Modular monolith** (with selectively extracted services)

A single deployable NestJS application is divided into **strict modules** with explicit module boundaries, each with its own database schema namespace and queue topics. Code crossing module boundaries goes through published in-process interfaces; the boundaries are enforced by ESLint module-boundary rules.

**Why a modular monolith for MVP:**
- Team size at MVP is 6–10 engineers; microservices would consume a third of the team on platform plumbing.
- Single transactional database simplifies the *most critical correctness boundary* (donations + payouts must be transactionally consistent or auditable in one place).
- Future extraction is cheap because module boundaries are already strict.

**What is extracted as a separate service from Day One:**
- **Payment Webhook Ingestor** — a Lambda function that receives Stripe / Flutterwave / GoCardless webhooks, verifies signatures, persists to a webhook event table, and enqueues for processing. Separate from the monolith for blast-radius isolation.
- **Media Processor** — Lambda + ffmpeg layer for image/video processing on document and impact-update uploads.
- **Sanctions Screener** — Lambda + ComplyAdvantage client; called inline from monolith but isolated for IP allowlisting and to keep ComplyAdvantage credentials out of the main app.
- **PDF Receipt Generator** — Lambda using a templating engine; isolated so receipt template changes don't require backend deploys.

**What is *not* extracted at MVP:**
- Donations service, Churches service, Campaigns service, Notifications dispatcher, Admin service — all live as modules in the monolith.

### Component diagram (text)

```
                         ┌──────────────────┐
                         │  Cloudflare WAF  │
                         └────────┬─────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │      AWS CloudFront CDN       │
                  │  (Lambda@Edge geo-routing)    │
                  └───────────────┬───────────────┘
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐   ┌────────────▼─────────────┐   ┌───────▼────────┐
│ Donor Web App  │   │   Public Marketing Site  │   │  Mobile Apps   │
│  Next.js 15    │   │       Next.js 15         │   │  RN + Expo     │
│  (Vercel)      │   │       (Vercel)           │   │  (App stores)  │
└───────┬────────┘   └────────────┬─────────────┘   └───────┬────────┘
        │                         │                         │
        │     ┌─ Public read API ─┴─────────────────────────┘
        │     │
        ▼     ▼
┌──────────────────────────────┐         ┌────────────────────────┐
│   AWS API Gateway (REST)     │◀────────│  Webhook Ingestor      │
│   + Cognito JWT Authorizer   │         │  (Lambda)              │
└──────────────┬───────────────┘         └────────────────────────┘
               │                                      │
               ▼                                      ▼
┌────────────────────────────────────────────────────────────────┐
│                  BURDEN Monolith (NestJS 11)                   │
│                  Deployed on ECS Fargate (multi-AZ)            │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Donor    │ │ Church   │ │ Donation │ │ Payout   │          │
│  │ module   │ │ module   │ │ module   │ │ module   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Verify   │ │ Trust&   │ │ Notif    │ │ Admin    │          │
│  │ module   │ │ Safety   │ │ module   │ │ module   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Tax/     │ │ Search   │ │ Audit    │                        │
│  │ Receipt  │ │ module   │ │ module   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
└──┬─────────────┬───────────────┬───────────────┬───────────────┘
   │             │               │               │
   ▼             ▼               ▼               ▼
┌────────┐  ┌────────┐  ┌──────────────┐  ┌──────────────┐
│ Postgres│  │ Redis  │  │ S3           │  │ External     │
│ RDS     │  │ Elasti │  │ + KMS        │  │ Services:    │
│ Multi-AZ│  │ Cache  │  │ + CloudFront │  │ Stripe,      │
│ +Replica│  │        │  │              │  │ Flutterwave, │
└────────┘  └────────┘  └──────────────┘  │ GoCardless,  │
                                          │ Persona,     │
                                          │ Stripe Id,   │
                                          │ ComplyAdv,   │
                                          │ Postmark,    │
                                          │ Customer.io, │
                                          │ Twilio       │
                                          └──────────────┘
```

### Multi-region considerations
- **MVP:** single primary region `eu-west-2` (London). Read replica + S3 cross-region replication to `us-east-1` for DR (RTO 4h, RPO 5min).
- **Phase 2:** active in `eu-west-2` and `us-east-1`. Donor data partitioned by region of residence to comply with GDPR + state privacy laws. A global donor profile service holds only IDs and routing data; PII lives in the regional DB.
- **Phase 3 (Africa):** `af-south-1` for Kenya/Nigeria/SA donor and church data.
- **Mainland China:** not operating. Geo-blocked at CloudFront.
- **EU GDPR (Article 44–50):** all EU donor PII stays in `eu-west-2`. Cross-border transfers limited to Standard Contractual Clauses where required (e.g., Persona has SCCs in place; Stripe is GDPR-compliant via SCCs).
- **UK GDPR (post-Brexit):** UK data stays in `eu-west-2` (London) which is post-Brexit-aligned for adequacy; no separate UK-only region needed at MVP.
- **Nigeria NDPR:** local processing strongly preferred; `af-south-1` covers this from Phase 3, with controller-of-record statements per Nigerian Data Protection Commission guidance.
- **India DPDP (2023):** not operating in India at MVP; revisit when expanding.
- **Kenya Data Protection Act 2019:** the Office of the Data Protection Commissioner permits cross-border transfer with consent + adequate safeguards; we will register with the ODPC before Kenya launch.

---

## 11. Database design

Conventions used below: `PK` = primary key; `FK` = foreign key; `(idx)` = indexed; `(pii)` = personally identifiable, encrypted at column level with AWS KMS customer-managed key, key rotation annual; `(fin)` = financial data, same encryption tier; `(pci)` = NEVER stored — references token only.

### Core tables

**users**
- `id` UUID PK
- `email` (pii) (idx, unique)
- `email_verified_at` timestamptz
- `phone` (pii) nullable
- `display_name` text
- `legal_first_name` (pii) nullable
- `legal_last_name` (pii) nullable
- `country` text (ISO-3166-1 alpha-2)
- `locale` text
- `kyc_tier` enum('none','standard','enhanced')
- `kyc_verified_at` timestamptz nullable
- `created_at`, `updated_at`, `deleted_at` timestamptz
- Indexes: `(email)`, `(country)`, `(kyc_tier)`
- Security: row-level security policy enforcing users can only read their own row via the donor app

**roles**
- `id` UUID PK
- `name` text (e.g., 'donor', 'church_admin', 'platform_admin')
- `description` text
- `created_at`

**permissions**
- `id` UUID PK
- `code` text unique (e.g., 'donation:create', 'church:approve')
- `description` text

**role_permissions**
- `role_id` FK → roles
- `permission_id` FK → permissions
- Composite PK

**user_roles**
- `user_id` FK → users
- `role_id` FK → roles
- `scope_type` enum('global','church','region') — for scoped roles
- `scope_id` UUID nullable
- `granted_by` FK → users
- `granted_at` timestamptz
- Composite PK

**churches**
- `id` UUID PK
- `legal_name` (pii) text
- `display_name` text
- `slug` text unique (idx)
- `country` text
- `region` text
- `denomination` text (idx)
- `tradition` enum('catholic','orthodox','oriental_orthodox','anglican','lutheran','reformed','methodist','baptist','pentecostal','non_denominational','other')
- `nicene_affirmation_at` timestamptz
- `verification_tier` enum('pending','basic','verified','premium_trust','suspended','rejected')
- `trust_score` integer (0–100)
- `trust_score_updated_at` timestamptz
- `mission_statement` text (≤ 280 chars)
- `website_url` text
- `primary_admin_id` FK → users
- `stripe_account_id` text (idx) — Stripe Connect
- `stripe_account_status` enum('pending','enabled','disabled')
- `currency_default` text (ISO-4217)
- `published_at` timestamptz nullable
- `created_at`, `updated_at`, `deleted_at`
- Indexes: `(country, verification_tier)`, `(slug)`, `(stripe_account_id)`
- Security: write requires `church_admin` scoped to this church or platform admin

**institutions**
- (Same structure as churches; differs by `kind` enum and verification rubric)
- `kind` enum('seminary','school','hospital','orphanage','missions_agency','relief_org','other')
- All other fields parallel to `churches`

**verification_documents**
- `id` UUID PK
- `church_id` FK
- `kind` enum('incorporation','governance','leadership','denominational_endorsement','tax_status','bank_proof','other')
- `s3_key` text — encrypted at rest, customer-managed KMS key per tenant prefix
- `sha256_hash` text
- `uploaded_by` FK → users
- `uploaded_at` timestamptz
- `reviewed_by` FK → users nullable
- `reviewed_at` timestamptz nullable
- `review_status` enum('pending','accepted','rejected','superseded')
- `review_notes` text (pii — may contain leadership names, encrypted)
- `retention_until` date — set at upload to 7 years post-account-closure
- Indexes: `(church_id, review_status)`
- Security: PII access audit-logged at row level via DB triggers

**campaigns**
- `id` UUID PK
- `church_id` FK
- `slug` text unique
- `title` text (≤ 80)
- `purpose_statement` text (≤ 500) — IMMUTABLE after first donation
- `purpose_statement_locked_at` timestamptz nullable
- `goal_amount` bigint (minor units; nullable for ongoing)
- `goal_currency` text
- `start_date` date
- `end_date` date nullable
- `category` enum('building','mission','relief','education','operations','discipleship','other')
- `is_emergency` boolean default false
- `emergency_approved_by` FK → users nullable
- `restriction` enum('restricted','unrestricted')
- `status` enum('draft','submitted','approved','live','paused','closed','rejected')
- `published_at` timestamptz nullable
- `created_at`, `updated_at`
- Indexes: `(church_id, status)`, `(status, end_date)` for surfaces, `(category, country)` denormalized

**events** (sub-type of campaigns for time-bound)
- `id` UUID PK
- `campaign_id` FK
- `event_date` date
- `location_city` text
- `location_country` text
- `expected_attendance` integer nullable

**donations**
- `id` UUID PK (UUIDv7 — time-orderable for index locality)
- `donor_user_id` FK → users nullable (null for guest donations)
- `donor_email_at_gift` (pii) text — captured at gift time even for guests
- `donor_country_at_gift` text
- `church_id` FK
- `campaign_id` FK nullable
- `amount_minor` bigint
- `currency` text (ISO-4217)
- `amount_usd_reference_minor` bigint — converted at donation time for reporting only
- `fx_rate_used` numeric(20,10)
- `donor_covered_fees` boolean
- `platform_fee_minor` bigint
- `processor_fee_minor` bigint
- `net_to_church_minor` bigint
- `privacy_tier` enum('public','name_only','anonymous')
- `payment_transaction_id` FK → payment_transactions
- `idempotency_key` text unique
- `status` enum('pending','succeeded','refunded','partially_refunded','failed','disputed','chargeback')
- `risk_score` integer nullable (set by fraud module)
- `created_at`, `succeeded_at`, `refunded_at`
- Indexes: `(donor_user_id, created_at desc)`, `(church_id, status, created_at desc)`, `(campaign_id, status)`, `(idempotency_key)`, `(risk_score) where risk_score > 50`
- Security: append-only-effective; updates allowed only for status transitions and refund records; tracked in audit_logs

**donation_allocations**
- For split gifts (e.g., to multiple campaigns) — generally not used at MVP
- `id` UUID PK; `donation_id` FK; `campaign_id` FK; `amount_minor` bigint

**recurring_donations**
- `id` UUID PK
- `donor_user_id` FK
- `church_id` FK
- `campaign_id` FK nullable
- `amount_minor` bigint
- `currency` text
- `frequency` enum('weekly','fortnightly','monthly','quarterly','annual')
- `next_run_at` timestamptz (idx)
- `payment_method_id` FK
- `status` enum('active','paused','cancelled','dunning')
- `dunning_attempts` integer default 0
- `dunning_started_at` timestamptz nullable
- `cancelled_reason` text nullable
- `provider_subscription_id` text — Stripe Subscription ID
- Indexes: `(next_run_at) where status='active'`

**currencies**
- `code` text PK (ISO-4217)
- `decimals` integer
- `is_active` boolean
- `display_symbol` text

**fx_rates**
- `id` UUID PK
- `from_currency` text
- `to_currency` text
- `rate` numeric(20,10)
- `source` enum('stripe','flutterwave','ecb_reference')
- `captured_at` timestamptz (idx)
- Composite index `(from_currency, to_currency, captured_at desc)`

**payment_transactions**
- `id` UUID PK
- `provider` enum('stripe','flutterwave','gocardless')
- `provider_charge_id` text (idx, unique)
- `donation_id` FK nullable (set after donation row created)
- `amount_minor` bigint
- `currency` text
- `status` enum('requires_action','succeeded','failed','refunded','disputed')
- `failure_code` text nullable
- `failure_message` text nullable
- `provider_payload_redacted` jsonb (pii redacted; full payload archived to S3 with stricter retention)
- `created_at`, `updated_at`
- Indexes: `(provider, provider_charge_id)`, `(status)`

**payment_methods (tokenized)**
- `id` UUID PK
- `user_id` FK
- `provider` text
- `provider_token` text (idx) — opaque token, never card PAN (pci)
- `brand` text — 'visa','mc','amex','apple_pay','google_pay','bacs_dd','sepa_dd'
- `last4` text
- `exp_month` integer nullable
- `exp_year` integer nullable
- `country` text
- `is_default` boolean
- `created_at`, `deleted_at`

**payouts**
- `id` UUID PK
- `church_id` FK
- `period_start` timestamptz
- `period_end` timestamptz
- `gross_amount_minor` bigint
- `fees_total_minor` bigint
- `refunds_total_minor` bigint
- `net_amount_minor` bigint
- `currency` text
- `payout_method_id` FK
- `provider` enum('stripe_connect','flutterwave_payout','direct_bank')
- `provider_payout_id` text (idx)
- `status` enum('scheduled','in_transit','paid','failed','reversed','held')
- `held_reason` text nullable
- `released_at`, `paid_at` timestamptz nullable
- Indexes: `(church_id, status, period_end desc)`

**payout_methods**
- `id` UUID PK
- `church_id` FK
- `kind` enum('bank','mobile_money')
- `provider_token` text (fin) — Stripe Connect token; mobile money number tokenized via Flutterwave
- `currency` text
- `country` text
- `is_default` boolean
- `verified_at` timestamptz nullable

**impact_updates**
- `id` UUID PK
- `church_id` FK
- `campaign_id` FK nullable
- `body` text (≤ 1,200)
- `published_at` timestamptz
- `superseded_by` FK → impact_updates nullable
- `superseded_reason` text nullable
- `media_keys` text[] — S3 keys
- Indexes: `(campaign_id, published_at desc)`

**testimonials**
- `id` UUID PK
- `church_id` FK
- `body` text
- `author_consent_recorded_at` timestamptz
- `published_at` timestamptz
- `status` enum('draft','published','retracted')

**notifications**
- `id` UUID PK
- `user_id` FK
- `kind` text — typed event ('donation.confirmed','recurring.failed' …)
- `channel` enum('email','push','sms','in_app','whatsapp')
- `payload` jsonb
- `dispatched_at` timestamptz nullable
- `delivered_at` timestamptz nullable
- `read_at` timestamptz nullable

**admin_reviews**
- `id` UUID PK
- `kind` enum('church_verification','campaign','impact_update','fraud_flag','dispute','tier_change')
- `subject_type` text — polymorphic
- `subject_id` UUID
- `assigned_to` FK → users nullable
- `status` enum('open','in_review','approved','rejected','escalated','requires_more_info')
- `decision_rationale` text
- `second_approver_id` FK → users nullable
- `second_approver_at` timestamptz nullable
- `created_at`, `closed_at`

**audit_logs**
- `id` UUID PK
- `actor_user_id` FK nullable (null for system actions)
- `actor_role` text
- `action` text — verb-noun ('updated_payout','viewed_donor_pii')
- `subject_type` text
- `subject_id` UUID
- `before` jsonb nullable (pii redacted)
- `after` jsonb nullable
- `ip_address` (pii) inet
- `user_agent` text
- `request_id` text — distributed trace
- `created_at` timestamptz (idx, BRIN for write performance)
- Indexes: BRIN on `(created_at)`; btree on `(subject_type, subject_id, created_at desc)`; btree on `(actor_user_id, created_at desc)`
- Security: append-only enforced via revoking UPDATE and DELETE from app role; signed with HMAC-SHA-256 daily aggregate hash to detect tampering

**fraud_flags**
- `id` UUID PK
- `kind` enum('velocity','geo_mismatch','sanctions_hit','duplicate_org','document_anomaly','dispute_pattern','manual')
- `subject_type` text
- `subject_id` UUID
- `severity` enum('low','medium','high','critical')
- `details` jsonb
- `auto_action_taken` text nullable — 'hold_payout','pause_donations','none'
- `created_at`, `cleared_at`, `cleared_by`

**trust_scores**
- `church_id` FK PK
- `score` integer
- `calculated_at` timestamptz
- `factors` jsonb — explainable breakdown
- (See §17 for methodology)

**user_sessions**
- `id` UUID PK
- `user_id` FK
- `clerk_session_id` text — handed off to Clerk for primary
- `ip_address` (pii) inet
- `user_agent` text
- `created_at`, `last_active_at`, `revoked_at`

**feature_flags / experiments**
- Managed in PostHog; mirror cache table in DB for emergency local fallback only.

**idempotency_keys**
- `key` text PK
- `user_id` FK nullable
- `endpoint` text
- `request_hash` text
- `response_status` integer
- `response_body` jsonb
- `created_at`, `expires_at`

**webhook_events**
- `id` UUID PK
- `provider` text
- `event_id` text unique (idx)
- `signature_verified_at` timestamptz nullable
- `payload` jsonb (sensitive fields redacted)
- `processing_status` enum('received','processing','processed','failed','dead_letter')
- `attempts` integer default 0
- `last_error` text nullable
- `created_at`

**tax_receipts**
- `id` UUID PK
- `donor_user_id` FK nullable
- `donor_email_at_gift` (pii) text
- `jurisdiction` text — 'US_501c3','UK_GiftAid','CA_T3010','AU_DGR' etc.
- `tax_year` integer
- `amount_total_minor` bigint
- `currency` text
- `donations_included` UUID[] — references donations
- `pdf_s3_key` text
- `issued_at` timestamptz
- `gift_aid_declaration_id` FK nullable

**gift_aid_declarations** (UK-specific)
- `id` UUID PK
- `donor_user_id` FK
- `declaration_signed_at` timestamptz
- `claim_period_start` date
- `claim_period_end` date
- `status` enum('active','revoked','superseded')
- `home_address` (pii) jsonb — required for HMRC

**consent_records**
- `id` UUID PK
- `user_id` FK
- `purpose` text — 'marketing_email','analytics','third_party_sharing'
- `granted` boolean
- `version_text` text — exact policy version shown
- `granted_at`, `revoked_at` timestamptz

**data_subject_requests**
- `id` UUID PK
- `user_id` FK
- `kind` enum('access','deletion','rectification','portability','restriction')
- `status` enum('received','verifying_identity','processing','completed','rejected')
- `received_at`, `completed_at`
- `evidence_s3_key` text — completion artifacts

**embed_widgets**
- `id` UUID PK
- `church_id` FK
- `key` text unique — public widget key
- `secret_hash` text — HMAC verification for postMessage events
- `allowed_origins` text[]
- `theme_json` jsonb
- `created_at`, `revoked_at`

**api_keys**
- `id` UUID PK
- `church_id` FK nullable
- `partner_id` FK nullable
- `key_prefix` text (idx)
- `key_hash` text
- `scopes` text[]
- `rate_limit_per_minute` integer
- `last_used_at`
- `created_at`, `revoked_at`

### Indexing principles
- Primary write hot-path tables (`donations`, `payment_transactions`, `audit_logs`) use UUIDv7 for index locality.
- `donations` table partitioned by `created_at` monthly once volume > 5M rows (don't partition pre-emptively).
- Heavy read surfaces (Discover) served from materialized views refreshed every 5 minutes for `featured_churches`, `top_campaigns`.
- Full-text search on `churches.display_name`, `mission_statement`, `country`, `denomination` via Postgres `tsvector` with GIN index. Move to a dedicated search service (OpenSearch) only when needed (likely v1.1 if at all).

### Encryption + secrets
- All `(pii)` and `(fin)` columns: pgcrypto column-level encryption with key from AWS KMS, customer-managed key, separate KMS key per data class (donor_pii, financial, kyb_documents).
- All disks: KMS-encrypted at rest (default RDS).
- TLS 1.3 in transit with strict cipher suite policy.
- DB credentials rotated quarterly via AWS Secrets Manager rotation Lambda.

---

## 12. API design

### Design choices
- **REST** with JSON; OpenAPI 3.1 spec generated from NestJS controllers.
- Versioning: URL-path versioning, `v1`. Deprecation policy: 12-month overlap.
- Authentication: Clerk-issued JWT in `Authorization: Bearer …`. Internal admin uses Cognito tokens with WebAuthn-required sessions.
- Idempotency: `Idempotency-Key` header required on all mutating endpoints that create money movement; replay returns the original response within 24h.
- Rate limits: per-IP and per-key, sliding window in Redis. Default donor: 60 req/min for reads, 10/min for writes. Public API: 30/min default with paid tiers.
- Pagination: cursor-based; `?cursor=…&limit=50`. Limit max 100.
- Errors: RFC 7807 `application/problem+json` with stable `code` strings (`donation_minimum_not_met`, `church_not_verified`).
- Public API surface intentionally narrow at MVP: only public church/campaign read endpoints + webhook events to churches.

### Endpoint catalogue (selected; full OpenAPI spec generated from code)

#### Authentication (delegated to Clerk; documented for clarity)
- `POST /v1/auth/sign-up` — proxied to Clerk; creates user; returns session JWT.
- `POST /v1/auth/sign-in` — proxied to Clerk.
- `POST /v1/auth/passkey/register-options` — WebAuthn ceremony.
- `POST /v1/auth/passkey/verify`
- `POST /v1/auth/sign-out`

#### User profile
- `GET /v1/me` — own profile. Auth: donor.
- `PATCH /v1/me` — body: `display_name?`, `phone?`, `locale?`, `country?`. Auth: donor (self).
- `GET /v1/me/donations?cursor=…&limit=…` — own giving history. Auth: donor (self).
- `GET /v1/me/recurring-donations` — Auth: donor (self).
- `GET /v1/me/tax-receipts?year=…` — Auth: donor (self).

#### Church directory + profile
- `GET /v1/churches?country=&denomination=&q=&cursor=` — public; rate limit 60/min/ip.
- `GET /v1/churches/:slug` — public church profile; cacheable 60s at edge.
- `GET /v1/churches/:id/campaigns?status=live` — public.
- `GET /v1/churches/:id/impact-updates?cursor=` — public.

#### Church onboarding (church-side)
- `POST /v1/churches` — create church draft. Auth: any registered donor (becomes primary admin). Body: legal_name, country, denomination, doctrine_affirmation_signature.
- `PATCH /v1/churches/:id` — Auth: church_admin (scoped). Cannot modify verification fields.
- `POST /v1/churches/:id/staff/invitations` — invite Finance Officer / Representative. Auth: church_admin.
- `DELETE /v1/churches/:id/staff/:userId` — Auth: church_admin.
- `POST /v1/churches/:id/verification-documents` — pre-signed S3 upload URL flow. Auth: church_admin.
- `POST /v1/churches/:id/submit-for-verification` — Auth: church_admin.

#### Verification (admin-side)
- `GET /v1/admin/verifications?status=pending` — Auth: trust_safety_reviewer.
- `POST /v1/admin/verifications/:caseId/approve` — Auth: trust_safety_reviewer + second approver. Body: tier ('verified'|'premium_trust'), notes.
- `POST /v1/admin/verifications/:caseId/reject` — Auth: trust_safety_reviewer. Body: reason_code, donor_visible_message?, internal_notes.
- `POST /v1/admin/verifications/:caseId/request-info` — Auth: trust_safety_reviewer.

#### Campaigns
- `POST /v1/churches/:id/campaigns` — Auth: church_admin.
- `PATCH /v1/campaigns/:id` — Auth: church_admin (own). After first donation, `purpose_statement` becomes 422 immutable.
- `POST /v1/campaigns/:id/submit` — Auth: church_admin.
- `POST /v1/admin/campaigns/:id/approve` — Auth: trust_safety_reviewer.
- `POST /v1/campaigns/:id/close` — Auth: church_admin.

#### Donations
- `POST /v1/donations` — primary money-mover. Idempotency-Key required. Body: `amount_minor`, `currency`, `church_id`, `campaign_id?`, `payment_method_id`, `donor_covered_fees`, `privacy_tier`, `gift_aid_declaration_id?`. Auth: optional (guests permitted).
  - Returns: `{ donation_id, status, requires_action?, client_secret? }` for SCA.
  - Side-effect: creates donation in `pending`, creates payment_transaction, calls Stripe with idempotency, runs sanctions screen + fraud check inline.
- `POST /v1/donations/:id/confirm` — for SCA challenge completion.
- `POST /v1/donations/:id/refund` — Auth: donor (within 7 days), trust_safety_reviewer (any time).
- `GET /v1/donations/:id` — Auth: donor (own) or church_admin (own church).

#### Recurring donations
- `POST /v1/recurring-donations` — Auth: donor.
- `PATCH /v1/recurring-donations/:id` — Auth: donor (own). Allowed: amount, frequency, next_run_at, payment_method_id.
- `POST /v1/recurring-donations/:id/pause` — Auth: donor.
- `POST /v1/recurring-donations/:id/resume` — Auth: donor.
- `DELETE /v1/recurring-donations/:id` — Auth: donor.

#### Currency conversion
- `GET /v1/fx?from=GBP&to=USD&amount_minor=10000` — public, cached 60s.

#### Featured churches / events
- `GET /v1/featured/churches?region=` — public.
- `GET /v1/featured/events?region=` — public.

#### Search & discovery
- `GET /v1/search?q=&type=church|campaign&country=&cursor=` — public.

#### Impact updates
- `POST /v1/campaigns/:id/impact-updates` — Auth: church_admin.
- `PATCH /v1/impact-updates/:id` — Auth: church_admin. Once published, only the body and media may be updated, and the original is preserved as `superseded_by`.

#### Admin review
- `GET /v1/admin/cases?status=&kind=` — Auth: per role.
- `POST /v1/admin/cases/:id/decide` — Auth: assigned reviewer + second approver where required.

#### Fraud
- `POST /v1/fraud-reports` — Auth: any user. Body: subject_type, subject_id, description.
- `GET /v1/admin/fraud-flags?severity=` — Auth: trust_safety_reviewer.

#### Notifications
- `GET /v1/me/notifications?cursor=` — Auth: self.
- `POST /v1/me/notifications/:id/read` — Auth: self.
- `PATCH /v1/me/notification-preferences` — Auth: self.

#### Embed widget config
- `POST /v1/churches/:id/embed-widgets` — Auth: church_admin.
- `GET /v1/churches/:id/embed-widgets` — Auth: church_admin.
- `DELETE /v1/embed-widgets/:id` — Auth: church_admin.

#### Webhooks emitted to churches
- Endpoint: church configures URL in dashboard.
- Events: `donation.created`, `donation.succeeded`, `donation.refunded`, `donation.disputed`, `payout.scheduled`, `payout.paid`, `payout.failed`, `recurring_donation.activated`, `recurring_donation.failed`, `recurring_donation.cancelled`, `campaign.approved`, `verification.tier_changed`.
- Signature: HMAC-SHA-256 over body with shared secret per webhook endpoint, in header `BURDEN-Signature: t=<unix-ts>,v1=<hex>`.
- Replay protection: timestamp tolerance 5 minutes; clients must reject older.
- Retries: exponential backoff (0s, 30s, 2m, 10m, 1h, 6h, 24h), max 7 attempts; dead-letter queue and email-to-church notification on final failure.

#### Inbound webhooks (we receive)
- `POST /v1/webhooks/stripe` — verified via Stripe-Signature header.
- `POST /v1/webhooks/flutterwave` — verified via shared secret + IP allowlist.
- `POST /v1/webhooks/gocardless` — verified via Webhook-Signature header.
- `POST /v1/webhooks/persona` — verification status updates.

### Security notes (apply to all endpoints)
- TLS 1.3 only; HSTS with `max-age=63072000; includeSubDomains; preload`.
- All mutating endpoints CSRF-protected via `SameSite=Lax` cookies + custom header on cross-origin.
- Input validation via Zod schemas at controller boundary; reject unknown fields strictly.
- Output filtering: response DTOs explicitly listed; no auto-serialization of entity to response.
- Rate limits enforced per identity + IP; aggressive limits on login, donation creation, search.
- Bot mitigation via Cloudflare Turnstile on signup, donation, fraud-report endpoints.

---

## 13. Payment and donation flow

### One-time donation, end-to-end (UK donor → UK church via card)

```
Donor app                BURDEN backend             Stripe                    DB
   │                          │                       │                       │
   │  POST /v1/donations      │                       │                       │
   │  {amount, church, …}     │                       │                       │
   ├─────────────────────────▶│                       │                       │
   │                          │  validate, screen     │                       │
   │                          │  sanctions (sync),    │                       │
   │                          │  insert donation row  │                       │
   │                          │  (status=pending)     │                       │
   │                          ├──────────────────────────────────────────────▶│
   │                          │                       │                       │
   │                          │  PaymentIntent.create │                       │
   │                          │  with idempotency key │                       │
   │                          ├──────────────────────▶│                       │
   │                          │                       │                       │
   │                          │  client_secret        │                       │
   │                          │◀──────────────────────┤                       │
   │  client_secret           │                       │                       │
   │◀─────────────────────────┤                       │                       │
   │                          │                       │                       │
   │  Stripe Elements confirm │                       │                       │
   │  (SCA challenge if reqd) │                       │                       │
   ├──────────────────────────────────────────────────▶                       │
   │                          │                       │                       │
   │  payment_succeeded       │                       │                       │
   │◀──────────────────────────────────────────────────                       │
   │                          │                       │                       │
   │                          │  webhook: charge.succeeded                    │
   │                          │◀──────────────────────┤                       │
   │                          │                       │                       │
   │                          │  verify signature,    │                       │
   │                          │  update donation,     │                       │
   │                          │  emit notifications,  │                       │
   │                          │  enqueue receipt PDF  │                       │
   │                          ├──────────────────────────────────────────────▶│
```

### Recurring donation
- Backed by Stripe Subscriptions (cards) or BACS Direct Debit Mandates via Stripe + GoCardless redundancy.
- Each charge cycle hits a webhook → identical confirmation flow as one-time.
- **Smart retries** via Stripe Smart Retries config: retry on day 1, 3, 7. Card-account-updater enabled.
- **Dunning UX:** after first failure, donor receives in-app card + email. After day 7 with no resolution, schedule pauses and church + donor notified.
- **Voluntary churn telemetry:** track cancellation reasons (drop-down at cancel: "financial," "moved church," "lost trust," "switching method," "other"). Aggregated for product feedback; never visible to the church.

### Multi-currency donation
- Donor sees prices in their inferred local currency.
- The donation is *charged* in the donor's currency; the *destination* church receives in their local currency after Stripe FX conversion.
- We pass through Stripe's FX rate without markup (key trust signal), display the rate at confirmation, and persist `fx_rate_used` and `amount_usd_reference_minor` for analytics.

### $1 minimum
- Validation enforced at API and UI layer.
- For currencies with naturally larger denominations (e.g., 1 IDR is ~$0.00006), use a minimum of "$1 USD or local equivalent rounded up to next sensible unit" — recompute weekly from FX.

### Platform fees and donor-covered fees
- Computed at the API layer at donation creation time and persisted on the donation row (`platform_fee_minor`, `processor_fee_minor`, `donor_covered_fees`, `net_to_church_minor`).
- Donor-covered toggle defaults ON; the donor sees both options before confirming.
- Platform fee never increases mid-campaign.

### Refund handling
- 7-day no-questions-asked window — donor self-serve. Processing fees non-refundable per processor terms; donor sees the exact refund amount before confirming.
- After 7 days: case opened in admin queue; church notified.
- If church already paid out: refund processed from BURDEN reserve; clawback queued against next payout per ToS.
- Tax receipt void issued automatically; donor's annual statement adjusts.

### Failed payment handling
- Decline codes from Stripe mapped to donor-facing copy:
  - `insufficient_funds` → "Your card was declined for insufficient funds. Please try a different method."
  - `card_velocity_exceeded` → "Your bank declined this charge. Please contact your bank or try later."
  - `do_not_honor` → "Your bank declined this charge. Please try a different card or contact your bank."
- Never expose raw decline codes; never auto-retry without donor consent.

### Chargeback handling
- Inbound dispute webhook → donation status `disputed`; payout for that period auto-held if disputes > 0.5% of period volume for that church.
- Trust & Safety queue surfaces dispute; reviewer can submit evidence to Stripe via API.
- Net financial impact (chargeback + dispute fee) charged against church reserve in line with terms; if church has no reserve, deducted from next payout.

### Payouts to churches
- Default payout cadence: weekly (Tuesday) for first 90 days; daily (Pro) or weekly (free tier) thereafter.
- Holding period: 7 days from each donation for first 90 days, then 3 days steady-state.
- Payout currency = church's chosen currency; FX done at payout time.
- Payout includes a downloadable PDF + CSV statement.

### Compliance checks (every donation, every church)
- **Donor-side:** AML transaction monitoring (velocity, amount, geography); sanctions list screening for donor email + name when KYC tier ≥ standard; PEP screening for major-gift donors.
- **Church-side:** sanctions screening on KYB at onboarding, weekly batch re-screening, ad-hoc re-screen on any verification document update.
- **Bilateral:** if either donor or church country pair triggers an enhanced-risk rule (e.g., FATF grey list), the donation routes through a manual review queue before settlement.

### Receipt generation
- Triggered on `donation.succeeded` webhook.
- Templated PDF generated by the dedicated Lambda using Handlebars + Puppeteer + WeasyPrint fallback.
- Per-jurisdiction template selection (see §14).
- Stored to S3 with KMS encryption; URL signed with 7-day TTL when emailed; donor can re-download from Tax Receipts Inbox indefinitely.

### Mobile money rails (Phase 2)
- **M-Pesa Kenya** via Flutterwave: STK push from BURDEN backend → donor approves on phone → Flutterwave webhook on success.
- **MTN MoMo (Ghana, Uganda, Cameroon)** via Flutterwave or direct MTN MoMo API.
- **Airtel Money** via Flutterwave.
- Retry/timeout: STK push timeout 60s; one auto-retry; then donor sees "We didn't receive confirmation — please check your phone or try a different method."
- Reconciliation: hourly job pulls Flutterwave transaction status for any donation in `pending` > 30 minutes.

### Mobile wallets
- **Apple Pay / Google Pay** integrated via Stripe; no separate merchant onboarding.
- Recurring giving via Apple Pay/Google Pay supported via Stripe Subscription with the wallet as the default payment method, with the donor's card-network token.
- **Samsung Pay** deferred — limited Stripe support, low Christian-donor footprint relative to engineering cost.

### Crypto / stablecoin
- **Recommendation: NOT at MVP, NOT at v1.1.** Re-evaluate at year 2 once UK and US pilot markets are stable and FATF Travel Rule implementation has clarified for non-custodial donations.
- If/when added: only stablecoin (USDC) via a regulated processor (Circle, BitPay) with full sanctions screening + chain analytics (Chainalysis Reactor or TRM Labs).

### Disbursement methods to churches
- **UK:** Stripe Connect to UK bank, BACS direct.
- **US:** Stripe Connect to US bank, ACH.
- **Kenya:** Flutterwave payout to M-Pesa B2C or bank.
- **Nigeria:** Flutterwave to NGN bank.
- **Multi-rail redundancy per region:** at least two payout providers per major region by year 2 to mitigate provider outage risk.

### FX risk and treasury policy
- Held funds (between donation and payout) sit in segregated FBO accounts at the platform's banking partner.
- We do not hedge FX between donation and payout; the holding period is short (3–7 days) and the volume manageable. We disclose this to churches in onboarding.
- Interest accrued on held funds → BURDEN Foundation general assistance fund (per §2). Published quarterly.

### App Store policy
- **iOS:** Apple App Store Review Guideline 3.2.1(vi) permits charitable donation collection outside of IAP for "approved charitable organizations." We will:
  1. Apply for the charitable status carve-out before submitting.
  2. **Ship MVP with a webview-based giving flow** to avoid review risk.
  3. Migrate to native flow in v1.1 once Apple confirms the carve-out approval.
- **Android:** Google Play permits donations through standard payment methods for registered non-profit organisations under their Donations Policy. We register before submission.

---

## 14. Tax receipting per jurisdiction

The platform's role and the receipt content vary by jurisdiction. The data model supports this via the `tax_receipts.jurisdiction` discriminator and per-jurisdiction template files.

[counsel-review across the entire section]

### United States — 501(c)(3)
- **Platform role:** at MVP, **fiscal sponsor model** via a registered 501(c)(3) sponsor. Donations are made to the sponsor, restricted to the recipient church, then granted by the sponsor to the church.
- **Substantiation requirements (IRC §170(f)(8)):** for any single donation ≥ $250, donor needs a written acknowledgment from the recipient including: amount, statement that no goods/services were provided in return (or a description and good-faith estimate of the value if any were), date.
- **Quid-pro-quo disclosures (§170(f)(17)):** required if donor receives goods/services > $75 — N/A on BURDEN since no goods/services are exchanged.
- **Receipt copy:**
  > Thank you for your gift. [Sponsor Name] (a 501(c)(3) public charity, EIN XX-XXXXXXX) received your gift of $[amount] on [date], restricted for the benefit of [Church Name]. No goods or services were provided in return. Please retain this acknowledgment for your tax records.

### United Kingdom — Gift Aid
- **Platform role:** UK CIO (BURDEN Foundation UK) acts as the receiving charity. Donations land at the CIO; the CIO pays out to verified churches as restricted grants. Gift Aid is claimed by the CIO from HMRC on eligible donations.
- **Gift Aid Declaration (HMRC):** required from each UK taxpayer donor; valid for past 4 years and future donations until cancelled. Stored in `gift_aid_declarations`.
- **Uplift mechanic:** donor gives £100 → CIO claims £25 from HMRC → £125 total available to grant out (less platform fee).
- **Donor-facing:** at checkout, eligible donors prompted to declare Gift Aid eligibility once; subsequent donations auto-uplift.
- **Annual statement:** donors receive an HMRC-compliant annual statement summarising donations + Gift Aid claimed.

### Canada — CRA
- **Platform role:** at expansion, register as a registered Canadian charity (or partner with one) so the platform can issue official Canadian receipts.
- **Receipt requirements (Income Tax Act §3501, CRA guidance):** unique serial number, charity name + BN, charity registration number, donor name + address, gift amount, gift date, place of issue, signature of authorized individual, statement that it is an official receipt for income tax purposes, CRA website URL.
- Receipt template encodes all of these.

### Australia — DGR
- **Platform role:** partner with an Australian DGR Item 1 endorsed charity at launch; revisit independent DGR registration year 2.
- **Receipt:** must include charity name, ABN, DGR endorsement statement, donor name, gift amount, gift date.

### Kenya — KRA
- **Platform role:** in Kenya, donations to a registered charity exempt under Income Tax Act §10 are deductible to the extent of 100% of the donation. Receipt requirements: PIN of the charity, charity name + registered address, donor name + PIN where available, amount, date.

### Nigeria — Companies Income Tax / Personal Income Tax
- Donations to organizations listed in 5th Schedule of CITA are deductible. Receipt must include FIRS-recognized organization status; lower individual-deduction relevance because of NPF tax structure. Receipt copy clarifies deductibility scope.

### South Africa — Section 18A
- Recipient must be a Public Benefit Organisation with §18A status. Receipt requires PBO number, recipient name, donor name + ID/passport/registration number, amount, statement that the donation will be used solely for §18A activities, date, signature.

### Ghana — Internal Revenue
- Charitable deductions exist but are tightly scoped under Income Tax Act 2015. Receipts include charity registration number; donor-side deductibility is limited. Receipt copy makes this clear so donors do not over-claim.

### Receipt engine architecture
- Per-jurisdiction template (Handlebars-based) checked into the repo under `services/receipts/templates/<jurisdiction>.hbs`.
- Receipt generation Lambda renders to PDF with Puppeteer (chromium-aws-lambda).
- PDFs stored in S3 with object lock (compliance mode) for the retention period required by the donor's jurisdiction (US: 7 years; UK: 6 years; Canada: 6 years; Australia: 5 years; default 7).
- Annual giving statements: cron job in January generates per-donor consolidated statements for the prior calendar year; donor receives email + in-app card.

---

## 15. Compliance and legal considerations

[counsel-review the entire section]

A compliance program built around the "three lines" model: (1) product/operations builds in controls, (2) compliance officer reviews, (3) external annual audit verifies.

### KYC / KYB
- **Donor KYC:** none for gifts < $1,000 cumulative annual; standard tier (name, email, country) for $1k–$10k; enhanced (Persona ID verification, source of funds attestation) above $10k. Major gifts above $25k get a manual call.
- **Church KYB:** Stripe Identity for the primary admin, document review for the institution, denominational endorsement or registration document required.
- Documentation retained 7 years post-account closure (UK Money Laundering Regulations 2017 reg. 40).

### AML transaction monitoring
- Velocity rules: per-donor limits at $5k/day, $20k/week, $50k/month default; raised by KYC tier.
- Pattern detection: round-numbers from new donors to new churches to high-risk geographies → manual review.
- SAR filing: at MVP, our payment partner (Stripe) is the regulated entity for card flows; we file SARs only when independently obligated. As we move toward DAF-Operator status (year 2+), we will need our own AML program with a designated Money Laundering Reporting Officer (MLRO) under UK FCA-equivalent rules where applicable.

### Sanctions screening
- ComplyAdvantage (or Refinitiv World-Check One) integrated.
- Lists: OFAC SDN, OFAC sectoral, UK HMT consolidated, EU consolidated, UN consolidated, FATF.
- Frequency: at donor signup, at every donation pre-clearance, batch-rescreen weekly for active donors and churches.
- Hits: hard-block donation; raise compliance case; manual disposition with audit trail.

### PEP screening
- Donors above the major-gift threshold and all church admins screened against PEP lists. Hits raise enhanced due diligence; not auto-block.

### Charity / fundraising regulations per market
- **UK:** Charity Commission registration for the CIO; Fundraising Regulator code of practice compliance; Code of Fundraising Practice adherence.
- **US:** state-by-state charitable solicitation registration via a service (e.g., Harbor Compliance) — required in ~40 states; covered by fiscal sponsor at MVP.
- **Canada:** CRA charitable registration when entering.
- **Australia:** ACNC registration; state-level charitable fundraising licences (NSW, Vic, etc.).
- **Kenya, Nigeria, South Africa, Ghana:** charity registration paths vary; engage local counsel before launch.

### Data privacy
- **GDPR (EU):** lawful bases — legitimate interest for service operation, consent for marketing. DPO appointed; DPIA conducted before launch and on any major feature touching PII. Right to access (Art. 15), erasure (Art. 17), portability (Art. 20), restriction (Art. 18), objection (Art. 21) implemented via `data_subject_requests` workflow with 30-day SLA.
- **UK GDPR + Data Protection Act 2018:** parallel implementation; ICO registration as a data controller.
- **CCPA/CPRA (California):** "Do Not Sell or Share" link, opt-out for the limited personalized-recommendation use, annual training for handlers.
- **Quebec Law 25:** privacy officer designation, breach notification, automated-decision-making disclosure.
- **Nigeria NDPR:** registration with the NDPC; data protection compliance organization (DPCO) audit annually; data localization preferences.
- **Kenya DPA 2019:** ODPC registration; cross-border transfer with consent + adequacy.
- **India DPDP 2023:** not in scope until India entry.

### PCI-DSS scope reduction
- Scope: SAQ-A by using Stripe Elements (card data never touches our servers).
- Documented PCI scope review annually.
- Tokenized card storage only via Stripe; raw PAN never stored.

### Tax receipt rules per jurisdiction
- See §14.

### Donation disclaimers (every donation receipt)
- Donations are restricted/unrestricted as labelled.
- Funds may be redirected by the recipient charity to its general fund if the specific campaign over-funds, per terms — we make this explicit.
- BURDEN platform fee non-refundable except in cases of fraud or platform error.

### Terms, privacy, refund, verification policies
- ToS: drafted by counsel, donor and church versions distinct, English at launch with translation review for each new market.
- Privacy policy: GDPR/UK GDPR/CCPA-aligned; standalone supplementary notices per jurisdiction.
- Refund policy: published, machine-readable in product.
- Church verification policy: published verbatim.

### Insurance program (Day-One coverage)
- **Cyber liability:** $5M minimum coverage from Day One; scale to $25M at $50M ARR.
- **Errors & omissions / professional liability:** $5M.
- **Fidelity bond / crime:** $5M covering employee dishonesty and funds-in-transit.
- **Directors & officers:** $3M.
- **General commercial liability:** standard.
- Recommended brokers: Embroker, Vouch, or Founder Shield (faith-tech-friendly track record).

### Reserve & capital requirements
- Stripe Connect: holds part of held funds in reserve as part of standard platform terms.
- BURDEN's own reserve: we maintain a chargeback reserve equal to 90 days of expected dispute volume + a goodwill refund reserve of $250k by month 6.
- These are funded from operating capital, not from float (which goes to assistance fund).

### What happens to held donor funds if BURDEN shuts down
A published, contractually binding wind-down plan, executed via the PBC charter and the UK CIO's governing document:
1. Donation acceptance pauses immediately.
2. Held funds for confirmed donations are paid out to verified churches per existing payout schedule.
3. Funds for unfulfilled campaigns are either (a) paid out to the originating church if approved by the Trust & Safety wind-down committee, or (b) granted to a successor charity nominated in the CIO's articles (recommended successor: Stewardship.org.uk for UK funds).
4. Donor data retained per legal obligations, then permanently deleted.
5. Independent administrator appointed to oversee.

This wind-down plan is published before launch.

### Geographic restrictions
- Excluded indefinitely: mainland China, Saudi Arabia, Iran, North Korea, Eritrea, Syria, Sudan, Cuba, Crimea/Donetsk/Luhansk, Belarus (subject to current sanctions), Myanmar (subject to current sanctions).
- Donor and church IP geo-blocking enforced at CloudFront + at API layer for defense in depth.

---

## 16. Cybersecurity framework

### Threat model (STRIDE + payment-specific)
- **Spoofing:** account takeover, webhook impersonation, fake church registration. Controls: passkeys, WebAuthn for staff, signed webhooks with timestamp tolerance, KYB review.
- **Tampering:** man-in-the-middle on donation, audit log tampering, document substitution after upload. Controls: TLS 1.3 only, signed audit log daily aggregate hash, S3 object lock for documents, content hash recorded at upload.
- **Repudiation:** donor disputes a donation that was theirs; admin denies an action. Controls: complete audit logs with WebAuthn-bound staff sessions, idempotency keys, signed receipts.
- **Information disclosure:** donor PII leak, KYB document leak, query injection. Controls: column-level encryption, parameterized queries, RLS, network egress allowlist for sensitive services.
- **Denial of service:** donation flow flooded; spam church registrations. Controls: WAF, rate limits, Turnstile, Lambda concurrency limits, staged rollout.
- **Elevation of privilege:** church admin gains platform admin; donor gains church admin. Controls: strict RBAC, ABAC scope checks, privilege boundary tests in CI.
- **Payment-specific:** card-testing attacks, BIN attacks, donation laundering. Controls: Stripe Radar, our own velocity rules, sanctions screening, Cloudflare bot scoring.

### Authentication
- **Donors:** Clerk-managed; passkeys preferred; magic link or email + password fallback; SSO via Apple, Google.
- **MFA:** required for any donor with cumulative giving > $1k or any saved payment method. Always required for church admins. Always required for platform staff.
- **Passwordless option:** WebAuthn passkeys default for new donor signups.
- **Staff:** Cognito + WebAuthn-only (YubiKey 5C / 5C NFC distributed at hire). No passwords for staff.
- **Session management:** sliding 30-day donor session, 8-hour idle timeout, hard 90-day max. Staff: 2-hour idle, 8-hour hard.
- **Session storage:** HttpOnly, Secure, SameSite=Lax cookie with rotating refresh token; CSRF token bound to session.

### Authorization
- RBAC + ABAC enforced at API layer with policy classes; defence-in-depth at DB layer with RLS for the most sensitive tables (donations, payouts, audit_logs, verification_documents).
- Least privilege at IAM: distinct AWS IAM roles per service module; Lambda functions assume narrow roles; staff console access via SSO + permission set scoped per role.

### Encryption
- **At rest:** RDS, S3, EBS all KMS-encrypted with customer-managed keys (CMK). Separate CMK per data class: `donor-pii-cmk`, `financial-cmk`, `kyb-documents-cmk`, `logs-cmk`. Annual key rotation enabled.
- **In transit:** TLS 1.3 only; HSTS preloaded; cipher policy `TLS-AES-128-GCM-SHA256`/`TLS-AES-256-GCM-SHA384`/`TLS-CHACHA20-POLY1305-SHA256`.
- **Application-level column encryption** on PII fields via pgcrypto for defence in depth.

### Secrets management
- HashiCorp Vault primary; AWS Secrets Manager for AWS-native runtime injection.
- No secrets in repo, ever; pre-commit hooks (gitleaks, trufflehog).
- Quarterly rotation enforced; emergency rotation runbook tested quarterly.

### API protections
- Rate limits: per-IP, per-key, per-identity, sliding window in Redis.
- Input validation: Zod at controller; reject unknown fields strict.
- Output sanitization: explicit response DTOs, never raw entities.
- WAF rules: OWASP top-10 patterns, geo-block, IP reputation scoring.
- Cloudflare Turnstile on registration, donation, fraud-report.

### Webhook security
- Inbound: signature verification + timestamp tolerance (5 min) + idempotency by event_id.
- Outbound: HMAC signature; secret rotated per endpoint; tolerance documented; retries with exponential backoff to dead letter.

### Audit logging
- Every privileged read and every write of auditable entity logged with actor, action, subject, before/after redacted snapshot, request ID, IP.
- Append-only enforced by revoking UPDATE/DELETE from app role; log-receiver service writes via dedicated narrowly-permissioned role.
- Daily HMAC-SHA-256 chain hash recorded in a separate immutable store (AWS S3 with object lock, compliance mode); makes silent tampering detectable.
- 7-year retention default; financial-record-touching logs to legal-hold-eligible storage.

### Admin activity monitoring
- All staff actions audit-logged with WebAuthn-bound identity.
- Anomaly detection on staff access (unusual hour, bulk PII access, atypical geography) → alert + auto-MFA-step-up.
- Quarterly access review: every staff member's permission set re-attested by their manager.

### Fraud detection
- Rules engine on top of Stripe Radar at MVP.
- Custom rules: velocity, geography mismatch, new-donor-large-gift, new-church-large-inflow.
- ML scoring deferred to v1.1 once labelled fraud data accumulates.

### Backups & disaster recovery
- RDS automated backups + PITR with 35-day window.
- Logical backup to S3 cross-region daily.
- DR drills quarterly: simulate primary region failure, restore in `us-east-1`, validate data integrity.
- **RTO 4 hours, RPO 5 minutes** at MVP; tighten to RTO 1 hour, RPO 1 minute by year 2.

### Incident response
- 24/7 on-call rotation from Day 90.
- Severity definitions:
  - **SEV-1:** funds-at-risk, PII breach, complete outage. PagerDuty page; CEO/CTO/Compliance immediately.
  - **SEV-2:** partial outage, suspected fraud cluster, vendor outage. On-call response within 30 min.
  - **SEV-3:** degraded performance, contained issue.
- Post-incident review within 5 business days with blameless RCA.
- Customer-facing status page (`status.burden.org`) with incidents posted within 30 min of internal SEV-1 declaration.
- Breach notification: GDPR 72-hour notification to ICO; donor notification per CCPA / state law thresholds.

### Security testing
- **SAST:** Semgrep in CI on every PR.
- **DAST:** OWASP ZAP scheduled weekly against staging.
- **IAST:** Contrast Security or equivalent in staging.
- **Dependency scanning:** Dependabot + Snyk for Node, Renovate for everything else; CVSS ≥ 7 blocks deploy.
- **Container scanning:** AWS ECR scanning + Trivy.
- **Secret scanning:** GitGuardian + gitleaks pre-commit.

### Penetration testing
- Day 60: light pen test by an independent firm before private beta.
- Annual full pen test thereafter.
- Targeted pen test post-major-feature (recurring giving launch, mobile money launch, API launch).
- **Bug bounty:** launch via HackerOne or Intigriti at public-beta — Day-One commitment. Initial scope: production donation flow, auth, public API. Rewards: $250–$15k by severity.

### Compliance certifications roadmap
- **SOC 2 Type II:** kickoff at month 3 (pre-launch); Type I report by month 9; Type II by month 18.
- **ISO 27001:** kickoff after SOC 2 Type II; certification target month 30, driven by enterprise denomination customers.
- **PCI-DSS:** SAQ-A self-assessment annually from Day One.

---

## 17. Fraud and trust system

### Trust score (published methodology)

Range 0–100, calculated nightly per church and on-event for major changes.

Components, with weights:

| Factor | Weight | Description |
|---|---|---|
| Verification tier | 25 | Pending=0, Basic=15, Verified=22, Premium-Trust=25 |
| Documentation completeness | 10 | 7 of 7 docs = 10; sliding |
| Identity validation strength | 10 | Persona match, denominational endorsement strength |
| Transaction history clean | 15 | No fraud_flags in last 180 days; chargeback rate < 0.5% |
| Donor satisfaction signals | 10 | Refund rate; dispute rate; donor retention on recurring |
| Transparency behaviour | 15 | Impact updates frequency relative to campaigns; goal-vs-actual transparency |
| Tenure | 5 | Ramps to full at 24 months on platform |
| External signals | 10 | Denominational standing, government registration in good standing, no adverse media |

Score is shown to donors (rounded to 5) with a "Why this score?" disclosure that displays the named components — but never with the underlying weights, to avoid gaming.

### Verification tiers
- **Basic:** registered legal entity confirmed; doctrinal affirmation recorded. Donation cap: $25k aggregate per month.
- **Verified:** Basic + leadership identity + denominational endorsement OR two-church referral. Donation cap: $250k/month. Eligible for Featured Church.
- **Premium-Trust:** Verified + 12+ months track record + independent annual review of finances submitted to BURDEN. No donation cap. Eligible for Featured Church + multi-day campaigns + emergency response.

### Specific detection patterns
- **Suspicious donations:** velocity threshold breaches, geography mismatch (donor IP vs payment country vs church country triangulation), card-testing patterns (many small attempts in short window from a single IP).
- **Suspicious payouts:** sudden large inflow followed by immediate large outflow request, repeated reset of bank account in short window.
- **Duplicate institutions:** name + country + denomination fuzzy match; image hash comparison on logos.
- **Document anomalies:** EXIF metadata inconsistent with claimed location, file watermarks indicating editing software, dates implausible.
- **Donor disputes:** more than 1% of a church's donations disputed → automatic Trust & Safety case.

### Donor-readable transparency
- Each church profile shows: verification tier badge, trust score (rounded), tenure on platform, total raised lifetime, total payouts disbursed lifetime, three most recent impact updates, response time to questions.
- Transparency report (quarterly, platform-wide) covers: total volume, fees, fraud rate, chargeback rate, payout completion rate, complaints received and resolved.

### Whistleblower / abuse-reporting
- In-app "Report a concern" available on every church profile and in donor settings.
- Categories: financial irregularity, doctrinal misrepresentation, leadership misconduct, security concern, other.
- Anonymous submission supported.
- SLA: acknowledged within 48 hours, initial assessment within 5 business days, resolution communicated to reporter (at appropriate detail level) within 30 days unless legally constrained.
- Internal whistleblower channel for staff: anonymous channel via a third party (Whistleblower Security or NAVEX EthicsPoint).
- No-retaliation policy in employee handbook; reviewed in onboarding.

### Conflict-of-interest policy
- Applies to staff, contractors, founders, board, editorial board, and trust & safety reviewers.
- Annual disclosure of any congregational membership, leadership role, financial relationship, or family relationship with any registered church on the platform.
- Recusal mandatory from any decision involving a church where a disclosed conflict exists.
- Founder/CEO recusal: even from broad strategic decisions where personal congregation could be materially advantaged.
- Disclosures audited by external annual review.

### Anonymous and privacy-tiered giving
- **Public:** name + amount visible on church-side donor list and (if donor opts) in any public donor wall.
- **Name only:** name visible to church; not in any public surface.
- **Anonymous:** church sees country + amount + campaign only; donor's identity never exposed; anonymous gifts may slow fraud-review timing for the receiving church to allow extra screening.
- Default = Name only.
- Tax receipts always include the donor's full identity (legal requirement).

---

## 18. Product design and UX

**Reference apps:** YouVersion for simplicity and global reach; **The Bible Project app for spacing, padding, and pacing** — donor-facing surfaces should feel as airy and unhurried as a Bible Project article. See §19 Layout for the explicit rhythm.

### Principles
1. **Simple before pretty.** Donation flow is three taps from any church profile.
2. **Calm reverence.** White space, restrained typography, no animations that perform spirituality. The page opens with breath.
3. **Show the money.** Every screen that touches money shows where it goes.
4. **Trust visible everywhere.** Verification badges, trust scores, payout counts, founded date, denomination — visible without clicks.
5. **Mobile-first, always.** All interactions optimized for one-handed use on a 5-inch screen.
6. **Readable in low light, low bandwidth, low literacy.** WCAG 2.2 AA throughout; line height generous; primary actions textually labelled, never icon-only.
7. **Multilingual from Day One.** All copy in i18n; no hard-coded strings; RTL support tested.
8. **Confirm without flatter.** Confirmations thank without praising; impact updates show without sentimentalising.
9. **No urgency.** No countdowns, no scarcity copy, no "X people just gave."
10. **No spiritual transactions.** No "your gift will be blessed," no implied quid pro quo.

### Accessibility specifics
- Minimum tap target 48dp.
- Contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for UI controls.
- All interactive elements keyboard-navigable; focus rings visible.
- Screen reader: every donation flow tested with VoiceOver and TalkBack; testers include sighted and blind users.
- Motion: respects `prefers-reduced-motion`.
- Simplified-language mode (toggle): replaces longer explanatory copy with shorter, simpler equivalents — useful for low-literacy users.
- USSD fallback (Phase 2 markets): donor texts a shortcode, a mobile-money charge is initiated via STK; receipt sent by SMS. Defer engineering to v2 unless pilot in Kenya signals strong demand.

### Core screens (with brief intent)

| Screen | Intent |
|---|---|
| Home | One Featured Church (later), one Discover row, "Resume your giving" if donor has an active recurring or recent gift |
| Discover | Browse churches by region, denomination, category; trust badge prominent |
| Featured Church | Editorial spotlight with "Why featured" disclosure |
| Featured Event | Time-bound event with date, location, goal |
| Campaign Detail | Goal, progress bar (accurate, no exaggeration), purpose statement, impact updates feed, give button |
| Donation Checkout | Amount, currency, fees transparency, payment method, privacy tier, confirm |
| Giving History | Chronological list with filters, total given lifetime, receipts inbox link |
| Recurring Giving | Active schedules with edit/pause/cancel; lifetime impact estimate |
| Church Dashboard | Today's gifts, this week, this month; pending actions; payout status |
| Campaign Builder | Step-by-step with helpful guardrails; preview before submit |
| Verification Center | Document checklist, status indicators, expected timeline |
| Admin Review Dashboard | Queue with SLA timers, case detail, second-approver workflow |
| Impact Updates | Compose update; see who'll be notified; preview |
| Profile and Settings | Identity, payment methods, notification preferences, privacy, account deletion |
| Embeddable Widget Configurator | Build a widget for a church's own site; copy embed code |
| Tax Receipts Inbox | Per-jurisdiction receipts, annual statements, Gift Aid declaration management |

---

## 19. Design system

### Brand attributes (binding)
Reverent, trustworthy, global, modern, warm, hopeful, secure. **Not:** triumphalist, sentimental, urgent, denominationally branded.

### Color palette
- **Stone** (primary neutral): `#0F1419` (text), `#3C4250` (secondary text), `#7B8094` (tertiary), `#D4D7DE` (border), `#F4F5F7` (surface), `#FFFFFF` (background).
- **Olive** (primary brand): `#3F5C45` (Olive 700, primary action), `#5C7A62` (500), `#8FA593` (300), `#E3EBE5` (50).
- **Wheat** (secondary brand, accent): `#C9A668` (Wheat 600), `#E0BD80` (400), `#F4E5C5` (100). Used sparingly — featured surface, trust badges.
- **Signal colors:**
  - Success: `#1F7A4D` (deep green; not bright).
  - Warning: `#9A6F1A` (amber-bronze; not yellow).
  - Error: `#A8333A` (deep red; not crimson).
  - Info: `#2E5577` (deep blue; not turquoise).
- All colors tested for WCAG 2.2 AA contrast on stone surfaces.

Rationale: olive/wheat palette feels rooted and global without invoking any specific tradition's iconography. Avoids both the "stained glass" cliché and the "tech startup blue."

### Typography
- **Display + headings:** Source Serif 4 (open-source, multi-script, professional bearing without being austere).
- **Body + UI:** Inter (open-source, broad language coverage including CJK fallbacks via Noto, excellent legibility at small sizes).
- **Numerals on financial surfaces:** Inter with `font-variant-numeric: tabular-nums`.
- **Scale (px):** 14, 16 (base), 18, 20, 24, 30, 36, 48. Line height 1.5 body, 1.25 headings.
- Trebuchet MS, Calibri, Arial Hebrew, Noto Sans family available as locale-appropriate fallbacks.

### Layout — Bible Project–inspired spacing and padding

Spatial design takes its cue from **The Bible Project app**: generous whitespace, slow vertical rhythm, content-first single-column reading, breathing room around every element. The platform is calm. Nothing is crammed. Density is reserved for the church and admin dashboards where information utility outweighs reading comfort.

#### Base unit and scale
- Base unit: **4 px** (finer-grained than the conventional 8-px grid so we can tune Bible Project's specific airy rhythm).
- Spacing scale (px): **4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128**.
- Default vertical rhythm between distinct content blocks on donor surfaces: **48 px on mobile, 72 px on web**. Denser on dashboards (24–32 px).

#### Container padding (donor app — the Bible-Project-inspired surfaces)
- Mobile horizontal padding: **24 px** (not 16 px). Matches the Bible Project app's airy gutters.
- Mobile vertical padding around major content: **32 px top, 32 px bottom** between sections.
- Web max-widths: **640 px** for prose-led pages (church profiles, impact updates, About), **960 px** for product pages (donation, dashboards), **1280 px** for admin/analytics. Narrower than typical to preserve readability and keep the line length around 60–75 characters.
- Page top padding (below header): **48 px mobile, 96 px web** — Bible-Project-style "open the page" feeling.

#### Card pattern
- Card internal padding: **24 px on mobile, 32 px on web** (vs. the previous 16 px). Cards feel like they are holding their content, not squeezing it.
- Card-to-card gap in lists: **16 px on mobile, 24 px on web** for tight clusters; **32 px on mobile, 48 px on web** between conceptual groups.
- Card border: 1 px `stone-border`, radius 12 px (slightly larger than typical, to soften the surface). No drop shadow by default; an optional 0 4 px 16 px shadow at 6% opacity reserved for elevated surfaces only (modals, the donate-now sticky CTA).
- Card hero media (church profile photo, campaign image): **24 px outset from card edge** — image extends slightly beyond the inner padding, giving it presence without bleeding to the screen edge.

#### Buttons
- Primary CTA height: **56 px on mobile, 52 px on web**. Bigger than typical, easy to tap, no second-guessing on a donation moment.
- Internal button padding: 16 px vertical, 32 px horizontal — the button feels like it has earned its place.
- Button-to-element gap: minimum 24 px above and below; never tight against text.

#### Typography rhythm
- Body line-height raised to **1.6** (from 1.5) for prose surfaces (church mission, impact updates, About). Dashboards stay at 1.5.
- Heading-to-body gap: **16 px**.
- Paragraph-to-paragraph gap: **20 px** (rather than relying on margin-bottom of the line-height alone).
- Section heading top spacing: **64 px** on mobile, **80 px** on web — the Bible Project app's signature breathing space before a new idea.

#### Lists
- List-item vertical gap: **16 px on mobile, 12 px on web** (web tighter because of larger reading width).
- Bullet/number to text gap: 12 px.
- Nested list indentation: 24 px.

#### Forms (donation checkout, settings)
- Field height: **52 px**.
- Label-to-field gap: 8 px.
- Field-to-field gap: 24 px.
- Form section gap (e.g., "Amount" → "Payment method" → "Privacy"): 48 px.
- Form-to-CTA gap: 32 px.
- Inline help text: 14 px, color `stone-tertiary`, sits 8 px under the field.

#### Photos and illustrations
- Photos in editorial surfaces (Featured Church) get **48 px above and 32 px below**, never tight to text.
- Illustrations (when used in empty states or About content) sit alone on a generous canvas: minimum 80 px of breathing space above and below.

#### Header and footer
- App header height: 64 px mobile, 72 px web.
- Footer top padding: 96 px (web) — closes the page with the same breath it opens with.

#### Where density wins
The Bible-Project rhythm applies to donor-facing surfaces. The **church dashboard** and **admin dashboard** revert to a denser 8-px-grid with 16-px card padding and 12-px row gaps — these are tools for work, not contemplation. Tooling looks different from the cathedral.

#### Verification checklist for any new screen
1. Does the page have at least **64 px of clear top space** before the first content block on mobile?
2. Is **no card under 24 px of internal padding** (donor surfaces)?
3. Is the line length on prose between **55–75 characters**?
4. Is there at least **24 px between any two interactive elements**?
5. Does the page feel like it would print as one calm, unhurried column?

If any answer is no, redesign before ship.

### Component library (initial)
- **Buttons:** primary (Olive 700), secondary (stone outline), tertiary (text only). Disabled state opacity 0.5. Loading state with inline spinner; never blocks tap target.
- **Cards:** church card, campaign card, impact-update card, payout card.
- **Donation widget:** amount selector (preset + custom), currency switcher, fee transparency line, donor-cover toggle, primary CTA. Reusable as embeddable widget.
- **Progress bars:** accurate to underlying data; no exaggeration. Show `£12,400 of £20,000`.
- **Trust badges:** Verified, Premium-Trust, Independent Audit Filed; tappable to disclosure modal.
- **Empty states:** illustration-light, text-clear, with one suggested action.
- **Loading states:** skeleton blocks matching final layout; never blocking spinner over the whole page.
- **Error states:** named, helpful, recoverable. Never "Something went wrong"; instead "Your card was declined for insufficient funds."
- **Confirmation screens:** thank without flattery, surface what just happened plus the next sensible action.

### Iconography
- Lucide icon set as base; commissioned set for BURDEN-specific concepts (verification tier, payout, donor-covered fees).
- No tradition-specific icons in default product (no crosses, no Bibles, no hands-praying). Churches may use any iconography on their own pages.

---

## 20. Notification strategy

### Channel matrix

| Event | Email | Push | SMS | WhatsApp | In-app | Channel of record |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Donation confirmation | ✓ | ✓ | — | — | ✓ | Email |
| Recurring reminder (3d before) | ✓ | ✓ | — | — | ✓ | Push |
| Recurring failed | ✓ | ✓ | v1.1 | — | ✓ | Email |
| Campaign milestone (donor) | — | ✓ | — | — | ✓ | Push |
| Campaign milestone (church) | ✓ | ✓ | — | — | ✓ | Email |
| Church approved | ✓ | — | — | — | ✓ | Email |
| Verification rejected | ✓ | — | — | — | ✓ | Email |
| Impact update (donor follows campaign) | ✓ (digest) | ✓ | — | — | ✓ | In-app (digest weekly email) |
| Security alert (login from new device) | ✓ | ✓ | v1.1 | — | ✓ | Email + Push |
| Payment failed | ✓ | ✓ | v1.1 | — | ✓ | Email |
| Admin review request | ✓ | ✓ | — | — | ✓ | Email |
| Suspected fraud hold | ✓ | — | — | — | ✓ | Email |
| Payout completed | ✓ | ✓ | — | — | ✓ | Email |
| Tax receipt issued | ✓ | ✓ | — | — | ✓ | Email |
| Annual giving statement | ✓ | — | — | — | ✓ | Email |
| Disaster campaign launched (regional opt-in) | ✓ | ✓ | — | — | ✓ | Push |

### Consent capture
- At signup: marketing opt-in default OFF; transactional notifications can never be disabled (donation receipts, security alerts, regulatory communications).
- In settings: granular toggles per category, per channel.
- Quiet hours respected: no push between 22:00–07:00 in donor's local time except SEV-1 security.
- Preferences stored in `consent_records` with the exact text version shown at the time of consent.

### Deliverability
- Postmark for transactional with a dedicated transactional subdomain (`mail.burden.org`).
- Customer.io for lifecycle on a separate sending domain.
- DMARC, DKIM, SPF strict; quarantine policy after warm-up.
- WhatsApp via Twilio Business API in markets where WhatsApp dominates (Phase 2+).

---

## 21. Analytics and KPIs

### North-star metrics
1. **Verified-donor active rate** — % of registered donors who give at least once in the trailing 90 days. Target: 35% by month 12.
2. **Verified-church active rate** — % of verified churches receiving any donations in trailing 30 days. Target: 65% by month 12.
3. **Trust-incident rate** — fraud + chargebacks + verified abuse reports per 1,000 donations. Target: < 0.8 per 1,000 by month 12; < 0.3 by year 2.

### Operational KPIs

| Category | KPI | MVP target | Year 2 target |
|---|---|---|---|
| Volume | Total donation volume (monthly) | £200k by M9 | £5M monthly |
| Volume | Verified churches | 250 by M9 | 5,000 |
| Volume | Active donors | 10k by M9 | 250k |
| Conversion | $1-donor conversion (first-time visitor → first gift) | 4% | 7% |
| Engagement | Average donation amount | £35 | £40 |
| Engagement | Recurring donation rate (% of donors with recurring) | 18% | 35% |
| Engagement | Donor retention 12-month | 45% | 60% |
| Trust | Time-to-church-approval (median) | 4 business days | 24 hours |
| Trust | Verification drop-off (started → completed) | < 35% | < 20% |
| Trust | Chargeback rate | < 0.4% | < 0.15% |
| Trust | Fraud rate | < 0.6% | < 0.2% |
| Operations | Payout completion rate | > 99.5% | > 99.9% |
| Operations | Customer support first response | < 12h | < 4h |
| Engineering | API p99 latency | < 600ms | < 300ms |
| Engineering | Donation flow p99 (tap to confirmation) | < 8s | < 4s |
| Engineering | Mobile money STK push success rate (Phase 2) | n/a | > 92% |
| Acquisition | CAC (paid + organic blended) | < £18 | < £10 |
| Lifetime | Donor LTV (3-year) | £180 | £400 |
| Editorial | Featured-surface diversity index (denominational + regional) | 0.7 of max | 0.85 |

### Metric instrumentation
- PostHog for product events; auto-captured page views + named events for the 30 most important user actions (donation_started, donation_confirmed, recurring_setup, etc.).
- Server-side events from backend for all financial events (source of truth) — never trust client for money.
- Snowflake warehouse from year 2; dbt models for KPI dashboards; metabase or Hex as the BI surface.

### Analytics ethics
- Donor giving amount is *never* used for personalised marketing (no "we noticed you give a lot — give more").
- Donor giving frequency may be used for product improvements (e.g., reminder timing).
- Aggregated, de-identified analytics may be shared with churches about their own donors.
- Donors can opt out of analytics; opt-out preserves baseline product analytics needed for security and fraud, nothing else.

---

## 22. Admin and operations

### Internal operations system

The Admin app (Retool at MVP, custom by v1.1) houses:

1. **Church approval workflow** — queue, case detail, document viewer with PII masking toggle, approval/rejection actions with second-approver gate.
2. **Document review queue** — sorted by SLA risk; reviewer can request additional docs.
3. **Campaign review queue** — auto-pre-screened by content moderation (v1.1+); reviewer focuses on policy edge cases.
4. **Donation dispute queue** — combined view of donor disputes + chargebacks; evidence gathering UI.
5. **Fraud alert dashboard** — fraud_flags surfaced with trust score impact, related entities, action options.
6. **Payout monitoring** — held payouts, in-transit, exceptions; manual release with second approver.
7. **User management** — search, view, freeze account, restore; PII access audit-logged.
8. **Content moderation** — review user-submitted content (impact updates, comments) flagged by ML or users.
9. **Regional admin assignment** — assign regional moderators; rotate assignments to prevent reviewer burnout.
10. **Audit log viewer** — searchable, filterable; tied to staff WebAuthn identity; access itself audit-logged.
11. **Manual override controls** — emergency funds release, emergency hold; require Compliance Officer + Super Admin co-sign.
12. **Editorial CMS** — separate tooling for the editorial board to schedule featured surfaces.

### Admin permission boundaries (binding)
Reaffirmed from §6: no single admin can move funds, change verification tier, modify audit logging, or access raw donor PII for >50 donors at once without a second approver from a different role family.

### Customer support model

- **Tier 0 — self-service:** in-app help center, articles, video walkthroughs.
- **Tier 1 — donor support:** general questions, donation issues, refund requests within 7-day window. SLA: first response < 12h MVP, < 4h by year 2. Channels: email + in-app chat. Tooling: Intercom (vs Zendesk: chosen for in-app experience, lighter setup).
- **Tier 2 — church support:** payout issues, verification questions, dashboard help. SLA: first response < 8h. Channels: email + in-app + scheduled call.
- **Tier 3 — dispute mediation:** complex refund/chargeback cases, abuse reports. Owned by Trust & Safety. SLA: acknowledged < 24h, resolved < 30 days unless complex.
- **Multilingual:** at MVP, English-only support with auto-translation for non-English inbound; native-speaker support added per market at expansion (Spanish + Swahili by Phase 2; French + Portuguese by Phase 3).
- **After hours:** automated triage with human SEV-1 paging via PagerDuty.

---

## 23. AI / ML and ethics policy

### Where ML is used (and where it isn't)

**Used:**
- **Fraud scoring (post-MVP, ~month 9):** trained on labelled fraud_flags + chargeback outcomes. Model behind a human-in-the-loop review for any new-style flag. Drift monitored monthly. Models are explainable (feature importances disclosed in admin tools).
- **Content moderation (post-MVP):** image-safety classifier (e.g., AWS Rekognition Moderation API as baseline) for uploaded media; text classifier for prohibited-content categories on campaign copy and impact updates. Always backed by human review; the model only assists, never auto-approves a sensitive case.
- **Translation assistance:** Phrase + DeepL or AWS Translate machine-assisted; human review required on transactional copy and any donor-facing legal text.
- **Search ranking on Discover:** lightweight learning-to-rank using donor implicit signals (clickthrough, donation conversion). Bias-tested quarterly to maintain regional and denominational diversity.
- **Personalization for impact updates:** recommend impact updates relevant to donor's giving history. Opt-out toggle.

**NOT used:**
- Scoring of "donor spiritual worthiness" or "donor likelihood to give based on faith signals."
- Manipulative urgency or scarcity optimisation in fundraising copy or UX.
- Optimisation of guilt or fear in donor messaging.
- Inferring donor demographics from giving patterns for third-party sharing.
- Personalisation of fee disclosure (fees always shown the same way).
- Auto-generation of impact updates that the church did not author. (Churches may use AI tools themselves to draft, but the platform never claims to author impact content.)

### AI ethics policy (publish)

1. **Disclosure:** any UI element where ML influences the user (e.g., fraud-flagged login challenge) is labelled.
2. **Human review:** all decisions affecting donor money or church account status require human review.
3. **Explainability:** ML models used in moderation or scoring are required to expose feature-importances to internal reviewers.
4. **Data use:** donor PII and donation amounts are NOT used to train any third-party model; if internal training data is used, it is de-identified; donors may opt out.
5. **No dark patterns:** A/B tests cannot exploit guilt, fear, or urgency. Test hypotheses are reviewed against a published "no-dark-patterns" rubric before launch.
6. **No identity profiling:** we do not infer donor's denomination, theology, or political identity from giving history for any purpose, including internal product strategy.
7. **Annual review:** the AI ethics policy is reviewed by the editorial advisory board annually, alongside changes to fraud and moderation models.

---

## 24. Development roadmap

Phased over 18 months from kickoff through scale-up. Each phase has goals, deliverables, risks, engineering effort, team needed.

### Phase 0 — Discovery (Weeks 1–4)
- **Goals:** confirm market fit hypothesis with 30 UK churches; finalise pilot market policy; legal entity setup; counsel engagement.
- **Deliverables:** signed 30-church beta letters of intent; UK CIO incorporated; US fiscal sponsorship agreement signed; insurance bound; PBC formed.
- **Risks:** church-side enthusiasm doesn't translate to onboarding (mitigate with concrete LOIs).
- **Engineering effort:** 0 engineers; founder + advisors.
- **Team:** founder, attorney (UK + US), accountant, advisory editorial board recruited.

### Phase 1 — UX/UI design (Weeks 3–8, overlapping)
- **Goals:** design system v1; donor flow; church flow; admin flow.
- **Deliverables:** Figma library; clickable prototype; user-tested with 8 donors + 5 churches.
- **Risks:** UX over-engineering; counter with strict "MVP screens only" Figma rule.
- **Engineering effort:** 1 product designer + 0.5 product manager.
- **Team:** designer, PM, founder.

### Phase 2 — Architecture (Weeks 5–10, overlapping)
- **Goals:** finalise tech stack, architecture decision records (ADRs), security baseline.
- **Deliverables:** 12 ADRs covering all major choices in §9–§16; AWS account structure (organizations, sub-accounts, SSO); GitHub org; CI baseline; staging environment.
- **Risks:** over-architecting before validating MVP; counter with explicit non-goals list.
- **Engineering effort:** 1 staff engineer + 0.5 security lead.
- **Team:** staff engineer, security lead.

### Phase 3 — MVP build (Weeks 8–28)
- **Goals:** ship private-beta-ready product.
- **Deliverables:** all MVP features in §8; SOC 2 Type I gap analysis complete; bug-bounty preparation.
- **Risks:** scope creep; KYB integration delays (Persona ↔ Stripe Identity sequencing); Apple App Store review surprise on charitable donations.
- **Engineering effort:** 5 full-stack engineers + 1 mobile lead + 1 designer + 1 PM + 1 security lead + 0.5 compliance lead.
- **Team:** 8 FTE.

### Phase 4 — Internal testing (Weeks 24–28, overlapping)
- **Goals:** end-to-end test with 5 internal "donors" giving to 5 internal "churches" (synthetic but realistic data).
- **Deliverables:** complete test plan executed; bug list closed; load test passing 1,000 concurrent donations.
- **Risks:** payment provider sandbox quirks vs production; mitigate with shadow-prod testing.
- **Engineering effort:** all hands during this window.

### Phase 5 — Security testing (Weeks 26–30)
- **Goals:** independent pen test passes with no critical / high severity open.
- **Deliverables:** pen-test report (NCC Group, Bishop Fox, or Trail of Bits); remediation completed; bug bounty program launched (private invite at first).
- **Engineering effort:** security lead + 1 engineer for remediation.

### Phase 6 — Pilot launch (Weeks 28–36)
- **Goals:** private beta UK only; 30 churches, 1,000 donors; collect feedback; iterate.
- **Deliverables:** £200k+ donations processed; sub-1% fraud + chargeback rate; weekly feedback synthesis.
- **Risks:** church onboarding bottleneck (mitigate with batch-onboarding sessions); first chargeback waves (mitigate with tight risk controls early).
- **Engineering effort:** 5 engineers + 1 product + 1 trust & safety hire + 1 customer support hire.

### Phase 7 — Public launch (Weeks 36–44)
- **Goals:** general availability UK; 250 verified churches; 10,000 active donors.
- **Deliverables:** marketing site launched; press kit; embeddable widget shipped (v1.1); SOC 2 Type I report.
- **Risks:** scale incidents (DB connections, queue backlog); on-call maturity.
- **Engineering effort:** add 2 engineers; ramp customer support.

### Phase 8 — Scale-up + Phase 2 markets (Months 12–18)
- **Goals:** Kenya + US live; SOC 2 Type II audit started; bug bounty public; 5,000 churches; £5M monthly volume.
- **Deliverables:** Phase 2 expansion playbook; new payment rails; localisation.
- **Risks:** multi-region operational complexity; market-specific compliance surprises.
- **Engineering effort:** 14 FTE total team.

### SOC 2 + bug bounty milestones (embedded)
- Week 4: SOC 2 advisory selected.
- Week 12: SOC 2 readiness assessment complete.
- Week 24: SOC 2 Type I observation period begins.
- Week 30: bug bounty private-invite live.
- Week 38: SOC 2 Type I report.
- Week 44: bug bounty public.
- Month 12–18: SOC 2 Type II observation period.
- Month 18: SOC 2 Type II report.

---

## 25. Engineering task backlog

Sample of seed tickets — full backlog generated in §31. Each shown as an epic plus selected stories.

### Epic E1 — Donation core
- **Story E1.S1** Donor can give $1 one-time to a verified church.
  - Acceptance: amount selector, currency, fee transparency, payment method, idempotency, receipt sent within 30s.
  - Tech notes: NestJS Donations module, Stripe PaymentIntents, idempotency_keys table, webhook ingestor.
  - Priority: P0. Dependencies: E1.S0 (Stripe Connect onboarding), E2.S2 (church profile read API).
- **Story E1.S2** Donor can set up monthly recurring with smart retries.
  - Acceptance: subscription created, dunning workflow, donor + church notifications on failure.
  - Tech notes: Stripe Subscriptions, BullMQ dunning worker.

### Epic E2 — Church onboarding
- **Story E2.S1** Church admin completes KYB intake.
  - Acceptance: 7 doc types uploadable to encrypted S3; sha256 stored; reviewer queue surfaces case.
  - Tech notes: pre-signed S3 URLs; Persona webhook for primary admin identity.

### Epic E3 — Verification workflow
- **Story E3.S1** Reviewer approves church to Verified with second-approver gate.
  - Acceptance: WebAuthn re-auth required; second approver from different role family; audit log entry; church notified.

### Epic E4 — Trust & safety
- **Story E4.S1** Velocity-rule fraud flag triggers manual review on >$5k from new donor.
  - Acceptance: case auto-created; payout held; SLA timer; reviewer disposition.

### Epic E5 — Receipts & tax
- **Story E5.S1** UK Gift Aid declaration captured at first eligible donation.
  - Acceptance: HMRC-compliant declaration text; signed-at recorded; appears on receipt; revocable in donor settings.

### Epic E6 — Notifications
- **Story E6.S1** Donation confirmation email delivered within 30s.
  - Acceptance: Postmark integration; template versioning; deliverability metrics dashboard.

### Epic E7 — Admin tools
- **Story E7.S1** Trust & safety reviewer can place a payout hold with rationale.
  - Acceptance: hold reflected on next scheduled payout; church receives explanatory message; audit log entry; second approver to release.

### Epic E8 — Public API & embeds
- **Story E8.S1** Church can generate an embeddable donate widget.
  - Acceptance: widget key, allowed origins, theme JSON; HMAC-signed postMessage; CSP allowance documentation.

### Epic E9 — Mobile
- **Story E9.S1** iOS app passes App Store review with webview-based giving.
  - Acceptance: charitable donation flow uses webview; Apple guideline 3.2.1(vi) compliance documented; review submission successful.

### Epic E10 — Compliance
- **Story E10.S1** Sanctions screening blocks a flagged donor from completing donation.
  - Acceptance: ComplyAdvantage integration; clear donor-facing message; case auto-created.

(Backlog of approximately 180 tickets generated at Phase 2 of the roadmap; trimmed here.)

---

## 26. Repository structure

Monorepo with **Turborepo** for orchestration and **pnpm 9** for workspace management.

```
burden/
├── apps/
│   ├── web/                      # Next.js 15 donor + church web app
│   ├── mobile/                   # React Native + Expo donor app
│   ├── admin/                    # Next.js admin app (replaces Retool by v1.1)
│   └── marketing/                # Static marketing site (Next.js, deployed to Vercel)
├── services/
│   ├── api/                      # Main NestJS monolith
│   ├── webhook-ingestor/         # AWS Lambda — Stripe/Flutterwave/GoCardless inbound
│   ├── media-processor/          # AWS Lambda — image/video processing
│   ├── receipt-generator/        # AWS Lambda — PDF receipts via Puppeteer
│   └── sanctions-screener/       # AWS Lambda — ComplyAdvantage client
├── packages/
│   ├── ui/                       # Shared React components for web + admin
│   ├── ui-native/                # Shared React Native primitives
│   ├── design-tokens/            # Colors, typography, spacing — shared across web/native
│   ├── auth/                     # Clerk wrapper + session helpers
│   ├── config/                   # Shared TS config, ESLint, Prettier
│   ├── types/                    # Shared TypeScript types (DTOs, shared schemas)
│   ├── db/                       # Prisma schema, migrations, generated client
│   ├── payments/                 # Stripe/Flutterwave/GoCardless clients + helpers
│   ├── notifications/            # Postmark, Twilio, push wrappers
│   ├── security/                 # Crypto helpers, signed-payload utilities, audit-log writer
│   ├── i18n/                     # Phrase integration, locale resources
│   ├── widgets/                  # Embeddable donate widget (vanilla JS bundle)
│   ├── feature-flags/            # PostHog integration helpers
│   └── observability/            # Datadog/Sentry instrumentation helpers
├── infra/
│   ├── terraform/                # AWS, DNS, RDS, ECS, KMS, Secrets, IAM, Vault
│   ├── cdk/                      # App-level infra (Lambdas, API Gateway, CloudWatch)
│   └── runbooks/                 # Markdown runbooks tied to alerts
├── docs/
│   ├── adrs/                     # Architecture decision records
│   ├── policies/                 # Public policies (verification, refund, AI ethics)
│   ├── compliance/               # SOC 2 evidence, DPIA, threat model
│   └── runbooks/                 # Internal-only ops playbooks
├── tests/
│   ├── e2e/                      # Playwright + Detox suites
│   ├── load/                     # k6 scripts
│   └── security/                 # ZAP automation, bandit, semgrep configs
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

**Why Turborepo over Nx:** lighter mental model; faster cache; simpler upgrade story. Nx's plugin ecosystem is impressive but the team-size doesn't justify the complexity at MVP.

---

## 27. Coding standards

### TypeScript
- Strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`).
- No `any` without `// eslint-disable` justification.
- Prefer `Result<T, E>` style for fallible flows over throwing in domain code.
- Branded types for IDs (`type DonationId = Brand<string, 'DonationId'>`).

### API validation
- All controller inputs validated with Zod at the boundary; no entity passes the boundary unvalidated.
- Reject unknown fields strictly on the request side; tolerate-but-strip on third-party webhook payloads.

### Error handling
- Never swallow errors; always log + tag with request ID.
- User-facing errors mapped through a single layer that strips internal detail.
- Error catalogue maintained in `packages/types` (stable error codes for clients).

### Logging
- Structured JSON logs (Pino).
- Standard fields: `request_id`, `actor_user_id`, `actor_role`, `subject_type`, `subject_id`, `operation`, `latency_ms`, `outcome`.
- Log levels strict: `error` for actionable, `warn` for noteworthy, `info` for operational events, `debug` for development only.
- No PII in logs ever; redaction at the logger boundary; pre-deploy CI check fails build on common PII patterns in log strings.

### Testing requirements
- Per §28; minimum: every story ships with unit tests on new pure logic, integration test on the API boundary, E2E for any P0 user-facing flow.
- Coverage gate: 80% statements on new code, 90% on financial code paths (donations, payouts, fees, FX, refunds).

### Security review checklist (in PR template)
- [ ] No new PII fields without encryption + audit-log integration
- [ ] No new endpoints without rate limit + auth + role check
- [ ] Idempotency considered for any state-changing endpoint
- [ ] Inputs Zod-validated, unknown fields rejected
- [ ] Outputs DTO-filtered, no entity leakage
- [ ] Threat-model entry updated if attack surface changes

### Code review rules
- Two approvers required on PRs touching `services/api/donations`, `services/api/payouts`, `services/api/admin`, `packages/security`, infra.
- One approver on standard PRs.
- Security-sensitive PRs require security-lead approval.
- No self-merge ever.

### Branch strategy
- **Trunk-based development.** Short-lived feature branches; PR to `main`; squash merge.
- Production deploys from `main`; previews per PR.

### Commit messages
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `security:`).
- Reviewed in CI for format.

### Environment configuration
- 12-factor: config via env vars; secrets via Vault → injected at runtime; no `.env` files in repo.
- Per-environment config in `services/api/config/` with strict schema.

### Documentation
- Every package has a top-level `README.md` (purpose, exports, owners).
- Every public API endpoint has OpenAPI annotations rendering to a hosted spec.
- Every architecturally significant decision becomes an ADR in `docs/adrs/`.

---

## 28. Testing strategy

### Test pyramid (target distribution by run count)

| Layer | Tooling | Target proportion | Run when |
|---|---|---|---|
| Unit | Vitest (web/services) + Jest (RN) | 70% | every PR, every push |
| Integration | Vitest + Testcontainers Postgres | 20% | every PR |
| Contract | Pact | small | nightly |
| E2E web | Playwright | 5% | every PR (smoke), nightly (full) |
| E2E mobile | Detox + Expo | 3% | nightly |
| Load | k6 | as scheduled | weekly + pre-launch + post-major-feature |
| Security | OWASP ZAP, Semgrep, Snyk, Trivy | as scheduled | per PR (SAST), nightly (DAST) |
| Accessibility | axe-core + manual screen-reader | smoke + manual | per PR (smoke), monthly (manual) |

### Specific test categories
- **Payment webhook tests:** replay fixtures from real Stripe/Flutterwave events; verify idempotency; verify signature failure paths.
- **Idempotency tests:** every mutating endpoint exercised with duplicate keys; verify identical response.
- **Currency tests:** every currency in `currencies` table fuzzed for rounding and minimum-amount edge cases.
- **Sanctions screening tests:** known-positive (test list) and known-negative cases; ComplyAdvantage stub for CI.
- **Refund and chargeback tests:** end-to-end with Stripe test mode disputes.
- **Authorization tests:** every role × every endpoint × resource scope matrix; auto-generated from RBAC config.
- **Audit log tests:** every privileged action verified to produce an audit row with the right subject + actor.
- **Chaos tests:** payment provider outage simulation (responses delayed, errors); circuit breakers verified.

### Mobile device matrix (E2E)
- iOS: iPhone 11, iPhone 14, iPhone 15 Pro, iPad (10th gen).
- Android: Pixel 4a (low-end ref), Pixel 7, Samsung Galaxy A33 (mid-range), Samsung S23.
- BrowserStack or Sauce Labs for device cloud.

### Accessibility testing
- Automated axe-core in Playwright suite for every screen.
- Monthly manual run by a screen-reader user (NVDA on Windows, VoiceOver on iOS) — paid contractor.
- Annual external accessibility audit by a specialist firm.

### Admin workflow testing
- Full second-approver flows tested in E2E including WebAuthn step-up.
- Audit-log integrity tested by injecting tampered rows and verifying detection.

---

## 29. Deployment strategy

### Environments
- **dev** — engineer-local, ephemeral.
- **preview** — per PR, auto-spun-up via Vercel (web) + ECS Fargate per-PR (api) + Expo preview (mobile).
- **staging** — production-mirroring; receives all merges to `main` after CI; integration with payment provider sandboxes; weekly synthetic smoke run.
- **production** — UK pilot region first; multi-region from Phase 2.

### CI / CD pipeline (GitHub Actions)

Pipeline stages on every PR:
1. **Install** — pnpm with frozen-lockfile, full Turbo cache.
2. **Lint + format check** — ESLint, Prettier, custom module-boundary lint.
3. **Type check** — `tsc --noEmit` across all packages.
4. **Unit + integration tests** — Vitest with Testcontainers.
5. **Security scans** — Semgrep, gitleaks, dependency review.
6. **Build** — all apps and services.
7. **Preview deploy** — staging of changed surfaces.
8. **E2E smoke** — Playwright on preview.

Production deploy:
- Triggered on merge to `main`.
- Steps: build → push to ECR → Terraform apply for IaC changes → ECS service update with blue/green via ECS deploy → smoke run → human approval gate for sensitive changes (DB migrations, payment-touching code).
- Rollback: blue/green allows instant traffic shift back; DB migrations always forward-only with shadow-table validation.

### Database migrations
- Forward-only (no destructive `ALTER`s without staged read+rewrite).
- Shadow-validation step: migration applied to a snapshot in staging, then validated; production apply only after green.
- Long-running migrations flagged at PR time and scheduled for low-traffic windows; advisory lock pattern used for any single-row hot path.

### Feature flags
- Every donor-facing feature gated behind a PostHog flag.
- Default off; enabled per cohort; auto-disable on error rate spike.

### Observability
- **Metrics:** Datadog, with golden signals (latency, traffic, errors, saturation) per service.
- **Logs:** Datadog Log Management, structured.
- **Traces:** Datadog APM, OpenTelemetry SDK across all services.
- **Errors:** Sentry, source-mapped, PII-scrubbed.
- **Synthetic monitoring:** Datadog synthetics on home, donation flow, login, every 5 min from 4 regions.

### Alerting
- PagerDuty integrated with Datadog.
- SEV-1 alerts: API error rate > 2%, donation success rate < 95%, payment webhook lag > 5 min, DB CPU > 90% sustained.
- SEV-2 alerts: error rate > 0.5%, latency p99 > 2x baseline, queue depth > 10k.
- Runbooks linked to every alert; runbook freshness audited monthly.

### Backup and restore drills
- Daily snapshots + PITR.
- Quarterly restore drills: restore from PITR to a sandbox, verify data integrity, document RTO actual.
- Yearly DR exercise: simulated region failure, full failover to secondary region.

---

## 30. Open founder questions

These must be answered, in writing, before development begins. Each is consequential downstream.

1. **Doctrinal eligibility:** confirm the Nicene Creed as the doctrinal marker. Confirm specific decisions on disputed groups (LDS, JW, Christian Science, Unitarian Universalist) and on prosperity-gospel ministries with abuse findings.
2. **Legal structure:** confirm Delaware PBC + UK CIO + US fiscal sponsor — or propose alternative. Must be settled before bank, insurance, or payment processor onboarding.
3. **Pilot market:** confirm UK as pilot. If alternative preferred, re-run §3 scoring before architecture phase.
4. **Stance on prosperity-gospel ministries:** publish a position. Recommend: case-by-case eligibility based on documented abuse findings, not on theology of giving.
5. **Stance on partisan-political fundraising:** publish a position. Recommend: prohibited regardless of country.
6. **Stance on legal-defense fundraising for accused leaders:** publish a position. Recommend: prohibited where the accusation is for crimes against minors, sexual assault, or financial fraud, regardless of conviction.
7. **Stance on crypto donations:** confirm not at MVP, not at v1.1. Set criteria for re-evaluation at year 2.
8. **iOS giving flow:** confirm webview at MVP, native flow at v1.1 conditional on Apple charitable carve-out approval.
9. **Wind-down plan:** confirm successor charity for residual UK funds (recommend Stewardship.org.uk). Codify in CIO articles.
10. **Founder/leadership conflict-of-interest:** confirm the disclosure requirement, the recusal scope, and the published statement.
11. **Insurance:** confirm scope and budget — $5M cyber, $5M E&O, $5M fidelity bond, $3M D&O, GCL.
12. **SOC 2 timing:** Type I at month 9, Type II at month 18, or compress?
13. **Float / interest policy:** confirm interest goes to BURDEN Foundation general assistance fund — published, immutable.
14. **Editorial board:** identify five candidates across at least four traditions and three regions. Appoint by month 4.
15. **Founder's home congregation declaration:** publish as part of the conflict-of-interest policy.
16. **Brand voice exemplars:** sign off on three reference brands the team should write toward (recommend: an Anglican broadsheet, the Salvation Army UK annual report, and Hatch — Sojourners' design language).
17. **Funding path:** confirm seed VC + foundation grants. Decide whether to pursue Praxis or Sovereign's Capital first.
18. **Hire #1:** confirm whether first hire is a CTO/staff engineer or a Head of Trust & Safety. Recommend the latter — engineering can be partially contracted in the first 90 days; trust cannot.

---

## 31. Final deliverables

### 31.1 MVP architecture diagram (text)

```
Internet
   │
   ▼
[ Cloudflare WAF + Turnstile ]
   │
   ▼
[ AWS CloudFront CDN ]  ──────────────────────┐
   │                                          │
   ├──▶ Marketing site (Next.js on Vercel)    │
   │                                          │
   ├──▶ Donor web app (Next.js on Vercel)     │
   │                                          │
   ├──▶ Admin app (Next.js on Vercel for MVP) │
   │                                          │
   └──▶ AWS API Gateway (REST, JWT auth)      │
            │                                 │
            ▼                                 │
   [ NestJS Monolith on ECS Fargate ]         │
   in eu-west-2 (London) Multi-AZ             │
            │                                 │
   ┌────────┼─────────┬──────────┬────────────┘
   │        │         │          │
   ▼        ▼         ▼          ▼
Postgres  Redis    S3+KMS    External integrations:
RDS       Elasti              Stripe, GoCardless,
Multi-AZ  Cache               Persona, Stripe Identity,
+RR       (queues             ComplyAdvantage,
          + cache)            Postmark, Customer.io,
                              Twilio, PostHog,
                              Datadog, Sentry, Clerk

Sidecar Lambdas:
  - Webhook Ingestor (Stripe / GoCardless / Persona / ComplyAdvantage)
  - Receipt Generator (Puppeteer + Handlebars)
  - Media Processor (image + video)
  - Sanctions Screener (ComplyAdvantage client)

Mobile apps (iOS + Android via React Native + Expo) call the same API Gateway.

Cross-region:
  - S3 cross-region replication eu-west-2 → us-east-1 (DR)
  - RDS automated backups + PITR (35d)

Phase 2 adds:
  - af-south-1 region for Kenya/Nigeria donor + church data
  - Flutterwave integration
  - Active in us-east-1
```

### 31.2 Database ERD (text, simplified)

```
users ──┬──< user_roles >── roles ──< role_permissions >── permissions
        │
        ├──< donations >── churches ──< campaigns >── events
        │       │            │
        │       │            ├── verification_documents
        │       │            ├── payout_methods
        │       │            ├── trust_scores (1:1)
        │       │            └── api_keys
        │       │
        │       ├── payment_transactions (1:1)
        │       ├── recurring_donations (M:1 if linked)
        │       └── donation_allocations (rare)
        │
        ├──< recurring_donations >── churches
        ├──< notifications
        ├──< user_sessions
        ├──< gift_aid_declarations (UK)
        ├──< consent_records
        ├──< data_subject_requests
        └──< tax_receipts >── donations (M:M via array column)

churches ──< campaigns ──< impact_updates
churches ──< testimonials
churches ──< embed_widgets
churches ──< payouts ── payout_methods

admin_reviews — polymorphic to churches | campaigns | donations | impact_updates | fraud_flags

audit_logs — polymorphic; references actor (users) and subject (any of the above)

fraud_flags — polymorphic; references subject

webhook_events — provider-keyed; references donation_id when applicable

idempotency_keys — global

currencies ──< fx_rates

feature_flags / experiments — config-style, mirrored from PostHog
```

### 31.3 Prioritized feature backlog (top 30)

| # | Epic | Story | Priority | Phase |
|---|---|---|---|---|
| 1 | Auth | Donor signup with passkey | P0 | MVP |
| 2 | Auth | Church admin signup with org primitive | P0 | MVP |
| 3 | Auth | Staff WebAuthn enrolment with hardware key | P0 | MVP |
| 4 | Church onboarding | KYB intake (7 docs, S3 + KMS) | P0 | MVP |
| 5 | Church onboarding | Stripe Connect / Stripe Identity onboarding | P0 | MVP |
| 6 | Verification | Reviewer queue + decision flow + 2-approver gate | P0 | MVP |
| 7 | Donations | One-time card donation with idempotency + SCA | P0 | MVP |
| 8 | Donations | Donor-covered fees toggle (default ON) | P0 | MVP |
| 9 | Donations | Recurring donation with smart retries | P0 | MVP |
| 10 | Donations | Refund (donor self-serve, 7-day window) | P0 | MVP |
| 11 | Donations | UK Gift Aid declaration capture + receipt | P0 | MVP |
| 12 | Donations | US 501(c)(3) substantiation receipt via fiscal sponsor | P0 | MVP |
| 13 | Receipts | Per-jurisdiction PDF receipt engine + Tax Receipts Inbox | P0 | MVP |
| 14 | Receipts | Annual giving statement generator | P1 | MVP |
| 15 | Compliance | Sanctions screening on every donor + church (ComplyAdvantage) | P0 | MVP |
| 16 | Compliance | Audit log infrastructure (append-only + signed daily hash) | P0 | MVP |
| 17 | Compliance | DSR workflow (access, deletion, portability) | P0 | MVP |
| 18 | Trust & Safety | Velocity-rule fraud flags + manual review queue | P0 | MVP |
| 19 | Trust & Safety | Public trust score + verification badge | P0 | MVP |
| 20 | Notifications | Postmark + Customer.io + push wiring | P0 | MVP |
| 21 | Notifications | Per-event template catalogue (10 events) | P0 | MVP |
| 22 | Mobile | iOS app webview giving flow + App Store review | P0 | MVP |
| 23 | Mobile | Android app native flow + Play Store review | P0 | MVP |
| 24 | Internationalisation | i18n infra (next-intl + Phrase) | P0 | MVP |
| 25 | Internationalisation | en-GB and en-US shipped | P0 | MVP |
| 26 | Admin | Trust & safety + verification queue UI in Retool | P0 | MVP |
| 27 | Admin | Audit log viewer | P0 | MVP |
| 28 | Public site | Church profiles SEO-optimised | P1 | MVP |
| 29 | Public site | Discover with simple ranking | P1 | MVP |
| 30 | Embedded | Embeddable donate widget (deferred to v1.1) | P2 | v1.1 |

### Cuts from MVP and rationale (explicit)

| Cut | Reason | Plan |
|---|---|---|
| Editorial Featured Church surface | Curation governance not yet running | v1.1 |
| Public donation feed | Privacy + manipulation risk | Defer indefinitely |
| Prayer notes attached to gifts | Moderation surface not justified pre-PMF | v2 |
| Sermon embedding | App Store + moderation overhead | v2 |
| Crypto giving | Regulatory complexity vs donor base | Defer to year 2+ review |
| WhatsApp notifications | Meta verification timeline | v2 |
| Native iOS giving (vs webview) | App Store review risk | v1.1 conditional |
| Major-gift donor relations | <50 expected at MVP volume | Manual handling MVP |
| ML fraud scoring | Need labelled data first | v1.1 |
| Mobile money | Pilot is UK | Phase 2 (Kenya) |

### 31.4 First 90-day execution plan

**Week 1**
- Founder confirms answers to §30 open questions (1, 2, 3, 9, 11, 13, 17, 18).
- Engagements: UK charity counsel, US corporate counsel, accountant, insurance broker, fiscal sponsor.
- Begin UK CIO incorporation (4–6 week timeline).
- PBC formed (Delaware).
- Insurance quotes requested.
- Hire #1 search: Head of Trust & Safety.

**Week 2**
- Editorial advisory board candidates identified; outreach.
- Bank conversations: Mercury (US PBC), Mettle / Tide (UK CIO).
- Stripe Connect platform application started.
- Persona, ComplyAdvantage, Postmark, Customer.io vendor evaluations.

**Week 3**
- Hire #2 search: staff engineer (full-stack, payments background).
- Hire #3 search: senior product designer.
- Initial 30-church beta LOIs drafted with UK charity counsel review.
- Stripe Connect approval pursued.

**Week 4**
- 30-church outreach begins (founder + advisory).
- AWS Organizations + Control Tower setup.
- GitHub org + initial repository scaffolding.
- ADR-0001 through ADR-0005 drafted.

**Weeks 5–6**
- Trust & Safety lead hired and onboarded; begins drafting verification policy + reviewer SOPs.
- Staff engineer hired; begins architecture phase deliverables.
- Senior designer hired; begins design system v1.
- 10+ LOIs signed.
- UK CIO incorporation expected complete.

**Week 7**
- Formal kickoff for MVP build.
- Sprint 1: auth, base infra, observability baseline, design system shell.
- Bug-bounty advisory engagement.

**Weeks 8–10**
- Sprint 2: church onboarding + KYB intake + S3+KMS document pipeline.
- Sprint 3: donation core (one-time, idempotency, Stripe).
- Editorial advisory board appointed (5 members).
- Bug-bounty private invite scoped.

**Weeks 11–12**
- Sprint 4: receipts engine (UK Gift Aid + US substantiation).
- Hire #4: backend engineer (compliance + payments focus).
- Hire #5: mobile engineer (RN + Expo experience).
- SOC 2 readiness assessment kickoff.

**Day 90 milestone:**
- Auth, church onboarding, donation core (one-time card), receipts engine, audit log, Trust & Safety queue, 5-person engineering team in place, 30 LOIs signed, editorial board appointed, SOC 2 readiness assessment complete, insurance bound.
- **Decision gate:** are we still on track to month-7 GA? If not, what to cut?

### 31.5 Risk register (probability × impact)

| # | Risk | Prob | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| 1 | Church verification creates onboarding friction so high that supply-side stalls | High | High | 9 | Onboarding playbook + concierge first-100 churches; iterate KYB UX |
| 2 | Apple App Store review on charitable donations is harder than expected | Medium | High | 6 | Webview MVP path; relationship with Apple charitable team; legal review of guideline 3.2.1(vi) |
| 3 | A featured church suffers a public scandal post-feature | Medium | High | 6 | Editorial board diversity; trust score continuous; rapid takedown SOP; pre-press statement template |
| 4 | Stripe Connect platform application denied or delayed | Low | High | 4 | GoCardless + Adyen Marketplace as backup; engage Stripe verticals (faith) team early |
| 5 | Sanctions / AML hit results in regulator inquiry | Low | High | 4 | ComplyAdvantage day-one; clear SOP; counsel on retainer |
| 6 | Major-gift donor sues over refund | Low | Medium | 2 | Refund policy explicit; ToS clear; insurance coverage |
| 7 | Currency exchange + FX confusion harms donor trust | Medium | Medium | 4 | Display rate at confirmation; pass-through policy; published transparency |
| 8 | Fundraising for company stalls because faith-tech is out of favour | Medium | Medium | 4 | Foundation grants as parallel path; bootstrap-able burn |
| 9 | Founder conflict of interest exposed (gives to platform church) | Medium | High | 6 | Pre-published declarations; recusal policy enforced; external audit |
| 10 | Cyber incident breaches donor PII | Low | Critical | 5 | Defense-in-depth (§16); cyber insurance; incident response plan tested |
| 11 | Editorial board fractures over a doctrinal dispute | Low | Medium | 2 | Board terms; clear scope; chair rotation; explicit "BURDEN does not arbitrate doctrine" policy |
| 12 | Mobile money provider (Flutterwave) reliability in Phase 2 | Medium | High | 6 | Multi-provider redundancy plan from Phase 2 onwards; SLA monitoring |
| 13 | A pilot church is found ineligible after donations were collected | Low | High | 4 | Pre-feature trust audit; reserve in escrow; donor refund-with-redirect option |
| 14 | Compliance counsel disagreement on UK CIO + PBC structure | Medium | Medium | 4 | Counsel engagement before incorporation; second-opinion budget |
| 15 | Recurring giving churn higher than modeled | Medium | Medium | 4 | Smart retries; quarterly churn report; ICP-fit refinement |
| 16 | $1 minimum invites card-testing fraud | High | Medium | 6 | Stripe Radar + custom rules; minimum cumulative friction unlocks |
| 17 | Editorial diversity fails (one tradition over-represented in featured) | Medium | Medium | 4 | Quarterly audit + correction; published methodology |
| 18 | Donor receipt error (wrong jurisdiction template) | Low | High | 4 | Receipt engine tests per jurisdiction; manual sample review of first 1,000 receipts |
| 19 | A founder/staff member's home church is featured without recusal | Low | High | 4 | Conflict-of-interest disclosure software; auto-flag at editorial selection |
| 20 | Brand voice drift toward urgency or manipulation under launch pressure | Medium | Medium | 4 | Voice rubric in marketing CI; copy review by the editorial board pre-publish |

### 31.6 Open founder questions (reaffirmed list)
See §30 above. The list is the answer; resolve before kickoff.

---

## End of blueprint

**Document version:** 1.0
**Prepared:** May 2026
**Disclaimer:** Not legal, tax, or investment advice. Sections marked [counsel-review] are particularly load-bearing and require qualified professional review before implementation.

