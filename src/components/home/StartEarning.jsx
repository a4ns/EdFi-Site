import { useLocale } from '../../state/locale';
import { useAuth } from '../../state/auth';

export default function StartEarning() {
  const { t } = useLocale();
  const { openAuth } = useAuth();
  return (
    <section className="page-x pb-12 pt-4 text-center lg:pb-16">
      <h2 className="section-title">{t('Explore the EdFi demo')}</h2>
      <button type="button" onClick={() => openAuth('signup')} className="btn btn-primary btn-lg mt-8 w-full sm:w-auto sm:px-10">
        {t('Try sample rewards')}
      </button>
    </section>
  );
}
