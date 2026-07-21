"use client";

import { installItem } from "../actions";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(n);

export type IncludedItem = {
  key: string; label: string; description: string; price: number;
  native: boolean; active: boolean; built: boolean; adminOnly: boolean;
};
export type AddonItem = {
  key: string; label: string; description: string; price: number;
  active: boolean; built: boolean; adminOnly: boolean;
};
export type ProfessionItem = {
  key: string; label: string; description: string; price: number; active: boolean;
};

function Badge({ tone, children }: { tone: "on" | "muted"; children: React.ReactNode }) {
  const cls = tone === "on" ? "bg-tint text-primary-dark" : "bg-soft text-hint";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

function ToggleButton({ itemKey, on, label, primary }: { itemKey: string; on: boolean; label: string; primary: boolean }) {
  return (
    <form action={installItem}>
      <input type="hidden" name="key" value={itemKey} />
      <input type="hidden" name="on" value={on ? "true" : "false"} />
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
          primary ? "bg-primary text-surface hover:bg-primary-dark" : "text-sub hover:bg-soft hover:text-ink"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function Card({ title, subtitle, right }: { title: React.ReactNode; subtitle: string; right: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="min-w-0">
        <div className="font-medium text-ink">{title}</div>
        <p className="mt-0.5 text-sm text-sub">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </li>
  );
}

/**
 * Loja do org: prateleira única (incluídos, módulos add-on, profissões) com preço e total
 * projetado. Instalar/remover via server action `installItem`. Só admin altera.
 */
export function LojaStore({
  canManage, planLabel, basePrice, total, included, addons, professions,
}: {
  canManage: boolean;
  planLabel: string;
  basePrice: number | null;
  total: number | null;
  included: IncludedItem[];
  addons: AddonItem[];
  professions: ProfessionItem[];
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
        <p className="mt-1 text-xs text-hint">
          Total projetado. A cobrança é ativada com a assinatura da Listeny.
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-sub">Incluídos no seu plano</h2>
        <p className="mb-3 text-xs text-hint">Vêm de fábrica ou já fazem parte do seu plano, sem custo extra.</p>
        <ul className="flex flex-col gap-2">
          {included.map((it) => (
            <Card
              key={it.key}
              title={it.label}
              subtitle={it.description}
              right={
                <>
                  <Badge tone="on">{it.native ? "Nativo" : "Incluído"}</Badge>
                  {!it.built && <Badge tone="muted">em breve</Badge>}
                  {!it.native && it.built && canManage && (
                    <ToggleButton itemKey={it.key} on={!it.active} primary={!it.active} label={it.active ? "Ocultar" : "Exibir"} />
                  )}
                </>
              }
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-sub">Módulos</h2>
        <p className="mb-3 text-xs text-hint">Instale só o que precisa — cada módulo soma na mensalidade.</p>
        <ul className="flex flex-col gap-2">
          {addons.map((it) => (
            <Card
              key={it.key}
              title={
                <span className="flex items-center gap-2">
                  {it.label}
                  <span className="text-sm font-semibold text-primary-dark">{brl(it.price)}/mês</span>
                </span>
              }
              subtitle={it.description}
              right={
                !it.built ? (
                  <Badge tone="muted">em breve</Badge>
                ) : (
                  <>
                    {it.active && <Badge tone="on">Instalado</Badge>}
                    {canManage && (
                      <ToggleButton itemKey={it.key} on={!it.active} primary={!it.active} label={it.active ? "Remover" : "Instalar"} />
                    )}
                  </>
                )
              }
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-sub">Profissões</h2>
        <p className="mb-3 text-xs text-hint">Marque a área de atuação do seu portal.</p>
        <ul className="flex flex-col gap-2">
          {professions.map((it) => (
            <Card
              key={it.key}
              title={
                <span className="flex items-center gap-2">
                  {it.label}
                  <span className="text-sm font-semibold text-primary-dark">{brl(it.price)}/mês</span>
                </span>
              }
              subtitle={it.description}
              right={
                <>
                  {it.active && <Badge tone="on">Instalado</Badge>}
                  {canManage && (
                    <ToggleButton itemKey={it.key} on={!it.active} primary={!it.active} label={it.active ? "Remover" : "Instalar"} />
                  )}
                </>
              }
            />
          ))}
        </ul>
      </section>

      {!canManage && (
        <p className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
          Somente dono e diretor podem instalar módulos e profissões.
        </p>
      )}
    </div>
  );
}
