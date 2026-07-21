import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { PagesForm, type PagesData } from "./_components/PagesForm";

/** Submódulo Páginas: conteúdo das seções + visibilidade. */
export default async function PaginasPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_site")
    .select(
      "hero_title, hero_subtitle, hero_cta_label, hero_cta_url, hero_image_url, about_title, about_body, show_about, show_events, show_booking, booking_cta_label, contact_email, contact_phone, contact_whatsapp, address, show_contact",
    )
    .eq("org_id", tenant.org.id)
    .maybeSingle();

  const d = (data ?? {}) as Partial<PagesData>;
  const site: PagesData = {
    hero_title: d.hero_title ?? null,
    hero_subtitle: d.hero_subtitle ?? null,
    hero_cta_label: d.hero_cta_label ?? null,
    hero_cta_url: d.hero_cta_url ?? null,
    hero_image_url: d.hero_image_url ?? null,
    about_title: d.about_title ?? null,
    about_body: d.about_body ?? null,
    show_about: d.show_about ?? true,
    show_events: d.show_events ?? false,
    show_booking: d.show_booking ?? false,
    booking_cta_label: d.booking_cta_label ?? null,
    contact_email: d.contact_email ?? null,
    contact_phone: d.contact_phone ?? null,
    contact_whatsapp: d.contact_whatsapp ?? null,
    address: d.address ?? null,
    show_contact: d.show_contact ?? true,
  };

  return <PagesForm site={site} />;
}
