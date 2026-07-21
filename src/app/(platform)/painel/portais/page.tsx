import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listManagerOrgs } from "@/lib/teacher";
import { BrandMark } from "@/components/BrandMark";
import { PortalList, type PortalItem } from "../_components/PortalList";

export const metadata = { title: "Seus portais — Listeny" };

/** Gestão de portais: abrir, criar e excluir. Sempre acessível (mesmo com 1 portal). */
export default async function PortaisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/painel/portais");

  const orgs = await listManagerOrgs(user.id);
  if (orgs.length === 0) redirect("/criar");

  const portals: PortalItem[] = orgs.map((o) => ({
    id: o.id, name: o.name, slug: o.slug, plan: o.plan, owned: o.owned,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <header className="mb-8 flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <BrandMark /> Listeny
      </header>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Seus portais</h1>
      <p className="mt-2 text-sub">Abra, crie ou exclua os portais que você gerencia.</p>

      <div className="mt-8">
        <PortalList portals={portals} />
      </div>

      <Link
        href="/criar"
        className="mt-6 inline-flex rounded-[var(--radius)] border border-edge px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary"
      >
        + Criar novo portal
      </Link>
    </main>
  );
}
