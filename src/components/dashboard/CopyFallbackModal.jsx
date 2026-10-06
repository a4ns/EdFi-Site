import Modal from './Modal';
import { useLocale } from '../../state/locale';

export default function CopyFallbackModal({ label, value, onClose }) {
  const { t } = useLocale();
  return (
    <Modal title={t('Copy manually')} onClose={onClose}>
      <p className="mb-4 text-sm leading-6 text-ink-2">{t('Clipboard access is unavailable. Select and copy the text below.')}</p>
      <label className="block text-sm text-ink-3">
        {t(label)}
        <input
          className="input num mt-2 w-full bg-page text-sm text-ink"
          value={value}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
        />
      </label>
      <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={onClose}>{t('Done')}</button>
    </Modal>
  );
}
