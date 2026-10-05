import { ChevronRight, CircleCheck, Hourglass } from 'lucide-react';
import { formatDemoAmount } from '../../lib/demoAmount';
import { formatInt } from '../../lib/format';
import { useLocale } from '../../state/locale';

function Progress({ value, total }) {
  const { t } = useLocale();
  return (
    <div role="progressbar" aria-label={t('Task progress')} aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} className="h-1 w-full overflow-hidden rounded-full bg-raised">
      <div className="h-full rounded-full bg-yellow transition-[width] duration-500" style={{ width: `${(value / total) * 100}%` }} />
    </div>
  );
}

function Action({ task, onClaim, onContinue }) {
  const { t } = useLocale();
  if (task.status === 'claimable') {
    return (
      <button type="button" className="btn btn-primary btn-sm h-auto min-h-8 w-[106px] shrink-0 whitespace-normal px-2 py-1 text-center sm:w-[116px]" onClick={() => onClaim(task)}>
        {t('Claim')}
      </button>
    );
  }
  if (task.status === 'claimed') {
    return (
      <span className="inline-flex min-h-8 w-[106px] shrink-0 whitespace-normal px-2 py-1 text-center sm:w-[116px] items-center justify-center gap-1 text-xs text-up sm:text-sm">
        <CircleCheck size={16} />
        {t('Claimed')}
      </span>
    );
  }
  if (task.status === 'verifying') {
    return (
      <span className="inline-flex min-h-8 w-[106px] shrink-0 whitespace-normal px-2 py-1 text-center sm:w-[116px] items-center justify-center gap-1 text-xs text-ink-3 sm:text-sm" title={t('Simulated verification; no registrar request is sent')}>
        <Hourglass size={14} />
        {t('Verifying')}
      </span>
    );
  }
  return (
    <button type="button" className="btn btn-secondary btn-sm h-auto min-h-8 w-[106px] shrink-0 whitespace-normal px-2 py-1 text-center sm:w-[116px]" onClick={() => onContinue(task)}>
      {t(task.cta ?? 'Start')}
    </button>
  );
}

export default function TasksCard({ tasks, onClaim, onContinue }) {
  const { locale, t } = useLocale();
  const claimable = tasks.filter((task) => task.status === 'claimable').length;
  return (
    <section id="tasks" className="panel flex flex-1 scroll-mt-20 flex-col p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{t('Learn & Earn')}</h2>
        {claimable > 0 ? (
          <span className="chip num bg-yellow/10 text-yellow-text">{t('{count} ready to claim', { count: claimable })}</span>
        ) : (
          <span className="text-xs text-ink-3">{t('No rewards ready to claim')}</span>
        )}
      </div>
      <ul className="mt-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 py-4 first:pt-2">
            <div className="min-w-0 w-full flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-ink">{t(task.title)}</p>
                <p className="num shrink-0 text-sm font-semibold text-ink">
                  +{formatDemoAmount(task.rewardUnits, locale)} <span className="font-normal text-ink-3">EDC</span>
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-3">
                <span className="min-w-0">{t(task.sub)}</span>
                <span className="num shrink-0">
                  {formatInt(Math.min(task.progress, task.total), locale)}/{formatInt(task.total, locale)}
                </span>
              </div>
              <div className="mt-2">
                <Progress value={Math.min(task.progress, task.total)} total={task.total} />
              </div>
            </div>
            <Action task={task} onClaim={onClaim} onContinue={onContinue} />
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-line pt-4">
        <a href="/#earn" className="link-more">
          {t('View all reward rates')}
          <ChevronRight size={16} />
        </a>
      </div>
    </section>
  );
}
