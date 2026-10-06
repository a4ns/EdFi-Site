import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Github, Globe, Moon, Sun } from 'lucide-react';
import { applyTheme } from '../lib/theme';
import { sectionHref } from '../lib/navigation';
import { useTheme } from '../state/useTheme';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from '../state/locale';
import { FOOTER_COLUMNS } from '../data/content';

function FooterTheme() {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <div className="flex items-center gap-3 text-sm text-ink-2">
      {t('Theme')}
      <div className="flex rounded-lg bg-card p-1">
        {[
          ['dark', Moon],
          ['light', Sun],
        ].map(([themeId, Ico]) => (
          <button
            key={themeId}
            type="button"
            aria-pressed={theme === themeId}
            aria-label={t(themeId === 'dark' ? 'Dark theme' : 'Light theme')}
            onClick={() => applyTheme(themeId)}
            className={`flex h-7 w-9 items-center justify-center rounded-md transition-colors ${theme === themeId ? 'bg-raised text-ink' : 'text-ink-3'}`}
          >
            <Ico size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

function FooterLink({ label, href }) {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const text = t(label === 'Download App' ? 'Open web demo' : label);
  const destination = sectionHref(label === 'Download App' ? '/demo' : href, pathname);
  const cls = 'text-sm text-ink-3 transition-colors hover:text-ink';
  return destination.startsWith('/') || destination.startsWith('#') ? (
    <Link to={destination} className={cls}>{text}</Link>
  ) : (
    <a href={destination} className={cls}>{text}</a>
  );
}

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-line bg-page">
      <div className="page-x pb-10 pt-12 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-[1.1fr_repeat(5,1fr)]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo />
            <h3 className="mt-8 text-base font-medium text-ink">{t('Project')}</h3>
            <a href="https://github.com/a4ns/EdFi-Site" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-ink-3 transition-colors hover:text-yellow-text">
              <Github size={18} aria-hidden="true" />
              {t('View source on GitHub')}
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="hidden md:block">
              <h3 className="text-base font-medium text-ink">{t(col.title)}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink label={label} href={href} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 -mt-4 md:hidden">
            {FOOTER_COLUMNS.map((col) => (
              <details key={col.title} className="group border-b border-line">
                <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {t(col.title)}
                  <ChevronDown size={18} className="text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="space-y-3 pb-4">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <FooterLink label={label} href={href} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 md:mt-12 md:border-t md:border-line md:pt-6">
          <div className="flex items-center gap-4 text-sm text-ink-2">
            <Globe size={16} className="shrink-0 text-ink-3" />
            <LanguageSwitcher variant="inline" />
            <span className="h-4 w-px bg-line-strong" />
            <span className="num">USD · KZT</span>
          </div>
          <FooterTheme />
        </div>

        <p className="mt-3 text-xs leading-5 text-ink-3">{t('Market prices use USD. Demo KZT estimates use a fixed rate of 1 USD = 520 KZT, not a live exchange rate.')}</p>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>{t('EdFi © {year} · Created by Ansar Kazbekov · 1st place, Crypto Ideathon Kazakhstan by Binance', { year: String(new Date().getFullYear()) })}</p>
          <p className="text-ink-3">{t('Independent concept project. Not affiliated with or endorsed by Binance.')}</p>
        </div>
      </div>
    </footer>
  );
}
