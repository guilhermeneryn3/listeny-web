import type { ReactNode } from "react";

export const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
export const labelCls = "mb-1 block text-sm font-medium text-sub";

export function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-hint">{title}</h2>
      {desc && <p className="mt-1 text-xs text-sub">{desc}</p>}
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

export function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function SaveBar({ ok, error, pending, label = "Salvar" }: { ok?: boolean; error?: string; pending: boolean; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {ok && <span className="text-sm text-success">Salvo!</span>}
      {error && <span className="text-sm text-danger">{error}</span>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Salvando…" : label}
      </button>
    </div>
  );
}
