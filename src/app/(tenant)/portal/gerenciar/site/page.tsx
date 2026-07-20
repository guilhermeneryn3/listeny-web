import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteEditor, type Site, type Offering } from "./_components/SiteEditor";
import { DomainManager, type Domain } from "./_components/DomainManager";

const EMPTY_SITE: Site = {
  published: false,
  hero_title: null, hero_subtitle: null, hero_cta_label: null, hero_cta_url: null, hero_image_url: null,
  about_title: null, about_body: null,
  contact_email: null, contact_phone: null, contact_whatsapp: null, address: null,
  instagram: null, youtube: null, tiktok: null, facebook: null,
};

const APP_DOMAIN = process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app";

/** Editor do site público do tenant (+ domínio próprio, só dono). */
export default async function SitePage() {
  const { tenant, role } = await requireManager();
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

  let domains: Domain[] = [];
  if (role === "owner") {
    const { data } = await createAdminClient()
      .from("org_domains")
      .select("id, hostname, is_primary, status, ssl_status")
      .eq("org_id", orgId)
      .order("created_at");
    domains = (data ?? []) as Domain[];
  }

  return (
    <div className="space-y-4">
      <SiteEditor
        site={(site as Site | null) ?? EMPTY_SITE}
        offerings={(offs ?? []) as Offering[]}
      />
      {role === "owner" && (
        <DomainManager domains={domains} slug={tenant.org.slug} appDomain={APP_DOMAIN} />
      )}
    </div>
  );
}
