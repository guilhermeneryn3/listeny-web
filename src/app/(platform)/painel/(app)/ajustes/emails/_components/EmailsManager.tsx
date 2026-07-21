"use client";

import { useActionState, useState } from "react";
import { saveEmailTemplate, type AjustesState } from "../../actions";

export type EmailItem = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  subject: string;
  body: string;
};

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function EmailCard({ item }: { item: EmailItem }) {
  const [state, action, pending] = useActionState<AjustesState, FormData>(saveEmailTemplate, {});
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <form action={action}>
        <input type="hidden" name="key" value={item.key} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-ink">{item.label}</div>
            <p className="mt-0.5 text-sm text-sub">{item.description}</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="enabled" defaultChecked={item.enabled} /> Ativo
          </label>
        </div>

        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-sm font-medium text-primary-dark hover:underline">
          {open ? "Ocultar assunto e texto" : "Editar assunto e texto"}
        </button>

        {/* mantém no DOM (mesmo oculto) para não zerar ao salvar com o card fechado */}
        <div className={open ? "mt-3 space-y-2" : "hidden"}>
          <div>
            <label className="mb-1 block text-sm font-medium text-sub">Assunto</label>
            <input name="subject" defaultValue={item.subject} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sub">Texto</label>
            <textarea name="body" defaultValue={item.body} rows={5} className={field} />
          </div>
          <p className="text-xs text-hint">Variáveis disponíveis: {"{aluno}"}, {"{portal}"}.</p>
        </div>

        <div className="mt-3 flex items-center justify-end gap-3">
          {state.ok && <span className="text-sm text-success">Salvo!</span>}
          {state.error && <span className="text-sm text-danger">{state.error}</span>}
          <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </li>
  );
}

export function EmailsManager({ items }: { items: EmailItem[] }) {
  return (
    <div className="space-y-4">
      <p className="rounded-[var(--radius)] border border-edge bg-soft p-3 text-xs text-sub">
        Configure os e-mails automáticos que serão enviados aos seus alunos. O disparo real entra em
        breve (infra de e-mail) — por ora, deixe tudo pronto.
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <EmailCard key={it.key} item={it} />
        ))}
      </ul>
    </div>
  );
}
