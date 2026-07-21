import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { effectiveModules, type OrgModuleRow } from "@/lib/modules";

type SiteRow = {
  published: boolean;
  hero_title: string | null; hero_subtitle: string | null;
  hero_cta_label: string | null; hero_cta_url: string | null; hero_image_url: string | null;
  about_title: string | null; about_body: string | null;
  contact_email: string | null; contact_phone: string | null; contact_whatsapp: string | null;
  address: string | null;
  instagram: string | null; youtube: string | null; tiktok: string | null; facebook: string | null;
  show_about: boolean; show_offerings: boolean; show_events: boolean; show_booking: boolean; show_contact: boolean;
  booking_cta_label: string | null;
};
type OfferingRow = {
  id: string; title: string; description: string | null;
  price: number | null; currency: string; duration_min: number | null;
  cta_label: string | null; cta_url: string | null;
};
type EvRow = {
  id: string; title: string; type: string; event_date: string; start_time: string | null; location: string | null;
};

const EV_TYPE_LABEL: Record<string, string> = {
  excursao: "Excursão", reuniao: "Reunião", evento: "Evento", feriado: "Feriado", aviso: "Aviso",
};
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function money(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);
  } catch {
    return `R$ ${price.toFixed(2)}`;
  }
}
function socialHref(kind: string, v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  const h = v.replace(/^@/, "");
  const base: Record<string, string> = {
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/",
    tiktok: "https://tiktok.com/@",
    facebook: "https://facebook.com/",
  };
  return (base[kind] ?? "https://") + h;
}

export default async function TenantHome() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) return null;

  const { org } = tenant;
  const supabase = await createClient();
  const [{ data: siteData }, { data: offs }, { data: om }] = await Promise.all([
    supabase.from("org_site").select("*").eq("org_id", org.id).maybeSingle(),
    supabase
      .from("site_offerings")
      .select("id, title, description, price, currency, duration_min, cta_label, cta_url")
      .eq("org_id", org.id)
      .eq("active", true)
      .order("position")
      .order("created_at"),
    supabase.from("org_modules").select("module_key, enabled").eq("org_id", org.id),
  ]);
  const site = siteData as SiteRow | null;
  const offerings = (offs ?? []) as OfferingRow[];
  const siteActive = effectiveModules(org.plan, (om ?? []) as OrgModuleRow[]).includes("site");

  // Sem o módulo Site, ou site não publicado → aviso discreto.
  if (!siteActive || !site?.published) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center rounded-full bg-tint px-4 py-1.5 text-sm font-semibold text-primary-dark">
          Em breve
        </span>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight">{org.name}</h1>
        <p className="mt-4 max-w-xl text-balance text-lg text-sub">
          O site de {org.name} está sendo preparado.
        </p>
      </main>
    );
  }

  // Eventos públicos (se a seção estiver ligada).
  let events: EvRow[] = [];
  if (site.show_events) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("events")
      .select("id, title, type, event_date, start_time, location")
      .eq("org_id", org.id)
      .eq("visibility", "public")
      .gte("event_date", todayStr)
      .order("event_date", { ascending: true })
      .limit(6);
    events = (data ?? []) as EvRow[];
  }

  const socials: [string, string | null][] = [
    ["instagram", site.instagram], ["youtube", site.youtube],
    ["tiktok", site.tiktok], ["facebook", site.facebook],
  ];
  const hasContact = !!(site.contact_whatsapp || site.contact_email || site.contact_phone || site.address);
  const hasSocials = socials.some(([, v]) => v);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section
        className="border-b border-edge bg-soft"
        style={site.hero_image_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${site.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className={`mx-auto w-full max-w-5xl px-6 py-20 ${site.hero_image_url ? "text-surface" : ""}`}>
          <h1 className="max-w-2xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            {site.hero_title ?? `Bem-vindo à ${org.name}`}
          </h1>
          {site.hero_subtitle && (
            <p className={`mt-4 max-w-xl text-balance text-lg ${site.hero_image_url ? "text-surface/90" : "text-sub"}`}>
              {site.hero_subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {site.hero_cta_label && site.hero_cta_url && (
              <a href={site.hero_cta_url} className="inline-flex rounded-[var(--radius)] bg-primary px-7 py-3 text-base font-semibold text-surface shadow-sm transition-colors hover:bg-primary-dark">
                {site.hero_cta_label}
              </a>
            )}
            {site.show_booking && (
              <a href="/entrar" className="inline-flex rounded-[var(--radius)] border border-primary bg-surface px-7 py-3 text-base font-semibold text-primary-dark transition-colors hover:bg-tint">
                {site.booking_cta_label ?? "Agendar"}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Sobre */}
      {site.show_about && (site.about_title || site.about_body) && (
        <section className="mx-auto w-full max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">{site.about_title ?? "Sobre"}</h2>
          {site.about_body && (
            <p className="mt-4 whitespace-pre-line text-balance leading-relaxed text-sub">{site.about_body}</p>
          )}
        </section>
      )}

      {/* Ofertas */}
      {site.show_offerings && offerings.length > 0 && (
        <section className="border-t border-edge bg-soft">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-ink">O que ofereço</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offerings.map((o) => (
                <div key={o.id} className="flex flex-col rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
                  <h3 className="font-bold text-ink">{o.title}</h3>
                  {o.description && <p className="mt-1 flex-1 text-sm text-sub">{o.description}</p>}
                  <div className="mt-3 text-sm font-semibold text-primary-dark">
                    {o.price != null ? money(o.price, o.currency) : ""}
                    {o.duration_min ? <span className="font-normal text-hint"> · {o.duration_min}min</span> : null}
                  </div>
                  {o.cta_label && o.cta_url && (
                    <a href={o.cta_url} className="mt-4 inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
                      {o.cta_label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Eventos */}
      {site.show_events && events.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Próximos eventos</h2>
            <a href="/calendario" className="text-sm font-semibold text-primary-dark hover:underline">Ver calendário</a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{e.title}</span>
                  <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{EV_TYPE_LABEL[e.type] ?? e.type}</span>
                </div>
                <div className="mt-0.5 text-sm text-sub">
                  {dateFmt.format(new Date(e.event_date + "T00:00:00"))}{e.start_time ? ` · ${e.start_time.slice(0, 5)}` : ""}{e.location ? ` · ${e.location}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contato / rodapé */}
      <footer className="border-t border-edge">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          {site.show_contact && hasContact && (
            <>
              <h2 className="text-lg font-bold text-ink">Contato</h2>
              <div className="mt-3 flex flex-col gap-1 text-sm text-sub">
                {site.contact_whatsapp && <a href={`https://wa.me/${site.contact_whatsapp.replace(/\D/g, "")}`} className="hover:text-primary-dark">WhatsApp: {site.contact_whatsapp}</a>}
                {site.contact_email && <a href={`mailto:${site.contact_email}`} className="hover:text-primary-dark">{site.contact_email}</a>}
                {site.contact_phone && <span>{site.contact_phone}</span>}
                {site.address && <span>{site.address}</span>}
              </div>
            </>
          )}
          {hasSocials && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-primary-dark">
              {socials.filter(([, v]) => v).map(([kind, v]) => (
                <a key={kind} href={socialHref(kind, v as string)} target="_blank" rel="noreferrer" className="capitalize hover:underline">{kind}</a>
              ))}
            </div>
          )}
          <p className="mt-8 text-xs text-hint">© {org.name} · feito com Listeny</p>
        </div>
      </footer>
    </main>
  );
}
