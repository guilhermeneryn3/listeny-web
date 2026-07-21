import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TOKENS } from "@/lib/theme";
import { AppearanceForm, type Template } from "./_components/AppearanceForm";

/** Submódulo Aparência: tema (template), logo e cor principal (grava org_branding). */
export default async function AparenciaPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();

  const [{ data: branding }, { data: tpls }] = await Promise.all([
    supabase.from("org_branding").select("theme_template_id, logo_url, palette").eq("org_id", tenant.org.id).maybeSingle(),
    supabase.from("theme_templates").select("id, key, name").eq("is_public", true).order("created_at"),
  ]);

  const b = branding as { theme_template_id: string | null; logo_url: string | null; palette: { primary?: string } | null } | null;
  const templates = (tpls ?? []) as Template[];

  return (
    <AppearanceForm
      templates={templates}
      themeTemplateId={b?.theme_template_id ?? templates[0]?.id ?? ""}
      logoUrl={b?.logo_url ?? ""}
      primary={b?.palette?.primary ?? tenant.tokens.primary ?? DEFAULT_TOKENS.primary}
    />
  );
}
