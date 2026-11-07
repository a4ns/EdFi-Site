export const DEMO_DEPOSIT_PAYLOAD = 'EDFI-DEMO-ONLY:DO-NOT-SEND-FUNDS';
export const DEMO_COPY = {
  account: 'Demo profile and settings only. No wallet is connected. Security and notification settings are illustrative.',
  overview: 'Demo only. Balances and activity are sample data. No wallet is connected and no funds are sent. Changes reset when you leave or reload.',
  operation: 'Demo only. This changes your sample balance; no funds are sent on-chain.',
  deposit: 'Demo only. Do not send funds. This prototype has no deposit address and cannot receive or credit deposits.',
};
export const shortAddress = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const t = (h, m, sec) => ((h * 60 + m) * 60 + sec) * 1000;

export function initialTransactions(now = Date.now()) {
  return [
    { id: 't6', kind: 'reward', title: 'Exam grade A', sub: 'Macroeconomics', amountUnits: 5000, at: now - t(2, 14, 37) },
    { id: 't5', kind: 'payment', title: 'Campus Canteen', sub: 'Scan Pay', amountUnits: -1500, at: now - t(5, 41, 9) },
    { id: 't4', kind: 'reward', title: 'Attendance bonus', sub: 'Weekly milestone 100%', amountUnits: 2500, at: now - t(26, 7, 52) },
    { id: 't3', kind: 'payment', title: 'Merch Store', sub: 'University hoodie', amountUnits: -12000, at: now - t(74, 33, 18) },
    { id: 't2', kind: 'reward', title: 'Research article', sub: 'DOI verified', amountUnits: 30000, at: now - t(146, 52, 41) },
    { id: 't1', kind: 'withdraw', title: 'Withdraw', sub: 'Sample withdrawal recipient', amountUnits: -10000, at: now - t(194, 5, 26) },
  ];
}

export const INITIAL_TASKS = [
  { id: 'week', title: '100% weekly attendance', sub: 'Sample smart-card check-ins', rewardUnits: 2500, progress: 5, total: 5, status: 'claimable' },
  { id: 'course', title: 'Blockchain Basics course', sub: 'Sample course · 4 demo steps', rewardUnits: 4000, progress: 3, total: 4, status: 'active', cta: 'Next lesson' },
  { id: 'gpa', title: 'Semester GPA 3.5+', sub: 'Sample GPA 3.72 · local demo', rewardUnits: 20000, progress: 1, total: 1, status: 'verifying', verify: true },
  { id: 'volunteer', title: 'Volunteer 10 hours', sub: 'Sample volunteering hours', rewardUnits: 10000, progress: 6, total: 10, status: 'active', cta: 'Log hour', doneText: 'Demo hour added' },
  { id: 'paper', title: 'Publish a research article', sub: 'Sample article · no DOI required', rewardUnits: 30000, progress: 0, total: 1, status: 'active', cta: 'Submit', verify: true },
];

export const MERCHANTS = [
  { id: 'canteen', name: 'Campus Canteen', sub: 'Main building, floor 1', icon: 'Utensils' },
  { id: 'dorm', name: 'Dormitory Office', sub: 'Dorm fees and services', icon: 'BedDouble' },
  { id: 'merch', name: 'Merch Store', sub: 'University apparel', icon: 'Shirt' },
  { id: 'print', name: 'Library Printing', sub: 'Print and copy center', icon: 'Printer' },
];

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Sample: weekly attendance reward', text: 'The sample weekly task has a 25 EDC demo reward ready to claim.', ago: '12 min ago' },
  { id: 'n2', title: 'Sample: exam reward', text: 'The sample history includes a 50 EDC reward for an A in Macroeconomics.', ago: '2 h ago' },
  { id: 'n3', title: 'Sample: GPA verification', text: 'Try a local verification example in Learn & Earn. No university or oracle is connected.', ago: 'Yesterday' },
];

export const ANNOUNCEMENTS = [
  'Demo guide: claim a weekly attendance reward',
  'Demo guide: complete a sample learning task for 40 EDC',
  'Demo guide: try a simulated campus payment',
  'Next phase: university integration and a testnet pilot are planned',
];
