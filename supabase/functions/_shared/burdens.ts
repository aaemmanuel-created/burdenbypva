// The live burdens, for channels that have no app to read them from (USSD).
// Mirrors the ids and names in burden-app/src/data/mock.js and
// burden-native/src/data/mock.ts — update all three together until burdens
// live in the database.

export type BurdenRef = { id: string; title: string; short: string; churchId: string; churchName: string; city: string };

export const BURDENS: BurdenRef[] = [
  { id: 'cmp_andrew_bursary', title: 'Osu Bursary Fund — 2026 Intake', short: 'Osu Bursary Fund',
    churchId: 'ch_accra_st_andrew', churchName: "St. Andrew's Presbyterian", city: 'Accra' },
  { id: 'cmp_grace_school', title: 'Saturday School — Term Materials', short: 'Saturday School',
    churchId: 'ch_nairobi_grace', churchName: 'Grace Community Church', city: 'Nairobi' },
  { id: 'cmp_redeemer_clinic', title: 'Mobile Medical Outreach — Q2', short: 'Medical Outreach',
    churchId: 'ch_lagos_redeemer', churchName: 'Redeemer Chapel Lagos', city: 'Lagos' },
  { id: 'cmp_allnations_meals', title: 'Wednesday Community Meal', short: 'Wednesday Meal',
    churchId: 'ch_london_allnations', churchName: 'All Nations Fellowship', city: 'London' },
  { id: 'cmp_lighthouse_rebuild', title: 'Fellowship Hall Rebuild', short: 'Fellowship Hall',
    churchId: 'ch_manila_lighthouse', churchName: 'Lighthouse Bible Church', city: 'Manila' },
];
