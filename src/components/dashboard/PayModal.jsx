import { useState } from 'react';
import { BedDouble, Check, Copy, Printer, Shirt, Utensils } from 'lucide-react';
import Modal from './Modal';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { MERCHANTS } from './data';
import { formatAmount, formatDateTime } from '../../lib/format';

const ICONS = { Utensils, BedDouble, Shirt, Printer };

const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export default function PayModal({ balance, onClose, onPay, onViewHistory }) {
  const [merchant, setMerchant] = useState(MERCHANTS[0].id);
  const [amount, setAmount] = useState('15.00');
  const [done, setDone] = useState(null);
  const value = Number(amount) || 0;
  const over = value > balance;
  const m = MERCHANTS.find((x) => x.id === merchant);

  if (done) {
    return (
      <Modal title="Scan Pay" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-up/15">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-up text-white">
              <Check size={28} strokeWidth={2.5} />
            </span>
          </span>
          <p className="mt-4 text-base font-medium text-ink">Payment Successful</p>
          <p className="num mt-1 text-[28px] font-semibold leading-9 text-ink">-{formatAmount(done.amount)} EDC</p>
        </div>
        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label="Merchant">{done.name}</SummaryRow>
          <SummaryRow label="Fee">0.00 EDC</SummaryRow>
          <SummaryRow label="Time">{formatDateTime(new Date(done.at))}</SummaryRow>
          <SummaryRow label="Order ID">{done.order}</SummaryRow>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-3">Tx hash</span>
            <span className="num flex items-center gap-1.5 text-ink-2">
              {done.hash.slice(0, 8)}…{done.hash.slice(-6)}
              <button type="button" onClick={() => navigator.clipboard?.writeText(done.hash).catch(() => {})} className="text-ink-3 hover:text-yellow-text" aria-label="Copy transaction hash">
                <Copy size={14} />
              </button>
            </span>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>
          Done
        </button>
        <button type="button" className="mt-3 w-full text-center text-sm font-medium text-ink-3 hover:text-ink" onClick={onViewHistory}>
          View in History
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Scan Pay" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value || over) return;
          onPay({ merchant: m, amount: value });
          setDone({ amount: value, name: m.name, at: Date.now(), order: `CP${Date.now().toString().slice(-10)}`, hash: `0x${hex(64)}` });
        }}
      >
        <p className="text-sm text-ink-3">Merchant</p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Merchant">
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
                <Ico size={18} className={sel ? 'text-yellow-text' : 'text-ink-3'} />
                <span className="truncate text-sm font-medium text-ink">{x.name}</span>
              </button>
            );
          })}
        </div>

        <label htmlFor="pay-amount" className="mt-6 block text-sm text-ink-3">
          Amount
        </label>
        <div className="mt-2">
          <AmountInput id="pay-amount" value={amount} onChange={setAmount} max={balance} invalid={over} />
        </div>
        {over && <p className="mt-2 text-xs text-down">Insufficient balance</p>}

        <div className="mt-6 space-y-3 rounded-lg bg-page p-4">
          <SummaryRow label="Available">{formatAmount(balance)} EDC</SummaryRow>
          <SummaryRow label="Network fee">0.00 EDC</SummaryRow>
          <SummaryRow label="You pay" strong>
            {formatAmount(value)} EDC
          </SummaryRow>
        </div>

        <button type="submit" className="btn btn-primary btn-lg mt-6 w-full" disabled={!value || over}>
          Confirm Payment
        </button>
      </form>
    </Modal>
  );
}
