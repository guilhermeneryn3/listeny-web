import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveFields, type FieldConfig } from "@/lib/studentFields";
import { EnrollForm } from "./_components/EnrollForm";

/** Autocadastro público: o aluno preenche os campos configurados e entra como pendente. */
export default async function CadastroPage() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) return null;

  // config lida no servidor (service-role): flags + campos, sem policy pública.
  const { data } = await createAdminClient()
    .from("org_student_form")
    .select("enroll_enabled, fields")
    .eq("org_id", tenant.org.id)
    .maybeSingle();
  const row = data as { enroll_enabled?: boolean; fields?: FieldConfig[] } | null;

  if (!row?.enroll_enabled) {
    return (
      <main className="mx-auto grid w-full max-w-lg flex-1 place-items-center px-6 py-24 text-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Cadastro indisponível</h1>
          <p className="mt-2 text-sub">{tenant.org.name} não está aceitando cadastros online no momento.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Cadastro — {tenant.org.name}</h1>
      <p className="mt-1 text-sm text-sub">Preencha seus dados. Seu cadastro passa por aprovação.</p>
      <div className="mt-6">
        <EnrollForm orgId={tenant.org.id} fields={effectiveFields(row.fields ?? null)} />
      </div>
    </main>
  );
}
