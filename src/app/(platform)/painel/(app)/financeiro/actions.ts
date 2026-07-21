"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChargeState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/inicio");
}

function parseAmount(v: FormDataEntryValue | null): number | null {
  const raw = String(v ?? "").trim().replace(/\./g, "").replace(",", ".");
  // aceita "1.234,56" (pt-BR) e "1234.56"
  const alt = String(v ?? "").trim().replace(",", ".");
  const n = Number(raw);
  const n2 = Number(alt);
  const val = Number.isFinite(n) ? n : n2;
  return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : null;
}

/** Soma meses a uma data YYYY-MM-DD, fixando o dia (clampa no último dia do mês). */
function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

async function validStudent(supabase: SupabaseClient, orgId: string, id: string): Promise<boolean> {
  const { data } = await supabase.from("students").select("id").eq("id", id).eq("org_id", orgId).maybeSingle();
  return !!data;
}

export async function createCharge(_prev: ChargeState, formData: FormData): Promise<ChargeState> {
  const { tenant, userId } = await requireManager();
  const supabase = await createClient();
  const orgId = tenant.org.id;

  const studentId = String(formData.get("student_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = parseAmount(formData.get("amount"));
  const dueRaw = String(formData.get("due_date") ?? "").trim();
  const dueDate = dueRaw || null;
  const repeat = Math.max(0, Math.min(24, Number(formData.get("repeat_months") ?? 0) || 0));

  if (!studentId) return { error: "Escolha o aluno." };
  if (!title) return { error: "Informe o título." };
  if (amount === null) return { error: "Informe um valor válido." };
  if (!(await validStudent(supabase, orgId, studentId))) return { error: "Aluno inválido." };

  const rows = [];
  for (let i = 0; i <= repeat; i++) {
    rows.push({
      org_id: orgId,
      student_id: studentId,
      title,
      amount,
      due_date: dueDate ? addMonths(dueDate, i) : null,
      created_by: userId,
    });
  }
  const { error } = await supabase.from("charges").insert(rows);
  if (error) return { error: "Não foi possível criar a cobrança." };
  refresh();
  return { ok: true };
}

export async function updateCharge(_prev: ChargeState, formData: FormData): Promise<ChargeState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = parseAmount(formData.get("amount"));
  const dueRaw = String(formData.get("due_date") ?? "").trim();
  if (!id) return { error: "Cobrança inválida." };
  if (!title) return { error: "Informe o título." };
  if (amount === null) return { error: "Informe um valor válido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("charges")
    .update({ title, amount, due_date: dueRaw || null })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true };
}

export async function setChargeStatus(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["pending", "paid", "canceled"].includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("charges")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  refresh();
}

export async function removeCharge(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("charges").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
