import { Link } from 'react-router-dom';
import { ChevronRight, Monitor, Smartphone } from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import QRCode from '../QRCode';
import { appUrl } from '../../lib/links';

function AppleGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.3-4.2zM13.9 5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

const PLATFORMS = [
  ['iOS', <AppleGlyph key="ios" />],
  ['Android', <Smartphone key="and" size={28} />],
  ['Web App', <Monitor key="web" size={28} />],
];

export default function AppDownload() {
  return (
    <section id="download" className="page-x scroll-mt-16 py-10 lg:py-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <PhoneMockup />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="section-title">
            Earn on the go.
            <br />
            Anywhere, anytime.
          </h2>
          <div className="mt-10 hidden max-w-[440px] items-center gap-6 rounded-2xl border border-line p-6 sm:flex">
            <QRCode value={appUrl()} size={112} />
            <div>
              <p className="text-sm text-ink-3">Scan to Download App</p>
              <p className="mt-1 text-xl font-semibold text-ink">iOS and Android</p>
            </div>
          </div>
          <Link to="/demo" className="btn btn-primary btn-lg mt-8 w-full sm:hidden">Open the Web App</Link>
          <div className="mt-10 flex gap-10">
            {PLATFORMS.map(([label, icon]) => (
              <Link key={label} to="/demo" className="group flex flex-col items-center gap-2 text-ink transition-colors hover:text-yellow-text">
                {icon}
                <span className="text-sm text-ink-3 transition-colors group-hover:text-yellow-text">{label}</span>
              </Link>
            ))}
          </div>
          <Link to="/demo" className="link-more mt-8 hidden text-ink sm:inline-flex">
            More Download Options
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
