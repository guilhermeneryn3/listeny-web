"use client";

import { useActionState } from "react";
import { savePaymentGateway, disconnectPayment, PAYMENT_PROVIDERS, type AjustesState } from "../../actions";

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

export function PaymentForm({ currentProvider, hasKey }: { currentProvider: string; hasKey: boolean }) {
  const [state, action, pending] = useActionState<AjustesState, FormData>(savePaymentGateway, {});
  const currentLabel = PAYMENT_PROVIDERS.find((p) => p.key === currentProvider)?.label;

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-hint">Meio de pagamento</h2>
          {currentLabel && (
            <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
              Conectado: {currentLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-sub">
          Conecte o gateway que você usa para <span className="font-medium text-ink">receber dos seus alunos</span>.
          A chave fica guardada com segurança e nunca é exibida de volta.
        </p>
      </div>

      <form action={action} className="space-y-3 rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        <span className="block text-sm font-medium text-sub">Provedor</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_PROVIDERS.map((p) => (
            <label
              key={p.key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm font-medium text-ink has-[:checked]:border-primary has-[:checked]:bg-tint"
            >
              <input type="radio" name="provider" value={p.key} defaultChecked={p.key === currentProvider} />
              {p.label}
            </label>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sub">Chave / Token da API</label>
          <input
            type="password"
            name="token"
            autoComplete="off"
            placeholder={hasKey ? "•••••••• salvo — deixe em branco para manter" : "cole sua chave/token"}
            className={field}
          />
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="text-sm text-success">Salvo!</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>

      {currentProvider && (
        <form action={disconnectPayment}>
          <button type="submit" className="text-sm font-medium text-sub transition-colors hover:text-danger">
            Desconectar {currentLabel}
          </button>
        </form>
      )}

      <p className="text-xs text-hint">
        A cobrança automática pelo gateway entra na fase de pagamento. Por ora, guardamos sua conexão.
      </p>
    </div>
  );
}
