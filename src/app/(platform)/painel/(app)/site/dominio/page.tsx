import { requireManager } from "@/lib/teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import { DomainManager, type Domain } from "../_components/DomainManager";

const APP_DOMAIN = process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app";

/** Submódulo Domínio próprio (só o dono gerencia). */
export default async function DominioPage() {
  const { tenant, role } = await requireManager();

  if (role !== "owner") {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
        Só o dono do portal gerencia o domínio.
      </div>
    );
  }

  const { data } = await createAdminClient()
    .from("org_domains")
    .select("id, hostname, is_primary, status, ssl_status")
    .eq("org_id", tenant.org.id)
    .order("created_at");

  return <DomainManager domains={(data ?? []) as Domain[]} slug={tenant.org.slug} appDomain={APP_DOMAIN} />;
}
