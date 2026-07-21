"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LessonState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/painel/aulas");
  revalidatePath("/painel/inicio");
}

type Fields = {
  title: string;
  type: "lesson" | "homework" | "goal";
  description: string | null;
  dueDate: string | null;
  classId: string | null;
  studentIds: string[];
  media: { url: string; name: string | null }[];
};

async function readFields(
  supabase: SupabaseClient,
  orgId: string,
  formData: FormData,
): Promise<Fields | { error: string }> {
  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "lesson");
  const type = (["lesson", "homework", "goal"].includes(typeRaw) ? typeRaw : "lesson") as Fields["type"];
  if (!title) return { error: "Informe o título." };

  const dueRaw = String(formData.get("due_date") ?? "").trim();
  const dueDate = dueRaw || null;

  let classId = String(formData.get("class_id") ?? "").trim() || null;
  if (classId) {
    const { data: cls } = await supabase.from("classes").select("id").eq("id", classId).eq("org_id", orgId).maybeSingle();
    if (!cls) classId = null;
  }

  // valida alunos do org
  const ids = formData.getAll("student_ids").map(String);
  let studentIds: string[] = [];
  if (ids.length > 0) {
    const { data } = await supabase.from("students").select("id").eq("org_id", orgId).in("id", ids);
    studentIds = (data ?? []).map((s) => s.id as string);
  }

  // mídia (links): arrays paralelas url/name
  const urls = formData.getAll("media_url").map((v) => String(v).trim());
  const names = formData.getAll("media_name").map((v) => String(v).trim());
  const media = urls
    .map((url, i) => ({ url, name: names[i] || null }))
    .filter((m) => m.url.length > 0);

  return { title, type, description: String(formData.get("description") ?? "").trim() || null, dueDate, classId, studentIds, media };
}

export async function createLesson(_prev: LessonState, formData: FormData): Promise<LessonState> {
  const { tenant, userId } = await requireManager();
  const supabase = await createClient();
  const orgId = tenant.org.id;
  const f = await readFields(supabase, orgId, formData);
  if ("error" in f) return { error: f.error };

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({ org_id: orgId, title: f.title, type: f.type, description: f.description, due_date: f.dueDate, class_id: f.classId, created_by: userId })
    .select("id")
    .single();
  if (error || !lesson) return { error: "Não foi possível criar a aula." };

  if (f.studentIds.length > 0) {
    await supabase.from("lesson_assignments").insert(f.studentIds.map((sid) => ({ lesson_id: lesson.id, student_id: sid })));
  }
  if (f.media.length > 0) {
    await supabase.from("lesson_media").insert(f.media.map((m) => ({ lesson_id: lesson.id, url: m.url, name: m.name })));
  }
  refresh();
  return { ok: true };
}

export async function updateLesson(_prev: LessonState, formData: FormData): Promise<LessonState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Aula inválida." };
  const supabase = await createClient();
  const orgId = tenant.org.id;
  const f = await readFields(supabase, orgId, formData);
  if ("error" in f) return { error: f.error };

  const { error } = await supabase
    .from("lessons")
    .update({ title: f.title, type: f.type, description: f.description, due_date: f.dueDate, class_id: f.classId })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) return { error: "Não foi possível salvar a aula." };

  // reconcilia atribuições PRESERVANDO o status de quem continua (não recria tudo)
  const { data: cur } = await supabase.from("lesson_assignments").select("student_id").eq("lesson_id", id);
  const current = new Set((cur ?? []).map((r) => r.student_id as string));
  const next = new Set(f.studentIds);
  const toAdd = [...next].filter((s) => !current.has(s));
  const toRemove = [...current].filter((s) => !next.has(s));
  if (toAdd.length > 0) await supabase.from("lesson_assignments").insert(toAdd.map((sid) => ({ lesson_id: id, student_id: sid })));
  if (toRemove.length > 0) await supabase.from("lesson_assignments").delete().eq("lesson_id", id).in("student_id", toRemove);

  // mídia: substitui (sem estado por-aluno)
  await supabase.from("lesson_media").delete().eq("lesson_id", id);
  if (f.media.length > 0) await supabase.from("lesson_media").insert(f.media.map((m) => ({ lesson_id: id, url: m.url, name: m.name })));

  refresh();
  return { ok: true };
}

export async function removeLesson(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
