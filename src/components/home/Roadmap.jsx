import { ROADMAP } from '../../data/content';

export default function Roadmap() {
  return (
    <section id="roadmap" className="page-x scroll-mt-16 py-12 lg:py-16">
      <h2 className="section-title">Roadmap</h2>
      <p className="mt-3 max-w-xl text-base text-ink-3">
        From a single-campus sandbox in Petropavlovsk to a national education standard.
      </p>
      <ol className="relative mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
        {ROADMAP.map((r, i) => (
          <li key={r.phase} className="card relative flex flex-col p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <span className="num flex h-8 w-8 items-center justify-center rounded-lg bg-yellow text-sm font-semibold text-yellow-on">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-ink-3">{r.phase}</span>
              <span className="ml-auto rounded bg-raised px-2 py-0.5 text-xs font-medium text-ink-2">{r.date}</span>
            </div>
            <h3 className="mt-6 text-xl font-semibold text-ink">{r.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-3">{r.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
