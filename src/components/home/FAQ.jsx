import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { FAQ as ITEMS } from '../../data/content';

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" className="page-x scroll-mt-16 py-10 lg:py-12">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="mt-10 space-y-2">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={`rounded-xl transition-colors ${isOpen ? 'bg-card' : 'hover:bg-card'}`}>
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 p-4 text-left md:gap-6 md:px-6 md:py-5"
                  aria-expanded={isOpen}
                  aria-controls={`${baseId}-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-base font-semibold text-ink">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-base font-medium text-ink md:text-xl">{item.q}</span>
                  {isOpen ? <Minus size={24} className="shrink-0 text-ink" /> : <Plus size={24} className="shrink-0 text-ink" />}
                </button>
              </h3>
              {isOpen && (
                <div id={`${baseId}-${i}`} role="region" className="animate-fade-in px-4 pb-6 pl-[72px] md:pl-[88px] md:pr-16">
                  <p className="text-sm leading-6 text-ink-3 md:text-base md:leading-7">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
