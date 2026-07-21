"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { darken } from "@/lib/theme";

export type SiteState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/painel/site", "layout");
  revalidatePath("/"); // o site público
}

const str = (fd: FormData, k: string): string | null => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};
const bool = (fd: FormData, k: string): boolean => String(fd.get(k) ?? "") === "on";
function num(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function orgId() {
  const { tenant } = await requireManager();
  return tenant.org.id;
}

/** Páginas: conteúdo das seções (hero/sobre/contato) + visibilidade + eventos/agendar. */
export async function savePages(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("org_site").upsert(
    {
      org_id: await orgId(),
      hero_title: str(fd, "hero_title"),
      hero_subtitle: str(fd, "hero_subtitle"),
      hero_cta_label: str(fd, "hero_cta_label"),
      hero_cta_url: str(fd, "hero_cta_url"),
      hero_image_url: str(fd, "hero_image_url"),
      about_title: str(fd, "about_title"),
      about_body: str(fd, "about_body"),
      show_about: bool(fd, "show_about"),
      show_events: bool(fd, "show_events"),
      show_booking: bool(fd, "show_booking"),
      booking_cta_label: str(fd, "booking_cta_label"),
      contact_email: str(fd, "contact_email"),
      contact_phone: str(fd, "contact_phone"),
      contact_whatsapp: str(fd, "contact_whatsapp"),
      address: str(fd, "address"),
      show_contact: bool(fd, "show_contact"),
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: "Não foi possível salvar as páginas." };
  refresh();
  return { ok: true };
}

/** Redes sociais. */
export async function saveSocials(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const supabase = await createClient();
  const { error } = await supabase.from("org_site").upsert(
    {
      org_id: await orgId(),
      instagram: str(fd, "instagram"),
      youtube: str(fd, "youtube"),
      tiktok: str(fd, "tiktok"),
      facebook: str(fd, "facebook"),
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: "Não foi possível salvar as redes." };
  refresh();
  return { ok: true };
}

/** Aparência: template + logo + cor primária (override em org_branding.palette). */
export async function saveAppearance(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const supabase = await createClient();
  const themeTemplateId = str(fd, "theme_template_id");
  const primary = str(fd, "primary");
  const { error } = await supabase.from("org_branding").upsert(
    {
      org_id: await orgId(),
      ...(themeTemplateId ? { theme_template_id: themeTemplateId } : {}),
      logo_url: str(fd, "logo_url"),
      palette: primary ? { primary, primaryDark: darken(primary, 0.85) } : null,
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: "Não foi possível salvar a aparência." };
  refresh();
  return { ok: true };
}

/** Ofertas: visibilidade da vitrine no site. */
export async function saveOfferingsSettings(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_site")
    .upsert({ org_id: await orgId(), show_offerings: bool(fd, "show_offerings") }, { onConflict: "org_id" });
  if (error) return { error: "Não foi possível salvar." };
  refresh();
  return { ok: true };
}

/** Publicação: deixa o site visível ao público (ou "em construção"). */
export async function setPublished(fd: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("org_site")
    .upsert({ org_id: await orgId(), published: bool(fd, "published") }, { onConflict: "org_id" });
  refresh();
}

// ── Ofertas (CRUD) ───────────────────────────────────────────────────────────
function offeringFields(fd: FormData) {
  return {
    title: String(fd.get("title") ?? "").trim(),
    description: str(fd, "description"),
    price: num(fd, "price"),
    duration_min: (() => {
      const n = num(fd, "duration_min");
      return n === null ? null : Math.round(n);
    })(),
    cta_label: str(fd, "cta_label"),
    cta_url: str(fd, "cta_url"),
  };
}

export async function createOffering(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const f = offeringFields(fd);
  if (!f.title) return { error: "Informe o título da oferta." };
  const supabase = await createClient();
  const { error } = await supabase.from("site_offerings").insert({ org_id: await orgId(), ...f });
  if (error) return { error: "Não foi possível criar a oferta." };
  refresh();
  return { ok: true };
}

export async function updateOffering(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const id = String(fd.get("id") ?? "");
  const f = offeringFields(fd);
  if (!id) return { error: "Oferta inválida." };
  if (!f.title) return { error: "Informe o título da oferta." };
  const supabase = await createClient();
  const { error } = await supabase.from("site_offerings").update(f).eq("id", id).eq("org_id", await orgId());
  if (error) return { error: "Não foi possível salvar a oferta." };
  refresh();
  return { ok: true };
}

export async function removeOffering(fd: FormData): Promise<void> {
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("site_offerings").delete().eq("id", id).eq("org_id", await orgId());
  refresh();
}
