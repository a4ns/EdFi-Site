import { Info } from 'lucide-react';
import { DEMO_COPY } from './data';

export default function DemoNotice({ kind = 'operation', className = '' }) {
  return (
    <p role="note" className={`flex gap-2 rounded-lg border border-yellow/20 bg-yellow/5 p-3 text-xs leading-5 text-ink-2 ${className}`}>
      <Info size={16} className="mt-0.5 shrink-0 text-yellow-text" />
      <span>{DEMO_COPY[kind]}</span>
    </p>
  );
}
