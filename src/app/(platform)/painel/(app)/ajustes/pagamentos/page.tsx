import { requireManager } from "@/lib/teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentForm } from "./_components/PaymentForm";

/** Submódulo Meios de pagamento: gateway do professor para receber dos alunos. Só o dono. */
export default async function PagamentosPage() {
  const { tenant, role } = await requireManager();

  if (role !== "owner") {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
        Só o dono do portal configura o meio de pagamento.
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("connectors")
    .select("id, key")
    .eq("org_id", tenant.org.id)
    .eq("kind", "payment")
    .eq("enabled", true)
    .maybeSingle();

  let hasKey = false;
  const connRow = conn as { id: string; key: string } | null;
  if (connRow) {
    const { data: cred } = await admin
      .from("connector_credentials")
      .select("connector_id")
      .eq("connector_id", connRow.id)
      .maybeSingle();
    hasKey = !!cred;
  }

  return <PaymentForm currentProvider={connRow?.key ?? ""} hasKey={hasKey} />;
}
