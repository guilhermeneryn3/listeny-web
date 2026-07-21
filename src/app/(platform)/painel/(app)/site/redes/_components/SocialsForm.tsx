"use client";

import { useActionState } from "react";
import { saveSocials, type SiteState } from "../../actions";
import { Section, SaveBar, field, labelCls } from "../../_components/ui";

export type Socials = {
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  facebook: string | null;
};

export function SocialsForm({ socials }: { socials: Socials }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveSocials, {});
  return (
    <form action={action} className="space-y-4">
      <Section title="Redes sociais" desc="Aparecem no rodapé do site.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>Instagram</label><input name="instagram" defaultValue={socials.instagram ?? ""} placeholder="@usuario ou URL" className={field} /></div>
          <div><label className={labelCls}>YouTube</label><input name="youtube" defaultValue={socials.youtube ?? ""} className={field} /></div>
          <div><label className={labelCls}>TikTok</label><input name="tiktok" defaultValue={socials.tiktok ?? ""} className={field} /></div>
          <div><label className={labelCls}>Facebook</label><input name="facebook" defaultValue={socials.facebook ?? ""} className={field} /></div>
        </div>
      </Section>
      <SaveBar ok={state.ok} error={state.error} pending={pending} />
    </form>
  );
}
