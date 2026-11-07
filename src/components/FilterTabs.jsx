import { moveFilterTab } from '../lib/navigation';

export default function FilterTabs({ label, tabs, value, onChange, panelId, className = '', tabClassName = '' }) {
  return (
    <div role="tablist" aria-label={label} className={className}>
      {tabs.map(({ id, label: tabLabel }, index) => (
        <button
          key={id}
          id={`${panelId}-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={value === id}
          aria-controls={panelId}
          tabIndex={value === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => moveFilterTab(event, index, tabs.length, (next) => onChange(tabs[next].id))}
          className={`tab shrink-0 ${tabClassName}`}
        >
          {tabLabel}
        </button>
      ))}
    </div>
  );
}
