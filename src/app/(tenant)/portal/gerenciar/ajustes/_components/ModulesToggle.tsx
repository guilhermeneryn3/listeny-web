"use client";

import { setOrgModule } from "../actions";

export type ModItem = { key: string; label: string; enabled: boolean };

/** Liga/desliga módulos do org (dentro do que o plano permite). */
export function ModulesToggle({ items }: { items: ModItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => (
        <li key={it.key} className="flex items-center justify-between rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-medium text-ink">{it.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${it.enabled ? "bg-tint text-primary-dark" : "bg-soft text-hint"}`}>
              {it.enabled ? "Ativo" : "Desligado"}
            </span>
          </div>
          <form action={setOrgModule}>
            <input type="hidden" name="key" value={it.key} />
            <input type="hidden" name="enabled" value={it.enabled ? "false" : "true"} />
            <button
              type="submit"
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${it.enabled ? "text-sub hover:bg-soft hover:text-ink" : "bg-primary text-surface hover:bg-primary-dark"}`}
            >
              {it.enabled ? "Desativar" : "Ativar"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
