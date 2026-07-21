"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planLimits, withinLimit } from "@/lib/plans";
import { effectiveFields, isCoreField, studentField, type FieldConfig } from "@/lib/studentFields";

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

function refresh() {
  revalidatePath("/painel/alunos");
  revalidatePath("/painel/inicio");
}

/** Config efetiva dos campos do cadastro deste org (catálogo em lib/studentFields). */
async function loadFieldConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
): Promise<FieldConfig[]> {
  const { data } = await supabase.from("org_student_form").select("fields").eq("org_id", orgId).maybeSingle();
  return effectiveFields((data as { fields?: FieldConfig[] } | null)?.fields ?? null);
}

/** Lê os valores do form pela config: core → colunas, extras → profile (jsonb). Valida obrigatórios. */
function collectStudentFields(fd: FormData, config: FieldConfig[]): {
  core: Record<string, string | null>;
  profile: Record<string, string>;
  error?: string;
} {
  const core: Record<string, string | null> = {};
  const profile: Record<string, string> = {};
  for (const cfg of config) {
    const f = studentField(cfg.key);
    if (!f) continue;
    const raw = String(fd.get(cfg.key) ?? "").trim();
    const value = cfg.key === "email" ? raw.toLowerCase() : raw;
    if (cfg.required && !value) return { core, profile, error: `Preencha: ${f.label}.` };
    if (isCoreField(cfg.key)) core[cfg.key] = value || null;
    else if (value) profile[cfg.key] = value;
  }
  return { core, profile };
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

  await admin.from("students").update({ user_id: userId }).eq("id", studentId).eq("org_id", orgId);
  await admin
    .from("memberships")
    .upsert({ org_id: orgId, user_id: userId, role: "student" }, { onConflict: "org_id,user_id" });

  return tmp ? { tempPassword: tmp } : { linked: true };
}

/** Cria um aluno no roster do professor (campos pela config do org). */
export async function createStudent(_prev: StudentState, formData: FormData): Promise<StudentState> {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const config = await loadFieldConfig(supabase, tenant.org.id);
  const { core, profile, error } = collectStudentFields(formData, config);
  if (error) return { error };
  if (!core.name) return { error: "Informe o nome do aluno." };

  // teto de alunos por plano
  const [{ data: org }, { count }] = await Promise.all([
    supabase.from("orgs").select("plan").eq("id", tenant.org.id).maybeSingle(),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("org_id", tenant.org.id),
  ]);
  const limit = planLimits((org as { plan?: string } | null)?.plan).maxStudents;
  if (!withinLimit(count ?? 0, limit)) {
    return { error: `Limite de alunos do plano atingido (${limit}). Faça upgrade para adicionar mais.` };
  }

  const { error: e } = await supabase
    .from("students")
    .insert({ org_id: tenant.org.id, ...core, profile, status: "active" });
  if (e) {
    if (e.code === "23505") return { error: "Já existe um aluno com esse e-mail." };
    return { error: "Não foi possível salvar o aluno." };
  }
  refresh();
  return { ok: true };
}

/** Edita dados de um aluno do próprio org (campos pela config). */
export async function updateStudent(_prev: StudentState, formData: FormData): Promise<StudentState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Aluno inválido." };

  const supabase = await createClient();
  const config = await loadFieldConfig(supabase, tenant.org.id);
  const { core, profile, error } = collectStudentFields(formData, config);
  if (error) return { error };
  if (!core.name) return { error: "Informe o nome do aluno." };

  const { error: e } = await supabase
    .from("students")
    .update({ ...core, profile })
    .eq("id", id)
    .eq("org_id", tenant.org.id);
  if (e) {
    if (e.code === "23505") return { error: "Já existe um aluno com esse e-mail." };
    return { error: "Não foi possível salvar as alterações." };
  }
  refresh();
  return { ok: true };
}

/** Salva a config do formulário de cadastro (campos + toggle do autocadastro). */
export async function saveStudentForm(_prev: StudentState, formData: FormData): Promise<StudentState> {
  const { tenant } = await requireManager();
  const enrollEnabled = String(formData.get("enroll_enabled") ?? "") === "on";
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("fields") ?? "[]"));
  } catch {
    return { error: "Configuração inválida." };
  }
  const list = Array.isArray(parsed)
    ? parsed.map((f) => ({ key: String((f as FieldConfig).key), required: !!(f as FieldConfig).required }))
    : [];
  const fields = effectiveFields(list);

  const supabase = await createClient();
  const { error } = await supabase
    .from("org_student_form")
    .upsert({ org_id: tenant.org.id, enroll_enabled: enrollEnabled, fields }, { onConflict: "org_id" });
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/painel/alunos/campos");
  revalidatePath("/painel/alunos");
  return { ok: true };
}

/** Ativa/inativa/aprova um aluno (soft — preserva histórico). Aprovar pendente = status active. */
export async function setStudentStatus(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "active" && status !== "inactive")) return;

  const supabase = await createClient();
  await supabase.from("students").update({ status }).eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}

/** Remove um aluno em definitivo (usado com confirmação na UI). */
export async function removeStudent(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: stu } = await supabase
    .from("students").select("user_id").eq("id", id).eq("org_id", tenant.org.id).maybeSingle();

  await supabase.from("students").delete().eq("id", id).eq("org_id", tenant.org.id);

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
