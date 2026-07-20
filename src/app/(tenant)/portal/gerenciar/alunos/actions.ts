"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planLimits, withinLimit } from "@/lib/plans";

export type StudentState = { ok?: boolean; error?: string };

export type GrantState = {
  error?: string;
  tempPassword?: string; // conta nova: senha p/ repassar ao aluno
  linked?: boolean; // vinculado a conta já existente
};

function tempPassword(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(10), (b) => abc[b % abc.length]).join("");
}

/**
 * Dá acesso ao aluno: resolve a conta pelo E-MAIL (chave global da identidade).
 * Conta existe → só vincula (mesma pessoa, mais um contexto). Não existe → cria com senha
 * temporária (troca no 1º login). Sempre cria/garante o membership(student) + students.user_id.
 * Escrita via service-role, após validar o gestor.
 */
export async function grantStudentAccess(
  _prev: GrantState,
  formData: FormData,
): Promise<GrantState> {
  const { tenant } = await requireManager();
  const orgId = tenant.org.id;
  const studentId = String(formData.get("student_id") ?? "");
  if (!studentId) return { error: "Aluno inválido." };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, email, user_id")
    .eq("id", studentId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!student) return { error: "Aluno não encontrado." };
  if (student.user_id) return { error: "Este aluno já tem acesso." };
  const email = (student.email ?? "").trim().toLowerCase();
  if (!email) return { error: "Cadastre um e-mail no aluno antes de dar acesso." };

  const admin = createAdminClient();

  // 1) já existe conta com esse e-mail?
  const { data: prof } = await admin.from("profiles").select("user_id").eq("email", email).maybeSingle();

  let userId: string;
  let tmp: string | undefined;
  if (prof?.user_id) {
    userId = prof.user_id as string;
  } else {
    tmp = tempPassword();
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: tmp,
      email_confirm: true,
    });
    if (cErr || !created.user) return { error: "Não foi possível criar o acesso. Tente novamente." };
    userId = created.user.id;
    await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);
  }

  // 2) vincula o roster + garante o contexto (membership student)
  await admin.from("students").update({ user_id: userId }).eq("id", studentId).eq("org_id", orgId);
  await admin
    .from("memberships")
    .upsert({ org_id: orgId, user_id: userId, role: "student" }, { onConflict: "org_id,user_id" });

  // NÃO revalida aqui de propósito: revalidar recarregaria a linha e sumiria com o resultado
  // (a senha) antes de o professor copiar. O badge "com acesso" atualiza no próximo load.
  return tmp ? { tempPassword: tmp } : { linked: true };
}

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
  const { tenant } = await requireManager();
  const { name, email, phone, notes } = readFields(formData);
  if (!name) return { error: "Informe o nome do aluno." };

  const supabase = await createClient();

  // teto de alunos por plano
  const [{ data: org }, { count }] = await Promise.all([
    supabase.from("orgs").select("plan").eq("id", tenant.org.id).maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("org_id", tenant.org.id),
  ]);
  const limit = planLimits((org as { plan?: string } | null)?.plan).maxStudents;
  if (!withinLimit(count ?? 0, limit)) {
    return { error: `Limite de alunos do plano atingido (${limit}). Faça upgrade para adicionar mais.` };
  }

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
  const { tenant } = await requireManager();
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
  const { tenant } = await requireManager();
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
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // pega o vínculo antes de apagar o registro do roster
  const { data: stu } = await supabase
    .from("students").select("user_id").eq("id", id).eq("org_id", tenant.org.id).maybeSingle();

  await supabase.from("students").delete().eq("id", id).eq("org_id", tenant.org.id);

  // remove também o acesso (membership student) deste aluno NESTE org — a conta pessoal dele
  // continua existindo (ele pode ser aluno de outros); só perde o vínculo com esta escola.
  const userId = (stu as { user_id?: string | null } | null)?.user_id;
  if (userId) {
    await createAdminClient()
      .from("memberships")
      .delete()
      .eq("org_id", tenant.org.id)
      .eq("user_id", userId)
      .eq("role", "student");
  }
  refresh();
}
