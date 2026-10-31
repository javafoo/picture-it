import { PRODUCT_NAME } from "@/lib/product";

/* The wordmark. A plain mark until the name is settled; `PlayO` stays for the
   tab icon. */

/** A round play mark, for the tab icon. */
export function PlayO({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <circle cx="50" cy="50" r="46" fill="var(--color-accent, #7b2f3e)" />
      <path d="M41 32 L70 50 L41 68 Z" fill="var(--color-canvas, #fbf8f3)" strokeLinejoin="round" stroke="var(--color-canvas, #fbf8f3)" strokeWidth="4" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return <span className={`inline-flex items-center font-display tracking-tight text-ink ${className}`}>{PRODUCT_NAME}</span>;
}
