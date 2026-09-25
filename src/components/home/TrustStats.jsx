import { TRUST_STATS } from '../../data/content';

export default function TrustStats() {
  return (
    <section className="page-x" aria-label="EdFi in numbers">
      <div className="grid grid-cols-2 gap-y-8 rounded-xl border border-line py-8 lg:grid-cols-4 lg:py-10">
        {TRUST_STATS.map((s, i) => (
          <div
            key={s.label}
            className={`px-6 lg:px-10 ${i % 2 === 1 ? 'border-l border-line' : ''} ${i > 0 ? 'lg:border-l lg:border-line' : ''}`}
          >
            <p className="num text-[28px] font-semibold leading-9 text-ink lg:text-[40px] lg:leading-[48px]">{s.value}</p>
            <p className="mt-1 text-sm text-ink-3">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
