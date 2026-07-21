import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listManagerOrgs } from "@/lib/teacher";

/**
 * Entrada do console. Sem sessão → login. Sem portal → criar. 1 portal → abre direto (sem
 * seletor). 2+ → tela "Seus portais". Abrir passa por `/painel/abrir` (fixa o cookie).
 */
export default async function PainelEntry() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/painel");

  const orgs = await listManagerOrgs(user.id);
  if (orgs.length === 0) redirect("/criar");
  if (orgs.length === 1) redirect(`/painel/abrir?portal=${encodeURIComponent(orgs[0].slug)}`);
  redirect("/painel/portais");
}
