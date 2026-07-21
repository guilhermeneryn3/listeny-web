"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/roles";

/** Liga/desliga um módulo do org (só admin). Aparece/some da nav e gateia a rota. */
export async function setOrgModule(formData: FormData): Promise<void> {
  const { tenant, role } = await requireManager();
  if (!isAdmin(role)) return;
  const key = String(formData.get("key") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!key) return;

  const supabase = await createClient();
  await supabase
    .from("org_modules")
    .upsert({ org_id: tenant.org.id, module_key: key, enabled }, { onConflict: "org_id,module_key" });
  revalidatePath("/gerenciar/ajustes");
  revalidatePath("/gerenciar", "layout");
}
