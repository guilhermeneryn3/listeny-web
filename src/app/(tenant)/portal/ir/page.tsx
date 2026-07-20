import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { MANAGER_ROLES, type Role } from "@/lib/roles";

/**
 * Despachante de login (o "elevador do prédio"): manda cada pessoa pro lugar certo NESTE org,
 * pelo papel. É o passo depois do login no app único do tenant.
 */
export default async function IrPage() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: prof } = await supabase
    .from("profiles").select("must_change_password").eq("user_id", user.id).maybeSingle();
  if (prof?.must_change_password) redirect("/trocar-senha");

  if (tenant.org.owner_id === user.id) redirect("/gerenciar");

  const { data: mem } = await supabase
    .from("memberships").select("role").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();
  const role = (mem as { role?: Role } | null)?.role;
  if (role && MANAGER_ROLES.includes(role)) redirect("/gerenciar");
  if (role === "student") redirect("/aluno");

  // segurança: aluno vinculado sem membership ainda
  const { data: stu } = await supabase
    .from("students").select("id").eq("org_id", tenant.org.id).eq("user_id", user.id).maybeSingle();
  if (stu) redirect("/aluno");

  redirect("/sem-acesso");
}
