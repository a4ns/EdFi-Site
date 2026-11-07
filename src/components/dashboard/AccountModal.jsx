import { useState } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import DemoNotice from './DemoNotice';
import { applyTheme } from '../../lib/theme';
import { useTheme } from '../../state/useTheme';
import { formatAmount, formatInt, KZT_PER_USD } from '../../lib/format';
import { useLocale } from '../../state/locale';
import { LANGUAGE_OPTIONS } from '../../lib/locale';

function Row({ label, children }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="min-w-0 text-sm text-ink-3">{label}</span>
      <span className="min-w-0 text-right text-sm text-ink">{children}</span>
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
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-yellow' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function AccountModal({ mode, onClose, onLogout }) {
  const { locale, setLocale, t } = useLocale();
  const theme = useTheme();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  if (mode === 'account') {
    return (
      <Modal title={t('Account')} onClose={onClose}>
        <DemoNotice kind="account" className="mb-5" />
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-raised text-lg font-semibold text-yellow-text">AK</span>
          <div>
            <p className="text-base font-semibold text-ink">Ansar Kazbekov</p>
            <span className="chip mt-1.5 bg-up/10 text-up">
              <BadgeCheck size={12} />
              {t('Sample profile')}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <Row label="UID"><span className="num">210404</span></Row>
          <Row label={t('University')}>{t('Kozybayev University')}</Row>
          <Row label={t('Tier')}>{t('Scholar Tier 2')}</Row>
          <Row label={t('Earn rate')}><span className="num">{t('{rate}x', { rate: formatAmount(1.4, 1, locale) })}</span></Row>
          <Row label={t('Wallet')}>{t('Not connected')}</Row>
        </div>
        <button type="button" className="btn btn-secondary btn-lg mt-6 w-full" onClick={onLogout}>
          {t('Log Out')}
        </button>
      </Modal>
    );
  }

  return (
    <Modal title={t('Settings')} onClose={onClose}>
      <DemoNotice kind="account" className="mb-5" />
      <Row label={t('Language')}>
        <select
          value={locale}
          aria-label={t('Language')}
          className="input h-10 max-w-full bg-page px-3 text-sm text-ink"
          onChange={(event) => setLocale(event.target.value)}
        >
          {LANGUAGE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value} lang={value}>{label}</option>
          ))}
        </select>
      </Row>
      <Row label={t('Theme')}>
        <span className="flex flex-wrap justify-end rounded-lg bg-page p-1">
          {['dark', 'light'].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => applyTheme(value)}
              className={`min-h-7 rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${theme === value ? 'bg-raised text-ink' : 'text-ink-3'}`}
            >
              {t(value === 'dark' ? 'Dark' : 'Light')}
            </button>
          ))}
        </span>
      </Row>
      <Row label={t('Push notifications')}><Toggle on={push} onChange={setPush} label={t('Push notifications')} /></Row>
      <Row label={t('Email notifications')}><Toggle on={email} onChange={setEmail} label={t('Email notifications')} /></Row>
      <Row label={t('Currency')}>{t('USD + demo KZT')}</Row>
      <p className="num mt-3 text-xs leading-5 text-ink-3">{t('Demo conversion: 1 USD = {rate} KZT. Fixed assumption, not a live exchange rate.', { rate: formatInt(KZT_PER_USD, locale) })}</p>
      <Row label={t('Two-factor authentication')}>
        <span className="inline-flex items-center gap-1.5 text-up">
          <ShieldCheck size={16} className="shrink-0" />
          {t('Sample: enabled')}
        </span>
      </Row>
      <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>
        {t('Done')}
      </button>
    </Modal>
  );
}
