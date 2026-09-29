import { TRUST_STATS } from '../../data/content';

export default function TrustStats() {
  return (
    <section className="page-x" aria-label="EdFi in numbers">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
        {TRUST_STATS.map((s) => (
          <div key={s.label}>
            <p className="num text-[32px] font-semibold leading-10 text-ink lg:text-[40px] lg:leading-[48px]">{s.value}</p>
            <p className="mt-1 text-sm text-ink-3">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
