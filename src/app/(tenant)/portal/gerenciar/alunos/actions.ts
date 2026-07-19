"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";

export type StudentState = { ok?: boolean; error?: string };

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function refresh() {
  revalidatePath("/gerenciar/alunos");
  revalidatePath("/gerenciar");
}

/** Cria um aluno no roster do professor (org derivado do gate, nunca do form). */
export async function createStudent(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const { tenant } = await requireTeacher();
  const { name, email, phone, notes } = readFields(formData);
  if (!name) return { error: "Informe o nome do aluno." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .insert({ org_id: tenant.org.id, name, email, phone, notes });
  if (error) {
    if (error.code === "23505") return { error: "Já existe um aluno com esse e-mail." };
    return { error: "Não foi possível salvar o aluno." };
  }
  refresh();
  return { ok: true };
}

/** Edita dados de um aluno do próprio org. */
export async function updateStudent(
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const { tenant } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const { name, email, phone, notes } = readFields(formData);
  if (!id) return { error: "Aluno inválido." };
  if (!name) return { error: "Informe o nome do aluno." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ name, email, phone, notes })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  if (error) {
    if (error.code === "23505") return { error: "Já existe um aluno com esse e-mail." };
    return { error: "Não foi possível salvar as alterações." };
  }
  refresh();
  return { ok: true };
}

/** Ativa/inativa um aluno (soft — preserva histórico). */
export async function setStudentStatus(formData: FormData): Promise<void> {
  const { tenant } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "active" && status !== "inactive")) return;

  const supabase = await createClient();
  await supabase
    .from("students")
    .update({ status })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  refresh();
}

/** Remove um aluno em definitivo (usado com confirmação na UI). */
export async function removeStudent(formData: FormData): Promise<void> {
  const { tenant } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("students").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
