import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenant, type Tenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { MANAGER_ROLES, type Role } from "@/lib/roles";

export type ManagerContext = {
  tenant: Tenant;
  userId: string;
  role: Role;
};

/**
 * Gate do painel de gestão (`/gerenciar`). Resolve o tenant pelo host, exige sessão e um papel
 * de GESTÃO neste org (dono/diretor/coordenador/professor/staff — ver MANAGER_ROLES).
 * Redireciona: sem tenant → `/`; sem sessão → `/entrar?next=/gerenciar`; logado sem papel de
 * gestão (aluno/responsável) → `/sem-acesso`. Reutilizável em server actions.
 */
export async function requireManager(): Promise<ManagerContext> {
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
  const role = (mem as { role?: Role } | null)?.role;
  if (role && MANAGER_ROLES.includes(role)) {
    return { tenant, userId: user.id, role };
  }

  redirect("/sem-acesso");
}
