// Static content for the EdFi concept prototype. Numbers illustrate the proposed campus pilot.

export const COINS = {
  EDC: { name: 'EdFi Coin', color: '#F0B90B' },
  BNB: { name: 'BNB', color: '#F3BA2F' },
  BTC: { name: 'Bitcoin', color: '#F7931A' },
  ETH: { name: 'Ethereum', color: '#627EEA' },
  SOL: { name: 'Solana', color: '#9945FF' },
  XRP: { name: 'XRP', color: '#23292F' },
  DOGE: { name: 'Dogecoin', color: '#C2A633' },
  ADA: { name: 'Cardano', color: '#0033AD' },
  TRX: { name: 'TRON', color: '#EB0029' },
  LINK: { name: 'Chainlink', color: '#2A5ADA' },
  AVAX: { name: 'Avalanche', color: '#E84142' },
  SUI: { name: 'Sui', color: '#4DA2FF' },
  TON: { name: 'Toncoin', color: '#0098EA' },
  LTC: { name: 'Litecoin', color: '#345D9D' },
  DOT: { name: 'Polkadot', color: '#E6007A' },
  USDT: { name: 'TetherUS', color: '#26A17B' },
};

// Snapshot used until live prices from Binance's public market-data API arrive
// (and whenever that API is unreachable).
export const FALLBACK_MARKETS = {
  BTC: { price: 84016, change: -0.5, volume: 1563047679, high: 85255, low: 83183 },
  ETH: { price: 2693.21, change: -0.09, volume: 680154606, high: 2743, low: 2667.33 },
  BNB: { price: 775.3, change: -0.59, volume: 104387119, high: 790.29, low: 768.58 },
  SOL: { price: 121.72, change: 3.7, volume: 481695710, high: 122.78, low: 115.86 },
  XRP: { price: 1.57, change: 2.78, volume: 541155128, high: 1.63, low: 1.5191 },
  DOGE: { price: 0.09799, change: 1.95, volume: 98163992, high: 0.09912, low: 0.09456 },
  ADA: { price: 0.2547, change: 2.83, volume: 52672013, high: 0.2586, low: 0.2461 },
  TRX: { price: 0.3375, change: -0.97, volume: 26360728, high: 0.3408, low: 0.336 },
  LINK: { price: 13.848, change: 5.16, volume: 82572929, high: 14.219, low: 13.102 },
  AVAX: { price: 10.446, change: -0.05, volume: 58739032, high: 10.75, low: 10.082 },
  SUI: { price: 1.1379, change: 11.93, volume: 154494798, high: 1.1615, low: 1 },
  TON: { price: 1.6, change: 0.95, volume: 7717352, high: 1.641, low: 1.58 },
  LTC: { price: 71.14, change: 0.1, volume: 60303408, high: 72.42, low: 68.96 },
  DOT: { price: 1.183, change: 1.2, volume: 11989957, high: 1.204, low: 1.131 },
};

export const EDC_START = { price: 0.0267, change: 4.82, volume: 1204380 * 0.0267, high: 0.0271, low: 0.0252 };

export const NAV = [
  {
    label: 'Learn & Earn',
    menu: [
      { icon: 'GraduationCap', title: 'Academic Rewards', desc: 'Grades and GPA paid out in EDC', href: '#earn-academic' },
      { icon: 'CalendarCheck', title: 'Attendance Streaks', desc: 'Weekly and monthly check-in bonuses', href: '#earn-attendance' },
      { icon: 'FlaskConical', title: 'Research Grants', desc: 'Earn for published, DOI-verified work', href: '#earn-research' },
      { icon: 'PiggyBank', title: 'EDC Staking', desc: 'Lock EDC for a boosted earn rate', href: '#products' },
    ],
  },
  { label: 'Markets', href: '/markets' },
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
  'EdFi wins Crypto Ideathon Kazakhstan',
  'How EDC rewards are calculated',
  'Campus Pay concept: paying at the canteen',
  'Next up: testnet pilot on campus',
  'Mainnet migration and eGov roadmap',
];

