import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenant, type Tenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { MANAGER_ROLES, type Role } from "@/lib/roles";

export type StudentContext = {
  tenant: Tenant;
  userId: string;
  studentId: string | null;
};

/**
 * Gate da área do aluno (`/aluno`). Confirma que a pessoa é ALUNO deste org (membership
 * `student` ou `students.user_id`=eu). Gestor cai no `/gerenciar`; sem sessão → `/entrar`;
 * ninguém disso → `/sem-acesso`.
 */
export async function requireStudent(): Promise<StudentContext> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/aluno");

  if (tenant.org.owner_id === user.id) redirect("/gerenciar");

  const { data: mem } = await supabase
    .from("memberships").select("role").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();
  const role = (mem as { role?: Role } | null)?.role;
  if (role && MANAGER_ROLES.includes(role)) redirect("/gerenciar");

  const { data: stu } = await supabase
    .from("students").select("id").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();

  if (role === "student" || stu) {
    return { tenant, userId: user.id, studentId: (stu as { id?: string } | null)?.id ?? null };
  }
  redirect("/sem-acesso");
}
