"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isAdmin, type Role } from "@/lib/roles";

/**
 * Nav lateral do workspace do professor (adaptação web das tabs do mockup mobile). Itens de
 * sub-fases futuras entram desabilitados até chegar a vez. Hrefs "limpos" (`/gerenciar/*`) —
 * o proxy reescreve o host de tenant para `/portal/*`, mas o usePathname/URL segue limpo.
 */
type Item = { href: string; label: string; icon: ReactNode; soon?: boolean; adminOnly?: boolean };

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const ITEMS: Item[] = [
  { href: "/gerenciar", label: "Início", icon: <Icon d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" /> },
  { href: "/gerenciar/alunos", label: "Alunos", icon: <Icon d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19c0-1.7-1-3-2.5-3.5M4 19c0-1.7 1-3 2.5-3.5" /> },
  { href: "/gerenciar/turmas", label: "Turmas", icon: <Icon d="M4 7h16M4 12h16M4 17h16" /> },
  { href: "/gerenciar/agenda", label: "Agenda", icon: <Icon d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" /> },
  { href: "/gerenciar/aulas", label: "Aulas", icon: <Icon d="M4 5h11a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z" />, soon: true },
  { href: "/gerenciar/progresso", label: "Progresso", icon: <Icon d="M4 19V5M4 19h16M8 15v-3M12 15V9M16 15v-6" />, soon: true },
  { href: "/gerenciar/financeiro", label: "Financeiro", icon: <Icon d="M3 7h18v10H3zM3 10h18M7 14h3" />, soon: true },
  { href: "/gerenciar/equipe", label: "Equipe", icon: <Icon d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-2.8 2.7-5 6-5s6 2.2 6 5M16 5.5a3 3 0 0 1 0 6M18 20c0-1.8-.7-3.4-1.9-4.6" />, adminOnly: true },
  { href: "/gerenciar/ajustes", label: "Ajustes", icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l1.5 1-1 2-1.8-.4-1.2 1.5.4 1.8-2 1-1.3-1.5-1.9.4-1.3 1.1-2-1 .4-1.8L4 13l-1.5-1 1-2 1.8.4L6.5 9l-.4-1.8 2-1L9.4 7.7 11.3 7l1.3-1.1 2 1-.4 1.8L15.4 10" />, soon: true },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS.filter((it) => !it.adminOnly || isAdmin(role));

  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active =
          it.href === "/gerenciar"
            ? pathname === "/gerenciar"
            : pathname.startsWith(it.href);

        if (it.soon) {
          return (
            <span
              key={it.href}
              className="flex cursor-default items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-hint"
              aria-disabled
            >
              {it.icon}
              <span>{it.label}</span>
              <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">
                em breve
              </span>
            </span>
          );
        }

        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-tint text-primary-dark"
                : "text-sub hover:bg-soft hover:text-ink"
            }`}
          >
            {it.icon}
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
