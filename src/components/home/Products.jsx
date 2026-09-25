import { Link } from 'react-router-dom';
import { ArrowDownLeft, CircleCheck, ChevronRight } from 'lucide-react';
import Icon from '../Icon';
import CoinIcon from '../CoinIcon';
import { PRODUCTS } from '../../data/content';

function EarnPreview() {
  return (
    <div className="space-y-2">
      {[
        ['Exam grade A', 'Macroeconomics', '+50.00'],
        ['Weekly attendance', '5 of 5 days', '+25.00'],
      ].map(([t, s, v]) => (
        <div key={t} className="flex items-center gap-3 rounded-md bg-card px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-up/10 text-up">
            <ArrowDownLeft size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-ink">{t}</span>
            <span className="block text-[11px] text-ink-3">{s}</span>
          </span>
          <span className="num text-xs font-semibold text-up">{v} EDC</span>
        </div>
      ))}
    </div>
  );
}

function SpendPreview() {
  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-[11px] text-ink-3">
        <span>Campus Canteen</span>
        <span className="inline-flex items-center gap-1 text-up">
          <CircleCheck size={12} />
          Paid
        </span>
      </div>
      <p className="num mt-1 text-xl font-semibold text-ink">
        -15.00 <span className="text-sm font-normal text-ink-3">EDC</span>
      </p>
      <div className="mt-2 flex justify-between border-t border-line pt-2 text-[11px] text-ink-3">
        <span>Fee</span>
        <span className="num text-ink-2">0.00 EDC</span>
      </div>
    </div>
  );
}

function WithdrawPreview() {
  return (
    <div className="space-y-2.5 px-1 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="text-ink-3">Coin</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <CoinIcon symbol="EDC" size={14} />
          EDC
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-3">Network</span>
        <span className="rounded bg-raised px-1.5 py-0.5 font-medium text-ink">BNB Smart Chain (BEP20)</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-3">Address</span>
        <span className="num font-medium text-ink">0x71C4…9A24</span>
      </div>
    </div>
  );
}

const PREVIEWS = [EarnPreview, SpendPreview, WithdrawPreview];

export default function Products() {
  return (
    <section id="products" className="page-x scroll-mt-16 py-10 lg:py-12">
      <h2 className="section-title">One token for your whole campus</h2>
      <p className="mt-3 max-w-xl text-base text-ink-3">
        EDC is earned for verified academic results and accepted across campus. It never gets stuck in a transcript.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
        {PRODUCTS.map((p, i) => {
          const Preview = PREVIEWS[i];
          return (
            <article key={p.tag} className="card flex flex-col p-6 lg:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-raised text-yellow-text">
                <Icon name={p.icon} size={24} />
              </span>
              <p className="mt-6 text-sm font-medium text-yellow-text">{p.tag}</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-ink-3">{p.desc}</p>
              <div className="mt-6 flex h-[128px] flex-col justify-center rounded-lg bg-page p-3">
                <Preview />
              </div>
              <Link to="/demo" className="link-more mt-6 text-ink">
                {p.cta}
                <ChevronRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
