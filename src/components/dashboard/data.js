export const WALLET_ADDRESS = '0x71C4e2b8A3f09d5E6c1B7a2D4f8E0c3B9a5D9A24';
export const shortAddress = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const t = (h, m, sec) => ((h * 60 + m) * 60 + sec) * 1000;

export function initialTransactions(now = Date.now()) {
  return [
    { id: 't6', kind: 'reward', title: 'Exam grade A', sub: 'Macroeconomics', amount: 50, at: now - t(2, 14, 37) },
    { id: 't5', kind: 'payment', title: 'Campus Canteen', sub: 'Scan Pay', amount: -15, at: now - t(5, 41, 9) },
    { id: 't4', kind: 'reward', title: 'Attendance bonus', sub: 'Weekly milestone 100%', amount: 25, at: now - t(26, 7, 52) },
    { id: 't3', kind: 'payment', title: 'Merch Store', sub: 'University hoodie', amount: -120, at: now - t(74, 33, 18) },
    { id: 't2', kind: 'reward', title: 'Research article', sub: 'DOI verified', amount: 300, at: now - t(146, 52, 41) },
    { id: 't1', kind: 'withdraw', title: 'Withdraw', sub: `To ${shortAddress(WALLET_ADDRESS)}`, amount: -100, at: now - t(194, 5, 26) },
  ];
}

export const INITIAL_TASKS = [
  { id: 'week', title: '100% weekly attendance', sub: 'Smart-card check-in', reward: 25, progress: 5, total: 5, status: 'claimable' },
  { id: 'course', title: 'Blockchain Basics course', sub: 'EdFi Academy · 4 lessons', reward: 40, progress: 3, total: 4, status: 'active', cta: 'Continue' },
  { id: 'gpa', title: 'Semester GPA 3.5+', sub: 'Current GPA 3.72 · Registrar', reward: 200, progress: 1, total: 1, status: 'verifying' },
  { id: 'volunteer', title: 'Volunteer 10 hours', sub: 'Student council · 6 of 10 hours', reward: 100, progress: 6, total: 10, status: 'active', cta: 'Log hour', doneText: 'Hour logged' },
  { id: 'paper', title: 'Publish a research article', sub: 'Submit a DOI for verification', reward: 300, progress: 0, total: 1, status: 'active', cta: 'Submit', verify: true },
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
