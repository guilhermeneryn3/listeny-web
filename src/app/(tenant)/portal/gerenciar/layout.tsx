import type { ReactNode } from "react";
import { requireManager } from "@/lib/teacher";
import { DashboardNav } from "./_components/DashboardNav";

/**
 * Shell do workspace do professor. `requireManager()` é o gate (tenant + sessão + vínculo de
 * gestão) — redireciona quem não pode. A marca do tenant já veio do `portal/layout` (header +
 * tokens CSS); aqui adicionamos a nav lateral.
 */
export default async function GerenciarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { tenant } = await requireManager();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-hint">
          {tenant.org.name}
        </div>
        <DashboardNav />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
