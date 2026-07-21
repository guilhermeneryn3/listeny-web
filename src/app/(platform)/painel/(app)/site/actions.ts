"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";

export type SiteState = { ok?: boolean; error?: string };

function refresh() {
  revalidatePath("/painel/site");
  revalidatePath("/"); // o site público
}

const str = (fd: FormData, k: string): string | null => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};
function num(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Salva o conteúdo do site (upsert) + publica/despublica. */
export async function saveSite(_prev: SiteState, formData: FormData): Promise<SiteState> {
  const { tenant } = await requireManager();
  const supabase = await createClient();

  const { error } = await supabase.from("org_site").upsert(
    {
      org_id: tenant.org.id,
      published: String(formData.get("published") ?? "") === "on",
      hero_title: str(formData, "hero_title"),
      hero_subtitle: str(formData, "hero_subtitle"),
      hero_cta_label: str(formData, "hero_cta_label"),
      hero_cta_url: str(formData, "hero_cta_url"),
      hero_image_url: str(formData, "hero_image_url"),
      about_title: str(formData, "about_title"),
      about_body: str(formData, "about_body"),
      contact_email: str(formData, "contact_email"),
      contact_phone: str(formData, "contact_phone"),
      contact_whatsapp: str(formData, "contact_whatsapp"),
      address: str(formData, "address"),
      instagram: str(formData, "instagram"),
      youtube: str(formData, "youtube"),
      tiktok: str(formData, "tiktok"),
      facebook: str(formData, "facebook"),
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: "Não foi possível salvar o site." };
  refresh();
  return { ok: true };
}

function offeringFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: str(formData, "description"),
    price: num(formData, "price"),
    duration_min: (() => {
      const n = num(formData, "duration_min");
      return n === null ? null : Math.round(n);
    })(),
    cta_label: str(formData, "cta_label"),
    cta_url: str(formData, "cta_url"),
  };
}

export async function createOffering(_prev: SiteState, formData: FormData): Promise<SiteState> {
  const { tenant } = await requireManager();
  const f = offeringFields(formData);
  if (!f.title) return { error: "Informe o título da oferta." };

  const supabase = await createClient();
  const { error } = await supabase.from("site_offerings").insert({ org_id: tenant.org.id, ...f });
  if (error) return { error: "Não foi possível criar a oferta." };
  refresh();
  return { ok: true };
}

export async function updateOffering(_prev: SiteState, formData: FormData): Promise<SiteState> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  const f = offeringFields(formData);
  if (!id) return { error: "Oferta inválida." };
  if (!f.title) return { error: "Informe o título da oferta." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_offerings").update(f).eq("id", id).eq("org_id", tenant.org.id);
  if (error) return { error: "Não foi possível salvar a oferta." };
  refresh();
  return { ok: true };
}

export async function removeOffering(formData: FormData): Promise<void> {
  const { tenant } = await requireManager();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("site_offerings").delete().eq("id", id).eq("org_id", tenant.org.id);
  refresh();
}
