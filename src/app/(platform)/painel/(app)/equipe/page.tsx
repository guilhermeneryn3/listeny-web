import { requireManager } from "@/lib/teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin, type Role } from "@/lib/roles";
import { ModuleLocked } from "@/components/ModuleLocked";
import { TeamManager, type Member, type Invite } from "./_components/TeamManager";

/** Quadro de colaboradores + convites. Só admin (dono/diretor). Nomes/e-mails via service-role. */
export default async function EquipePage() {
  const { tenant, role, modules } = await requireManager();

  if (!modules.includes("equipe")) return <ModuleLocked moduleKey="equipe" />;

  if (!isAdmin(role)) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
        Somente dono e diretor podem gerenciar a equipe.
      </div>
    );
  }

  const admin = createAdminClient();
  const orgId = tenant.org.id;

  const { data: mems } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", orgId);
  const userIds = (mems ?? []).map((m) => m.user_id as string);

  const { data: profs } = userIds.length
    ? await admin.from("profiles").select("user_id, first_name, last_name, email").in("user_id", userIds)
    : { data: [] as { user_id: string; first_name: string; last_name: string; email: string | null }[] };

  const members: Member[] = (mems ?? []).map((m) => {
    const p = (profs ?? []).find((x) => x.user_id === m.user_id);
    const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();
    return {
      userId: m.user_id as string,
      role: (m.user_id === tenant.org.owner_id ? "owner" : (m.role as Role)),
      name: name || (p?.email ?? "—"),
      email: p?.email ?? "",
    };
  });

  const { data: inv } = await admin
    .from("invitations")
    .select("id, email, role, token, expires_at")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const invites = (inv ?? []) as Invite[];

  return <TeamManager members={members} invites={invites} />;
}
