// Mock data for the BURDEN MVP demo.
// In production these come from the verified-church and campaign services.

export const churches = [
  {
    id: 'ch_nairobi_grace',
    name: 'Grace Community Church',
    location: 'Nairobi, Kenya',
    tradition: 'Evangelical',
    verified: true,
    tier: 'Verified',
    members: 1240,
    summary:
      "A neighbourhood church in Eastleigh serving families through weekly worship, a feeding programme, and a Saturday school.",
    leadership: 'Rev. Mary Wanjiku, Senior Pastor',
    founded: 1998,
  },
  {
    id: 'ch_lagos_redeemer',
    name: 'Redeemer Chapel Lagos',
    location: 'Lagos, Nigeria',
    tradition: 'Pentecostal',
    verified: true,
    tier: 'Premium Trust',
    members: 3200,
    summary:
      "Multi-site congregation across Yaba and Surulere with an active medical outreach in underserved communities.",
    leadership: 'Pastor Tunde Adebayo',
    founded: 2004,
  },
  {
    id: 'ch_accra_st_andrew',
    name: "St. Andrew's Presbyterian",
    location: 'Accra, Ghana',
    tradition: 'Mainline Protestant',
    verified: true,
    tier: 'Verified',
    members: 860,
    summary:
      "A historic parish in Osu running a bursary fund for secondary school students from the surrounding district.",
    leadership: 'Rev. Dr. Kofi Mensah',
    founded: 1962,
  },
  {
    id: 'ch_london_allnations',
    name: 'All Nations Fellowship',
    location: 'London, United Kingdom',
    tradition: 'Non-denominational',
    verified: true,
    tier: 'Verified',
    members: 540,
    summary:
      "A diaspora-rooted congregation in Peckham supporting refugee resettlement and weekly community meals.",
    leadership: 'Pastor Grace Okoye',
    founded: 2011,
  },
  {
    id: 'ch_manila_lighthouse',
    name: 'Lighthouse Bible Church',
    location: 'Manila, Philippines',
    tradition: 'Baptist',
    verified: true,
    tier: 'Verified',
    members: 720,
    summary:
      "A Quezon City congregation rebuilding a fellowship hall damaged by Typhoon Karding and running a youth tutoring centre.",
    leadership: 'Pastor Joel Ramos',
    founded: 1989,
  },
]

