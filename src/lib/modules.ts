import type { Plan } from "@/lib/plans";

/**
 * Catálogo da LOJA. Fonte única do que existe pra instalar. Tunável no código (sem migration).
 *
 * Duas naturezas:
 *  - NATIVO  → vem de fábrica, sempre presente, sem preço (núcleo do produto).
 *  - MÓDULO  → instalável. Se o plano do org o INCLUI, vem grátis (dentro do plano); senão é um
 *              add-on pago que soma na mensalidade.
 *  - PROFISSÃO → item instalável que apenas ETIQUETA o segmento do org (v1 leve; sem efeito na
 *              nav). Base pra personalização futura (termos/campos por profissão).
 *
 * O que está instalado/ligado mora em `org_modules` (org_id, module_key, enabled). Preço e
 * preço-base do plano moram no código. Cobrança real é DEFERIDA — por ora o total é projetado.
 * Início, Ajustes e Loja NÃO são gateados — sempre presentes.
 */
export type ModuleKey =
  | "alunos" | "turmas" | "agenda" | "site" | "eventos"
  | "aulas" | "progresso" | "financeiro"
  | "equipe" | "marketing" | "rh";

export type ModuleCategory = "nativo" | "modulo";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  href: string;
  category: ModuleCategory;
  price: number; // R$/mês quando é add-on (nativo = 0). Placeholder, tunável.
  description: string;
  adminOnly?: boolean; // só dono/diretor (ex.: equipe, rh)
  built?: boolean; // já implementado (senão aparece como "em breve", não instalável)
};

export const MODULES: ModuleDef[] = [
  { key: "alunos", label: "Alunos", href: "/gerenciar/alunos", category: "nativo", price: 0, description: "Cadastro e gestão dos seus alunos.", built: true },
  { key: "turmas", label: "Turmas", href: "/gerenciar/turmas", category: "nativo", price: 0, description: "Organize alunos em turmas.", built: true },
  { key: "agenda", label: "Agenda", href: "/gerenciar/agenda", category: "nativo", price: 0, description: "Agenda de sessões e agendamento pelos alunos.", built: true },
  { key: "site", label: "Site", href: "/gerenciar/site", category: "nativo", price: 0, description: "Seu site e domínio próprio.", built: true },
  { key: "aulas", label: "Aulas", href: "/gerenciar/aulas", category: "modulo", price: 19, description: "Publique aulas e materiais para os alunos.", built: true },
  { key: "eventos", label: "Eventos", href: "/gerenciar/eventos", category: "modulo", price: 19, description: "Calendário público: excursões, reuniões, avisos.", built: true },
  { key: "financeiro", label: "Financeiro", href: "/gerenciar/financeiro", category: "modulo", price: 29, description: "Cobranças e controle financeiro dos alunos.", built: true },
  { key: "equipe", label: "Equipe", href: "/gerenciar/equipe", category: "modulo", price: 19, description: "Convide e gerencie sua equipe.", adminOnly: true, built: true },
  { key: "progresso", label: "Progresso", href: "/gerenciar/progresso", category: "modulo", price: 19, description: "Boletim e acompanhamento de evolução." },
  { key: "marketing", label: "Marketing", href: "/gerenciar/marketing", category: "modulo", price: 39, description: "Captação de leads e campanhas." },
  { key: "rh", label: "RH", href: "/gerenciar/rh", category: "modulo", price: 49, description: "Gestão de pessoas para instituições.", adminOnly: true },
];

/** Profissões/verticais instaláveis (etiqueta de segmento na v1). Você cria cada uma aqui. */
export type ProfessionKey =
  | "personal" | "musica" | "artes-marciais" | "reforco-escolar" | "desenho";

export type ProfessionDef = {
  key: ProfessionKey;
  label: string;
  price: number; // R$/mês (placeholder, tunável)
  description: string;
};

