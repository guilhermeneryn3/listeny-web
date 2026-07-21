import { requireManager } from "@/lib/teacher";
import { isAdmin } from "@/lib/roles";
import { planModules, MODULES } from "@/lib/modules";
import { ModulesToggle, type ModItem } from "./_components/ModulesToggle";

/** Ajustes do org. Seção Módulos: liga/desliga o que exibir (dentro do plano). Só admin altera. */
export default async function AjustesPage() {
  const { role, plan, modules } = await requireManager();

  const items: ModItem[] = planModules(plan)
    .filter((k) => MODULES.find((m) => m.key === k)?.built)
    .map((k) => ({
      key: k,
      label: MODULES.find((m) => m.key === k)?.label ?? k,
      enabled: modules.includes(k),
    }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ajustes</h1>
      <h2 className="mb-3 mt-6 text-sm font-semibold text-sub">Módulos</h2>
      <p className="mb-3 text-sm text-sub">
        Escolha o que exibir no seu painel (dentro do que o seu plano permite).
      </p>
      {isAdmin(role) ? (
        <ModulesToggle items={items} />
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
          Somente dono e diretor podem ligar/desligar módulos.
        </p>
      )}
    </div>
  );
}
