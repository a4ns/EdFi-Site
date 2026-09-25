import { Link } from 'react-router-dom';
import { Github, Instagram, Linkedin, Youtube } from 'lucide-react';
import Logo from './Logo';
import { FOOTER_COLUMNS } from '../data/content';

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.8 2.5h3.1l-6.8 7.8 8 10.6h-6.3l-4.9-6.4-5.6 6.4H2.2l7.3-8.3L1.8 2.5h6.4l4.4 5.9zm-1.1 16.5h1.7L7.4 4.3H5.6z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.1 13.1 1.2 11.6c-1.1-.3-1.1-1.1.2-1.6L20.5 2.6c.9-.3 1.7.2 1.4 1.7z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 5.2A17 17 0 0 0 15.4 4l-.5 1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.2 1 13 1.3 16.8a17 17 0 0 0 5.2 2.6l1.1-1.8c-.6-.2-1.2-.5-1.7-.9l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.2-3.1-11.6zM8.5 14.5c-1 0-1.9-1-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9 1 1.9 2.1c0 1.2-.8 2.1-1.9 2.1zm7 0c-1 0-1.9-1-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9 1 1.9 2.1c0 1.2-.8 2.1-1.9 2.1z" />
    </svg>
  );
}

const SOCIAL = [
  ['X', <XIcon key="x" />],
  ['Telegram', <TelegramIcon key="t" />],
  ['Discord', <DiscordIcon key="d" />],
  ['Instagram', <Instagram key="i" size={18} />],
  ['YouTube', <Youtube key="y" size={18} />],
  ['LinkedIn', <Linkedin key="l" size={18} />],
  ['GitHub', <Github key="g" size={18} />],
];

function FooterLink({ label, href }) {
  const cls = 'text-sm text-ink-3 transition-colors hover:text-ink';
  return href.startsWith('/') ? (
    <Link to={href} className={cls}>{label}</Link>
  ) : (
    <a href={href} className={cls}>{label}</a>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-page">
      <div className="page-x pb-10 pt-12 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo />
            <h3 className="mt-8 text-base font-medium text-ink">Community</h3>
            <div className="mt-4 grid max-w-[176px] grid-cols-4 gap-4">
              {SOCIAL.map(([label, icon]) => (
                <a key={label} href="#" aria-label={label} className="text-ink-3 transition-colors hover:text-yellow">
                  {icon}
                </a>
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-base font-medium text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink label={label} href={href} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>EdFi © {new Date().getFullYear()} · Built for the Binance Crypto Ideathon by Kazbekov Ansar · Mentor: Shaikhin D. N.</p>
          <p className="text-ink-4">Independent concept project. Not affiliated with or endorsed by Binance.</p>
        </div>
      </div>
    </footer>
  );
}