export const PROFESSIONS: ProfessionDef[] = [
  { key: "personal", label: "Personal Trainer", price: 19, description: "Perfil para treinadores e educação física." },
  { key: "musica", label: "Música", price: 19, description: "Perfil para professores de música e instrumentos." },
  { key: "artes-marciais", label: "Artes Marciais", price: 19, description: "Perfil para academias e mestres de luta." },
  { key: "reforco-escolar", label: "Reforço Escolar", price: 19, description: "Perfil para reforço e aulas de apoio." },
  { key: "desenho", label: "Desenho", price: 19, description: "Perfil para professores de desenho e artes visuais." },
];

/** Mapa plano→módulos INCLUÍDOS (grátis dentro do plano). Nativos vêm em todos por padrão. */
export const PLAN_MODULES: Record<Plan, ModuleKey[]> = {
  free: ["alunos", "turmas", "agenda", "site"],
  basico: ["alunos", "turmas", "agenda", "site", "aulas"],
  intermediario: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "eventos"],
  premium: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "marketing", "eventos"],
  enterprise: ["alunos", "turmas", "agenda", "site", "aulas", "progresso", "financeiro", "equipe", "marketing", "rh", "eventos"],
};

export function planModules(plan: string | null | undefined): ModuleKey[] {
  return PLAN_MODULES[(plan as Plan) ?? "free"] ?? PLAN_MODULES.free;
}
export function moduleDef(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
export function professionDef(key: string): ProfessionDef | undefined {
  return PROFESSIONS.find((p) => p.key === key);
}
export function isNative(key: ModuleKey): boolean {
  return moduleDef(key)?.category === "nativo";
}
/** true se o módulo está incluído no plano (grátis) — nativos contam como incluídos. */
export function isIncluded(plan: string | null | undefined, key: ModuleKey): boolean {
  return isNative(key) || planModules(plan).includes(key);
}

/** Linha de override do org: enabled=true instalado/exibido, enabled=false oculto/não instalado. */
export type OrgModuleRow = { module_key: string; enabled: boolean };

/**
 * Módulos EFETIVOS (ativos) de um org = nativos + incluídos-não-ocultos + add-ons instalados.
 *  - nativo: sempre ativo.
 *  - módulo incluído no plano: ativo salvo se o org marcou enabled=false (ocultar).
 *  - módulo fora do plano (add-on): ativo só se o org instalou (enabled=true).
 */
export function effectiveModules(
  plan: string | null | undefined,
  rows: OrgModuleRow[],
): ModuleKey[] {
  const state = new Map<string, boolean>(rows.map((r) => [r.module_key, r.enabled]));
  return MODULES.filter((m) => {
    if (m.category === "nativo") return true;
    const included = planModules(plan).includes(m.key);
    const row = state.get(m.key);
    return included ? row !== false : row === true;
  }).map((m) => m.key);
}

/** Profissões instaladas (enabled=true) — só as chaves conhecidas do catálogo. */
export function installedProfessions(rows: OrgModuleRow[]): ProfessionKey[] {
  const on = new Set(rows.filter((r) => r.enabled).map((r) => r.module_key));
  return PROFESSIONS.filter((p) => on.has(p.key)).map((p) => p.key);
}

/**
 * Total PROJETADO da mensalidade = preço-base do plano + add-ons instalados (módulos fora do
 * plano) + profissões instaladas. Retorna `null` se o plano é sob consulta (base null).
 */
export function monthlyTotal(
  plan: string | null | undefined,
  basePrice: number | null,
  rows: OrgModuleRow[],
): number | null {
  if (basePrice === null) return null;
  const active = new Set(effectiveModules(plan, rows));
  const addons = MODULES
    .filter((m) => active.has(m.key) && !isIncluded(plan, m.key))
    .reduce((sum, m) => sum + m.price, 0);
  const profs = installedProfessions(rows).reduce(
    (sum, k) => sum + (professionDef(k)?.price ?? 0),
    0,
  );
  return basePrice + addons + profs;
}

export function moduleLabel(key: ModuleKey): string {
  return moduleDef(key)?.label ?? key;
}
export function modulePrice(key: ModuleKey): number {
  return moduleDef(key)?.price ?? 0;
}
