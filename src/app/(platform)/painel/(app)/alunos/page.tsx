import Link from "next/link";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { effectiveFields, type FieldConfig } from "@/lib/studentFields";
import { StudentsManager, type Student } from "./_components/StudentsManager";

/** Roster de alunos do professor. Dados reais (RLS por org); estado vazio quando não há. */
export default async function AlunosPage() {
  const { tenant, modules } = await requireManager();
  const supabase = await createClient();
  const portalOff = !modules.includes("portal-aluno");

  const [{ data }, { data: formRow }] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, email, phone, notes, status, user_id, avatar_url, profile")
      .eq("org_id", tenant.org.id)
      .order("name"),
    supabase.from("org_student_form").select("fields").eq("org_id", tenant.org.id).maybeSingle(),
  ]);

  const students: Student[] = (data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    email: (s.email as string | null) ?? null,
    phone: (s.phone as string | null) ?? null,
    notes: (s.notes as string | null) ?? null,
    status: s.status as Student["status"],
    hasAccess: !!s.user_id,
    avatarUrl: (s.avatar_url as string | null) ?? null,
    profile: (s.profile as Record<string, string> | null) ?? {},
  }));

  const fields = effectiveFields((formRow as { fields?: FieldConfig[] } | null)?.fields ?? null);

  return (
    <div>
      {portalOff && (
        <div className="mb-4 rounded-[var(--radius)] border border-edge bg-soft p-3 text-sm text-sub">
          O <span className="font-semibold text-ink">Portal do Aluno</span> está desligado — os alunos
          não conseguem entrar na área logada. Ative na{" "}
          <Link href="/painel/loja" className="font-semibold text-primary-dark hover:underline">Loja</Link>.
        </div>
      )}
      <StudentsManager students={students} fields={fields} />
    </div>
  );
}
