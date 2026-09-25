import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from './Modal';
import CoinIcon from '../CoinIcon';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { formatAmount } from '../../lib/format';

const isAddress = (a) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

export default function WithdrawModal({ balance, onClose, onWithdraw }) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const value = Number(amount) || 0;
  const over = value > balance;
  const badAddress = touched && address && !isAddress(address);
  const valid = isAddress(address) && value >= 1 && !over;
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      /* clipboard read can be blocked; user can type instead */
    }
    setTouched(true);
  };

  return (
    <Modal title="Withdraw EDC" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onWithdraw({ address: address.trim(), amount: value });
        }}
      >
        <p className="text-sm text-ink-3">Coin</p>
        <div className="mt-2 flex h-12 items-center justify-between rounded-lg border border-line-strong px-4">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <CoinIcon symbol="EDC" size={20} />
            EDC <span className="font-normal text-ink-3">EdFi Coin</span>
          </span>
          <span className="num text-xs text-ink-3">{formatAmount(balance)} available</span>
        </div>

        <label htmlFor="wd-address" className="mt-6 block text-sm text-ink-3">
          Address
        </label>
        <div
          className={`mt-2 flex h-12 items-center rounded-lg border px-4 transition-colors focus-within:border-yellow hover:border-yellow ${
            badAddress ? '!border-down' : 'border-line-strong'
          }`}
        >
          <input
            id="wd-address"
            className="num min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
            placeholder="Enter BEP20 address (0x…)"
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
          <ChevronDown size={16} className="text-ink-3" />
        </div>
        <p className="mt-2 text-xs text-ink-3">Arrival ≈ 3s · Min. withdrawal 1 EDC</p>

        <label htmlFor="wd-amount" className="mt-6 block text-sm text-ink-3">
          Amount
        </label>
        <div className="mt-2">
          <AmountInput id="wd-amount" value={amount} onChange={setAmount} max={balance} invalid={over} />
        </div>
        {over && <p className="mt-2 text-xs text-down">Insufficient balance</p>}

        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label="Available">{formatAmount(balance)} EDC</SummaryRow>
          <SummaryRow label="Network fee">0.00 EDC</SummaryRow>
          <SummaryRow label="Receive amount" strong>
            {formatAmount(value)} EDC
          </SummaryRow>
        </div>

        <button type="submit" className="btn btn-primary btn-lg mt-6 w-full" disabled={!valid}>
          Withdraw
        </button>
      </form>
    </Modal>
  );
}
