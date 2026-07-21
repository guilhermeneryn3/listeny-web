import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { SocialsForm, type Socials } from "./_components/SocialsForm";

/** Submódulo Redes sociais. */
export default async function RedesPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_site")
    .select("instagram, youtube, tiktok, facebook")
    .eq("org_id", tenant.org.id)
    .maybeSingle();
  const d = (data ?? {}) as Partial<Socials>;
  return (
    <SocialsForm
      socials={{
        instagram: d.instagram ?? null,
        youtube: d.youtube ?? null,
        tiktok: d.tiktok ?? null,
        facebook: d.facebook ?? null,
      }}
    />
  );
}
