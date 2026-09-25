// Static content for the EdFi site. Numbers are demo values for the Kozybayev University pilot.

export const COINS = {
  EDC: { name: 'EdFi Coin', color: '#F0B90B' },
  BNB: { name: 'BNB', color: '#F3BA2F' },
  BTC: { name: 'Bitcoin', color: '#F7931A' },
  ETH: { name: 'Ethereum', color: '#627EEA' },
  SOL: { name: 'Solana', color: '#9945FF' },
  XRP: { name: 'XRP', color: '#23292F' },
  USDT: { name: 'TetherUS', color: '#26A17B' },
};

// Snapshot used until live prices from Binance's public market-data API arrive
// (and whenever that API is unreachable).
export const FALLBACK_MARKETS = {
  BTC: { price: 84033.99, change: -0.68, volume: 1570440950 },
  ETH: { price: 2693.96, change: 0.03, volume: 688309857 },
  BNB: { price: 775.21, change: -0.73, volume: 105021356 },
  SOL: { price: 122.02, change: 3.79, volume: 482173688 },
  XRP: { price: 1.5702, change: 2.57, volume: 540407579 },
};

export const EDC_START = { price: 0.0267, change: 4.82, volume: 1204380 * 0.0267 };

export const NAV = [
  {
    label: 'Learn & Earn',
    menu: [
      { icon: 'GraduationCap', title: 'Academic Rewards', desc: 'Grades and GPA paid out in EDC', href: '#earn' },
      { icon: 'CalendarCheck', title: 'Attendance Streaks', desc: 'Weekly and monthly check-in bonuses', href: '#earn' },
      { icon: 'FlaskConical', title: 'Research Grants', desc: 'Earn for published, DOI-verified work', href: '#earn' },
      { icon: 'PiggyBank', title: 'EDC Staking', desc: 'Lock EDC for a boosted earn rate', href: '#products' },
    ],
  },
  { label: 'Markets', href: '#markets' },
  { label: 'Campus Pay', href: '#products' },
  { label: 'Roadmap', href: '#roadmap' },
  {
    label: 'More',
    menu: [
      { icon: 'Building2', title: 'For Universities', desc: 'Connect your registrar to EdFi oracles', href: '#products' },
      { icon: 'CircleHelp', title: 'FAQ', desc: 'How earning, paying and withdrawing work', href: '#faq' },
      { icon: 'Smartphone', title: 'Download App', desc: 'Earn on the go, iOS and Android', href: '#download' },
    ],
  },
];

export const NEWS = [
  'EdFi pilot opens to 6,000 Kozybayev University students on BNB Chain testnet',
  'How EDC rewards are calculated: GPA, attendance and research explained',
  'Campus Pay: spend EDC at the canteen, dormitory office and merch store',
  'EdFi presented at the Binance Crypto Ideathon',
  'Roadmap update: mainnet migration and eGov integration',
];

export const TRUST_STATS = [
  { value: '6,000', label: 'Students in the pilot' },
  { value: '4,208', label: 'Active scholars' },
  { value: '1.2M+', label: 'EDC rewarded' },
  { value: '~3s', label: 'Settlement on BNB Chain' },
];

// Earning "markets": what students get paid for.
export const EARN_CATEGORIES = ['All', 'Academic', 'Attendance', 'Research', 'Campus'];

export const EARN_ACTIVITIES = [
  { id: 'exam', icon: 'GraduationCap', name: 'Exam grade A', category: 'Academic', reward: 50, frequency: 'Per exam', oracle: 'University LMS', earners24h: 412 },
  { id: 'gpa', icon: 'Award', name: 'Semester GPA 3.5+', category: 'Academic', reward: 200, frequency: 'Per semester', oracle: 'Registrar', earners24h: 186 },
  { id: 'week', icon: 'CalendarCheck', name: '100% weekly attendance', category: 'Attendance', reward: 25, frequency: 'Weekly', oracle: 'Smart-card check-in', earners24h: 1904 },
  { id: 'streak', icon: 'Flame', name: '30-day attendance streak', category: 'Attendance', reward: 120, frequency: 'Monthly', oracle: 'Smart-card check-in', earners24h: 233 },
  { id: 'paper', icon: 'FlaskConical', name: 'Published research article', category: 'Research', reward: 300, frequency: 'Per article', oracle: 'DOI registry', earners24h: 12 },
  { id: 'talk', icon: 'Mic', name: 'Conference talk', category: 'Research', reward: 150, frequency: 'Per event', oracle: 'Faculty sign-off', earners24h: 27 },
  { id: 'olympiad', icon: 'Trophy', name: 'Olympiad or hackathon win', category: 'Campus', reward: 250, frequency: 'Per event', oracle: 'Organizer signature', earners24h: 9 },
  { id: 'volunteer', icon: 'HeartHandshake', name: 'Volunteering', category: 'Campus', reward: 10, frequency: 'Per hour', oracle: 'Student council', earners24h: 341 },
];

