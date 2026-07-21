/**
 * Contrato de tokens de tema (a "cara" do tenant é DADO, não código).
 *
 * As MESMAS chaves usadas em `theme_templates.tokens` e no override parcial
 * `org_branding.palette` no Supabase. Nunca hardcode cor na UI: os componentes
 * usam variáveis CSS (`--color-*`, `--radius`, `--font-tenant`) e o shell do
 * tenant sobrescreve essas variáveis em runtime com os valores do banco.
 */
export type ThemeTokens = {
  primary: string;
  primaryDark: string;
  bg: string;
  surface: string;
  ink: string;
  sub: string;
  hint: string;
  edge: string;
  soft: string;
  success: string;
  warn: string;
  danger: string;
  tint: string;
  radius: string;
  font: string;
};

/** Template padrão `teal-clean` (espelha o seed da migration 0003). */
export const DEFAULT_TOKENS: ThemeTokens = {
  primary: "#14B8A6",
  primaryDark: "#0D9488",
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  ink: "#17181D",
  sub: "#5A6172",
  hint: "#9AA0AB",
  edge: "#ECECF2",
  soft: "#F1F3F7",
  success: "#16A34A",
  warn: "#B45309",
  danger: "#F0473C",
  tint: "#ECFDF9",
  radius: "16px",
  font: "Plus Jakarta Sans",
};

/**
 * Tokens efetivos do tenant = default ← template ← palette (override parcial vence).
 * Recebe os jsonb crus do banco (parciais/desconhecidos) e devolve um conjunto completo.
 */
export function mergeTokens(
  templateTokens?: Partial<ThemeTokens> | null,
  palette?: Partial<ThemeTokens> | null,
): ThemeTokens {
  return {
    ...DEFAULT_TOKENS,
    ...(templateTokens ?? {}),
    ...(palette ?? {}),
  };
}

/** Escurece um hex (#rrggbb) por um fator (0–1) — usado p/ derivar a cor de hover (primaryDark). */
export function darken(hex: string, factor = 0.85): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(c * factor))),
  );
  return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/**
 * Converte os tokens em variáveis CSS para injeção inline no shell do tenant.
 * O nome de cada variável casa com o contrato do `globals.css` (@theme inline),
 * então as utilities do Tailwind (`bg-primary`, `text-ink`, …) passam a herdar
 * os valores do tenant por cascata.
 */
export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--color-primary": tokens.primary,
    "--color-primary-dark": tokens.primaryDark,
    "--color-bg": tokens.bg,
    "--color-surface": tokens.surface,
    "--color-ink": tokens.ink,
    "--color-sub": tokens.sub,
    "--color-hint": tokens.hint,
    "--color-edge": tokens.edge,
    "--color-soft": tokens.soft,
    "--color-success": tokens.success,
    "--color-warn": tokens.warn,
    "--color-danger": tokens.danger,
    "--color-tint": tokens.tint,
    "--radius": tokens.radius,
    "--font-tenant": tokens.font,
  };
}
