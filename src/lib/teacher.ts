import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenantBySlug, type Tenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MANAGER_ROLES, type Role } from "@/lib/roles";
import { PORTAL_COOKIE } from "@/lib/urls";
import { effectiveModules, type ModuleKey, type OrgModuleRow } from "@/lib/modules";

export type ManagerContext = {
  tenant: Tenant;
  userId: string;
  role: Role;
  plan: string;
  modules: ModuleKey[];
};

export type ManagerOrg = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
};

/**
 * Portais (orgs) que o usuário GERENCIA — dono + memberships de gestão. Usa service-role
 * (server-only), sempre filtrado pelo próprio usuário, então não depende da RLS de leitura.
 */
export async function listManagerOrgs(userId: string): Promise<ManagerOrg[]> {
  const admin = createAdminClient();
  // "owner" não é papel de membership (é o owner_id do org) — o dono vem da query `owned`.
  const membershipManagerRoles = MANAGER_ROLES.filter((r) => r !== "owner");
  const [ownedRes, memRes] = await Promise.all([
    admin.from("orgs").select("id, name, slug, status, plan").eq("owner_id", userId),
    admin
      .from("memberships")
      .select("orgs(id, name, slug, status, plan)")
      .eq("user_id", userId)
      .in("role", membershipManagerRoles),
  ]);

  const byId = new Map<string, ManagerOrg>();
  for (const o of (ownedRes.data ?? []) as ManagerOrg[]) byId.set(o.id, o);
  for (const row of (memRes.data ?? []) as { orgs: ManagerOrg | ManagerOrg[] | null }[]) {
    const o = Array.isArray(row.orgs) ? row.orgs[0] : row.orgs;
    if (o && !byId.has(o.id)) byId.set(o.id, o);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gate do CONSOLE do profissional (`/painel`). Resolve o portal pelo COOKIE de seleção
 * (não pelo host — o console mora na plataforma). Exige sessão e papel de gestão NESTE portal.
 * Redireciona: sem sessão → `/login?next=/painel`; sem/ inválida seleção → `/painel` (seletor);
 * logado sem papel de gestão no portal → `/painel`. Reutilizável em server actions.
 */
export async function requireManager(): Promise<ManagerContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/painel");

  const jar = await cookies();
  const slug = jar.get(PORTAL_COOKIE)?.value ?? "";
  if (!slug) redirect("/painel");

  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) redirect("/painel");

  let role: Role | undefined;
  if (tenant.org.owner_id === user.id) {
    role = "owner";
  } else {
    const { data: mem } = await supabase
      .from("memberships")
      .select("role")
      .eq("org_id", tenant.org.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const r = (mem as { role?: Role } | null)?.role;
    if (r && MANAGER_ROLES.includes(r)) role = r;
  }
  if (!role) redirect("/painel");

  const plan = tenant.org.plan;
  const { data: om } = await supabase
    .from("org_modules").select("module_key, enabled").eq("org_id", tenant.org.id);
  const modules = effectiveModules(plan, (om ?? []) as OrgModuleRow[]);

  return { tenant, userId: user.id, role, plan, modules };
}
