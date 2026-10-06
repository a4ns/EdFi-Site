// EdFi navigation marks use filled shapes on a shared 24px grid.
// The surrounding link or button supplies the accessible name.
function NavIcon({ size = 20, className = '', children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function DashboardNavIcon(props) {
  return (
    <NavIcon {...props}>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
    </NavIcon>
  );
}

export function HomeNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path d="m12 2.5 9.2 7.2a1 1 0 0 1-.6 1.8H20v8a1.5 1.5 0 0 1-1.5 1.5H15v-7H9v7H5.5A1.5 1.5 0 0 1 4 19.5v-8h-.6a1 1 0 0 1-.6-1.8L12 2.5Z" />
    </NavIcon>
  );
}

export function AssetsNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path d="M5 3h12.5A1.5 1.5 0 0 1 19 4.5V6H5a1 1 0 0 0 0 2h14.5A1.5 1.5 0 0 1 21 9.5v1h-5a3.5 3.5 0 0 0 0 7h5v2a1.5 1.5 0 0 1-1.5 1.5H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
      <path fillRule="evenodd" d="M16 12h6v4h-6a2 2 0 0 1 0-4Zm0 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </NavIcon>
  );
}

export function EarnNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path d="M12 3 23 8.2 12 13.4 1 8.2 12 3Z" />
      <path d="M5 12v4.2c0 2.1 3.1 4 7 4s7-1.9 7-4V12l-7 3.3L5 12Zm16-.9v5.4h2v-6.4l-2 1Z" />
    </NavIcon>
  );
}

export function PayNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path fillRule="evenodd" d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Z" />
      <path d="M6 6h2v2H6V6Zm10 0h2v2h-2V6ZM6 16h2v2H6v-2Zm7-3h3v3h-3v-3Zm5 0h3v2h-3v-2Zm-2 3h3v3h-3v-3Zm-3 3h3v2h-3v-2Zm6 0h2v2h-2v-2Z" />
    </NavIcon>
  );
}

export function HistoryNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path fillRule="evenodd" d="M12 3a9 9 0 1 1-8.4 12.2l1.9-.7A7 7 0 1 0 6 8.4l2 2H1.5V4l2.9 2.9A9 9 0 0 1 12 3Zm-1 4h2v4.5l3 1.7-1 1.8-4-2.3V7Z" />
    </NavIcon>
  );
}

export function ReferralNavIcon(props) {
  return (
    <NavIcon {...props}>
      <circle cx="9" cy="7.5" r="4" />
      <path d="M2 19a7 7 0 0 1 14 0v1H2v-1Zm16-12h2v3h3v2h-3v3h-2v-3h-3v-2h3V7Z" />
    </NavIcon>
  );
}

export function AccountNavIcon(props) {
  return (
    <NavIcon {...props}>
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M4 21v-1a8 6.5 0 0 1 16 0v1H4Z" />
    </NavIcon>
  );
}

export function SettingsNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path fillRule="evenodd" d="m10 2-.6 2.5-1.8 1-2.4-.7-2 3.4L5 10v2l-1.8 1.8 2 3.4 2.4-.7 1.8 1 .6 2.5h4l.6-2.5 1.8-1 2.4.7 2-3.4L19 12v-2l1.8-1.8-2-3.4-2.4.7-1.8-1L14 2h-4Zm2 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" transform="translate(0 1)" />
    </NavIcon>
  );
}

export function ExitNavIcon(props) {
  return (
    <NavIcon {...props}>
      <path d="M4 3h8v2H5v14h7v2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm12.6 3.6L22 12l-5.4 5.4-1.4-1.4 3-3H9v-2h9.2l-3-3 1.4-1.4Z" />
    </NavIcon>
  );
}
