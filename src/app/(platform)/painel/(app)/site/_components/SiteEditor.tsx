"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveSite,
  createOffering,
  updateOffering,
  removeOffering,
  type SiteState,
} from "../actions";

export type Site = {
  published: boolean;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  hero_image_url: string | null;
  about_title: string | null;
  about_body: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  address: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  facebook: string | null;
};
export type Offering = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration_min: number | null;
  cta_label: string | null;
  cta_url: string | null;
};

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
const labelCls = "mb-1 block text-sm font-medium text-sub";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-hint">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function SiteForm({ site }: { site: Site }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveSite, {});

  return (
    <form action={action} className="space-y-4">
      <Section title="Destaque (topo)">
        <div><label className={labelCls}>Título</label><input name="hero_title" defaultValue={site.hero_title ?? ""} placeholder="Aulas de violão para todos os níveis" className={field} /></div>
        <div><label className={labelCls}>Subtítulo</label><input name="hero_subtitle" defaultValue={site.hero_subtitle ?? ""} placeholder="Presencial e online, no seu ritmo" className={field} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>Botão — texto</label><input name="hero_cta_label" defaultValue={site.hero_cta_label ?? ""} placeholder="Agende uma aula" className={field} /></div>
          <div><label className={labelCls}>Botão — link</label><input name="hero_cta_url" defaultValue={site.hero_cta_url ?? ""} placeholder="https://wa.me/…" className={field} /></div>
        </div>
        <div><label className={labelCls}>Imagem de fundo (URL) — opcional</label><input name="hero_image_url" type="url" defaultValue={site.hero_image_url ?? ""} placeholder="https://…" className={field} /></div>
      </Section>

      <Section title="Sobre">
        <div><label className={labelCls}>Título</label><input name="about_title" defaultValue={site.about_title ?? ""} placeholder="Quem sou eu" className={field} /></div>
        <div><label className={labelCls}>Texto</label><textarea name="about_body" defaultValue={site.about_body ?? ""} rows={5} placeholder="Conte sua experiência, método, diferenciais…" className={field} /></div>
      </Section>

      <Section title="Contato">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>E-mail</label><input name="contact_email" type="email" defaultValue={site.contact_email ?? ""} className={field} /></div>
          <div><label className={labelCls}>Telefone</label><input name="contact_phone" defaultValue={site.contact_phone ?? ""} className={field} /></div>
          <div><label className={labelCls}>WhatsApp</label><input name="contact_whatsapp" defaultValue={site.contact_whatsapp ?? ""} placeholder="5511999999999" className={field} /></div>
          <div><label className={labelCls}>Endereço</label><input name="address" defaultValue={site.address ?? ""} className={field} /></div>
        </div>
      </Section>

      <Section title="Redes sociais">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>Instagram</label><input name="instagram" defaultValue={site.instagram ?? ""} placeholder="@usuario ou URL" className={field} /></div>
          <div><label className={labelCls}>YouTube</label><input name="youtube" defaultValue={site.youtube ?? ""} className={field} /></div>
          <div><label className={labelCls}>TikTok</label><input name="tiktok" defaultValue={site.tiktok ?? ""} className={field} /></div>
          <div><label className={labelCls}>Facebook</label><input name="facebook" defaultValue={site.facebook ?? ""} className={field} /></div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="published" defaultChecked={site.published} />
          Publicar site (deixar visível ao público)
        </label>
        <div className="ml-auto flex items-center gap-3">
          {state.ok && <span className="text-sm text-success">Salvo!</span>}
          {state.error && <span className="text-sm text-danger">{state.error}</span>}
          <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function OfferingForm({ offering, onDone }: { offering?: Offering; onDone: () => void }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(
    offering ? updateOffering : createOffering,
    {},
  );
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className={`rounded-[var(--radius)] border bg-surface p-4 shadow-sm ${offering ? "border-primary" : "border-edge"}`}>
      {offering && <input type="hidden" name="id" value={offering.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" required placeholder="Título (ex.: Aula avulsa)" defaultValue={offering?.title ?? ""} className={`sm:col-span-2 ${field}`} />
        <input name="description" placeholder="Descrição" defaultValue={offering?.description ?? ""} className={`sm:col-span-2 ${field}`} />
        <input name="price" inputMode="decimal" placeholder="Preço (R$) — opcional" defaultValue={offering?.price ?? ""} className={field} />
        <input name="duration_min" type="number" min={0} placeholder="Duração (min) — opcional" defaultValue={offering?.duration_min ?? ""} className={field} />
        <input name="cta_label" placeholder="Botão — texto (ex.: Contratar)" defaultValue={offering?.cta_label ?? ""} className={field} />
        <input name="cta_url" placeholder="Botão — link" defaultValue={offering?.cta_url ?? ""} className={field} />
      </div>
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : offering ? "Salvar" : "Adicionar oferta"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function Offerings({ offerings }: { offerings: Offering[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-hint">Ofertas / serviços</h2>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Adicionar
          </button>
        )}
      </div>
      {adding && <div className="mb-3"><OfferingForm onDone={() => setAdding(false)} /></div>}
      {offerings.length === 0 && !adding ? (
        <p className="text-sm text-sub">Nenhuma oferta ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offerings.map((o) =>
            editingId === o.id ? (
              <li key={o.id}><OfferingForm offering={o} onDone={() => setEditingId(null)} /></li>
            ) : (
              <li key={o.id} className="flex items-center gap-3 rounded-lg border border-edge p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{o.title}</div>
                  <div className="truncate text-sm text-sub">
                    {o.price != null ? `R$ ${o.price.toFixed(2)}` : "—"}
                    {o.duration_min ? ` · ${o.duration_min}min` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => { setEditingId(o.id); setAdding(false); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
                <form action={removeOffering} onSubmit={(e) => { if (!window.confirm(`Remover "${o.title}"?`)) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
                </form>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

export function SiteEditor({ site, offerings }: { site: Site; offerings: Offering[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Site</h1>
        <a href="/" target="_blank" rel="noreferrer" className="rounded-[var(--radius)] border border-edge bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary">
          Ver site
        </a>
      </div>
      <SiteForm site={site} />
      <Offerings offerings={offerings} />
    </div>
  );
}
