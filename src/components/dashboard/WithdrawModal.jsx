import { useState } from 'react';
import { Check, Hourglass } from 'lucide-react';
import Modal from './Modal';
import CoinIcon from '../CoinIcon';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { formatDemoAmount, isDemoAddress, parseDemoAmount } from '../../lib/demoAmount';
import DemoNotice from './DemoNotice';

export default function WithdrawModal({ balanceUnits, transaction, error, onClose, onWithdraw }) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const units = parseDemoAmount(amount);
  const over = units !== null && units > balanceUnits;
  const badAddress = touched && address && !isDemoAddress(address);
  const valid = isDemoAddress(address) && units !== null && units >= 100 && !over;
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      /* clipboard read can be blocked; user can type instead */
    }
    setTouched(true);
  };

  if (transaction) {
    const processing = transaction.status === 'processing';
    return (
      <Modal title="Withdraw EDC" onClose={onClose}>
        <DemoNotice className="mb-5" />
        <div className="flex flex-col items-center text-center" role="status">
          {processing ? <Hourglass size={36} className="text-yellow-text" /> : <Check size={36} className="text-up" />}
          <p className="mt-4 text-base font-medium text-ink">{processing ? 'Demo withdrawal processing' : 'Demo withdrawal complete'}</p>
          <p className="num mt-2 text-2xl font-semibold text-ink">{formatDemoAmount(-transaction.amountUnits)} EDC</p>
        </div>
        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label="Demo receipt">{transaction.id}</SummaryRow>
          <p className="text-xs text-ink-3">{transaction.sub}</p>
          <p className="text-xs text-ink-3">Status changes are simulated locally. Nothing is sent to this address.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>Done</button>
      </Modal>
    );
  }

  return (
    <Modal title="Withdraw EDC" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onWithdraw({ address: address.trim(), amountUnits: units });
        }}
      >
        <DemoNotice className="mb-5" />
        <p className="text-sm text-ink-3">Demo coin</p>
        <div className="mt-2 flex h-12 items-center justify-between rounded-lg border border-line-strong px-4">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <CoinIcon symbol="EDC" size={20} />
            EDC <span className="font-normal text-ink-3">EdFi Coin</span>
          </span>
          <span className="num text-xs text-ink-3">{formatDemoAmount(balanceUnits)} available</span>
        </div>

        <label htmlFor="wd-address" className="mt-6 block text-sm text-ink-3">
          Sample address
        </label>
        <div
          className={`mt-2 flex h-12 items-center rounded-lg border px-4 transition-colors focus-within:border-yellow hover:border-yellow ${
            badAddress ? '!border-down' : 'border-line-strong'
          }`}
        >
          <input
            id="wd-address"
            className="num min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
            placeholder="Enter a sample BEP20 address (0x…)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" onClick={paste} className="ml-3 text-sm font-medium text-yellow-text hover:text-yellow-hover">
            Paste
          </button>
        </div>
        {badAddress && <p className="mt-2 text-xs text-down">Enter a valid BNB Smart Chain address</p>}

        <p className="mt-6 text-sm text-ink-3">Network</p>
        <div className="mt-2 flex h-12 items-center justify-between rounded-lg border border-line-strong px-4 text-sm font-medium text-ink">
          BNB Smart Chain (BEP20)
        </div>
        <p className="mt-2 text-xs text-ink-3">Simulated processing · Min. demo withdrawal 1 EDC</p>

        <label htmlFor="wd-amount" className="mt-6 block text-sm text-ink-3">
          Amount
        </label>
        <div className="mt-2">
          <AmountInput id="wd-amount" value={amount} onChange={setAmount} maxUnits={balanceUnits} invalid={over} />
        </div>
        {over && <p className="mt-2 text-xs text-down">Insufficient balance</p>}

        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label="Available">{formatDemoAmount(balanceUnits)} EDC</SummaryRow>
          <SummaryRow label="Network fee">0.00 EDC</SummaryRow>
          <SummaryRow label="Receive amount" strong>
            {formatDemoAmount(units ?? 0)} EDC
          </SummaryRow>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-down">{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg sticky bottom-0 mt-6 w-full" disabled={!valid}>
          Simulate withdrawal
        </button>
      </form>
    </Modal>
  );
}