// "campaigns" is kept as the legacy export name for compatibility,
// but the user-facing term throughout the app is **burden** — each entry
// is a specific, time-bound, crowdfunded project owned by a verified
// church. Not tithing. Not general fund. Specific objectives, specific
// money workflow, specific people on the ground.
export const campaigns = [
  {
    id: 'cmp_grace_school',
    churchId: 'ch_nairobi_grace',
    title: 'Saturday School — Term Materials',
    summary:
      "Books, uniforms, and a daily meal for 84 children attending the Saturday school this term.",
    raised: 4280,
    goal: 7500,
    currency: 'USD',
    donors: 312,
    daysLeft: 21,
    category: 'Education',
    objective:
      "Cover all term-one learning materials and the daily lunch for 84 children — most from single-parent households in Eastleigh — so attendance does not depend on whether a family can afford books that month.",
    currentState:
      "57% funded. Books and uniforms already procured for 48 of the 84 children. Lunch programme running daily, currently funded month-to-month. We are 21 days from term end — remainder covers the final 36 children and one term of lunches.",
    team: [
      { role: 'Burden lead',          name: 'Rev. Mary Wanjiku' },
      { role: 'Programme coordinator', name: 'Sarah Njeri' },
      { role: 'Finance steward',       name: 'James Karanja' },
      { role: 'On-ground delivery',    name: 'Teacher Esther Mwangi' },
    ],
    moneyWorkflow: [
      'Donors give via BURDEN.',
      'Funds held in BURDEN escrow for 3 banking days, then released to Grace Community Church\'s verified payout account at Equity Bank, Nairobi.',
      'Sarah Njeri (programme coordinator) requests disbursements against three pre-agreed milestones: books procured, uniforms delivered, lunch month funded.',
      'James Karanja (finance steward) signs every disbursement; Rev. Wanjiku co-signs anything above $500.',
      'Monthly receipts and photos published as an impact update on this burden\'s page.',
    ],
    prayerGroup: {
      members: 64,
      recentPrayers: 18,
      focusLine: 'Pray for the 36 children still waiting on materials, and for the teachers running the Saturday programme alongside their weekday work.',
    },
  },
  {
    id: 'cmp_redeemer_clinic',
    churchId: 'ch_lagos_redeemer',
    title: 'Mobile Medical Outreach — Q2',
    summary:
      "Fuel, medicines, and clinician fees for four weekend clinics in Makoko and Ajegunle.",
    raised: 12640,
    goal: 18000,
    currency: 'USD',
    donors: 891,
    daysLeft: 14,
    category: 'Health',
    objective:
      "Run four weekend medical outreach clinics in Q2 across Makoko and Ajegunle, providing free paediatric, maternal, and primary care to roughly 900 patients who have no other access to a doctor.",
    currentState:
      "70% funded. Two of four clinics already delivered: 487 patients seen so far, 62 referrals into ongoing care. Medicines and PPE stocked for the remaining two clinics. Outstanding gap is clinician honoraria and fuel for the mobile unit.",
    team: [
      { role: 'Burden lead',          name: 'Pastor Tunde Adebayo' },
      { role: 'Clinical lead',        name: 'Dr. Funmi Ade­bowale (MBBS)' },
      { role: 'Finance steward',      name: 'Mrs. Bisi Okonkwo' },
      { role: 'On-ground delivery',   name: 'Outreach team — Yaba campus' },
    ],
    moneyWorkflow: [
      'Donors give via BURDEN.',
      'Funds held in escrow for 3 banking days, then released to Redeemer Chapel Lagos\'s verified payout account at Zenith Bank, Nigeria.',
      'Dr. Ade­bowale signs off on the medical supply list each clinic; Mrs. Okonkwo countersigns disbursements.',
      'Two-person rule on every withdrawal above ₦100,000 (approximately $130).',
      'Per-clinic report published within 7 days, with patient counts and consumables actually used.',
    ],
    prayerGroup: {
      members: 142,
      recentPrayers: 41,
      focusLine: 'Pray for safe travel for the clinical team into Makoko this Saturday, and for the patients they will see — particularly the expectant mothers.',
    },
  },
  {
    id: 'cmp_andrew_bursary',
    churchId: 'ch_accra_st_andrew',
    title: 'Osu Bursary Fund — 2026 Intake',
    summary:
      "School fees and exam registration for 22 students entering senior secondary this September.",
    raised: 6100,
    goal: 9200,
    currency: 'USD',
    donors: 204,
    daysLeft: 38,
    category: 'Education',
    objective:
      "Fund a full year of senior secondary school fees and WAEC exam registration for 22 students from the Osu parish district whose families cannot meet the September 2026 fee deadline.",
    currentState:
      "66% funded. 14 of 22 student placements confirmed and assigned to specific donors. Outstanding gap covers fees for 8 remaining students plus exam registration for all 22 in May 2027.",
    team: [
      { role: 'Burden lead',          name: 'Rev. Dr. Kofi Mensah' },
      { role: 'Bursary committee chair', name: 'Mrs. Adwoa Boateng' },
      { role: 'Finance steward',       name: 'Mr. Yaw Ofori, CA' },
      { role: 'On-ground delivery',    name: 'School liaison — Osu Presbyterian SHS' },
    ],
    moneyWorkflow: [
      'Donors give via BURDEN.',
      'Funds held in escrow for 3 banking days, then released to St. Andrew\'s Presbyterian\'s verified payout account at GCB Bank, Accra.',
      'Bursary committee disburses directly to the schools — money does not pass through students or families.',
      'Mr. Ofori (CA) reconciles every term against published school fee schedules.',
      'Names of supported students (anonymised) and grades published at the end of each term.',
    ],
    prayerGroup: {
      members: 31,
      recentPrayers: 9,
      focusLine: 'Pray for the 22 students stepping into senior secondary — especially the eight whose places are not yet confirmed, and for their families.',
    },
  },
  {
    id: 'cmp_allnations_meals',
    churchId: 'ch_london_allnations',
    title: 'Wednesday Community Meal',
    summary:
      "Groceries and kitchen costs for the weekly meal serving roughly 120 neighbours each Wednesday.",
    raised: 2150,
    goal: 4000,
    currency: 'USD',
    donors: 138,
    daysLeft: 9,
    category: 'Community',
    objective:
      "Fund three months of the Wednesday evening community meal in Peckham — roughly 120 neighbours weekly — covering groceries, cooking gas, and a small honorarium for the volunteer kitchen lead.",
    currentState:
      "54% funded. 14 of the 26 weeks in this funding window already covered. Meal continues uninterrupted for now from the church\'s reserve, but reserve is depleted as of week 16.",
    team: [
      { role: 'Burden lead',          name: 'Pastor Grace Okoye' },
      { role: 'Kitchen lead',         name: 'Auntie Funke Adebayo' },
      { role: 'Finance steward',      name: 'Daniel Okafor (treasurer)' },
      { role: 'On-ground delivery',   name: 'Volunteer rota — Peckham fellowship' },
    ],
    moneyWorkflow: [
      'Donors give via BURDEN.',
      'Funds held in escrow for 3 banking days, then released to All Nations Fellowship\'s verified payout account at Lloyds Bank, UK.',
      'Daniel Okafor pays the registered cash-and-carry directly each week — no cash handled by volunteers.',
      'Auntie Funke submits a weekly head-count and a receipts pack to the treasurer.',
      'Monthly summary published on this burden\'s page.',
    ],
    prayerGroup: {
      members: 47,
      recentPrayers: 12,
      focusLine: 'Pray for the neighbours who come every Wednesday — many of whom come for the company as much as the meal — and for the volunteers cooking.',
    },
  },
  {
    id: 'cmp_lighthouse_rebuild',
    churchId: 'ch_manila_lighthouse',
    title: 'Fellowship Hall Rebuild',
    summary:
      "Roofing, electrical, and furnishing for the hall damaged by Typhoon Karding.",
    raised: 18900,
    goal: 32000,
    currency: 'USD',
    donors: 1102,
    daysLeft: 47,
    category: 'Building',
    objective:
      "Rebuild the Lighthouse Bible Church fellowship hall — roof, electricals, and basic furnishing — destroyed by Typhoon Karding. The hall hosts the youth tutoring centre, the Saturday women\'s group, and Sunday overflow.",
    currentState:
      "59% funded. Roof framing complete and inspected. Outstanding scope: roof skin, electrical rewire and inspection, sound system, and 12 fellowship tables and seating for 80.",
    team: [
      { role: 'Burden lead',          name: 'Pastor Joel Ramos' },
      { role: 'Site foreman',         name: 'Engr. Romulo Santos (licensed)' },
      { role: 'Finance steward',      name: 'Marites Cruz, CPA' },
      { role: 'On-ground delivery',   name: 'Local contractors — vetted by Engr. Santos' },
    ],
    moneyWorkflow: [
      'Donors give via BURDEN.',
      'Funds held in escrow for 3 banking days, then released to Lighthouse Bible Church\'s verified payout account at BPI, Philippines.',
      'Marites Cruz (CPA) releases against signed contractor invoices only — no advance payments.',
      'Engr. Santos signs off every milestone (framing, skin, electrical, fitout) before the next disbursement.',
      'Photographs and inspection notes published with each milestone.',
    ],
    prayerGroup: {
      members: 218,
      recentPrayers: 73,
      focusLine: 'Pray for safe work on the roof in the coming weeks, and for the youth currently meeting outside while the hall is unfinished.',
    },
  },
]

