import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { setPublished } from "../actions";
import { Section } from "../_components/ui";

const APP_DOMAIN = process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app";

/** Submódulo Publicação: deixa o site visível ao público (ou "em construção"). */
export default async function PublicacaoPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_site")
    .select("published")
    .eq("org_id", tenant.org.id)
    .maybeSingle();
  const published = (data as { published?: boolean } | null)?.published ?? false;

  return (
    <form action={setPublished}>
      <Section
        title="Publicação"
        desc="Publicado: o site fica visível ao público. Em construção: mostra um aviso de 'em breve'."
      >
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="published" defaultChecked={published} />
          Publicar site (visível ao público)
        </label>
        <p className="text-sm text-sub">
          Endereço: <span className="font-medium text-ink">{tenant.org.slug}.{APP_DOMAIN}</span>
        </p>
        <div className="flex justify-end">
          <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Salvar
          </button>
        </div>
      </Section>
    </form>
  );
}
