import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenant, type Tenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { MANAGER_ROLES, type Role } from "@/lib/roles";
import { consoleUrl } from "@/lib/urls";
import { effectiveModules, type OrgModuleRow } from "@/lib/modules";

export type StudentContext = {
  tenant: Tenant;
  userId: string;
  studentId: string | null;
  /** O org tem o módulo "Portal do Aluno" ativo? Se não, a área do aluno fica indisponível. */
  portalEnabled: boolean;
};

/**
 * Gate da área do aluno (`/aluno`). Confirma que a pessoa é ALUNO deste org (membership
 * `student` ou `students.user_id`=eu). Gestor cai no console; sem sessão → `/entrar`;
 * ninguém disso → `/sem-acesso`. Também informa se o Portal do Aluno está ativo no org
 * (o gate de "área indisponível" fica no chamador, para mostrar uma tela clara).
 */
export async function requireStudent(): Promise<StudentContext> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const rawHost = h.get("host") ?? host; // com porta, p/ a URL do console (cross-host)
  const tenant = await resolveTenant(host);
  if (!tenant) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/aluno");

  if (tenant.org.owner_id === user.id) redirect(consoleUrl(rawHost));

  const { data: mem } = await supabase
    .from("memberships").select("role").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();
  const role = (mem as { role?: Role } | null)?.role;
  if (role && MANAGER_ROLES.includes(role)) redirect(consoleUrl(rawHost));

  const { data: stu } = await supabase
    .from("students").select("id").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();

  if (role === "student" || stu) {
    const { data: om } = await supabase
      .from("org_modules").select("module_key, enabled").eq("org_id", tenant.org.id);
    const portalEnabled = effectiveModules(tenant.org.plan, (om ?? []) as OrgModuleRow[]).includes("portal-aluno");
    return {
      tenant,
      userId: user.id,
      studentId: (stu as { id?: string } | null)?.id ?? null,
      portalEnabled,
    };
  }
  redirect("/sem-acesso");
}
