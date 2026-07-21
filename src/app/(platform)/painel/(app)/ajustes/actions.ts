"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAYMENT_PROVIDERS } from "./providers";

export type AjustesState = { ok?: boolean; error?: string };

/**
 * Conecta o gateway do professor (recebimento dos alunos). Só o dono. Metadados em `connectors`;
 * a chave/token em `connector_credentials` (opaco, só service-role) — nunca volta pro client.
 * Um gateway ativo por org. (Cobrança de verdade via o gateway = fase de pagamento, deferida.)
 */
export async function savePaymentGateway(_prev: AjustesState, fd: FormData): Promise<AjustesState> {
  const { tenant, role } = await requireManager();
  if (role !== "owner") return { error: "Só o dono configura o meio de pagamento." };

  const provider = String(fd.get("provider") ?? "").trim();
  const token = String(fd.get("token") ?? "").trim();
  if (!PAYMENT_PROVIDERS.some((p) => p.key === provider)) return { error: "Escolha um provedor." };

  const admin = createAdminClient();
  // 1 gateway ativo por org: desliga os demais de pagamento.
  await admin.from("connectors").update({ enabled: false }).eq("org_id", tenant.org.id).eq("kind", "payment");

  const { data: conn, error } = await admin
    .from("connectors")
    .upsert(
      { org_id: tenant.org.id, kind: "payment", key: provider, enabled: true, config: {} },
      { onConflict: "org_id,kind,key" },
    )
    .select("id")
    .single();
  if (error || !conn) return { error: "Não foi possível salvar o gateway." };

  // Segredo só é gravado se informado; em branco mantém o que já existe.
  if (token) {
    const { error: cErr } = await admin
      .from("connector_credentials")
      .upsert({ connector_id: conn.id, secret: { token } }, { onConflict: "connector_id" });
    if (cErr) return { error: "Não foi possível salvar a chave." };
  }

  revalidatePath("/painel/ajustes/pagamentos");
  return { ok: true };
}

/** Desconecta o gateway ativo (mantém o registro, só desliga). Só o dono. */
export async function disconnectPayment(): Promise<void> {
  const { tenant, role } = await requireManager();
  if (role !== "owner") return;
  await createAdminClient()
    .from("connectors").update({ enabled: false }).eq("org_id", tenant.org.id).eq("kind", "payment");
  revalidatePath("/painel/ajustes/pagamentos");
}

/** Salva um e-mail automático (ligar/desligar + assunto/texto). Gestor (RLS can_manage_org). */
export async function saveEmailTemplate(_prev: AjustesState, fd: FormData): Promise<AjustesState> {
  const { tenant } = await requireManager();
  const key = String(fd.get("key") ?? "").trim();
  if (!key) return { error: "Tipo inválido." };

  const enabled = String(fd.get("enabled") ?? "") === "on";
  const subject = String(fd.get("subject") ?? "").trim() || null;
  const body = String(fd.get("body") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("org_email_templates")
    .upsert({ org_id: tenant.org.id, key, enabled, subject, body }, { onConflict: "org_id,key" });
  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/painel/ajustes/emails");
  return { ok: true };
}
