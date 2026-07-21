import { notFound } from "next/navigation";
import Link from "next/link";
import { requireManager } from "@/lib/teacher";
import { isAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  storeEntry, isIncluded, effectiveModules, installedProfessions,
  type OrgModuleRow, type ModuleKey, type ProfessionKey, type StoreEntry,
} from "@/lib/modules";
import { installItem } from "../actions";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(n);

type Action =
  | { kind: "none" }
  | { kind: "soon" }
  | { kind: "toggle"; on: boolean; label: string; danger: boolean };

function decideAction(entry: StoreEntry, native: boolean, included: boolean, active: boolean): Action {
  if (native) return { kind: "none" };
  if (entry.kind === "module" && !entry.built) return { kind: "soon" };
  if (included) return { kind: "toggle", on: !active, label: active ? "Ocultar" : "Exibir", danger: active };
  return { kind: "toggle", on: !active, label: active ? "Remover" : "Instalar", danger: active };
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d={d} />
    </svg>
  );
}

const CATEGORY_LABEL: Record<StoreEntry["category"], string> = {
  nativo: "Nativo", modulo: "Módulo", profissao: "Profissão",
};

/** Página do módulo (estilo app store): o que faz + destaques + ação de instalar. */
export default async function ModuleDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = storeEntry(key);
  if (!entry) notFound();

  const { tenant, role, plan } = await requireManager();
  const supabase = await createClient();
  const { data: om } = await supabase
    .from("org_modules").select("module_key, enabled").eq("org_id", tenant.org.id);
  const rows = (om ?? []) as OrgModuleRow[];

  const native = entry.kind === "module" && entry.category === "nativo";
  const included = entry.kind === "module" && isIncluded(plan, entry.key as ModuleKey);
  const active =
    entry.kind === "module"
      ? effectiveModules(plan, rows).includes(entry.key as ModuleKey)
      : installedProfessions(rows).includes(entry.key as ProfessionKey);

  const action = decideAction(entry, native, included, active);
  const canManage = isAdmin(role);
  const priceLine = native || included ? "Incluído no seu plano — sem custo extra." : `${brl(entry.price)}/mês`;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/painel/loja" className="text-sm font-medium text-sub hover:text-ink">← Voltar à Loja</Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-tint text-primary-dark">
          <Icon d={entry.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{entry.label}</h1>
            <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">
              {CATEGORY_LABEL[entry.category]}
            </span>
            {active && <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">Ativo</span>}
          </div>
          <p className="mt-1 text-sm text-sub">{entry.description}</p>
          <p className="mt-1 text-sm font-semibold text-primary-dark">{priceLine}</p>
        </div>
      </div>

      {entry.details && (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-sub">{entry.details}</p>
      )}

      {entry.features && entry.features.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {entry.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-ink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-primary-dark"><path d="M20 6 9 17l-5-5" /></svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      {entry.capability && (
        <p className="mt-4 rounded-[var(--radius)] border border-edge bg-soft p-3 text-xs text-sub">
          Este módulo liga uma capacidade (não vira uma tela no menu do painel).
        </p>
      )}

      {/* Ação */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        {action.kind === "none" && <span className="text-sm text-sub">Sempre disponível no seu portal.</span>}
        {action.kind === "soon" && <span className="text-sm text-sub">Em desenvolvimento — em breve na Loja.</span>}
        {action.kind === "toggle" && (
          <>
            <span className="text-sm text-sub">
              {included
                ? active ? "Aparece no seu painel." : "Está oculto no seu painel."
                : active ? `Instalado · ${brl(entry.price)}/mês no seu total.` : `Instalar adiciona ${brl(entry.price)}/mês.`}
            </span>
            {canManage ? (
              <form action={installItem}>
                <input type="hidden" name="key" value={entry.key} />
                <input type="hidden" name="on" value={action.on ? "true" : "false"} />
                <button
                  type="submit"
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                    action.danger ? "text-sub hover:bg-soft hover:text-ink" : "bg-primary text-surface hover:bg-primary-dark"
                  }`}
                >
                  {action.label}
                </button>
              </form>
            ) : (
              <span className="text-sm text-hint">Somente dono e diretor podem instalar.</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
