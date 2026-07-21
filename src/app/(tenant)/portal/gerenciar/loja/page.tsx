import { requireManager } from "@/lib/teacher";
import { isAdmin } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LABEL, planPrice, type Plan } from "@/lib/plans";
import {
  MODULES, PROFESSIONS, isIncluded, effectiveModules, installedProfessions, monthlyTotal,
} from "@/lib/modules";
import { LojaStore, type IncludedItem, type AddonItem, type ProfessionItem } from "./_components/LojaStore";

/**
 * Loja de módulos do org: prateleira única (nativos + incluídos + add-ons pagos + profissões),
 * com preço e total projetado da mensalidade. Admin instala/remove; o estado mora em `org_modules`.
 */
export default async function LojaPage() {
  const { tenant, role, plan } = await requireManager();
  const supabase = await createClient();
  const { data: om } = await supabase
    .from("org_modules").select("module_key, enabled").eq("org_id", tenant.org.id);
  const rows = (om ?? []) as { module_key: string; enabled: boolean }[];

  const active = new Set(effectiveModules(plan, rows));
  const installedProf = new Set<string>(installedProfessions(rows));
  const basePrice = planPrice(plan);
  const total = monthlyTotal(plan, basePrice, rows);

  const included: IncludedItem[] = MODULES.filter((m) => isIncluded(plan, m.key)).map((m) => ({
    key: m.key, label: m.label, description: m.description, price: m.price,
    native: m.category === "nativo", active: active.has(m.key), built: !!m.built, adminOnly: !!m.adminOnly,
  }));
  const addons: AddonItem[] = MODULES.filter((m) => !isIncluded(plan, m.key)).map((m) => ({
    key: m.key, label: m.label, description: m.description, price: m.price,
    active: active.has(m.key), built: !!m.built, adminOnly: !!m.adminOnly,
  }));
  const professions: ProfessionItem[] = PROFESSIONS.map((p) => ({
    key: p.key, label: p.label, description: p.description, price: p.price, active: installedProf.has(p.key),
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Loja</h1>
      <p className="mb-6 mt-1 text-sm text-sub">
        Instale módulos e profissões para o seu portal. Cada item soma na mensalidade.
      </p>
      <LojaStore
        canManage={isAdmin(role)}
        planLabel={PLAN_LABEL[plan as Plan] ?? plan}
        basePrice={basePrice}
        total={total}
        included={included}
        addons={addons}
        professions={professions}
      />
    </div>
  );
}
