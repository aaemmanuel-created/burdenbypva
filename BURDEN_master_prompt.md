# BURDEN by PVA — Master Build Prompt

## Meta-instructions to the model

You are acting as a senior full-stack software engineer, cybersecurity architect, product manager, DevOps engineer, payments specialist, compliance counsel (non-binding), and UX strategist at a world-class software company. You have shipped at least one global, regulated, multi-currency consumer product before.

Follow these constraints throughout your answer:

1. Cite specifics — exact regulations (with article numbers where relevant), exact payment provider features, exact framework versions, exact AWS/GCP/Azure service names. Do not hedge with vague terms like "modern", "industry-standard", or "scalable cloud provider" unless you also name the concrete choice you would make.
2. Where this prompt and engineering best practice conflict, follow best practice and flag the conflict explicitly so the founder can decide.
3. Where a decision depends on jurisdiction, make a concrete recommendation for the pilot market (see §3), then note how the answer would change in the other priority markets.
4. When you list options, also pick one. Do not leave the founder to choose between three frameworks without a recommendation and the reasoning behind it.
5. Flag any place where you are uncertain or where a qualified human (lawyer, accountant, denominational authority, security auditor) must review before launch.

---

## 1. Product vision

Build a global Christian fundraising platform called **BURDEN by PVA**. It serves Christian churches, ministries, mission organizations, Christian educational and humanitarian institutions, and individual Christian donors worldwide. The core idea is to allow local churches and Christian institutions to raise funds transparently from regular people globally — donors should be able to give as little as $1 USD or its local-currency equivalent, and the platform should support millions of users.

The scope is **Christian-only**. Verification, editorial curation, and content policy must reflect this. Make the doctrinal scope explicit in the output and recommend how to handle:

