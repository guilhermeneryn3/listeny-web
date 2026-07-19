import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenant, type Tenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export type TeacherRole = "owner" | "teacher" | "staff";

export type TeacherContext = {
  tenant: Tenant;
  userId: string;
  role: TeacherRole;
};

/**
 * Gate da área do professor (`/gerenciar`). Resolve o tenant pelo host, exige sessão e que o
 * usuário GERENCIE este org (dono ou membership teacher/staff). Redireciona quando não bate:
 *  - sem tenant → `/` (o shell do tenant já trata "portal não encontrado");
 *  - sem sessão → `/entrar?next=/gerenciar`;
 *  - logado mas sem vínculo de gestão → `/sem-acesso`.
 * Chamado no layout de `/gerenciar` e reutilizável nas server actions.
 */
export async function requireTeacher(): Promise<TeacherContext> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/gerenciar");

  if (tenant.org.owner_id === user.id) {
    return { tenant, userId: user.id, role: "owner" };
  }

  const { data: mem } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", tenant.org.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (mem as { role?: string } | null)?.role;
  if (role === "teacher" || role === "staff") {
    return { tenant, userId: user.id, role };
  }

  redirect("/sem-acesso");
}
