/**
 * Planos e limites. Gateia recursos do menor (professor liberal) ao maior (instituição).
 * Valores PLACEHOLDER — ajustáveis sem migração (moram no código, checados no servidor).
 * `null` = ilimitado.
 */
export type Plan = "free" | "basico" | "intermediario" | "premium" | "enterprise";

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  basico: "Básico",
  intermediario: "Intermediário",
  premium: "Premium",
  enterprise: "Enterprise",
};

/** Preço-base mensal do plano (R$). `null` = sob consulta. Placeholder, tunável no código. */
export const PLAN_PRICE: Record<Plan, number | null> = {
  free: 0,
  basico: 49,
  intermediario: 99,
  premium: 199,
  enterprise: null,
};

export function planPrice(plan: string | null | undefined): number | null {
  const p = (plan as Plan) ?? "free";
  return p in PLAN_PRICE ? PLAN_PRICE[p] : PLAN_PRICE.free;
}

export type PlanLimits = {
  maxStudents: number | null;
  maxStaff: number | null;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxStudents: 20, maxStaff: 1 },
  basico: { maxStudents: 100, maxStaff: 3 },
  intermediario: { maxStudents: 500, maxStaff: 10 },
  premium: { maxStudents: 2000, maxStaff: 50 },
  enterprise: { maxStudents: null, maxStaff: null },
};

export function planLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[(plan as Plan) ?? "free"] ?? PLAN_LIMITS.free;
}

/** true se `count` ainda cabe no limite (`null` = ilimitado). */
export function withinLimit(count: number, limit: number | null): boolean {
  return limit === null || count < limit;
}
