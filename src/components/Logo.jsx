// EdFi mark: a mortarboard in brand yellow.
export function LogoMark({ size = 24, color = '#F0B90B', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" className={className}>
      <path d="M12 3.5 22.5 8.4 12 13.3 1.5 8.4z" />
      <path d="M5.8 11.9v3.9c0 1.7 2.8 3.5 6.2 3.5s6.2-1.8 6.2-3.5v-3.9L12 14.8z" />
      <path d="M20.2 9.6h1.3v5.9h-1.3z" />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={28} />
      <span className="text-[22px] font-bold leading-none tracking-[0.06em] text-brand">EDFI</span>
    </span>
  );
}
