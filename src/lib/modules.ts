import type { Plan } from "@/lib/plans";

/**
 * Catálogo de módulos + mapa plano→módulos. Fonte única do "o que cada plano libera".
 * Tunável no código (sem migration). Do professor solo (poucos módulos) à instituição (todos).
 * Início e Ajustes NÃO são módulos gateados — sempre presentes.
 */
export type ModuleKey =
  | "alunos" | "turmas" | "agenda" | "site" | "eventos"
  | "aulas" | "progresso" | "financeiro"
  | "equipe" | "marketing" | "rh";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  href: string;
  adminOnly?: boolean; // só dono/diretor (ex.: equipe, rh)
  built?: boolean; // já implementado (senão aparece como "em breve")
};

export const MODULES: ModuleDef[] = [
  { key: "alunos", label: "Alunos", href: "/gerenciar/alunos", built: true },
  { key: "turmas", label: "Turmas", href: "/gerenciar/turmas", built: true },
  { key: "agenda", label: "Agenda", href: "/gerenciar/agenda", built: true },
  { key: "site", label: "Site", href: "/gerenciar/site", built: true },
  { key: "eventos", label: "Eventos", href: "/gerenciar/eventos", built: true },
  { key: "aulas", label: "Aulas", href: "/gerenciar/aulas", built: true },
  { key: "progresso", label: "Progresso", href: "/gerenciar/progresso" },
  { key: "financeiro", label: "Financeiro", href: "/gerenciar/financeiro", built: true },
  { key: "equipe", label: "Equipe", href: "/gerenciar/equipe", adminOnly: true, built: true },
  { key: "marketing", label: "Marketing", href: "/gerenciar/marketing" },
  { key: "rh", label: "RH", href: "/gerenciar/rh", adminOnly: true },
];

/** Mapa plano→módulos (ajustável). */
export const PLAN_MODULES: Record<Plan, ModuleKey[]> = {
  free: ["alunos", "turmas", "agenda", "site"],
  basico: ["alunos", "turmas", "agenda", "site", "aulas"],
  intermediario: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "eventos"],
  premium: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "marketing", "eventos"],
  enterprise: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "marketing", "rh", "eventos"],
};

const PLAN_ORDER: Plan[] = ["free", "basico", "intermediario", "premium", "enterprise"];

export function planModules(plan: string | null | undefined): ModuleKey[] {
  return PLAN_MODULES[(plan as Plan) ?? "free"] ?? PLAN_MODULES.free;
}
export function hasModule(plan: string | null | undefined, key: ModuleKey): boolean {
  return planModules(plan).includes(key);
}
/** Módulos efetivos = os do plano menos os que o org desligou (org_modules.enabled=false). */
export function effectiveModules(plan: string | null | undefined, disabled: Set<string>): ModuleKey[] {
  return planModules(plan).filter((k) => !disabled.has(k));
}
export function moduleLabel(key: ModuleKey): string {
  return MODULES.find((m) => m.key === key)?.label ?? key;
}
/** Primeiro plano (do menor ao maior) que inclui o módulo — p/ a tela de "faça upgrade". */
export function firstPlanWith(key: ModuleKey): Plan | null {
  return PLAN_ORDER.find((p) => PLAN_MODULES[p].includes(key)) ?? null;
}
