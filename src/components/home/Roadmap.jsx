import { useLocale } from '../../state/locale';
import { Check } from 'lucide-react';
import { ROADMAP } from '../../data/content';

const TONE = {
  Completed: { text: 'text-up', dot: 'bg-yellow text-yellow-on', line: 'bg-yellow' },
  'Up next': { text: 'text-yellow-text', dot: 'bg-yellow text-yellow-on', line: 'bg-line-strong' },
  Planned: { text: 'text-ink-3', dot: 'border border-line-strong bg-page text-ink-3', line: 'bg-line-strong' },
};

export default function Roadmap() {
  const { t } = useLocale();
  return (
    <section id="roadmap" className="page-x scroll-mt-16 py-8 lg:py-12">
      <h2 className="section-title">{t('Roadmap')}</h2>
      <p className="mt-3 max-w-xl text-base text-ink-3">
        {t('From a winning concept to a planned campus pilot and, in time, nationwide adoption.')}
      </p>
      <ol className="mt-10 grid gap-8 lg:grid-cols-4 lg:gap-0">
        {ROADMAP.map((r, i) => {
          const tone = TONE[r.status] ?? TONE.Planned;
          return (
            <li key={t(r.phase)} className="relative flex gap-4 lg:block lg:pr-8">
              {/* connector: vertical below lg, horizontal on desktop */}
              <div className="flex flex-col items-center lg:mb-6 lg:flex-row">
                <span className={`num z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone.dot}`}>
                  {r.status === 'Completed' ? <Check size={16} strokeWidth={2.5} /> : i + 1}
                </span>
                {i < ROADMAP.length - 1 && <span className={`mt-2 w-px flex-1 lg:ml-3 lg:mt-0 lg:h-px lg:w-auto ${tone.line}`} />}
              </div>
              <div className="pb-2 lg:pb-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink-3">
                  {t(r.phase)}
                  {r.date && <span className="rounded bg-raised px-2 py-0.5 text-xs font-medium text-ink-2">{r.date}</span>}
                </p>
                <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${tone.text}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t(r.status)}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">{t(r.title)}</h3>
                <p className="mt-2 max-w-[340px] text-sm leading-6 text-ink-3">{t(r.desc)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