export const TRUST_STATS = [
  { value: 6000, label: 'Students at the proposed pilot campus' },
  { value: 8, label: 'Proposed ways to earn EDC' },
  { value: 0, label: 'Proposed campus payment fees' },
  { value: 'Prototype', label: 'Current product stage' },
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
    desc: 'The proposed model rewards university-verified grades, attendance and research with EDC. Try sample rewards in the demo.',
    cta: 'Start earning',
  },
  {
    icon: 'QrCode',
    tag: 'Spend',
    title: 'Pay across campus',
    desc: 'Explore a simulated QR payment for a campus canteen. Real campus payments and zero platform fees are planned.',
    cta: 'See Campus Pay',
  },
  {
    icon: 'ArrowLeftRight',
    tag: 'Withdraw',
    title: 'Take it anywhere',
    desc: 'Preview a simulated withdrawal. EDC contracts are tested locally; wallet transfers, swaps and staking are not available yet.',
    cta: 'How withdrawals work',
  },
];

export const ROADMAP = [
  {
    phase: 'Phase 1',
    date: '2025',
    status: 'Completed',
    title: 'Concept & prototype',
    desc: 'Learn-to-Earn model, token mechanics and a working web prototype. 1st place at Crypto Ideathon Kazakhstan by Binance.',
  },
  {
    phase: 'Phase 2',
    status: 'Up next',
    title: 'Testnet pilot',
    desc: 'Planned deployment to BNB Smart Chain testnet and a sandbox pilot at Kozybayev University (6,000 students).',
  },
  {
    phase: 'Phase 3',
    status: 'Planned',
    title: 'Full campus economy',
    desc: 'Mainnet launch. Payments at canteens, dormitories and local merchandise stores.',
  },
  {
    phase: 'Phase 4',
    date: '2027',
    status: 'Planned',
    title: 'National eGov integration',
    desc: 'Direct integration with state education databases to scale EdFi across Kazakhstan.',
  },
];

export const FAQ = [
  {
    q: 'What is EdFi?',
    a: 'EdFi is a Learn-to-Earn concept for universities. The proposed model rewards verified grades, attendance and research with EDC, a BEP-20 token. Campus payments and withdrawals are planned; the current web prototype uses sample data.',
  },
  {
    q: 'How do I earn EDC?',
    a: 'In the demo, claim sample rewards for activities such as an A on an exam, full attendance or a published article. University sign-in, automatic result syncing and real token rewards are not connected yet. The Learn & Earn table shows proposed rates.',
  },
  {
    q: 'How is my academic data verified?',
    a: 'The planned model uses university systems such as an LMS, registrar, attendance records and DOI registries to verify results. The locally tested contracts verify a signed result before minting EDC. University integrations and the oracle service are not live yet.',
  },
  {
    q: 'What can I spend EDC on?',
    a: 'Canteen meals, dormitory fees and university merchandise are planned use cases. The current Scan Pay demo only simulates a payment: no funds move and nothing is sent to a blockchain.',
  },
  {
    q: 'Can I withdraw EDC to an exchange?',
    a: 'Not yet. The EDC contracts have not been deployed, and the demo cannot send tokens to a wallet or exchange. Exchange listings, liquidity and real withdrawals are not available.',
  },
  {
    q: 'Is EdFi live?',
    a: 'EdFi is a concept prototype that won 1st place at Crypto Ideathon Kazakhstan by Binance. The contracts are tested locally and are not deployed. A testnet pilot at Kozybayev University is the next planned step. Try the demo with sample data and no connected wallet.',
  },
];

export const FOOTER_COLUMNS = [
  {
    title: 'About',
    links: [['About EdFi', '#products'], ['Roadmap', '#roadmap'], ['Crypto Ideathon win', '#roadmap']],
  },
  {
    title: 'Products',
    links: [['Learn & Earn', '#earn'], ['Campus Pay', '#products'], ['EDC Wallet', '/demo'], ['Staking', '#products']],
  },
  {
    title: 'Universities',
    links: [['Partner with EdFi', '#products'], ['Oracle verification', '#faq'], ['Kozybayev pilot', '#roadmap']],
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
