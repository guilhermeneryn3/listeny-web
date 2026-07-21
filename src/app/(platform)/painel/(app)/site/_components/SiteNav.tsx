"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/painel/site/paginas", label: "Páginas" },
  { href: "/painel/site/ofertas", label: "Ofertas" },
  { href: "/painel/site/aparencia", label: "Aparência" },
  { href: "/painel/site/redes", label: "Redes sociais" },
  { href: "/painel/site/dominio", label: "Domínio" },
  { href: "/painel/site/publicacao", label: "Publicação" },
];

/** Sub-navegação do módulo Site (submódulos), estilo "Loja online" da Nuvemshop. */
export function SiteNav() {
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
