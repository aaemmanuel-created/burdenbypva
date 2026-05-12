// Mock data for the BURDEN MVP demo.
// Mirrors burden-app/src/data/mock.js exactly so both clients show the same content.

export type Church = {
  id: string;
  name: string;
  location: string;
  tradition: string;
  verified: boolean;
  tier: 'Basic' | 'Verified' | 'Premium Trust';
  members: number;
  summary: string;
  leadership: string;
  founded: number;
};

export type Campaign = {
  id: string;
  churchId: string;
  title: string;
  summary: string;
  raised: number;
  goal: number;
  currency: string;
  donors: number;
  daysLeft: number;
  category: 'Education' | 'Health' | 'Community' | 'Building';
};

export type Gift = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  churchName: string;
  amount: number;
  coveredFee: number;
  total: number;
  recurring: boolean;
  anonymous: boolean;
  donor: { name: string; email: string } | null;
  timestamp: string;
};

export const churches: Church[] = [
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
];

export const campaigns: Campaign[] = [
  {
    id: 'cmp_grace_school',
    churchId: 'ch_nairobi_grace',
    title: 'Saturday School — Term Materials',
    summary:
      "Books, uniforms, and a daily meal for 84 children attending the Saturday school this term.",
    raised: 4280, goal: 7500, currency: 'USD', donors: 312, daysLeft: 21,
    category: 'Education',
  },
  {
    id: 'cmp_redeemer_clinic',
    churchId: 'ch_lagos_redeemer',
    title: 'Mobile Medical Outreach — Q2',
    summary:
      "Fuel, medicines, and clinician fees for four weekend clinics in Makoko and Ajegunle.",
    raised: 12640, goal: 18000, currency: 'USD', donors: 891, daysLeft: 14,
    category: 'Health',
  },
  {
    id: 'cmp_andrew_bursary',
    churchId: 'ch_accra_st_andrew',
    title: 'Osu Bursary Fund — 2026 Intake',
    summary:
      "School fees and exam registration for 22 students entering senior secondary this September.",
    raised: 6100, goal: 9200, currency: 'USD', donors: 204, daysLeft: 38,
    category: 'Education',
  },
  {
    id: 'cmp_allnations_meals',
    churchId: 'ch_london_allnations',
    title: 'Wednesday Community Meal',
    summary:
      "Groceries and kitchen costs for the weekly meal serving roughly 120 neighbours each Wednesday.",
    raised: 2150, goal: 4000, currency: 'USD', donors: 138, daysLeft: 9,
    category: 'Community',
  },
  {
    id: 'cmp_lighthouse_rebuild',
    churchId: 'ch_manila_lighthouse',
    title: 'Fellowship Hall Rebuild',
    summary:
      "Roofing, electrical, and furnishing for the hall damaged by Typhoon Karding.",
    raised: 18900, goal: 32000, currency: 'USD', donors: 1102, daysLeft: 47,
    category: 'Building',
  },
];

export type Event = {
  id: string;
  churchId: string | null;
  title: string;
  location: string;
  date: string;
  summary: string;
  category: 'Outreach' | 'Community' | 'Platform' | 'Dedication';
};

export const events: Event[] = [
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
];

export const principles: string[] = [
  'Every church and institution is verified before receiving funds.',
  'Donors see where their money is going — itemised, in plain language.',
  'No urgency manipulation. No spiritual-reward-for-giving language.',
  'No single admin can move funds, change verification, or access donor PII alone.',
  'Quarterly transparency report, published in full, every quarter.',
];
