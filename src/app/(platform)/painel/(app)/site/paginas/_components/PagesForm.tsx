"use client";

import { useActionState } from "react";
import { savePages, type SiteState } from "../../actions";
import { Section, Toggle, SaveBar, field, labelCls } from "../../_components/ui";

export type PagesData = {
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  hero_image_url: string | null;
  about_title: string | null;
  about_body: string | null;
  show_about: boolean;
  show_events: boolean;
  show_booking: boolean;
  booking_cta_label: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  address: string | null;
  show_contact: boolean;
};

export function PagesForm({ site }: { site: PagesData }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(savePages, {});

  return (
    <form action={action} className="space-y-4">
      <Section title="Destaque (topo)">
        <div><label className={labelCls}>Título</label><input name="hero_title" defaultValue={site.hero_title ?? ""} placeholder="Aulas de violão para todos os níveis" className={field} /></div>
        <div><label className={labelCls}>Subtítulo</label><input name="hero_subtitle" defaultValue={site.hero_subtitle ?? ""} placeholder="Presencial e online, no seu ritmo" className={field} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>Botão — texto</label><input name="hero_cta_label" defaultValue={site.hero_cta_label ?? ""} placeholder="Fale comigo" className={field} /></div>
          <div><label className={labelCls}>Botão — link</label><input name="hero_cta_url" defaultValue={site.hero_cta_url ?? ""} placeholder="https://wa.me/…" className={field} /></div>
        </div>
        <div><label className={labelCls}>Imagem de fundo (URL) — opcional</label><input name="hero_image_url" type="url" defaultValue={site.hero_image_url ?? ""} placeholder="https://…" className={field} /></div>
      </Section>

      <Section title="Sobre">
        <Toggle name="show_about" defaultChecked={site.show_about} label="Mostrar a seção Sobre no site" />
        <div><label className={labelCls}>Título</label><input name="about_title" defaultValue={site.about_title ?? ""} placeholder="Quem sou eu" className={field} /></div>
        <div><label className={labelCls}>Texto</label><textarea name="about_body" defaultValue={site.about_body ?? ""} rows={5} placeholder="Conte sua experiência, método, diferenciais…" className={field} /></div>
      </Section>

      <Section title="Eventos" desc="Lista os próximos eventos públicos do seu portal, com link para o calendário.">
        <Toggle name="show_events" defaultChecked={site.show_events} label="Mostrar a seção Eventos no site" />
      </Section>

      <Section title="Agendar" desc="Um botão que leva o visitante à área do aluno para reservar um horário.">
        <Toggle name="show_booking" defaultChecked={site.show_booking} label="Mostrar o botão Agendar no site" />
        <div><label className={labelCls}>Texto do botão</label><input name="booking_cta_label" defaultValue={site.booking_cta_label ?? ""} placeholder="Agendar" className={field} /></div>
      </Section>

      <Section title="Contato">
        <Toggle name="show_contact" defaultChecked={site.show_contact} label="Mostrar a seção Contato no site" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>E-mail</label><input name="contact_email" type="email" defaultValue={site.contact_email ?? ""} className={field} /></div>
          <div><label className={labelCls}>Telefone</label><input name="contact_phone" defaultValue={site.contact_phone ?? ""} className={field} /></div>
          <div><label className={labelCls}>WhatsApp</label><input name="contact_whatsapp" defaultValue={site.contact_whatsapp ?? ""} placeholder="5511999999999" className={field} /></div>
          <div><label className={labelCls}>Endereço</label><input name="address" defaultValue={site.address ?? ""} className={field} /></div>
        </div>
      </Section>

      <SaveBar ok={state.ok} error={state.error} pending={pending} />
    </form>
  );
}
