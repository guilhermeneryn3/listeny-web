import Link from "next/link";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { effectiveFields, type FieldConfig } from "@/lib/studentFields";
import { FieldsConfigurator } from "./_components/FieldsConfigurator";

const APP_DOMAIN = process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app";

/** Configurador dos campos do cadastro + link de autocadastro. */
export default async function CamposPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_student_form")
    .select("enroll_enabled, fields")
    .eq("org_id", tenant.org.id)
    .maybeSingle();
  const row = data as { enroll_enabled?: boolean; fields?: FieldConfig[] } | null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Campos do cadastro</h1>
        <Link href="/painel/alunos" className="text-sm font-medium text-sub hover:text-ink">← Alunos</Link>
      </div>
      <FieldsConfigurator
        initial={effectiveFields(row?.fields ?? null)}
        enrollEnabled={!!row?.enroll_enabled}
        enrollLink={`https://${tenant.org.slug}.${APP_DOMAIN}/cadastro`}
      />
    </div>
  );
}
