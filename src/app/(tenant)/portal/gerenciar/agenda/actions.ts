"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/gerenciar/agenda");
  revalidatePath("/gerenciar");
}

type Fields = {
  title: string;
  kind: "in_person" | "online";
  startsAt: string; // ISO (UTC) vindo do cliente
  durationMin: number;
  location: string | null;
  meetingUrl: string | null;
  recordingUrl: string | null;
  classId: string | null;
  notes: string | null;
};

function readFields(formData: FormData): Fields | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "in_person");
  const kind = kindRaw === "online" ? "online" : "in_person";
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const durationMin = Number(formData.get("duration_min") ?? 60);
  if (!title) return { error: "Informe o título da sessão." };
  if (!startsAt || Number.isNaN(Date.parse(startsAt))) return { error: "Informe a data e a hora." };
  if (!Number.isFinite(durationMin) || durationMin <= 0) return { error: "Duração inválida." };
  return {
    title,
    kind,
    startsAt: new Date(startsAt).toISOString(),
    durationMin: Math.round(durationMin),
    location: String(formData.get("location") ?? "").trim() || null,
    meetingUrl: String(formData.get("meeting_url") ?? "").trim() || null,
    recordingUrl: String(formData.get("recording_url") ?? "").trim() || null,
    classId: String(formData.get("class_id") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

/** Filtra os student_ids do form para os que realmente são do org (segurança). */
async function validStudentIds(
  supabase: SupabaseClient,
  orgId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("org_id", orgId)
    .in("id", ids);
  return (data ?? []).map((s) => s.id as string);
}

export async function createSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const { tenant } = await requireManager();
  const f = readFields(formData);
  if ("error" in f) return { error: f.error };

  const supabase = await createClient();
  const orgId = tenant.org.id;

  // class_id (se veio) tem que ser do org
  let classId = f.classId;
  if (classId) {
    const { data: cls } = await supabase
      .from("classes").select("id").eq("id", classId).eq("org_id", orgId).maybeSingle();
    if (!cls) classId = null;
  }
  const studentIds = await validStudentIds(
    supabase,
    orgId,
    formData.getAll("student_ids").map(String),
  );

  const repeatWeeks = Math.max(0, Math.min(52, Number(formData.get("repeat_weeks") ?? 0) || 0));
  const base = new Date(f.startsAt).getTime();

  for (let i = 0; i <= repeatWeeks; i++) {
    const startsAt = new Date(base + i * 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: sess, error } = await supabase
      .from("sessions")
      .insert({
        org_id: orgId,
        title: f.title,
        kind: f.kind,
        starts_at: startsAt,
        duration_min: f.durationMin,
        location: f.location,
        meeting_url: f.meetingUrl,
        recording_url: f.recordingUrl,
        class_id: classId,
        notes: f.notes,
      })
      .select("id")
      .single();
    if (error || !sess) return { error: "Não foi possível criar a sessão." };
    if (studentIds.length > 0) {
      await supabase
        .from("session_students")
        .insert(studentIds.map((sid) => ({ session_id: sess.id, student_id: sid })));
    }
  }

  refresh();
  return { ok: true };
}

export async function updateSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const f = readFields(formData);
  if (!id) return { error: "Sessão inválida." };
  if ("error" in f) return { error: f.error };

  const supabase = await createClient();
  const orgId = tenant.org.id;

  let classId = f.classId;
  if (classId) {
    const { data: cls } = await supabase
      .from("classes").select("id").eq("id", classId).eq("org_id", orgId).maybeSingle();
    if (!cls) classId = null;
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      title: f.title,
      kind: f.kind,
      starts_at: f.startsAt,
      duration_min: f.durationMin,
      location: f.location,
      meeting_url: f.meetingUrl,
      recording_url: f.recordingUrl,
      class_id: classId,
      notes: f.notes,
    })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) return { error: "Não foi possível salvar a sessão." };

  // reconcilia participantes
  const studentIds = await validStudentIds(
    supabase,
    orgId,
    formData.getAll("student_ids").map(String),
  );
  await supabase.from("session_students").delete().eq("session_id", id);
  if (studentIds.length > 0) {
    await supabase
      .from("session_students")
      .insert(studentIds.map((sid) => ({ session_id: id, student_id: sid })));
  }

  refresh();
  return { ok: true };
}

export async function setSessionStatus(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["scheduled", "done", "canceled", "no_show"].includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("sessions").update({ status }).eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}

export async function setAttendance(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const sessionId = String(formData.get("session_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const attendance = String(formData.get("attendance") ?? "");
  if (!sessionId || !studentId || !["pending", "present", "absent"].includes(attendance)) return;

  const supabase = await createClient();
  // confirma que a sessão é do org do professor
  const { data: sess } = await supabase
    .from("sessions").select("id").eq("id", sessionId).eq("org_id", tenant.org.id).maybeSingle();
  if (!sess) return;
  await supabase
    .from("session_students")
    .update({ attendance })
    .eq("session_id", sessionId)
    .eq("student_id", studentId);
  refresh();
}

export async function removeSession(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("sessions").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
