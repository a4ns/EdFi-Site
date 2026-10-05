import { useLocale } from '../../state/locale';
import { useEffect, useState } from 'react';
import { BedDouble, Check, Printer, Shirt, Utensils, Zap } from 'lucide-react';
import Modal from './Modal';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { MERCHANTS } from './data';
import { formatDateTime } from '../../lib/format';
import { formatDemoAmount, parseDemoAmount } from '../../lib/demoAmount';
import DemoNotice from './DemoNotice';

const ICONS = { Utensils, BedDouble, Shirt, Printer };

export default function PayModal({ balanceUnits, transaction, error, onClose, onPay, onViewHistory }) {
  const { locale, t } = useLocale();
  const [merchant, setMerchant] = useState(MERCHANTS[0].id);
  const [amount, setAmount] = useState('15.00');
  const [scanning, setScanning] = useState(true);

  // The demo has no camera: "detect" the canteen QR code after a moment.
  useEffect(() => {
    if (!scanning) return undefined;
    const id = setTimeout(() => {
      setMerchant('canteen');
      setScanning(false);
    }, 2600);
    return () => clearTimeout(id);
  }, [scanning]);
  const units = parseDemoAmount(amount);
  const over = units !== null && units > balanceUnits;
  const valid = units !== null && units > 0 && !over;
  const m = MERCHANTS.find((x) => x.id === merchant);

  if (transaction) {
    return (
      <Modal title={t('Scan Pay')} onClose={onClose}>
        <DemoNotice className="mb-5" />
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-up/15">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-up text-white">
              <Check size={28} strokeWidth={2.5} />
            </span>
          </span>
          <p className="mt-4 text-base font-medium text-ink">{t('Demo payment complete')}</p>
          <p className="num mt-1 text-[28px] font-semibold leading-9 text-ink">-{formatDemoAmount(-transaction.amountUnits, locale)} EDC</p>
        </div>
        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label={t('Merchant')}>{t(transaction.title)}</SummaryRow>
          <SummaryRow label={t('Fee')}>{formatDemoAmount(0, locale)} EDC</SummaryRow>
          <SummaryRow label={t('Time')}>{formatDateTime(new Date(transaction.at), locale)}</SummaryRow>
          <SummaryRow label={t('Demo receipt')}>{transaction.id}</SummaryRow>
          <p className="text-xs text-ink-3">{t('Local receipt only. No blockchain transaction exists.')}</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>
          {t('Done')}
        </button>
        <button type="button" className="mt-3 w-full text-center text-sm font-medium text-ink-3 hover:text-ink" onClick={onViewHistory}>
          {t('View in History')}
        </button>
      </Modal>
    );
  }

  if (scanning) {
    return (
      <Modal title={t('Scan Pay')} onClose={onClose}>
        <p className="text-center text-sm text-ink-3">{t('Preview a simulated merchant scan')}</p>
        <div className="relative mx-auto mt-5 flex h-[260px] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-xl bg-deep">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
          <div className="relative h-[190px] w-[190px]">
            {['left-0 top-0 border-l-2 border-t-2 rounded-tl-lg', 'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg', 'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg', 'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg'].map((c) => (
              <span key={c} className={`absolute h-7 w-7 border-yellow ${c}`} />
            ))}
            <span className="absolute inset-x-3 h-0.5 animate-scan rounded bg-yellow shadow-[0_0_12px_rgba(252,213,53,0.8)]" />
          </div>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-xs text-ink-3">
          <Zap size={12} />
          {t('Demo only · No camera access is used')}
        </p>
        <button type="button" className="btn btn-secondary btn-lg mt-6 w-full" onClick={() => setScanning(false)}>
          {t('Select merchant instead')}
        </button>
      </Modal>
    );
  }

  return (
    <Modal title={t('Scan Pay')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onPay({ merchantId: m.id, amountUnits: units });
        }}
      >
        <DemoNotice className="mb-5" />
        <p className="text-sm text-ink-3">{t('Demo merchant')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Merchant')}>
          {MERCHANTS.map((x) => {
            const Ico = ICONS[x.icon];
            const sel = x.id === merchant;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setMerchant(x.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
                  sel ? 'border-yellow bg-yellow/5' : 'border-line-strong hover:border-ink-3'
                }`}
              >
                <Ico size={18} className={`shrink-0 ${sel ? 'text-yellow-text' : 'text-ink-3'}`} />
                <span className="min-w-0 break-words text-sm font-medium leading-5 text-ink">{t(x.name)}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="pay-amount" className="mt-6 block text-sm text-ink-3">
          {t('Amount')}
        </label>
        <div className="mt-2">
          <AmountInput id="pay-amount" value={amount} onChange={setAmount} maxUnits={balanceUnits} invalid={over} />
        </div>
        {over && <p className="mt-2 text-xs text-down">{t('Insufficient balance')}</p>}

        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label={t('Available')}>{formatDemoAmount(balanceUnits, locale)} EDC</SummaryRow>
          <SummaryRow label={t('Network fee')}>{formatDemoAmount(0, locale)} EDC</SummaryRow>
          <SummaryRow label={t('You pay')} strong>
            {formatDemoAmount(units ?? 0, locale)} EDC
          </SummaryRow>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-down">{t(error)}</p>}
        <button type="submit" className="btn btn-primary btn-lg sticky bottom-0 mt-6 w-full" disabled={!valid}>
          {t('Simulate payment')}
        </button>
      </form>
    </Modal>
  );
}
