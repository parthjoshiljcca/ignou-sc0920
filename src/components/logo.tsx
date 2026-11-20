export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--primary)" />
      <path d="M14 22 32 14l18 8-18 8z" fill="var(--accent)" />
      <path d="M20 27v10c0 4 5.4 7 12 7s12-3 12-7V27l-12 5.3z" fill="var(--on-primary)" />
      <rect x="47" y="23" width="2.6" height="13" rx="1.3" fill="var(--accent)" />
    </svg>
  );
}
