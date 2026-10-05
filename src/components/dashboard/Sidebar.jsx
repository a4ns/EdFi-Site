import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { SIDEBAR_ITEMS } from './nav';
import { useLocale } from '../../state/locale';

export default function Sidebar({ active, onSelect }) {
  const { t } = useLocale();
  return (
    <div className="hidden w-[240px] shrink-0 border-r border-line lg:block">
      <aside className="sticky top-16 flex h-[calc(100vh-64px)] flex-col overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label={t('Account')}>
          {SIDEBAR_ITEMS.map((item) => {
            const { id, label, icon: Ico } = item;
            const isActive = active === id;
            return (
              <div key={id} className={id === 'referral' || id === 'account' ? 'mt-2 border-t border-line pt-3' : ''}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
                  isActive ? 'bg-card text-ink' : 'text-ink-3 hover:bg-card hover:text-ink'
                }`}
              >
                <Ico size={20} className={isActive ? 'shrink-0 text-ink [&_*]:fill-current [&_*]:[fill-opacity:0.2]' : 'shrink-0'} />
                {t(label)}
              </button>
              </div>
            );
          })}
        </nav>
        <Link
          to="/"
          className="mt-auto flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-ink-3 transition-colors hover:bg-card hover:text-ink"
        >
          <LogOut size={20} />
          {t('Exit demo')}
        </Link>
      </aside>
    </div>
  );
}
