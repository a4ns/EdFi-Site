import { useState } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { applyTheme, currentTheme } from '../../lib/theme';

function Row({ label, children }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-sm text-ink-3">{label}</span>
      <span className="text-right text-sm text-ink">{children}</span>
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-yellow' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function AccountModal({ mode, onClose, onLogout }) {
  const [theme, setTheme] = useState(currentTheme);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  if (mode === 'account') {
    return (
      <Modal title="Account" onClose={onClose}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-raised text-lg font-semibold text-yellow-text">AK</span>
          <div>
            <p className="text-base font-semibold text-ink">Ansar Kazbekov</p>
            <span className="chip mt-1.5 bg-up/10 text-up">
              <BadgeCheck size={12} />
              Verified
            </span>
          </div>
        </div>
        <div className="mt-4">
          <Row label="UID"><span className="num">210404</span></Row>
          <Row label="University">Kozybayev University</Row>
          <Row label="Tier">Scholar Tier 2</Row>
          <Row label="Earn rate"><span className="num">1.4x</span></Row>
          <Row label="Wallet"><span className="num">0x71C4…9A24</span></Row>
        </div>
        <button type="button" className="btn btn-secondary btn-lg mt-6 w-full" onClick={onLogout}>
          Log Out
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <Row label="Theme">
        <span className="flex rounded-lg bg-page p-1">
          {['dark', 'light'].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => {
                applyTheme(t);
                setTheme(t);
              }}
              className={`h-7 rounded-md px-3 text-xs font-medium capitalize transition-colors ${theme === t ? 'bg-raised text-ink' : 'text-ink-3'}`}
            >
              {t}
            </button>
          ))}
        </span>
      </Row>
      <Row label="Push notifications"><Toggle on={push} onChange={setPush} label="Push notifications" /></Row>
      <Row label="Email notifications"><Toggle on={email} onChange={setEmail} label="Email notifications" /></Row>
      <Row label="Currency">USD - $</Row>
      <Row label="Two-factor authentication">
        <span className="inline-flex items-center gap-1.5 text-up">
          <ShieldCheck size={16} />
          Enabled
        </span>
      </Row>
      <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>
        Done
      </button>
    </Modal>
  );
}
