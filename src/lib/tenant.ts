import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TOKENS,
  mergeTokens,
  type ThemeTokens,
} from "@/lib/theme";

/** Domínio-app da plataforma. Subdomínios `<slug>.APP_DOMAIN` são tenants. */
const APP_DOMAIN = (
  process.env.NEXT_PUBLIC_EDUCATY_APP_DOMAIN ?? "educaty.app"
).toLowerCase();

/** Hosts que são a PLATAFORMA (não um tenant): landing, criar, login, painel. */
const PLATFORM_HOSTS = new Set<string>([
  APP_DOMAIN,
  `www.${APP_DOMAIN}`,
  "localhost",
  "127.0.0.1",
]);

export type TenantOrg = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type TenantBranding = {
  logo_url: string | null;
  custom_css: string | null;
};

export type Tenant = {
  org: TenantOrg;
  branding: TenantBranding | null;
  tokens: ThemeTokens;
};

/** Normaliza o host: remove porta e caixa. */
function bareHost(host: string): string {
  return (host.split(":")[0] ?? "").toLowerCase();
}

/** `true` se o host é a plataforma (não deve resolver como tenant). */
export function isPlatformHost(host: string): boolean {
  const bare = bareHost(host);
  return PLATFORM_HOSTS.has(bare) || bare.endsWith(".vercel.app");
}

/**
 * Resolve o tenant a partir do host da requisição.
 *
 *  - host de plataforma → `null` (é a plataforma, não um tenant).
 *  - `<slug>.educaty.app` (ou `<slug>.localhost` em dev) → `orgs` por slug.
 *  - qualquer outro host → `org_domains` por hostname (status active) → org.
 *
 * Usa o client anon do servidor: branding/orgs/org_domains/theme_templates são
 * de leitura pública (RLS), então não precisa de sessão nem service-role.
 * Retorna `null` quando nada casa.
 */
export async function resolveTenant(host: string): Promise<Tenant | null> {
  const bare = bareHost(host);
  if (!bare || isPlatformHost(bare)) return null;

  const supabase = await createClient();

  // 1) Descobrir o org: por slug (subdomínio) ou por domínio próprio.
  let org: TenantOrg | null = null;

  const subdomainSlug = subdomainOf(bare);
  if (subdomainSlug) {
    const { data } = await supabase
      .from("orgs")
      .select("id, name, slug, status")
      .eq("slug", subdomainSlug)
      .maybeSingle();
    org = (data as TenantOrg | null) ?? null;
  } else {
    const { data: domain } = await supabase
      .from("org_domains")
      .select("org_id")
      .eq("hostname", bare)
      .eq("status", "active")
      .maybeSingle();
    const orgId = (domain as { org_id: string } | null)?.org_id;
    if (orgId) {
      const { data } = await supabase
        .from("orgs")
        .select("id, name, slug, status")
        .eq("id", orgId)
        .maybeSingle();
      org = (data as TenantOrg | null) ?? null;
    }
  }

  if (!org) return null;

  // 2) Branding do org (pode não existir ainda → usa o tema padrão).
  const { data: brandingRow } = await supabase
    .from("org_branding")
    .select("theme_template_id, logo_url, custom_css, palette")
    .eq("org_id", org.id)
    .maybeSingle();

  const branding = brandingRow as {
    theme_template_id: string | null;
    logo_url: string | null;
    custom_css: string | null;
    palette: Partial<ThemeTokens> | null;
  } | null;

  // 3) Tokens do template escolhido (ou default) + overrides da palette.
  let templateTokens: Partial<ThemeTokens> | null = null;
  if (branding?.theme_template_id) {
    const { data: tpl } = await supabase
      .from("theme_templates")
      .select("tokens")
      .eq("id", branding.theme_template_id)
      .maybeSingle();
    templateTokens =
      (tpl as { tokens: Partial<ThemeTokens> } | null)?.tokens ?? null;
  }

  const tokens = templateTokens || branding?.palette
    ? mergeTokens(templateTokens, branding?.palette)
    : DEFAULT_TOKENS;

  return {
    org,
    branding: branding
      ? { logo_url: branding.logo_url, custom_css: branding.custom_css }
      : null,
    tokens,
  };
}

/**
 * Se o host for um subdomínio da plataforma (`<slug>.educaty.app`) ou, em dev,
 * `<slug>.localhost`, devolve o slug; senão `null` (é domínio próprio).
 */
function subdomainOf(bare: string): string | null {
  const suffixes = [`.${APP_DOMAIN}`, ".localhost"];
  for (const suffix of suffixes) {
    if (bare.endsWith(suffix)) {
      const slug = bare.slice(0, -suffix.length);
      // Um único rótulo (sem pontos) é um subdomínio de tenant válido.
      if (slug && !slug.includes(".")) return slug;
    }
  }
  return null;
}
