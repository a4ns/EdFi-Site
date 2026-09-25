import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { SIDEBAR_ITEMS } from './nav';

export default function Sidebar({ active, onSelect }) {
  return (
    <div className="hidden w-[240px] shrink-0 border-r border-line lg:block">
      <aside className="sticky top-16 flex h-[calc(100vh-64px)] flex-col overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Account">
          {SIDEBAR_ITEMS.map((item) => {
            const { id, label, icon: Ico } = item;
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 rounded-lg px-4 text-left text-sm font-medium transition-colors ${
                  isActive ? 'bg-card text-ink' : 'text-ink-3 hover:bg-card hover:text-ink'
                }`}
              >
                <Ico size={20} className={isActive ? 'text-ink [&_*]:fill-current [&_*]:[fill-opacity:0.2]' : ''} />
                {label}
              </button>
            );
          })}
        </nav>
        <Link
          to="/"
          className="mt-auto flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-ink-3 transition-colors hover:bg-card hover:text-ink"
        >
          <LogOut size={20} />
          Exit demo
        </Link>
      </aside>
    </div>
  );
}
