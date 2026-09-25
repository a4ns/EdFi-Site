import { useState } from 'react';
import { BedDouble, CircleCheck, Printer, Shirt, Utensils } from 'lucide-react';
import Modal from './Modal';
import AmountInput from './AmountInput';
import SummaryRow from './SummaryRow';
import { MERCHANTS } from './data';
import { formatAmount } from '../../lib/format';

const ICONS = { Utensils, BedDouble, Shirt, Printer };

export default function PayModal({ balance, onClose, onPay }) {
  const [merchant, setMerchant] = useState(MERCHANTS[0].id);
  const [amount, setAmount] = useState('15.00');
  const [done, setDone] = useState(null);
  const value = Number(amount) || 0;
  const over = value > balance;
  const m = MERCHANTS.find((x) => x.id === merchant);

  if (done) {
    return (
      <Modal title="Scan Pay" onClose={onClose}>
        <div className="flex flex-col items-center py-4 text-center">
          <CircleCheck size={56} className="text-up" />
          <p className="mt-4 text-xl font-semibold text-ink">Payment Successful</p>
          <p className="num mt-2 text-[28px] font-semibold text-ink">-{formatAmount(done.amount)} EDC</p>
          <p className="mt-1 text-sm text-ink-3">Paid to {done.name} · Fee 0.00 EDC</p>
          <button type="button" className="btn btn-secondary btn-lg mt-8 w-full" onClick={onClose}>
            Done
          </button>
        </div>
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
          setDone({ amount: value, name: m.name });
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
