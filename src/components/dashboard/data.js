export const DEMO_DEPOSIT_PAYLOAD = 'EDFI-DEMO-ONLY:DO-NOT-SEND-FUNDS';
export const DEMO_COPY = {
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
  { id: 'week', title: '100% weekly attendance', sub: 'Smart-card check-in', rewardUnits: 2500, progress: 5, total: 5, status: 'claimable' },
  { id: 'course', title: 'Blockchain Basics course', sub: 'EdFi Academy · 4 lessons', rewardUnits: 4000, progress: 3, total: 4, status: 'active', cta: 'Continue' },
  { id: 'gpa', title: 'Semester GPA 3.5+', sub: 'Current GPA 3.72 · Registrar', rewardUnits: 20000, progress: 1, total: 1, status: 'verifying' },
  { id: 'volunteer', title: 'Volunteer 10 hours', sub: 'Student council · 6 of 10 hours', rewardUnits: 10000, progress: 6, total: 10, status: 'active', cta: 'Log hour', doneText: 'Hour logged' },
  { id: 'paper', title: 'Publish a research article', sub: 'Submit a DOI for verification', rewardUnits: 30000, progress: 0, total: 1, status: 'active', cta: 'Submit', verify: true },
];

export const MERCHANTS = [
  { id: 'canteen', name: 'Campus Canteen', sub: 'Main building, floor 1', icon: 'Utensils' },
  { id: 'dorm', name: 'Dormitory Office', sub: 'Dorm fees and services', icon: 'BedDouble' },
  { id: 'merch', name: 'Merch Store', sub: 'University apparel', icon: 'Shirt' },
  { id: 'print', name: 'Library Printing', sub: 'Print and copy center', icon: 'Printer' },
];

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Weekly attendance verified', text: '100% attendance confirmed. 25 EDC is ready to claim.', ago: '12 min ago' },
  { id: 'n2', title: 'Exam reward received', text: '+50.00 EDC for Macroeconomics (grade A).', ago: '2 h ago' },
  { id: 'n3', title: 'GPA verification in progress', text: 'The registrar oracle is confirming your semester GPA.', ago: 'Yesterday' },
];

export const ANNOUNCEMENTS = [
  'Attendance rewards now settle every Friday',
  'Blockchain Basics course: earn 40 EDC on completion',
  'Dormitory Office now accepts Campus Pay',
  'Scheduled maintenance: Sunday 02:00–03:00 (UTC+5)',
];
