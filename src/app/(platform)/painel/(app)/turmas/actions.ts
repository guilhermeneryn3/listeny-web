"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";

export type ClassState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/painel/turmas");
  revalidatePath("/painel/inicio");
}

export async function createClass(
  _prev: ClassState,
  formData: FormData,
): Promise<ClassState> {
  const { tenant } = await requireManager();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return { error: "Informe o nome da turma." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .insert({ org_id: tenant.org.id, name, description });
  if (error) return { error: "Não foi possível criar a turma." };
  refresh();
  return { ok: true };
}

export async function updateClass(
  _prev: ClassState,
  formData: FormData,
): Promise<ClassState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id) return { error: "Turma inválida." };
  if (!name) return { error: "Informe o nome da turma." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ name, description })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  if (error) return { error: "Não foi possível salvar a turma." };
  refresh();
  return { ok: true };
}

export async function removeClass(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}

/** Vincula/desvincula um aluno a uma turma. Garante que ambos são do MESMO org do professor. */
export async function setClassStudent(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const classId = String(formData.get("class_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const on = String(formData.get("on") ?? "") === "true";
  if (!classId || !studentId) return;

  const supabase = await createClient();
  // Ambos precisam pertencer ao org do professor (a FK não amarra isso).
  const [{ data: cls }, { data: stu }] = await Promise.all([
    supabase.from("classes").select("id").eq("id", classId).eq("org_id", tenant.org.id).maybeSingle(),
    supabase.from("students").select("id").eq("id", studentId).eq("org_id", tenant.org.id).maybeSingle(),
  ]);
  if (!cls || !stu) return;

  if (on) {
    await supabase
      .from("class_students")
      .upsert({ class_id: classId, student_id: studentId }, { onConflict: "class_id,student_id" });
  } else {
    await supabase
      .from("class_students")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);
  }
  refresh();
}