export const PRODUCTS = [
  {
    icon: 'GraduationCap',
    tag: 'Earn',
    title: 'Get paid for learning',
    desc: 'Grades, attendance and published research are verified by university oracles and minted as EDC to your wallet.',
    cta: 'Start earning',
  },
  {
    icon: 'QrCode',
    tag: 'Spend',
    title: 'Pay across campus',
    desc: 'Scan to pay at the canteen, dormitory office or merch store. Zero fees, settled on BNB Chain in seconds.',
    cta: 'See Campus Pay',
  },
  {
    icon: 'ArrowLeftRight',
    tag: 'Withdraw',
    title: 'Take it anywhere',
    desc: 'EDC is a BEP-20 token. Move it to any BNB Chain wallet, swap it, or stake it for a higher earn rate.',
    cta: 'How withdrawals work',
  },
];

export const ROADMAP = [
  {
    phase: 'Phase 1',
    date: 'Nov 2025',
    title: 'Smart contract MVP',
    desc: 'Testnet sandbox at Kozybayev University (6,000 students) to validate the Learn-to-Earn model.',
  },
  {
    phase: 'Phase 2',
    date: 'Q2 2026',
    title: 'Full campus economy',
    desc: 'Mainnet migration. Payments at canteens, dormitories and local merchandise stores.',
  },
  {
    phase: 'Phase 3',
    date: '2027',
    title: 'National eGov integration',
    desc: 'Direct integration with state education databases to scale EdFi across Kazakhstan.',
  },
];

export const FAQ = [
  {
    q: 'What is EdFi?',
    a: 'EdFi is a Learn-to-Earn platform for universities. Verified academic results such as grades, attendance and research are rewarded with EDC, a BEP-20 token on BNB Chain that students can spend on campus or withdraw.',
  },
  {
    q: 'How do I earn EDC?',
    a: 'Sign in with your university account and your results sync automatically. Each verified activity (an A on an exam, a full week of attendance, a published article) mints the matching reward to your EdFi wallet. See the Learn & Earn table for current rates.',
  },
  {
    q: 'How is my academic data verified?',
    a: 'EdFi never takes self-reported data. University systems (LMS, registrar, smart-card check-in, DOI registries) sign each result, and an on-chain oracle checks the signature before any EDC is minted.',
  },
  {
    q: 'What can I spend EDC on?',
    a: 'Canteen meals, dormitory fees and university merchandise during the pilot. Scan the merchant QR code in the app and the payment settles in about three seconds with no fees.',
  },
  {
    q: 'Can I withdraw EDC to an exchange?',
    a: 'Yes. EDC lives on BNB Chain, so you can send it to any BNB Chain wallet. From there it can be swapped or moved to an exchange. Withdrawals are fee-free during the pilot.',
  },
  {
    q: 'Is EdFi live?',
    a: 'EdFi is a concept built for the Binance Crypto Ideathon and is running as a testnet pilot. The dashboard demo uses sample data so you can try every flow without a wallet.',
  },
];

export const FOOTER_COLUMNS = [
  {
    title: 'About',
    links: [['About EdFi', '#products'], ['Roadmap', '#roadmap'], ['Binance Crypto Ideathon', '#faq'], ['Whitepaper', '#faq']],
  },
  {
    title: 'Products',
    links: [['Learn & Earn', '#earn'], ['Campus Pay', '#products'], ['EDC Wallet', '/demo'], ['Staking', '#products']],
  },
  {
    title: 'Universities',
    links: [['Partner with EdFi', '#products'], ['Oracle verification', '#faq'], ['Pilot: Kozybayev University', '#roadmap']],
  },
  {
    title: 'Learn',
    links: [['What is Learn-to-Earn?', '#faq'], ['How rewards work', '#earn'], ['Withdrawing EDC', '#faq']],
  },
  {
    title: 'Support',
    links: [['FAQ', '#faq'], ['Try the demo', '/demo'], ['Download App', '#download']],
  },
];
