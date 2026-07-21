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
  | "equipe" | "marketing" | "rh" | "portal-aluno";

export type ModuleCategory = "nativo" | "modulo";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  href: string;
  category: ModuleCategory;
  price: number; // R$/mês quando é add-on (nativo = 0). Placeholder, tunável.
  description: string; // frase curta (card da loja)
  icon: string; // path SVG (stroke) para o ícone na loja
  details?: string; // descrição longa (página do módulo)
  features?: string[]; // destaques (bullets na página do módulo)
  adminOnly?: boolean; // só dono/diretor (ex.: equipe, rh)
  built?: boolean; // já implementado (senão aparece como "em breve", não instalável)
  capability?: boolean; // liga uma CAPACIDADE (ex.: área do aluno), não é tela no menu do painel
};

export const MODULES: ModuleDef[] = [
  { key: "alunos", label: "Alunos", href: "/painel/alunos", category: "nativo", price: 0, description: "Cadastro e gestão dos seus alunos.", built: true,
    icon: "M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19c0-1.7-1-3-2.5-3.5M4 19c0-1.7 1-3 2.5-3.5",
    details: "O coração do portal: cadastre seus alunos, guarde contatos e observações e conceda acesso à área do aluno quando quiser.",
    features: ["Cadastro com contato e notas", "Status ativo/inativo", "Concede acesso à área do aluno"] },
  { key: "turmas", label: "Turmas", href: "/painel/turmas", category: "nativo", price: 0, description: "Organize alunos em turmas.", built: true,
    icon: "M4 7h16M4 12h16M4 17h16",
    details: "Agrupe alunos em turmas para organizar aulas, agenda e comunicação.",
    features: ["Crie quantas turmas quiser", "Vincule alunos às turmas", "Base para agenda e aulas"] },
  { key: "agenda", label: "Agenda", href: "/painel/agenda", category: "nativo", price: 0, description: "Sessões e agendamento pelos alunos.", built: true,
    icon: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    details: "Organize suas sessões presenciais e online e, se quiser, deixe o aluno reservar horários disponíveis.",
    features: ["Sessões presenciais e online", "Agendamento pelo aluno (opt-in)", "Calendário mensal"] },
  { key: "site", label: "Site", href: "/painel/site", category: "modulo", price: 29, description: "Seu site e domínio próprio.", built: true,
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
    details: "Seu site profissional com domínio próprio, gerenciado em submódulos: Páginas, Aparência, Ofertas, Redes e mais.",
    features: ["Seções liga/desliga", "Tema, logo e cor", "Domínio próprio"] },
  { key: "aulas", label: "Aulas", href: "/painel/aulas", category: "modulo", price: 19, description: "Publique aulas e materiais.", built: true,
    icon: "M4 5h11a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z",
    details: "Publique aulas, tarefas e materiais e acompanhe a conclusão de cada aluno.",
    features: ["Aulas, tarefas e metas", "Materiais por link", "Aluno marca como concluído"] },
  { key: "eventos", label: "Eventos", href: "/painel/eventos", category: "modulo", price: 19, description: "Calendário público de eventos.", built: true,
    icon: "M12 3l2.4 5 5.6.6-4 4 1 5.4-5-2.7-5 2.7 1-5.4-4-4 5.6-.6z",
    details: "Calendário de excursões, reuniões e avisos. Eventos públicos aparecem no site e na área do aluno.",
    features: ["Eventos públicos ou internos", "Calendário mensal", "Aparece no site"] },
  { key: "financeiro", label: "Financeiro", href: "/painel/financeiro", category: "modulo", price: 29, description: "Cobranças e controle financeiro.", built: true,
    icon: "M3 7h18v10H3zM3 10h18M7 14h3",
    details: "Crie cobranças por aluno e acompanhe o status de pagamento, com um resumo do que há a receber.",
    features: ["Cobranças por aluno", "Status pago/pendente/vencido", "Resumo a receber"] },
  { key: "equipe", label: "Equipe", href: "/painel/equipe", category: "modulo", price: 19, description: "Convide e gerencie sua equipe.", adminOnly: true, built: true,
    icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-2.8 2.7-5 6-5s6 2.2 6 5M16 5.5a3 3 0 0 1 0 6M18 20c0-1.8-.7-3.4-1.9-4.6",
    details: "Convide diretores, coordenadores e professores com papéis e permissões próprias.",
    features: ["Convite por e-mail", "Papéis por pessoa", "Aceite sem perder outros acessos"] },
  { key: "portal-aluno", label: "Portal do Aluno", href: "/aluno", category: "modulo", price: 29, description: "Área logada do aluno.", built: true, capability: true,
    icon: "M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    details: "A área logada onde o aluno acessa aulas, cobranças, agenda e eventos. Sem este módulo, o aluno não entra no portal.",
    features: ["Área logada do aluno", "Aulas, cobranças e agenda", "Agendamento (se ligado)"] },
  { key: "progresso", label: "Progresso", href: "/painel/progresso", category: "modulo", price: 19, description: "Boletim e evolução dos alunos.",
    icon: "M4 19V5M4 19h16M8 15v-3M12 15V9M16 15v-6",
    details: "Boletim e acompanhamento de evolução dos alunos. Em desenvolvimento." },
  { key: "marketing", label: "Marketing", href: "/painel/marketing", category: "modulo", price: 39, description: "Captação de leads e campanhas.",
    icon: "M3 11v2l14 5V6L3 11ZM17 8a3 3 0 0 1 0 8M6 13v5",
    details: "Captação de leads e campanhas para atrair mais alunos. Em desenvolvimento." },
  { key: "rh", label: "RH", href: "/painel/rh", category: "modulo", price: 49, description: "Gestão de pessoas (instituições).", adminOnly: true,
    icon: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17c0-1.7 1.8-3 4-3s4 1.3 4 3",
    details: "Gestão de pessoas para instituições de ensino. Em desenvolvimento." },
];

