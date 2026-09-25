import { ChevronRight, Megaphone } from 'lucide-react';
import { ANNOUNCEMENTS } from './data';

export default function AnnouncementsCard() {
  return (
    <section className="panel p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Announcements</h2>
        <a href="/#faq" className="link-more">
          More
          <ChevronRight size={16} />
        </a>
      </div>
      <ul className="mt-4 space-y-4">
        {ANNOUNCEMENTS.map((a) => (
          <li key={a} className="flex gap-2 text-sm">
            <Megaphone size={16} className="mt-0.5 shrink-0 text-ink-3" />
            <span className="text-ink-2">{a}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
