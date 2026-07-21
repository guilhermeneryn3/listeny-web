import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LABEL, planPrice, type Plan } from "@/lib/plans";
import {
  MODULES, PROFESSIONS, isIncluded, effectiveModules, installedProfessions, monthlyTotal,
  type ModuleDef, type OrgModuleRow,
} from "@/lib/modules";
import { StoreGrid, type StoreCardItem } from "./_components/StoreGrid";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(n);

type Badge = Pick<StoreCardItem, "badgeText" | "badgeTone">;

function includedBadge(m: ModuleDef, active: boolean): Badge {
  if (!m.built) return { badgeText: "em breve", badgeTone: "muted" };
  if (m.category === "nativo") return { badgeText: "Nativo", badgeTone: "on" };
  if (active) return { badgeText: "Instalado", badgeTone: "on" };
  return { badgeText: "Incluído", badgeTone: "price" };
}
function addonBadge(m: ModuleDef, active: boolean): Badge {
  if (!m.built) return { badgeText: "em breve", badgeTone: "muted" };
  if (active) return { badgeText: "Instalado", badgeTone: "on" };
  return { badgeText: `${brl(m.price)}/mês`, badgeTone: "price" };
}

/** Vitrine da loja de módulos: cards clicáveis que abrem a página de cada módulo/profissão. */
export default async function LojaPage() {
  const { tenant, plan } = await requireManager();
  const supabase = await createClient();
  const { data: om } = await supabase
    .from("org_modules").select("module_key, enabled").eq("org_id", tenant.org.id);
  const rows = (om ?? []) as OrgModuleRow[];

  const active = new Set(effectiveModules(plan, rows));
  const installedProf = new Set<string>(installedProfessions(rows));
  const basePrice = planPrice(plan);
  const total = monthlyTotal(plan, basePrice, rows);

  const base = (m: ModuleDef) => ({ key: m.key, label: m.label, description: m.description, icon: m.icon });

  const included: StoreCardItem[] = MODULES.filter((m) => isIncluded(plan, m.key)).map((m) => ({
    ...base(m), ...includedBadge(m, active.has(m.key)),
  }));
  const modules: StoreCardItem[] = MODULES.filter((m) => !isIncluded(plan, m.key)).map((m) => ({
    ...base(m), ...addonBadge(m, active.has(m.key)),
  }));
  const professions: StoreCardItem[] = PROFESSIONS.map((p) => ({
    key: p.key, label: p.label, description: p.description, icon: p.icon,
    ...(installedProf.has(p.key)
      ? { badgeText: "Instalado", badgeTone: "on" as const }
      : { badgeText: `${brl(p.price)}/mês`, badgeTone: "price" as const }),
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Loja</h1>
      <p className="mb-6 mt-1 text-sm text-sub">
        Clique num módulo para ver o que ele faz e instalar. Cada item soma na mensalidade.
      </p>
      <StoreGrid
        planLabel={PLAN_LABEL[plan as Plan] ?? plan}
        basePrice={basePrice}
        total={total}
        included={included}
        modules={modules}
        professions={professions}
      />
    </div>
  );
}
