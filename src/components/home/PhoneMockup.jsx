import { useLocale } from '../../state/locale';
import { ArrowUpRight, Bell, Eye, GraduationCap, Home, LineChart, QrCode, Search, Send, Wallet, Wifi } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import { ChangePill } from '../PriceCell';
import { useMarkets } from '../../state/markets';
import { formatAmount, formatPrice, formatUsd, formatChange } from '../../lib/format';

const ACTIONS = [
  ['Scan Pay', QrCode],
  ['Earn', GraduationCap],
  ['Send', Send],
  ['Withdraw', ArrowUpRight],
];

const TABS = [
  ['Home', Home, true],
  ['Markets', LineChart],
  ['Pay', QrCode],
  ['Earn', GraduationCap],
  ['Assets', Wallet],
];

// A Binance-app style home screen for the EdFi wallet, drawn in HTML.
export default function PhoneMockup() {
  const { locale, t } = useLocale();
  const { quotes } = useMarkets();
  const balance = 450;
  return (
    <div className="relative mx-auto w-[320px] shrink-0 rounded-[44px] border border-line bg-deep p-[10px] shadow-pop" aria-hidden="true">
      <div className="relative h-[640px] overflow-hidden rounded-[36px] bg-page">
        {/* status bar */}
        <div className="flex h-10 items-center justify-between px-6 pt-1 text-[12px] font-semibold text-ink">
          <span className="num">9:41</span>
          <span className="absolute left-1/2 top-2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-deep" />
          <span className="flex items-center gap-1">
            <Wifi size={12} />
            <span className="h-[9px] w-[18px] rounded-[3px] border border-ink/70 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
            </span>
          </span>
        </div>

        {/* app bar */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised text-[11px] font-semibold text-yellow-text">AK</span>
          <span className="flex h-7 flex-1 items-center gap-1.5 rounded-full bg-raised px-3 text-[12px] text-ink-3">
            <Search size={12} />
            EDC
          </span>
          <Bell size={16} className="text-ink-2" />
        </div>

        {/* balance */}
        <div className="px-4">
          <p className="flex items-center gap-1 text-[12px] text-ink-3">
            {t('Demo balance (EDC)')} <Eye size={11} />
          </p>
          <p className="num mt-1 text-[30px] font-semibold leading-9 text-ink">{formatAmount(balance, 2, locale)}</p>
          <p className="num text-[12px] text-ink-3">≈ {formatUsd(balance * quotes.EDC.price, locale)}</p>
          <p className="num mt-1 text-[12px] text-ink-3">
            {t('Sample earnings')} <span className="text-up">+{formatAmount(50, 2, locale)} EDC ({formatChange(12.5, locale)})</span>
          </p>
        </div>

        {/* quick actions */}
        <div className="mt-4 grid grid-cols-4 px-2">
          {ACTIONS.map(([label, Ico], i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${i === 0 ? 'bg-yellow text-yellow-on' : 'bg-raised text-ink'}`}>
                <Ico size={18} />
              </span>
              <span className="text-center text-[11px] text-ink-2">{t(label)}</span>
            </div>
          ))}
        </div>

        {/* markets list */}
        <div className="mt-5 flex justify-between gap-2 border-b border-line px-4 text-[13px] font-medium">
          <span className="text-ink-3">{t('Favorites')}</span>
          <span className="relative pb-2 text-ink">
            {t('Hot')}
            <span className="absolute bottom-0 left-1/2 h-[2px] w-3 -translate-x-1/2 rounded bg-yellow" />
          </span>
          <span className="text-ink-3">{t('Gainers')}</span>
          <span className="text-ink-3">{t('New')}</span>
        </div>
        <ul className="px-4">
          {['EDC', 'BNB', 'BTC', 'ETH', 'SOL'].map((s) => (
            <li key={s} className="flex h-[50px] items-center">
              <CoinIcon symbol={s} size={20} />
              <span className="ml-2 text-[13px] font-semibold text-ink">
                {s}
                <span className="font-normal text-ink-3">/USDT</span>
              </span>
              <span className="num ml-auto mr-3 text-[13px] font-medium text-ink">{formatPrice(quotes[s].price, locale)}</span>
              <ChangePill value={quotes[s].change} className="!h-6 !min-w-[62px] !text-[12px]" />
            </li>
          ))}
        </ul>

        {/* tab bar */}
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 border-t border-line bg-page px-2 pb-5 pt-2">
          {TABS.map(([label, Ico, active]) => (
            <span key={label} className={`flex min-w-0 flex-col items-center gap-0.5 text-center text-[11px] ${active ? 'text-ink' : 'text-ink-3'}`}>
              <Ico size={18} className={active ? 'text-yellow-text' : ''} />
              {t(label)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
