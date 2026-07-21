"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/roles";

/**
 * Instala/remove um item da Loja (módulo add-on, exibir/ocultar incluído, ou profissão).
 * Só admin (dono/diretor). Guarda o estado em `org_modules` (enabled). Um único upsert cobre
 * todos os casos: enabled=true instalado/exibido, enabled=false removido/oculto.
 */
export async function installItem(formData: FormData): Promise<void> {
  const { tenant, role } = await requireManager();
  if (!isAdmin(role)) return;
  const key = String(formData.get("key") ?? "");
  const on = String(formData.get("on") ?? "") === "true";
  if (!key) return;

  const supabase = await createClient();
  await supabase
    .from("org_modules")
    .upsert({ org_id: tenant.org.id, module_key: key, enabled: on }, { onConflict: "org_id,module_key" });
  revalidatePath("/gerenciar/loja");
  revalidatePath("/gerenciar", "layout");
}
