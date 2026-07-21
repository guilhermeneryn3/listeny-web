import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listManagerOrgs } from "@/lib/teacher";
import { BrandMark } from "@/components/BrandMark";
import { PLAN_LABEL, type Plan } from "@/lib/plans";

export const metadata = { title: "Seus portais — Listeny" };

/**
 * Entrada do console. Sem sessão → login. Sem portal → criar. 1 portal → abre direto (sem
 * seletor). 2+ → mostra o seletor. Abrir passa pela rota `/painel/abrir` que fixa o cookie.
 */
export default async function PainelHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/painel");

  const orgs = await listManagerOrgs(user.id);
  if (orgs.length === 0) redirect("/criar");
  if (orgs.length === 1) redirect(`/painel/abrir?portal=${encodeURIComponent(orgs[0].slug)}`);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <header className="mb-8 flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <BrandMark /> Listeny
      </header>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Seus portais</h1>
      <p className="mt-2 text-sub">Escolha qual portal você quer gerenciar.</p>

      <ul className="mt-8 flex flex-col gap-2">
        {orgs.map((o) => (
          <li key={o.id}>
            <Link
              href={`/painel/abrir?portal=${encodeURIComponent(o.slug)}`}
              className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{o.name}</div>
                <div className="mt-0.5 text-sm text-sub">
                  {o.slug} · {PLAN_LABEL[o.plan as Plan] ?? o.plan}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary-dark">Abrir →</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/criar"
        className="mt-6 inline-flex rounded-[var(--radius)] border border-edge px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary"
      >
        Criar novo portal
      </Link>
    </main>
  );
}
