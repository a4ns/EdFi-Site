import { CircleCheck, Hourglass } from 'lucide-react';

function Progress({ value, total }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-raised">
      <div className="h-full rounded-full bg-yellow transition-[width] duration-500" style={{ width: `${(value / total) * 100}%` }} />
    </div>
  );
}

function Action({ task, onClaim, onContinue }) {
  if (task.status === 'claimable') {
    return (
      <button type="button" className="btn btn-primary btn-sm w-[88px]" onClick={() => onClaim(task)}>
        Claim
      </button>
    );
  }
  if (task.status === 'claimed') {
    return (
      <span className="inline-flex w-[88px] items-center justify-center gap-1 text-sm text-up">
        <CircleCheck size={16} />
        Claimed
      </span>
    );
  }
  if (task.status === 'verifying') {
    return (
      <span className="inline-flex w-[88px] items-center justify-center gap-1 text-sm text-ink-3" title="Waiting for the registrar oracle">
        <Hourglass size={14} />
        Verifying
      </span>
    );
  }
  return (
    <button type="button" className="btn btn-secondary btn-sm w-[88px]" onClick={() => onContinue(task)}>
      {task.cta ?? 'Start'}
    </button>
  );
}

export default function TasksCard({ tasks, onClaim, onContinue }) {
  const claimable = tasks.filter((t) => t.status === 'claimable').length;
  return (
    <section id="tasks" className="panel scroll-mt-20 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Learn &amp; Earn</h2>
        {claimable > 0 ? (
          <span className="chip bg-yellow/10 text-yellow">{claimable} ready to claim</span>
        ) : (
          <span className="text-xs text-ink-3">All rewards claimed</span>
        )}
      </div>
      <ul className="mt-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-4 border-b border-line py-4 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                <p className="num shrink-0 text-sm font-semibold text-ink">
                  +{t.reward} <span className="font-normal text-ink-3">EDC</span>
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-3">
                <span className="truncate">{t.sub}</span>
                <span className="num shrink-0">
                  {Math.min(t.progress, t.total)}/{t.total}
                </span>
              </div>
              <div className="mt-2">
                <Progress value={Math.min(t.progress, t.total)} total={t.total} />
              </div>
            </div>
            <Action task={t} onClaim={onClaim} onContinue={onContinue} />
          </li>
        ))}
      </ul>
    </section>
  );
}
