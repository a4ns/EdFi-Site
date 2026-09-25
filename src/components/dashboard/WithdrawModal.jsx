import { useState } from 'react';
import Modal from './Modal';
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
  const valid = isAddress(address) && value > 0 && !over;

  return (
    <Modal title="Withdraw EDC" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onWithdraw({ address: address.trim(), amount: value });
        }}
      >
        <label htmlFor="wd-address" className="block text-sm text-ink-3">
          Address
        </label>
        <input
          id="wd-address"
          className={`input num mt-2 ${badAddress ? '!border-down' : ''}`}
          placeholder="Enter BEP20 address (0x…)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => setTouched(true)}
          autoComplete="off"
          spellCheck="false"
        />
        {badAddress && <p className="mt-2 text-xs text-down">Enter a valid BNB Smart Chain address</p>}

        <p className="mt-6 text-sm text-ink-3">Network</p>
        <div className="mt-2 flex h-12 items-center rounded-lg border border-line-strong px-4 text-sm font-medium text-ink">
          BNB Smart Chain (BEP20)
        </div>

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
