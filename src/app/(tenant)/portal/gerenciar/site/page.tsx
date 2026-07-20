import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { SiteEditor, type Site, type Offering } from "./_components/SiteEditor";

const EMPTY_SITE: Site = {
  published: false,
  hero_title: null, hero_subtitle: null, hero_cta_label: null, hero_cta_url: null, hero_image_url: null,
  about_title: null, about_body: null,
  contact_email: null, contact_phone: null, contact_whatsapp: null, address: null,
  instagram: null, youtube: null, tiktok: null, facebook: null,
};

/** Editor do site público do tenant. */
export default async function SitePage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const orgId = tenant.org.id;

  const [{ data: site }, { data: offs }] = await Promise.all([
    supabase
      .from("org_site")
      .select("published, hero_title, hero_subtitle, hero_cta_label, hero_cta_url, hero_image_url, about_title, about_body, contact_email, contact_phone, contact_whatsapp, address, instagram, youtube, tiktok, facebook")
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("site_offerings")
      .select("id, title, description, price, duration_min, cta_label, cta_url")
      .eq("org_id", orgId)
      .order("position")
      .order("created_at"),
  ]);

  return (
    <SiteEditor
      site={(site as Site | null) ?? EMPTY_SITE}
      offerings={(offs ?? []) as Offering[]}
    />
  );
}
