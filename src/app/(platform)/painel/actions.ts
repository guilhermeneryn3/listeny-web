"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PORTAL_COOKIE } from "@/lib/urls";

/**
 * Exclui um portal (org) — IRREVERSÍVEL. Só o DONO pode, e precisa digitar o nome exato do
 * portal como confirmação. Apaga o org (as FKs fazem cascata; `tenant_sales` é inerte). Se o
 * portal excluído era o selecionado, limpa o cookie.
 */
export async function deletePortal(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/painel");

  const slug = String(formData.get("slug") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (!slug) redirect("/painel/portais");

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("orgs")
    .select("id, name, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  // Só o dono exclui; a confirmação tem que bater com o nome exato.
  if (!org || org.owner_id !== user.id || confirm !== org.name.trim()) redirect("/painel/portais");

  await admin.from("orgs").delete().eq("id", org.id);

  const jar = await cookies();
  if (jar.get(PORTAL_COOKIE)?.value === slug) jar.delete(PORTAL_COOKIE);

  revalidatePath("/painel/portais");
  redirect("/painel/portais");
}