// Events — both church-hosted gatherings and platform-level events.
// `churchId: null` means BURDEN itself is the host.
export const events = [
  {
    id: 'evt_redeemer_clinic_day',
    churchId: 'ch_lagos_redeemer',
    title: 'Makoko Clinic Day',
    location: 'Makoko, Lagos',
    date: '2026-05-17',
    summary:
      'Free clinic open to the community — paediatric, maternal, and primary care. Volunteers needed.',
    category: 'Outreach',
  },
  {
    id: 'evt_grace_sat_school_open',
    churchId: 'ch_nairobi_grace',
    title: 'Saturday School — Open Day',
    location: 'Eastleigh, Nairobi',
    date: '2026-05-24',
    summary:
      'Parents and donors invited to meet the children, see classrooms, and review the term plan.',
    category: 'Community',
  },
  {
    id: 'evt_burden_transparency_townhall',
    churchId: null,
    title: 'BURDEN Quarterly Transparency Town Hall',
    location: 'Online — Zoom + livestream',
    date: '2026-06-30',
    summary:
      'Quarterly read-out: platform volume, fees, fraud rate, payout completion. Open Q&A with the BURDEN team.',
    category: 'Platform',
  },
  {
    id: 'evt_allnations_meal_anniversary',
    churchId: 'ch_london_allnations',
    title: 'Wednesday Meal — Five-Year Anniversary',
    location: 'Peckham, London',
    date: '2026-07-08',
    summary:
      'Five years of the weekly community meal. Service of thanks, shared dinner, and brief programme update.',
    category: 'Community',
  },
  {
    id: 'evt_lighthouse_dedication',
    churchId: 'ch_manila_lighthouse',
    title: 'Fellowship Hall — Dedication Service',
    location: 'Quezon City, Manila',
    date: '2026-09-13',
    summary:
      'Service to dedicate the rebuilt fellowship hall. Donors who contributed receive a printed update on the works.',
    category: 'Dedication',
  },
]

export const principles = [
  'Every church and institution is verified before receiving funds.',
  'Donors see where their money is going — itemised, in plain language.',
  'No urgency manipulation. No spiritual-reward-for-giving language.',
  'No single admin can move funds, change verification, or access donor PII alone.',
  'Quarterly transparency report, published in full, every quarter.',
]
