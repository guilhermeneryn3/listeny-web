import { moduleLabel, modulePrice, type ModuleKey } from "@/lib/modules";

/** Tela mostrada quando o módulo não está ativo no org (gate de rota + gancho pra Loja). */
export function ModuleLocked({ moduleKey }: { moduleKey: ModuleKey }) {
  const price = modulePrice(moduleKey);
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-10 text-center">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">
        {moduleLabel(moduleKey)} não está ativo
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-sub">
        Instale este módulo na Loja{price > 0 ? ` por R$ ${price}/mês` : ""} para começar a usar.
      </p>
      <a
        href="/painel/loja"
        className="mt-6 inline-flex rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
      >
        Ir para a Loja
      </a>
    </div>
  );
}
