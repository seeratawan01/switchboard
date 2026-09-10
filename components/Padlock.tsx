export function Padlock({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={className}>
      <rect x="1.5" y="5.5" width="9" height="6" rx="1" fill="currentColor" />
      <path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
