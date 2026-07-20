"use client";

import { useActionState, useState } from "react";
import { addDomain, removeDomain, setPrimaryDomain, type DomainState } from "../domain-actions";

export type Domain = {
  id: string;
  hostname: string;
  is_primary: boolean;
  status: "pending" | "active" | "failed";
  ssl_status: string;
};

const STATUS: Record<Domain["status"], { label: string; cls: string }> = {
  pending: { label: "Aguardando DNS", cls: "bg-soft text-hint" },
  active: { label: "Ativo", cls: "bg-tint text-primary-dark" },
  failed: { label: "Falhou", cls: "bg-soft text-danger" },
};

export function DomainManager({
  domains,
  slug,
  appDomain,
}: {
  domains: Domain[];
  slug: string;
  appDomain: string;
}) {
  const [state, action, pending] = useActionState<DomainState, FormData>(addDomain, {});
  const [showDns, setShowDns] = useState<string | null>(null);
  const target = `${slug}.${appDomain}`;

  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-hint">Domínio próprio</h2>
      <p className="mb-4 text-sm text-sub">
        Seu site já está em <span className="font-medium text-ink">{target}</span>. Você também
        pode usar um domínio seu (ex.: <span className="font-medium text-ink">suaescola.com.br</span>).
      </p>

      <form action={action} className="flex flex-wrap gap-2">
        <input
          name="hostname"
          placeholder="suaescola.com.br"
          className="min-w-[220px] flex-1 rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Adicionando…" : "Adicionar domínio"}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}

      {domains.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {domains.map((d) => (
            <li key={d.id} className="rounded-lg border border-edge p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{d.hostname}</span>
                {d.is_primary && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface">principal</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS[d.status].cls}`}>
                  {STATUS[d.status].label}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => setShowDns(showDns === d.id ? null : d.id)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">
                    DNS
                  </button>
                  {d.status === "active" && !d.is_primary && (
                    <form action={setPrimaryDomain}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-dark hover:bg-soft">Tornar principal</button>
                    </form>
                  )}
                  <form action={removeDomain} onSubmit={(e) => { if (!window.confirm(`Remover ${d.hostname}?`)) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
                  </form>
                </div>
              </div>

              {showDns === d.id && (
                <div className="mt-3 rounded-lg bg-soft p-3 text-sm text-sub">
                  <p className="font-medium text-ink">Configuração de DNS</p>
                  <p className="mt-1">No seu provedor de domínio, crie um registro:</p>
                  <pre className="mt-2 overflow-x-auto rounded bg-surface p-2 text-xs text-ink">
{`Tipo:  CNAME
Nome:  www   (ou o subdomínio desejado)
Valor: ${target}`}
                  </pre>
                  <p className="mt-2 text-xs text-hint">
                    Após apontar o DNS, a verificação e o certificado (SSL) são concluídos na
                    publicação. Domínio raiz (sem www) é configurado no lançamento.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