- Which Christian traditions are eligible (Catholic, Orthodox, Protestant — mainline, evangelical, Pentecostal/charismatic, independent, denominational and non-denominational)
- How the platform stays ecumenical without endorsing any one tradition over another
- How disputed groups are handled (e.g., LDS, Jehovah's Witnesses, Christian Science, prosperity-gospel ministries with abuse histories) — recommend a published eligibility policy
- Minimum doctrinal markers (e.g., Nicene Creed) versus organizational/operational markers (registered legal entity, leadership accountability, financial governance) for verification

Take inspiration from YouVersion in simplicity, spiritual tone, global reach, clean interface, multilingual readiness, and community-centered experience. BURDEN is not a Bible app — it is a fundraising, donor-engagement, and church/institution support platform.

Generate a complete, production-grade software framework and technical blueprint as if this will become a real startup product.

Define:
- Mission of BURDEN by PVA
- Problem it solves
- Target users: donors, churches, ministries, faith-based institutions (Christian schools, seminaries, hospitals, missions agencies), platform administrators
- Emotional and spiritual positioning (reverent, trustworthy, hopeful, never manipulative)
- Short product tagline

---

## 2. Business model and revenue

Define how the platform itself makes money. Cover:

- Platform fee structure (percentage, fixed, tiered) and benchmark it against tithe.ly, Pushpay, GoFundMe Charity, Givelify, Kindrid/Pushpay, Donorbox, GiveCloud
- Optional donor-covered fees vs church-paid fees
- Payment processor pass-through vs platform markup
- Premium church features (advanced analytics, custom branding, larger media storage, lower payout fees, multi-user dashboards)
- Float / treasury policy on funds held in transit and how (or whether) interest accrues
- Recommended legal structure: for-profit C-corp, public benefit corporation, non-profit 501(c)(3), or hybrid (e.g., non-profit owning a wholly-owned LLC). Make a concrete recommendation and explain the trade-offs for fundraising the company itself, donor trust, and tax treatment.
- Funding strategy for the company: bootstrap, mission-aligned VC, faith-based foundations, donor-advised seed grants. Recommend one path and name 3–5 plausible funders for that path.
- Exit considerations and what an exit would mean for donor and church trust.

---

## 3. Pilot market selection

Recommend a single pilot launch country using an explicit scoring framework over: regulatory clarity for digital fundraising, payment rail maturity, mobile money penetration, church density and openness to digital giving, English-language coverage, diaspora giving corridors, presence of an existing Christian fintech competitor, data-protection regime complexity, and Apple/Google App Store availability of charitable carve-outs.

Then list a 12-month and 24-month expansion path of 3–5 additional markets, with the corridor logic (e.g., UK pilot → US + Nigeria + Kenya + Canada, because of diaspora giving and shared regulatory familiarity).

---

## 4. Theological, editorial, and content policy

Produce a published eligibility and editorial policy covering:

- Doctrinal eligibility statement (recommend baseline: organizations that affirm the Nicene Creed and operate under recognized Christian leadership)
- Denominational neutrality rules — the platform does not rank or favor one tradition
- Featured-church curation governance: who curates, on what criteria, how often, with what conflict-of-interest disclosures, and with anti-bias safeguards across denominations and regions
- Content boundaries: political endorsements, prosperity-gospel claims tying giving to material return, denominational disputes, fundraising for legal defense in abuse cases, fundraising for partisan election work
- Scripture-quoting and translation policy (which translations may be quoted at length, public-domain options, citation requirements, when Scripture appears in transactional UI vs marketing)
- Brand voice rules: warm, hopeful, reverent, plain-spoken; no urgency manipulation, no implied spiritual reward for giving, no shame language

---

## 5. Core product modules

Design the major modules:

Donor App; Church/Institution Dashboard; Admin Dashboard; Campaign Management; Event Highlighting; Church Highlighting; Global Donation Feed; Giving History; Recurring Donations; Currency Conversion; Payment Processing; Fraud Detection; KYC/KYB Verification; Notifications; Reporting and Analytics; Content Moderation; User Authentication; Role-Based Access Control; Multilingual Support; Prayer/Encouragement Feature; Testimonials and Impact Stories; Embeddable Donate Widgets and Public API; Emergency/Disaster Response Campaigns; Major-Gift Workflow; Employer Matching and Donor-Advised Fund Integration; Anonymous and Privacy-Tiered Giving; Sermon/Content Embedding (linked, not hosted); Receipt and Tax Documentation Engine.

---

## 6. User roles and permissions

Define every role with what they can view, create, edit, approve, and cannot access:

Guest User; Registered Donor; Church Representative; Church Finance Officer; Church Admin; Regional Moderator; Editorial Curator; Trust & Safety Reviewer; Compliance Officer; Platform Admin; Super Admin.

Include a documented admin permission boundary so no single admin can move funds, change verification status, and access donor PII without a second approver.

---

## 7. Main user journeys

Detailed flows for:

A donor discovering a featured church; a donor giving $1 or more (one-time); setting up recurring giving; mobile-money giving in an emerging market; anonymous giving; a major-gift donor (>$10,000) flow; a church registering on the platform; submitting verification documents; creating a fundraising campaign; an institution creating an event fundraiser; an emergency/disaster campaign with expedited verification; an admin reviewing and approving a church; an admin flagging suspicious activity; a donor receiving impact updates after giving; a donor disputing a donation or requesting a refund; a church receiving its first payout.

---

## 8. Core features for MVP

MVP must include only the essential features to launch safely and validate demand. Separate features into:

- MVP (3–4 month build target)
- v1.1 (3 months post-launch)
- v2 (year 1)
- Future advanced

Be opinionated — list what to cut from MVP and why.

---

## 9. Recommended tech stack

Recommend a modern, scalable stack with concrete choices and version numbers:

Frontend framework; mobile app framework (and the rationale for React Native vs Flutter vs native iOS/Android — Apple App Store policy on charitable donations is a factor); backend framework; database; auth provider; cloud hosting; object storage; payment providers (global card + regional + mobile money); currency conversion service; email service; SMS/WhatsApp notification service; analytics; error monitoring; CI/CD; infrastructure-as-code; admin dashboard tooling; feature flag service; experimentation/A-B testing infrastructure; translation management system; CDN with geo-aware routing; KYC/KYB vendor (Persona, Sumsub, Onfido, Veriff — pick one and explain).

Prioritize security, scalability, developer productivity, and global availability — including in low-bandwidth and Android-dominant markets.

---

## 10. System architecture

High-level architecture covering: frontend clients, API gateway, backend services, database layer, payment service, verification service, notification service, media service, admin service, fraud/risk service, analytics service, content management service for editorial surfaces, public API and webhook gateway, search and discovery service, ML inference service.

Recommend MVP architecture: modular monolith vs microservices vs serverless vs hybrid. Make a clear recommendation and justify it with the team-size and time-to-market constraints of an MVP.

Include multi-region considerations: data residency for EU (GDPR), UK, Nigeria (NDPR), India (DPDP), Kenya (DPA 2019), and a stance on whether the platform operates in mainland China at all.

---

## 11. Database design

Initial relational schema with purpose, key fields, relationships, indexing, and security considerations for:

users; roles; permissions; churches; institutions; verification_documents; campaigns; events; donations; donation_allocations; recurring_donations; currencies; fx_rates; payment_transactions; payment_methods (tokenized); payouts; payout_methods; impact_updates; testimonials; notifications; admin_reviews; audit_logs; fraud_flags; trust_scores; user_sessions; feature_flags; experiments; idempotency_keys; webhook_events; tax_receipts; consent_records; data_subject_requests; embed_widgets; api_keys.

Mark every column containing PII or financial data and specify encryption-at-rest treatment (column-level, KMS-key tier, rotation policy).

---

## 12. API design

REST first, with a clear migration path to GraphQL for the donor app if needed. For each endpoint specify method, path, purpose, request body, response shape, required auth, required role, idempotency behavior, rate limits, and security notes:

Authentication; user profile; church registration; church verification; campaign creation; campaign approval; donation creation (with idempotency key); payment confirmation; recurring donation management; currency conversion; featured churches; featured events; search and discovery; impact updates; admin review; fraud reporting; notifications; embeddable widget config; public API for partner integrations (Planning Center, Subsplash, Tithe.ly successor data); webhooks emitted to churches.

Specify webhook signature verification (HMAC, timestamp tolerance, replay protection) and idempotency-key semantics in detail.

---

## 13. Payment and donation flow

Design in detail:

One-time donation; recurring donation; multi-currency donation; minimum donation of $1 USD or local equivalent; platform fees and optional donor-covered fees; refund handling; failed payment handling; chargeback handling; payouts to churches; holding periods; compliance checks; receipt generation.

Add specifically:

- Mobile money rails: M-Pesa (Safaricom Daraja), MTN MoMo, Airtel Money, Wave, Orange Money, with a recommended aggregator (e.g., Flutterwave, Cellulant, DPO, Paystack).
- Mobile wallets: Apple Pay, Google Pay, Samsung Pay, and how each interacts with recurring giving.
- Crypto/stablecoin stance — recommend yes/no/later with rationale (compliance burden, donor base fit, volatility risk).
- Recurring-donation health: dunning, smart card retries (e.g., Stripe Smart Retries), card-account-updater services, churn telemetry, grace periods.
- Idempotency keys on donation creation and signed webhook verification with replay protection.
- Disbursement methods to churches: bank transfer, mobile money, in-kind partner networks; multi-bank/payment-rail redundancy per region.
- FX risk and treasury policy on multi-currency held funds.
- Apple App Store and Google Play policy on charitable donations vs in-app purchases — explicit strategy (native flow vs webview vs hybrid) and how to qualify for the charitable-donation carve-outs.

Recommend payment providers for global reach (Stripe, PayPal, Adyen) and for regional coverage (Flutterwave, Paystack, Razorpay, Mercado Pago, Pix, Stitch, dLocal). Make clear that final provider choice depends on country availability and legal review.

---

## 14. Tax receipting and donor tax treatment

Build a per-jurisdiction tax-receipting framework. Cover at minimum: United States (501(c)(3) substantiation, $250 written acknowledgment threshold, quid-pro-quo disclosure), United Kingdom (Gift Aid declarations, HMRC requirements), Canada (CRA receipts), Australia (DGR status), Kenya (KRA), Nigeria, South Africa (Section 18A), and Ghana.

Specify the platform's role per jurisdiction (agent for the church, donor-advised fund operator, mere conduit, registered intermediary) and explain how that role changes the receipt copy, the data model, and the legal entity required in-country.

---

## 15. Compliance and legal considerations

Compliance checklist (not legal advice — flag that qualified counsel must review):

KYC and KYB; AML transaction monitoring and SAR filing; sanctions screening (OFAC, UK HMT, EU consolidated, UN); PEP screening; charity and fundraising regulations per market; data privacy (GDPR, UK GDPR, CCPA/CPRA, Quebec Law 25, Nigeria NDPR, Kenya DPA 2019, India DPDP); PCI-DSS scope reduction via tokenization; tax receipt rules per jurisdiction; donation disclaimers; terms of service; privacy policy; refund policy; church verification policy; regional payout requirements; export controls; geographic restrictions (countries the platform must not operate in).

Add: insurance program (cyber liability, errors and omissions, fidelity bond, directors and officers, crime), reserve and capital requirements per payment partner, and a documented policy for what happens to held donor funds if the company shuts down (escrow, successor charity arrangement, donor-redirect mechanism).

---

## 16. Cybersecurity framework

Strong cybersecurity plan covering: threat model (STRIDE, plus payment- and donation-specific abuse cases); authentication security; MFA; passwordless option (WebAuthn/passkeys); OAuth/social login; session management; RBAC and ABAC; least privilege; encryption at rest (KMS-managed) and in transit (TLS 1.3); secrets management (Vault, AWS Secrets Manager); API rate limiting; bot protection; DDoS protection (CloudFront/Cloudflare); input validation; SQL injection prevention; XSS, CSRF, SSRF prevention; secure payment handling; webhook signature verification with replay protection; comprehensive audit logging; admin activity monitoring with second-approver workflows; fraud detection; backup strategy; disaster recovery (RTO and RPO targets); incident response plan with on-call rotation; security testing (SAST, DAST, IAST); dependency scanning (Dependabot, Snyk, Renovate); penetration testing plan (annual + post-major-release).

Add: a Day-One bug bounty / responsible disclosure program (HackerOne or Bugcrowd), a SOC 2 Type II readiness roadmap with concrete milestones, and an ISO 27001 path for international enterprise church partners.

---

## 17. Fraud and trust system

Trust and safety system covering: church verification; identity verification of leadership; bank account verification; document review; campaign approval; risk scoring; suspicious donation detection; suspicious payout detection; duplicate institution detection; donor dispute handling; church reputation score; public transparency indicators; admin review queues.

Add:

- Tiered verification levels (basic, verified, premium-trust) with what each unlocks (donation caps, payout speed, featuring eligibility).
- Public transparency reports (quarterly platform-wide volume, fees, fraud rate, payout completion).
- Independent annual financial audit of the platform itself, separate from PCI/SOC 2.
- A documented, donor-readable trust-score methodology.
- Whistleblower and abuse-reporting mechanism (donors flagging churches, churches flagging staff, internal misconduct reporting) with anonymous-submission support and a published response SLA.
- Conflict-of-interest policy for staff, admins, founders, and editorial curators (giving to or affiliation with featured churches, recusal rules).
- Anonymous and privacy-tiered giving: donor identity controls and exactly what churches see vs do not see at each tier.

---

## 18. Product design and UX

UX principles inspired by YouVersion: simple navigation; calm, reverent design language; global accessibility; low-friction giving; donor confidence; transparent impact; mobile-first; offline-friendly where feasible (review queue caching, draft campaigns); WCAG 2.2 AA accessibility; multilingual interface with RTL support; clear donation confirmation; emotional but never manipulative fundraising language.

Add accessibility for low-literacy and low-bandwidth users: voice prompts, icon-led navigation, simplified-language mode, USSD fallback consideration in select markets, Android-low-end performance budget.

Core screens: Home; Discover; Featured Church; Featured Event; Campaign Detail; Donation Checkout; Giving History; Recurring Giving; Church Dashboard; Campaign Builder; Verification Center; Admin Review Dashboard; Impact Updates; Profile and Settings; Embeddable Widget Configurator; Tax Receipts Inbox.

---

## 19. Design system

Recommend a design system covering: color palette; typography; layout principles; component library; buttons; cards; donation widgets; progress bars; trust badges; empty states; loading states; error states; confirmation screens.

Brand should feel reverent, trustworthy, global, modern, warm, hopeful, and secure — without religious imagery that excludes any Christian tradition (e.g., avoid tradition-specific iconography by default; allow churches to brand their own pages).

---

## 20. Notification strategy

Notifications for: donation confirmation; recurring donation reminders; campaign milestones; church approval; verification rejection; impact updates; security alerts; failed payments; admin review requests; suspected fraud holds; payout completion; tax receipt issued.

Channels: email (primary), push, SMS, WhatsApp where available. Specify channel-of-record per notification type and the consent capture flow.

---

## 21. Analytics and KPIs

Define metrics: total donation volume; number of donors; verified churches; average donation amount; $1-donor conversion rate; recurring donation rate; campaign success rate; donor retention (1, 3, 12 month cohort retention); fraud rate; chargeback rate; payout completion rate; time to church approval; cost per donor acquisition; lifetime donor value.

Add: experiment win-rate, page-level conversion, mobile-money success rate by provider, recurring-donation involuntary churn rate, verification drop-off funnel, and an editorial-curation diversity metric (denominational, regional).

---

## 22. Admin and operations

Internal operations system: church approval workflow; document review queue; campaign review queue; donation dispute queue; fraud alert dashboard; payout monitoring; user management; content moderation; regional admin assignment; audit log viewer; manual override controls (with second-approver enforcement); admin permission boundaries; editorial curation CMS separate from the church self-service dashboard.

Add: a documented multilingual customer support model — tiers (donor, church, dispute mediation), SLAs, in-app help center, escalation paths, and the case management tooling (Zendesk, Intercom, Freshdesk — pick one).

---

## 23. AI/ML and ethics policy

Specify where AI/ML is used and where it is not:

- Fraud scoring models (training data sources, drift monitoring, human-in-the-loop overrides)
- Translation (machine-assisted with human review for critical surfaces)
- Content moderation (image safety, prohibited-content classification)
- Recommendation/ranking on the discover surface, with editorial-override capability
- Personalization for impact updates

Add an AI ethics and data-use policy: what data may or may not be used for training, donor opt-out rights, transparency disclosures, prohibited use cases (no scoring of donor "spiritual worthiness", no manipulative urgency optimization, no A/B tests that exploit guilt or fear).

---

## 24. Development roadmap

Phased roadmap with goals, deliverables, risks, estimated engineering effort, and team members needed:

Discovery; UX/UI design; architecture; MVP build; internal testing; security testing; pilot launch (single market); public launch; scale-up.

Embed concrete SOC 2 Type II and bug-bounty milestones in the roadmap, not as optional add-ons.

---

## 25. Engineering tasks

Break the project into agile tickets with epic, user story, acceptance criteria, technical notes, priority, and dependencies — across frontend, backend, database, DevOps, security, QA, and product.

---

## 26. Repository structure

Recommend a clean monorepo structure with folders for apps/web, apps/mobile, apps/admin, services/api, packages/ui, packages/auth, packages/config, packages/types, packages/db, packages/payments, packages/notifications, packages/security, packages/i18n, packages/widgets (embeddable), infra, docs, tests.

Recommend the monorepo tool (Turborepo, Nx, or pnpm workspaces) with rationale.

---

## 27. Coding standards

TypeScript standards; API validation (Zod or similar); error handling; structured logging; testing requirements; security review checklist; code review rules; branch strategy (trunk-based vs Gitflow — pick one); commit message convention (Conventional Commits); environment configuration; secrets management; documentation expectations; ADR (Architecture Decision Record) practice.

---

## 28. Testing strategy

Unit tests; integration tests; end-to-end tests; payment webhook tests with replayed fixtures; security tests; load tests (donation-spike simulation); accessibility tests (axe, manual screen-reader); mobile device coverage matrix (incl. low-end Android); admin workflow tests; regression tests; chaos / failure-injection tests for payment provider outages.

---

## 29. Deployment strategy

Development, staging, production environments; CI/CD pipeline; automated testing gates; database migrations (forward-only with shadow validation); rollback strategy; feature flags; observability (metrics, logs, traces — recommend tooling); monitoring; alerting (with on-call rotation and runbooks); backup and restore drills.

---

## 30. Open questions the founder must answer before development begins

Generate this list explicitly. At minimum it must include:

- Doctrinal scope and the published eligibility policy for churches and ministries
- Legal structure of the company (for-profit, public benefit corp, non-profit, hybrid)
- Pilot market and the criteria used to choose it
- Stance on prosperity-gospel ministries, partisan-political fundraising, and legal-defense fundraising for accused leaders
- Stance on crypto donations
- Whether the iOS app routes giving through a webview or a native flow (App Store policy)
- What happens to held donor funds if the company shuts down
- Founder/leadership conflict-of-interest disclosures
- Insurance program scope and budget
- Whether the platform pursues SOC 2 Type II in year one or year two

---

## 31. Output format

Structure the final answer professionally with clear headings, tight prose, bullet points only where they add scannable value, and diagrams in text form where useful. After the blueprint, provide:

1. A recommended MVP architecture diagram in text form
2. A database ERD in text form
3. A prioritized feature backlog with cut-from-MVP justifications
4. A first 90-day execution plan, week by week, with named workstreams
5. A list of critical risks and mitigations, ranked by probability × impact
6. The list of open founder questions from §30

---

## Important product principles (do not soften these)

- Trust is the most important feature.
- The platform serves the global Christian church and is explicitly Christian-only.
- Churches and institutions must be verified before receiving funds.
- Donors must clearly understand where their money is going.
- The platform must avoid emotional manipulation. No urgency exploitation. No spiritual-reward-for-giving language.
- The product must be secure by design.
- The app must be globally capable from day one but launch in a controlled pilot market first.
- The system must be built to support millions of users eventually; the MVP must remain ruthlessly simple.
- Every donation must be traceable, auditable, and receipted.
- Admins must have strong controls, but no single admin can move funds, change verification status, or access donor PII without a second approver.
- The product should feel simple, warm, spiritual, and trustworthy.

Now generate the complete software framework for **BURDEN by PVA**.
