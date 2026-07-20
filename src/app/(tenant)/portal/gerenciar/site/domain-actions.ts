"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export type DomainState = { ok?: boolean; error?: string };

// hostname válido (sem protocolo/caminho), minúsculo
const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/** Só o DONO gere domínios (org_domains: escrita reservada; validamos posse e usamos service-role). */
async function ownerOrgId(): Promise<string | null> {
  const { tenant, role } = await requireManager();
  return role === "owner" ? tenant.org.id : null;
}

export async function addDomain(_prev: DomainState, formData: FormData): Promise<DomainState> {
  const orgId = await ownerOrgId();
  if (!orgId) return { error: "Apenas o dono pode adicionar domínios." };

  const hostname = String(formData.get("hostname") ?? "")
    .trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!HOST_RE.test(hostname)) return { error: "Informe um domínio válido (ex.: escola.com.br)." };

  const admin = createAdminClient();
  const { error } = await admin.from("org_domains").insert({
    org_id: orgId,
    hostname,
    status: "pending",
    ssl_status: "none",
    is_primary: false,
  });
  if (error) {
    if (error.code === "23505") return { error: "Esse domínio já está em uso." };
    return { error: "Não foi possível adicionar o domínio." };
  }
  revalidatePath("/gerenciar/site");
  return { ok: true };
}

export async function removeDomain(formData: FormData): Promise<void> {
  const orgId = await ownerOrgId();
  if (!orgId) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("org_domains").delete().eq("id", id).eq("org_id", orgId);
  revalidatePath("/gerenciar/site");
}

export async function setPrimaryDomain(formData: FormData): Promise<void> {
  const orgId = await ownerOrgId();
  if (!orgId) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  // confirma que o domínio é do org e está ativo (só domínio verificado pode ser primário)
  const { data: dom } = await admin
    .from("org_domains").select("status").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!dom || dom.status !== "active") return;

  await admin.from("org_domains").update({ is_primary: false }).eq("org_id", orgId);
  await admin.from("org_domains").update({ is_primary: true }).eq("id", id).eq("org_id", orgId);
  revalidatePath("/gerenciar/site");
}
