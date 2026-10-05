import Modal from './Modal';
import QRCode from '../QRCode';
import CoinIcon from '../CoinIcon';
import DemoNotice from './DemoNotice';
import { DEMO_DEPOSIT_PAYLOAD } from './data';

export default function DepositModal({ onClose }) {
  return (
    <Modal title="Deposit EDC" onClose={onClose}>
      <DemoNotice kind="deposit" className="mb-5" />
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-line-strong px-4 py-3">
          <span className="text-sm text-ink-3">Demo coin</span>
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <CoinIcon symbol="EDC" size={18} />
            EDC <span className="font-normal text-ink-3">EdFi Coin</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line-strong px-4 py-3">
          <span className="text-sm text-ink-3">Planned network</span>
          <span className="text-right text-sm font-medium text-ink">BNB Smart Chain</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3">
        <QRCode value={DEMO_DEPOSIT_PAYLOAD} size={152} />
        <p className="text-center text-sm text-ink-3">Sample QR only. It is not a wallet address.</p>
      </div>
      <button type="button" onClick={onClose} className="btn btn-primary btn-lg mt-6 w-full">Done</button>
    </Modal>
  );
}
