import { useState } from 'react';
import { Check, Copy, Info } from 'lucide-react';
import Modal from './Modal';
import QRCode from '../QRCode';
import CoinIcon from '../CoinIcon';
import { WALLET_ADDRESS } from './data';

export default function DepositModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
    } catch {
      /* clipboard can be unavailable; still show feedback */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal title="Deposit EDC" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-line-strong px-4 py-3">
          <span className="text-sm text-ink-3">Coin</span>
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <CoinIcon symbol="EDC" size={18} />
            EDC <span className="font-normal text-ink-3">EdFi Coin</span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line-strong px-4 py-3">
          <span className="text-sm text-ink-3">Network</span>
          <span className="text-sm font-medium text-ink">BNB Smart Chain (BEP20)</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <QRCode value={WALLET_ADDRESS} size={152} />
      </div>

      <p className="mt-6 text-sm text-ink-3">Address</p>
      <div className="mt-2 flex items-center gap-3 rounded-lg bg-page p-3">
        <span className="num min-w-0 flex-1 break-all text-sm text-ink">{WALLET_ADDRESS}</span>
        <button type="button" onClick={copy} className="icon-btn shrink-0" aria-label="Copy address">
          {copied ? <Check size={18} className="text-up" /> : <Copy size={18} />}
        </button>
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-yellow/5 p-3 text-xs leading-5 text-ink-2">
        <Info size={16} className="mt-0.5 shrink-0 text-yellow-text" />
        Send only EDC on BNB Smart Chain (BEP20) to this address. Deposits arrive after 15 network confirmations.
      </div>
    </Modal>
  );
}
