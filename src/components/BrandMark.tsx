/**
 * Símbolo da marca Listeny (capelo). Desenhado com currentColor, então herda a cor
 * de quem o usa — inclusive os tokens do tenant. Sem asset externo.
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-lg bg-primary text-surface ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[62%] w-[62%]"
      >
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
      </svg>
    </span>
  );
}
