import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LocaleContext } from '../../state/locale';
import { MarketsContext } from '../../state/markets';
import { AuthContext } from '../../state/auth';
import { messages, translate } from '../../i18n/messages';
import { COINS, EDC_START, FALLBACK_MARKETS, EARN_ACTIVITIES, EARN_CATEGORIES, FAQ as FAQ_ITEMS, GUIDE_LINKS, PRODUCTS, ROADMAP, TRUST_STATS } from '../../data/content';
import { formatInt } from '../../lib/format';
import Hero from './Hero';
import EarnMarkets from './EarnMarkets';
import FAQ from './FAQ';
import AppDownload from './AppDownload';
import Products from './Products';
import Roadmap from './Roadmap';
import StartEarning from './StartEarning';
import TrustStats from './TrustStats';

const QUOTES = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
const MARKET_DATA = {
  quotes: QUOTES,
  list: Object.entries(QUOTES).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })),
  live: false,
};

function Providers({ locale, children, openAuth = () => {} }) {
  return (
    <MemoryRouter>
      <LocaleContext.Provider value={{ locale, t: (key, values) => translate(locale, key, values), setLocale: () => {} }}>
        <AuthContext.Provider value={{ openAuth }}>
          <MarketsContext.Provider value={MARKET_DATA}>{children}</MarketsContext.Provider>
        </AuthContext.Provider>
      </LocaleContext.Provider>
    </MemoryRouter>
  );
}

function Sections() {
  return <><Hero /><TrustStats /><EarnMarkets /><Products /><AppDownload /><Roadmap /><FAQ /><StartEarning /></>;
}

describe('landing-page localization', () => {
  it('translates every canonical marketing data field in Russian and Kazakh', () => {
    const keys = [
      ...GUIDE_LINKS.map((item) => item.label), ...EARN_CATEGORIES,
      ...EARN_ACTIVITIES.flatMap((a) => [a.name, a.category, a.frequency, a.oracle]),
      ...PRODUCTS.flatMap((p) => [p.tag, p.title, p.desc, p.cta]),
      ...ROADMAP.flatMap((r) => [r.phase, r.status, r.title, r.desc]),
      ...FAQ_ITEMS.flatMap((f) => [f.q, f.a]),
      ...TRUST_STATS.flatMap((s) => [s.label, ...(typeof s.value === 'string' ? [s.value] : [])]),
    ];
    for (const key of keys) {
      for (const locale of ['ru', 'kk']) expect(messages[key]?.[locale], `${locale}: ${key}`).toBeTruthy();
    }
  });

  it.each(['en', 'ru', 'kk'])('renders the whole landing page in %s, including accessible names and demo notices', (locale) => {
    const t = (key, values) => translate(locale, key, values);
    render(<Providers locale={locale}><Sections /></Providers>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t('ACADEMIC'));
    expect(screen.getByRole('heading', { name: t('Frequently Asked Questions') })).toBeVisible();
    expect(screen.getByRole('tablist', { name: t('Reward categories') })).toBeVisible();
    expect(screen.getByRole('textbox', { name: t('University email or student ID') })).toHaveAttribute('placeholder', t('University email / Student ID'));
    expect(screen.getByRole('img', { name: t('Scan to open the web demo') })).toBeInTheDocument();
    expect(screen.getByText(t('Illustrative screens with sample data. Native iOS and Android apps are planned.'))).toBeVisible();
    expect(screen.getByText(t('EDC price is simulated; the token is not live.'), { exact: false })).toBeVisible();
    const stats = screen.getByRole('region', { name: t('EdFi in numbers') });
    expect(within(stats).getByText(formatInt(6000, locale), { normalizer: (text) => text })).toBeVisible();
    expect(screen.getByText(t(FAQ_ITEMS.find((item) => item.id === 'about').a))).toBeVisible();
  });

  it('preserves reward category, sorting and FAQ selection when language changes', () => {
    const renderContent = (locale) => <Providers locale={locale}><EarnMarkets /><FAQ /></Providers>;
    const { rerender } = render(renderContent('en'));
    fireEvent.click(screen.getByRole('tab', { name: 'Research' }));
    fireEvent.click(screen.getByRole('button', { name: 'EDC Reward' }));
    fireEvent.click(screen.getByRole('button', { name: /Can I withdraw EDC to an exchange\?/ }));
    for (const locale of ['ru', 'kk']) {
      rerender(renderContent(locale));
      const t = (key) => translate(locale, key);
      expect(screen.getByRole('tab', { name: t('Research') })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('row')).toHaveLength(3);
      expect(screen.getAllByRole('row')[1]).toHaveTextContent(t('Published research article'));
      expect(screen.getByText(t(FAQ_ITEMS.find((item) => item.id === 'withdrawals').a))).toBeVisible();
      expect(screen.getAllByRole('link', { name: t('Earn') })).toHaveLength(2);
      expect(screen.getAllByRole('link', { name: t('Earn') })[0]).toHaveAttribute('href', '/demo#tasks');
      expect(document.getElementById('earn-research')).toBeInTheDocument();
    }
  });

  it('keeps demo sign-up behavior and routes intact after translation', () => {
    const openAuth = vi.fn();
    const t = (key) => translate('kk', key);
    render(<Providers locale="kk" openAuth={openAuth}><Hero /></Providers>);
    fireEvent.change(screen.getByRole('textbox', { name: t('University email or student ID') }), { target: { value: 'sample-student' } });
    fireEvent.click(screen.getByRole('button', { name: t('Sign Up') }));
    expect(openAuth).toHaveBeenCalledWith('signup', 'sample-student');
    expect(screen.getByRole('link', { name: t('Android web demo') })).toHaveAttribute('href', '/demo');
  });
});
