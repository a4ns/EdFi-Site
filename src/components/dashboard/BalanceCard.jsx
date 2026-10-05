import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, Eye, EyeOff, QrCode, Upload } from 'lucide-react';
import BalanceChart from './BalanceChart';
import { useMarkets } from '../../state/markets';
import { KZT_PER_USD, formatAmount, formatCurrency, formatInt } from '../../lib/format';
import { formatDemoAmount } from '../../lib/demoAmount';
import { useLocale } from '../../state/locale';
import { useDisclosure } from '../../state/useDisclosure';

const UNITS = ['EDC', 'USDT', 'KZT'];

export default function BalanceCard({ balanceUnits, earnedUnits, onPay, onDeposit, onWithdraw }) {
  const { locale, t } = useLocale();
  const [hidden, setHidden] = useState(false);
  const [unit, setUnit] = useState('EDC');
  const { open: unitOpen, containerRef, triggerRef, panelId, close, toggle } = useDisclosure();
  const [activeUnit, setActiveUnit] = useState(0);
  const options = useRef([]);
  const { quotes } = useMarkets();
  const balance = balanceUnits / 100;
  const usd = balance * quotes.EDC.price;
  const shown = unit === 'EDC' ? balance : unit === 'USDT' ? usd : usd * KZT_PER_USD;
  const mask = (s) => (hidden ? '******' : s);

  useEffect(() => {
    if (unitOpen) options.current[activeUnit]?.focus();
  }, [unitOpen, activeUnit]);

  const toggleUnits = () => {
    setActiveUnit(UNITS.indexOf(unit));
    toggle();
  };

  const moveUnit = (event) => {
    if (event.key === 'Tab') {
      close(true);
      return;
    }
    let next;
    if (event.key === 'ArrowDown') next = (activeUnit + 1) % UNITS.length;
    else if (event.key === 'ArrowUp') next = (activeUnit + UNITS.length - 1) % UNITS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = UNITS.length - 1;
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      next = UNITS.findIndex((value) => value.startsWith(event.key.toUpperCase()));
      if (next < 0) return;
    } else return;
    event.preventDefault();
    setActiveUnit(next);
  };

  return (
    <section id="balance" className="panel min-w-0 scroll-mt-20 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">{t('Demo EDC balance')}</h2>
            <button type="button" className="icon-btn h-6 w-6" onClick={() => setHidden((h) => !h)} aria-label={t(hidden ? 'Show balance' : 'Hide balance')}>
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="num break-all text-[32px] font-semibold leading-10 text-ink">{mask(unit === 'EDC' ? formatDemoAmount(balanceUnits, locale) : formatAmount(shown, 2, locale))}</span>
            <div ref={containerRef} className="relative">
              <button
                ref={triggerRef}
                type="button"
                className="flex items-center gap-0.5 text-sm font-medium text-ink"
                onClick={toggleUnits}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                  event.preventDefault();
                  if (!unitOpen) toggleUnits();
                  else options.current[activeUnit]?.focus();
                }}
                aria-label={t('Balance display currency')}
                aria-haspopup="listbox"
                aria-expanded={unitOpen}
                aria-controls={unitOpen ? panelId : undefined}
              >
                {unit}
                <ChevronDown size={14} className={`transition-transform ${unitOpen ? 'rotate-180' : ''}`} />
              </button>
              {unitOpen && (
                <ul id={panelId} role="listbox" aria-label={t('Balance display currency')} onKeyDown={moveUnit} className="absolute left-0 top-7 z-20 w-28 animate-fade-in rounded-lg border border-line bg-card py-1 shadow-pop">
                  {UNITS.map((u, index) => (
                    <li key={u} role="presentation">
                      <button
                        ref={(element) => { options.current[index] = element; }}
                        type="button"
                        role="option"
                        tabIndex={activeUnit === index ? 0 : -1}
                        aria-selected={u === unit}
                        onFocus={() => setActiveUnit(index)}
                        onClick={() => {
                          setUnit(u);
                          close(true);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-raised ${u === unit ? 'text-yellow-text' : 'text-ink'}`}
                      >
                        {u}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="num mt-1 text-sm text-ink-3">
            ≈ {mask(formatCurrency(usd, 'USD', locale))} <span className="text-ink-4">·</span> {mask(formatCurrency(usd * KZT_PER_USD, 'KZT', locale, 0))}
          </p>
          <p className="num mt-3 text-sm text-ink-3">
            {t('Demo earned today')}{' '}
            <span className="font-medium text-up">{mask(`+${formatDemoAmount(earnedUnits, locale)} EDC`)}</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">{t('Your local calendar day · Illustrative value and exchange rate')}</p>
          <p className="mt-1 max-w-lg text-xs text-ink-3">{t('Demo conversion: 1 USD = {rate} KZT. Fixed assumption, not a live exchange rate.', { rate: formatInt(KZT_PER_USD, locale) })}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <button type="button" className="btn btn-primary btn-sm h-auto min-h-10 min-w-0 whitespace-normal px-2 py-2 leading-tight sm:px-4" onClick={onPay}>
            <QrCode size={16} className="shrink-0 max-sm:hidden" />
            {t('Scan Pay')}
          </button>
          <button type="button" className="btn btn-secondary btn-sm h-auto min-h-10 min-w-0 whitespace-normal px-2 py-2 leading-tight sm:px-4" onClick={onDeposit}>
            <Download size={16} className="shrink-0 max-sm:hidden" />
            {t('Deposit')}
          </button>
          <button type="button" className="btn btn-secondary btn-sm h-auto min-h-10 min-w-0 whitespace-normal px-2 py-2 leading-tight sm:px-4" onClick={onWithdraw}>
            <Upload size={16} className="shrink-0 max-sm:hidden" />
            {t('Withdraw')}
          </button>
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <BalanceChart end={balance} />
      </div>
    </section>
  );
}