/** Profissões/verticais instaláveis (etiqueta de segmento na v1). Você cria cada uma aqui. */
export type ProfessionKey =
  | "personal" | "musica" | "artes-marciais" | "reforco-escolar" | "desenho";

export type ProfessionDef = {
  key: ProfessionKey;
  label: string;
  price: number; // R$/mês (placeholder, tunável)
  description: string;
  icon: string;
  details?: string;
  features?: string[];
};

const PROFESSION_FEATURES = ["Marca o segmento do seu portal", "Base para personalização futura", "Instalação reversível"];

export const PROFESSIONS: ProfessionDef[] = [
  { key: "personal", label: "Personal Trainer", price: 19, description: "Perfil para treinadores e educação física.",
    icon: "M4 9v6M20 9v6M6 12h12M8 7v10M16 7v10",
    details: "Perfil para personal trainers e educação física — marca a área de atuação do portal, base para termos e campos próprios no futuro.", features: PROFESSION_FEATURES },
  { key: "musica", label: "Música", price: 19, description: "Perfil para professores de música e instrumentos.",
    icon: "M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 15V5l10-2v10",
    details: "Perfil para professores de música e instrumentos — marca a área de atuação do portal.", features: PROFESSION_FEATURES },
  { key: "artes-marciais", label: "Artes Marciais", price: 19, description: "Perfil para academias e mestres de luta.",
    icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    details: "Perfil para academias e mestres de artes marciais — marca a área de atuação do portal.", features: PROFESSION_FEATURES },
  { key: "reforco-escolar", label: "Reforço Escolar", price: 19, description: "Perfil para reforço e aulas de apoio.",
    icon: "M4 5h11a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z",
    details: "Perfil para reforço escolar e aulas de apoio — marca a área de atuação do portal.", features: PROFESSION_FEATURES },
  { key: "desenho", label: "Desenho", price: 19, description: "Perfil para professores de desenho e artes visuais.",
    icon: "M4 20l4-1L18 9l-3-3L5 16zM14 6l3 3",
    details: "Perfil para professores de desenho e artes visuais — marca a área de atuação do portal.", features: PROFESSION_FEATURES },
];

/**
 * Mapa plano→módulos INCLUÍDOS (grátis dentro do plano). Modelo HÍBRIDO:
 *  - o plano dá certos módulos GRÁTIS (listados aqui) + os nativos;
 *  - módulos fora da lista são add-ons PAGOS;
 *  - em ambos os casos INSTALAR é opção do usuário (opt-in) — incluído não vem ligado sozinho,
 *    só não custa extra. Deixa o painel/site limpo, do jeito de cada um.
 */
export const PLAN_MODULES: Record<Plan, ModuleKey[]> = {
  free: ["alunos", "turmas", "agenda"],
  basico: ["alunos", "turmas", "agenda", "site", "aulas"],
  intermediario: ["alunos", "turmas", "agenda", "site", "aulas", "eventos", "financeiro", "equipe", "portal-aluno", "progresso"],
  premium: ["alunos", "turmas", "agenda", "site", "aulas", "eventos", "financeiro", "equipe", "portal-aluno", "progresso", "marketing"],
  enterprise: ["alunos", "turmas", "agenda", "site", "aulas", "eventos", "financeiro", "equipe", "portal-aluno", "progresso", "marketing", "rh"],
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
 * Módulos EFETIVOS (ativos) de um org. Modelo OPT-IN: só os NATIVOS vêm ligados; qualquer outro
 * módulo (incluído no plano OU add-on pago) fica ativo só se o usuário INSTALOU (enabled=true).
 * `plan` fica na assinatura por compatibilidade (a distinção incluído×pago é de PREÇO, ver
 * `isIncluded`/`monthlyTotal`, não de ativação).
 */
export function effectiveModules(
  plan: string | null | undefined,
  rows: OrgModuleRow[],
): ModuleKey[] {
  void plan;
  const state = new Map<string, boolean>(rows.map((r) => [r.module_key, r.enabled]));
  return MODULES.filter((m) => m.category === "nativo" || state.get(m.key) === true).map((m) => m.key);
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

/** Item normalizado da loja (módulo OU profissão) — usado pela página de detalhe `/painel/loja/[key]`. */
export type StoreEntry = {
  kind: "module" | "profession";
  key: string;
  label: string;
  description: string;
  details?: string;
  features?: string[];
  icon: string;
  price: number;
  adminOnly: boolean;
  built: boolean;
  capability: boolean;
  category: ModuleCategory | "profissao";
};

export function storeEntry(key: string): StoreEntry | undefined {
  const m = moduleDef(key);
  if (m) {
    return {
      kind: "module", key: m.key, label: m.label, description: m.description, details: m.details,
      features: m.features, icon: m.icon, price: m.price, adminOnly: !!m.adminOnly, built: !!m.built,
      capability: !!m.capability, category: m.category,
    };
  }
  const p = professionDef(key);
  if (p) {
    return {
      kind: "profession", key: p.key, label: p.label, description: p.description, details: p.details,
      features: p.features, icon: p.icon, price: p.price, adminOnly: false, built: true,
      capability: false, category: "profissao",
    };
  }
  return undefined;
}
