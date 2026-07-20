"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdmin, type Role } from "@/lib/roles";
import { MODULES, type ModuleKey } from "@/lib/modules";
import { PLAN_LABEL, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

/**
 * Nav do painel, montada a partir do CATÁLOGO de módulos, mostrando só os módulos do plano do
 * org (e respeitando adminOnly × papel). Início/Ajustes são fixos. Módulos do plano ainda não
 * implementados aparecem como "em breve". Rótulo do plano no rodapé.
 */
function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <path d={d} />
    </svg>
  );
}

const ICONS: Record<ModuleKey | "inicio" | "ajustes", string> = {
  inicio: "M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5",
  alunos: "M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19c0-1.7-1-3-2.5-3.5M4 19c0-1.7 1-3 2.5-3.5",
  turmas: "M4 7h16M4 12h16M4 17h16",
  agenda: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  site: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
  aulas: "M4 5h11a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z",
  progresso: "M4 19V5M4 19h16M8 15v-3M12 15V9M16 15v-6",
  financeiro: "M3 7h18v10H3zM3 10h18M7 14h3",
  equipe: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-2.8 2.7-5 6-5s6 2.2 6 5M16 5.5a3 3 0 0 1 0 6M18 20c0-1.8-.7-3.4-1.9-4.6",
  marketing: "M3 11v2l14 5V6L3 11ZM17 8a3 3 0 0 1 0 8M6 13v5",
  rh: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17c0-1.7 1.8-3 4-3s4 1.3 4 3",
  ajustes: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l1.5 1-1 2-1.8-.4-1.2 1.5.4 1.8-2 1-1.3-1.5-1.9.4-1.3 1.1-2-1 .4-1.8L4 13l-1.5-1 1-2 1.8.4L6.5 9l-.4-1.8 2-1L9.4 7.7 11.3 7l1.3-1.1 2 1-.4 1.8L15.4 10",
};

const base = "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors";

export function DashboardNav({
  role,
  modules,
  plan,
}: {
  role: Role;
  modules: ModuleKey[];
  plan: string;
}) {
  const pathname = usePathname();
  const enabled = MODULES.filter((m) => modules.includes(m.key) && (!m.adminOnly || isAdmin(role)));

  const inicioActive = pathname === "/gerenciar";

  return (
    <nav className="flex flex-col gap-1">
      <Link href="/gerenciar" className={`${base} ${inicioActive ? "bg-tint text-primary-dark" : "text-sub hover:bg-soft hover:text-ink"}`}>
        <Icon d={ICONS.inicio} />
        <span>Início</span>
      </Link>

      {enabled.map((m) => {
        if (!m.built) {
          return (
            <span key={m.key} className={`${base} cursor-default text-hint`} aria-disabled>
              <Icon d={ICONS[m.key]} />
              <span>{m.label}</span>
              <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">em breve</span>
            </span>
          );
        }
        const active = pathname.startsWith(m.href);
        return (
          <Link key={m.key} href={m.href} className={`${base} ${active ? "bg-tint text-primary-dark" : "text-sub hover:bg-soft hover:text-ink"}`}>
            <Icon d={ICONS[m.key]} />
            <span>{m.label}</span>
          </Link>
        );
      })}

      <span className={`${base} cursor-default text-hint`} aria-disabled>
        <Icon d={ICONS.ajustes} />
        <span>Ajustes</span>
        <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">em breve</span>
      </span>

      <button
        type="button"
        onClick={async () => {
          await createClient().auth.signOut();
          window.location.href = "/entrar";
        }}
        className={`${base} mt-1 text-sub hover:bg-soft hover:text-ink`}
      >
        <Icon d="M15 12H3M9 6l-6 6 6 6M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <span>Sair</span>
      </button>

      <div className="mt-3 px-3 text-xs text-hint">
        Plano: <span className="font-semibold text-sub">{PLAN_LABEL[(plan as Plan)] ?? plan}</span>
      </div>
    </nav>
  );
}
