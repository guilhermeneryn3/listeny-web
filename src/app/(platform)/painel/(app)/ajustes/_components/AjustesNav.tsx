"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/painel/ajustes/pagamentos", label: "Meios de pagamento" },
  { href: "/painel/ajustes/emails", label: "E-mails automáticos" },
];

/** Sub-navegação do hub de Ajustes. */
export function AjustesNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
      {ITEMS.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-tint text-primary-dark" : "text-sub hover:bg-soft hover:text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
