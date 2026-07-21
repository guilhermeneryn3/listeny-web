"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";

export type EventState = { ok?: boolean; error?: string };

const TYPES = ["excursao", "reuniao", "evento", "feriado", "aviso"];

function refresh() {
  revalidatePath("/painel/eventos");
  revalidatePath("/calendario");
}

function readFields(formData: FormData) {
  const typeRaw = String(formData.get("type") ?? "evento");
  const visRaw = String(formData.get("visibility") ?? "public");
  return {
    title: String(formData.get("title") ?? "").trim(),
    type: TYPES.includes(typeRaw) ? typeRaw : "evento",
    event_date: String(formData.get("event_date") ?? "").trim(),
    start_time: String(formData.get("start_time") ?? "").trim() || null,
    end_date: String(formData.get("end_date") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    visibility: visRaw === "internal" ? "internal" : "public",
  };
}

export async function createEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const { tenant, userId } = await requireManager();
  const f = readFields(formData);
  if (!f.title) return { error: "Informe o título." };
  if (!f.event_date) return { error: "Informe a data." };

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({ org_id: tenant.org.id, created_by: userId, ...f });
  if (error) return { error: "Não foi possível criar o evento." };
  refresh();
  return { ok: true };
}

export async function updateEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const f = readFields(formData);
  if (!id) return { error: "Evento inválido." };
  if (!f.title) return { error: "Informe o título." };
  if (!f.event_date) return { error: "Informe a data." };

  const supabase = await createClient();
  const { error } = await supabase.from("events").update(f).eq("id", id).eq("org_id", tenant.org.id);
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true };
}

export async function removeEvent(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
