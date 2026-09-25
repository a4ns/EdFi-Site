import { Copy, UserPlus } from 'lucide-react';

export default function ReferralCard({ onCopy }) {
  const code = 'EDFI-AK210404';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?ref=${code}`);
    } catch {
      /* clipboard can be unavailable */
    }
    onCopy();
  };
  return (
    <section className="panel p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Invite classmates</h2>
          <p className="mt-1 text-sm text-ink-3">
            You both get <span className="font-medium text-yellow">20 EDC</span> after their first verified reward.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-yellow">
          <UserPlus size={20} />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-page px-3 py-2.5">
        <span className="text-xs text-ink-3">Referral code</span>
        <span className="flex items-center gap-2">
          <span className="num text-sm font-medium text-ink">{code}</span>
          <button type="button" onClick={copy} className="text-ink-3 transition-colors hover:text-yellow" aria-label="Copy referral link">
            <Copy size={14} />
          </button>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <p className="text-xs text-ink-3">Friends joined</p>
          <p className="num mt-1 text-sm font-medium text-ink">3</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">Referral rewards</p>
          <p className="num mt-1 text-sm font-medium text-ink">60.00 EDC</p>
        </div>
      </div>
    </section>
  );
}
