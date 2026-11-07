import { useLocale } from '../../state/locale';
import { useEffect, useRef, useState } from 'react';
import { Check, Hourglass } from 'lucide-react';
import Modal from './Modal';
import CoinIcon from '../CoinIcon';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { formatDemoAmount, isDemoAddress, parseDemoAmount } from '../../lib/demoAmount';
import DemoNotice from './DemoNotice';
import { readClipboardText } from '../../lib/clipboard';

export default function WithdrawModal({ balanceUnits, transaction, error, onClose, onWithdraw }) {
  const { locale, t } = useLocale();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState(null);
  const pasteRequest = useRef(0);
  const addressInput = useRef(null);
  useEffect(() => () => { pasteRequest.current += 1; }, []);
  const units = parseDemoAmount(amount);
  const over = units !== null && units > balanceUnits;
  const badAddress = touched && address && !isDemoAddress(address);
  const valid = isDemoAddress(address) && units !== null && units >= 100 && !over;
  const paste = async () => {
    const request = ++pasteRequest.current;
    setPasteFeedback(null);
    const result = await readClipboardText();
    if (request !== pasteRequest.current) return;
    if (!result.ok) setPasteFeedback('Clipboard access is unavailable. Paste or type a sample address manually.');
    else if (!result.text.trim()) setPasteFeedback('Clipboard is empty. Enter a sample address manually.');
    else setAddress(result.text.trim());
    setTouched(true);
    addressInput.current?.focus();
  };

  if (transaction) {
    const processing = transaction.status === 'processing';
    return (
      <Modal title={t('Withdraw EDC')} onClose={onClose}>
        <DemoNotice className="mb-5" />
        <div className="flex flex-col items-center text-center" role="status">
          {processing ? <Hourglass size={36} className="text-yellow-text" /> : <Check size={36} className="text-up" />}
          <p className="mt-4 text-base font-medium text-ink">{t(processing ? 'Demo withdrawal processing' : 'Demo withdrawal complete')}</p>
          <p className="num mt-2 text-2xl font-semibold text-ink">{formatDemoAmount(-transaction.amountUnits, locale)} EDC</p>
        </div>
        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label={t('Demo receipt')}>{transaction.id}</SummaryRow>
          <p className="text-xs text-ink-3">{t(transaction.subKey ?? transaction.sub, transaction.subParams)}</p>
          <p className="text-xs text-ink-3">{t('Status changes are simulated locally. Nothing is sent to this address.')}</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>{t('Done')}</button>
      </Modal>
    );
  }

  return (
    <Modal title={t('Withdraw EDC')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          pasteRequest.current += 1;
          onWithdraw({ address: address.trim(), amountUnits: units });
        }}
      >
        <DemoNotice className="mb-5" />
        <p className="text-sm text-ink-3">{t('Demo coin')}</p>
        <div className="mt-2 flex h-12 items-center justify-between rounded-lg border border-line-strong px-4">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <CoinIcon symbol="EDC" size={20} />
            EDC <span className="font-normal text-ink-3">EdFi Coin</span>
          </span>
          <span className="num text-xs text-ink-3">{t('{amount} available', { amount: formatDemoAmount(balanceUnits, locale) })}</span>
        </div>

        <label htmlFor="wd-address" className="mt-6 block text-sm text-ink-3">
          {t('Sample address')}
        </label>
        <div
          className={`mt-2 flex h-12 items-center rounded-lg border px-4 transition-colors focus-within:border-yellow hover:border-yellow ${
            badAddress ? '!border-down' : 'border-line-strong'
          }`}
        >
          <input
            id="wd-address"
            ref={addressInput}
            className="num min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            placeholder={t('Enter a sample BEP20 address (0x…)')}
            value={address}
            onChange={(e) => {
              pasteRequest.current += 1;
              setPasteFeedback(null);
              setAddress(e.target.value);
            }}
            onBlur={() => setTouched(true)}
            autoComplete="off"
            spellCheck="false"
            aria-invalid={badAddress ? true : undefined}
            aria-describedby={[badAddress ? 'wd-address-error' : null, pasteFeedback ? 'wd-paste-feedback' : null].filter(Boolean).join(' ') || undefined}
          />
          <button type="button" onClick={paste} className="ml-3 text-sm font-medium text-yellow-text hover:underline">
            {t('Paste')}
          </button>
        </div>
        {badAddress && <p id="wd-address-error" className="mt-2 text-xs text-down">{t('Enter a valid BNB Smart Chain address')}</p>}
        {pasteFeedback && <p id="wd-paste-feedback" role="status" className="mt-2 text-xs leading-5 text-ink-3">{t(pasteFeedback)}</p>}

        <p className="mt-6 text-sm text-ink-3">{t('Network')}</p>
        <div className="mt-2 flex h-12 items-center justify-between rounded-lg border border-line-strong px-4 text-sm font-medium text-ink">
          BNB Smart Chain (BEP20)
        </div>
        <p className="mt-2 text-xs text-ink-3">{t('Simulated processing · Min. demo withdrawal 1 EDC')}</p>

        <label htmlFor="wd-amount" className="mt-6 block text-sm text-ink-3">
          {t('Amount')}
        </label>
        <div className="mt-2">
          <AmountInput id="wd-amount" value={amount} onChange={setAmount} maxUnits={balanceUnits} invalid={over} />
        </div>
        {over && <p className="mt-2 text-xs text-down">{t('Insufficient balance')}</p>}

        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label={t('Available')}>{formatDemoAmount(balanceUnits, locale)} EDC</SummaryRow>
          <SummaryRow label={t('Network fee')}>{formatDemoAmount(0, locale)} EDC</SummaryRow>
          <SummaryRow label={t('Receive amount')} strong>
            {formatDemoAmount(units ?? 0, locale)} EDC
          </SummaryRow>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-down">{t(error)}</p>}
        <button type="submit" className="btn btn-primary btn-lg sticky bottom-0 mt-6 w-full" disabled={!valid}>
          {t('Simulate withdrawal')}
        </button>
      </form>
    </Modal>
  );
}
