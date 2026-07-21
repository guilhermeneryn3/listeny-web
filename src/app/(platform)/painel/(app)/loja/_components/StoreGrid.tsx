import Link from "next/link";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(n);

export type StoreCardItem = {
  key: string;
  label: string;
  description: string;
  icon: string;
  badgeText: string;
  badgeTone: "on" | "muted" | "price";
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d={d} />
    </svg>
  );
}

function Badge({ tone, children }: { tone: StoreCardItem["badgeTone"]; children: React.ReactNode }) {
  const cls =
    tone === "on" ? "bg-tint text-primary-dark" : tone === "price" ? "bg-soft text-ink" : "bg-soft text-hint";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

function Card({ item }: { item: StoreCardItem }) {
  return (
    <Link
      href={`/painel/loja/${item.key}`}
      className="flex flex-col rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint text-primary-dark">
          <Icon d={item.icon} />
        </span>
        <Badge tone={item.badgeTone}>{item.badgeText}</Badge>
      </div>
      <div className="mt-3 font-semibold text-ink">{item.label}</div>
      <p className="mt-0.5 line-clamp-2 text-sm text-sub">{item.description}</p>
    </Link>
  );
}

function Grid({ title, items }: { title: string; items: StoreCardItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-sub">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.key} item={it} />
        ))}
      </div>
    </section>
  );
}

/** Vitrine da loja: resumo do total + grades de cards clicáveis (cada um abre a página do módulo). */
export function StoreGrid({
  planLabel, basePrice, total, included, modules, professions,
}: {
  planLabel: string;
  basePrice: number | null;
  total: number | null;
  included: StoreCardItem[];
  modules: StoreCardItem[];
  professions: StoreCardItem[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        <div className="text-sm text-sub">
          Plano <span className="font-semibold text-ink">{planLabel}</span> · base{" "}
          {basePrice === null ? "sob consulta" : `${brl(basePrice)}/mês`}
        </div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
          {total === null ? "Sob consulta" : `${brl(total)}/mês`}
        </div>
        <p className="mt-1 text-xs text-hint">Total projetado. A cobrança é ativada com a assinatura da Listeny.</p>
      </div>

      <Grid title="Incluídos no seu plano" items={included} />
      <Grid title="Módulos" items={modules} />
      <Grid title="Profissões" items={professions} />
    </div>
  );
}
