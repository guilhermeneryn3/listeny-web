"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createOffering,
  updateOffering,
  removeOffering,
  saveOfferingsSettings,
  type SiteState,
} from "../../actions";
import { Section, Toggle, SaveBar, field } from "../../_components/ui";

export type Offering = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  duration_min: number | null;
  cta_label: string | null;
  cta_url: string | null;
};

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

function SettingsForm({ showOfferings }: { showOfferings: boolean }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveOfferingsSettings, {});
  return (
    <form action={action}>
      <Section title="Vitrine" desc="Exibe suas ofertas/serviços no site público.">
        <Toggle name="show_offerings" defaultChecked={showOfferings} label="Mostrar a seção Ofertas no site" />
        <SaveBar ok={state.ok} error={state.error} pending={pending} />
      </Section>
    </form>
  );
}

export function OfferingsManager({ offerings, showOfferings }: { offerings: Offering[]; showOfferings: boolean }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <SettingsForm showOfferings={showOfferings} />

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
    </div>
  );
}
