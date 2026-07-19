"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateOrgState = {
  error?: string;
  /** Slug do portal recém-criado (mostra o link de sucesso). */
  createdSlug?: string;
};

const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Onboarding do criador: cria o org (tenant) do usuário logado.
 *   (a) exige sessão (senão → /login);
 *   (b) insere `orgs` (owner_id = uid da sessão);
 *   (c) insere a `memberships` do dono (role 'teacher');
 *   (d) insere `org_branding` (template escolhido + logo opcional).
 * Usa o client com sessão do usuário — a RLS garante que ele só cria o próprio org.
 */
export async function createOrg(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/criar");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const themeTemplateId = String(formData.get("theme_template_id") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();

  if (!name) return { error: "Informe o nome do portal." };
  if (!slug) return { error: "Informe o endereço (slug) do portal." };
  if (!SLUG_RE.test(slug)) {
    return {
      error: "Endereço inválido: use apenas letras minúsculas, números e hífen.",
    };
  }
  if (!themeTemplateId) return { error: "Escolha um tema para o portal." };

  // (b) org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .insert({ owner_id: user.id, name, slug })
    .select("id, slug")
    .single();
  if (orgErr || !org) {
    if (orgErr?.code === "23505") {
      return { error: "Esse endereço (slug) já está em uso. Escolha outro." };
    }
    return { error: "Não foi possível criar o portal. Tente novamente." };
  }

  // (c) membership do dono
  const { error: memErr } = await supabase
    .from("memberships")
    .insert({ org_id: org.id, user_id: user.id, role: "teacher" });
  if (memErr) {
    // Desfaz o org órfão se o vínculo do dono falhar.
    await supabase.from("orgs").delete().eq("id", org.id);
    return { error: "Não foi possível concluir a criação do portal." };
  }

  // (d) branding
  const { error: brandErr } = await supabase.from("org_branding").insert({
    org_id: org.id,
    theme_template_id: themeTemplateId,
    logo_url: logoUrl || null,
  });
  if (brandErr) {
    return { error: "Portal criado, mas houve um erro ao aplicar o tema." };
  }

  revalidatePath("/criar");
  return { createdSlug: org.slug };
}
