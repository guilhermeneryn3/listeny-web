import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { OfferingsManager, type Offering } from "./_components/OfferingsManager";

/** Submódulo Ofertas: vitrine de serviços/preços + visibilidade no site. */
export default async function OfertasPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();

  const [{ data: siteRow }, { data: offs }] = await Promise.all([
    supabase.from("org_site").select("show_offerings").eq("org_id", tenant.org.id).maybeSingle(),
    supabase
      .from("site_offerings")
      .select("id, title, description, price, duration_min, cta_label, cta_url")
      .eq("org_id", tenant.org.id)
      .order("position")
      .order("created_at"),
  ]);

  const showOfferings = (siteRow as { show_offerings?: boolean } | null)?.show_offerings ?? true;
  return <OfferingsManager offerings={(offs ?? []) as Offering[]} showOfferings={showOfferings} />;
}
