import { Check } from 'lucide-react';
import { ROADMAP } from '../../data/content';

export default function Roadmap() {
  return (
    <section id="roadmap" className="page-x scroll-mt-16 py-8 lg:py-12">
      <h2 className="section-title">Roadmap</h2>
      <p className="mt-3 max-w-xl text-base text-ink-3">
        From a single-campus sandbox in Petropavlovsk to a national education standard.
      </p>
      <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
        {ROADMAP.map((r, i) => (
          <li key={r.phase} className="relative flex gap-4 md:block md:pr-8">
            {/* connector: vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col items-center md:mb-6 md:flex-row">
              <span
                className={`num z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  r.status === 'Planned' ? 'border border-line-strong bg-page text-ink-3' : 'bg-yellow text-yellow-on'
                }`}
              >
                {r.status === 'Completed' ? <Check size={16} strokeWidth={2.5} /> : i + 1}
              </span>
              {i < ROADMAP.length - 1 && (
                <span
                  className={`mt-2 w-px flex-1 md:ml-3 md:mt-0 md:h-px md:w-auto ${r.status === 'Completed' ? 'bg-yellow' : 'bg-line-strong'}`}
                />
              )}
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm text-ink-3">
                {r.phase}
                <span className="rounded bg-raised px-2 py-0.5 text-xs font-medium text-ink-2">{r.date}</span>
              </p>
              <p
                className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${
                  r.status === 'Completed' ? 'text-up' : r.status === 'In progress' ? 'text-yellow-text' : 'text-ink-3'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {r.status}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-ink">{r.title}</h3>
              <p className="mt-2 max-w-[340px] text-sm leading-6 text-ink-3">{r.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
