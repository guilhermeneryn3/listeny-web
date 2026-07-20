import { moduleLabel, firstPlanWith, type ModuleKey } from "@/lib/modules";
import { PLAN_LABEL, type Plan } from "@/lib/plans";

/** Tela mostrada quando o módulo não está no plano do org (gate de rota + gancho de upgrade). */
export function ModuleLocked({ moduleKey }: { moduleKey: ModuleKey }) {
  const plan = firstPlanWith(moduleKey);
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-10 text-center">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">
        {moduleLabel(moduleKey)} não está no seu plano
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-sub">
        Este recurso fica disponível a partir do plano{" "}
        <span className="font-semibold text-ink">{plan ? PLAN_LABEL[plan as Plan] : "—"}</span>.
      </p>
      <a
        href="/gerenciar"
        className="mt-6 inline-flex rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
      >
        Voltar ao painel
      </a>
    </div>
  );
}
