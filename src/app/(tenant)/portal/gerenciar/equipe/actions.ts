"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { INVITABLE_ROLES, isAdmin, type Role } from "@/lib/roles";

export type InviteState = { ok?: boolean; error?: string };

/** Convida um colaborador (e-mail + papel). Só admin (dono/diretor). */
export async function createInvitation(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { tenant, role } = await requireManager();
  if (!isAdmin(role)) return { error: "Apenas dono/diretor podem convidar." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const inviteRole = String(formData.get("role") ?? "") as Role;
  if (!email || !email.includes("@")) return { error: "Informe um e-mail válido." };
  if (!INVITABLE_ROLES.includes(inviteRole)) return { error: "Papel inválido." };

  const supabase = await createClient();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("invitations").insert({
    org_id: tenant.org.id,
    email,
    role: inviteRole,
    token,
    invited_by: (await supabase.auth.getUser()).data.user?.id,
    expires_at: expiresAt,
  });
  if (error) return { error: "Não foi possível criar o convite." };

  revalidatePath("/gerenciar/equipe");
  return { ok: true };
}

/** Cancela um convite pendente. */
export async function cancelInvitation(formData: FormData): Promise<void> {
  const { tenant, role } = await requireManager();
  if (!isAdmin(role)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", id).eq("org_id", tenant.org.id);
  revalidatePath("/gerenciar/equipe");
}
