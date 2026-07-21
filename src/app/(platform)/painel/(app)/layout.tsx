import type { ReactNode } from "react";
import Link from "next/link";
import { requireManager, listManagerOrgs } from "@/lib/teacher";
import { BrandMark } from "@/components/BrandMark";
import { DashboardNav } from "./_components/DashboardNav";

/**
 * Shell do CONSOLE do profissional (`/painel`). Marca Listeny (não a do tenant — o console é a
 * plataforma). `requireManager()` é o gate (sessão + portal selecionado + papel de gestão).
 * Mostra o portal atual e, se a pessoa tem mais de um, o "Trocar portal".
 */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const { tenant, role, plan, modules, userId } = await requireManager();
  const orgs = await listManagerOrgs(userId);
  const multi = orgs.length > 1;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg text-ink">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/painel/inicio" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink">
            <BrandMark /> Listeny
          </Link>
          <span className="text-hint">/</span>
          <span className="truncate font-semibold text-ink">{tenant.org.name}</span>
          {multi && (
            <Link
              href="/painel"
              className="ml-auto rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-sub transition-colors hover:border-primary"
            >
              Trocar portal
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <DashboardNav role={role} modules={modules} plan={plan} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
