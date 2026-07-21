"use client";

import { useActionState, useEffect, useState } from "react";
import { createInvitation, cancelInvitation, type InviteState } from "../actions";
import { INVITABLE_ROLES, ROLE_LABEL, type Role } from "@/lib/roles";

export type Member = { userId: string; role: Role; name: string; email: string };
export type Invite = { id: string; email: string; role: Role; token: string; expires_at: string | null };

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function InviteForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvitation, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="email" type="email" required placeholder="e-mail do colaborador" className={field} />
        <select name="role" defaultValue="teacher" className={field}>
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Convidando…" : "Enviar convite"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const link = `${window.location.origin}/aceitar?token=${token}`;
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          window.prompt("Copie o link do convite:", link);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-dark hover:bg-soft"
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}

export function TeamManager({ members, invites }: { members: Member[]; invites: Invite[] }) {
  const [inviting, setInviting] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Equipe</h1>
        {!inviting && (
          <button type="button" onClick={() => setInviting(true)} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Convidar
          </button>
        )}
      </div>

      {inviting && (
        <div className="mb-4">
          <InviteForm onDone={() => setInviting(false)} />
          <p className="mt-2 text-xs text-hint">
            O envio por e-mail entra depois. Por ora, use “Copiar link” no convite pendente e mande você mesmo.
          </p>
        </div>
      )}

      <h2 className="mb-2 mt-2 text-sm font-semibold text-sub">Colaboradores</h2>
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-3 shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tint text-sm font-bold text-primary-dark">
              {(m.name || "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{m.name}</div>
              <div className="truncate text-sm text-sub">{m.email}</div>
            </div>
            <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-sub">
              {ROLE_LABEL[m.role]}
            </span>
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-sub">Convites pendentes</h2>
          <ul className="flex flex-col gap-2">
            {invites.map((iv) => (
              <li key={iv.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-dashed border-edge bg-soft p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink">{iv.email}</div>
                  <div className="text-sm text-sub">{ROLE_LABEL[iv.role]}</div>
                </div>
                <CopyLinkButton token={iv.token} />
                <form action={cancelInvitation}>
                  <input type="hidden" name="id" value={iv.id} />
                  <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-surface">Cancelar</button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
