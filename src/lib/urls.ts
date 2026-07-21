/**
 * Helpers de URL entre host de PLATAFORMA (console do profissional) e host de TENANT
 * (subdomínio/aluno). O console mora na plataforma (`listeny.app/painel`); o aluno e o site
 * moram no subdomínio. Redirecionar um gestor que caiu no subdomínio → console é cross-host.
 */
const APP_DOMAIN = (
  process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app"
).toLowerCase();

/** Cookie que guarda o portal (slug do org) selecionado no console. */
export const PORTAL_COOKIE = "listeny_portal";

/** Origem (proto+host+porta) da PLATAFORMA, derivada de um host que pode ser de tenant. */
export function platformOrigin(host: string): string {
  const [hostname, port] = host.split(":");
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  const proto = isLocal ? "http" : "https";

  let platformHost: string;
  if (hostname.endsWith(".localhost")) platformHost = "localhost";
  else if (isLocal) platformHost = hostname;
  else if (hostname.endsWith(`.${APP_DOMAIN}`)) platformHost = APP_DOMAIN;
  else platformHost = APP_DOMAIN; // domínio próprio do tenant → plataforma em produção

  return `${proto}://${platformHost}${port ? `:${port}` : ""}`;
}

/** URL absoluta do console na plataforma, a partir de um host (de tenant ou plataforma). */
export function consoleUrl(host: string, path = "/painel"): string {
  return platformOrigin(host) + path;
}
