import { type NextRequest, NextResponse } from "next/server";

/**
 * Roteamento por host (Next 16 "proxy", ex-"middleware"). Faz SÓ roteamento — não toca
 * no Supabase nem em env vars (por isso a lista de hosts de plataforma é inline aqui,
 * espelhando `lib/tenant.ts`).
 *
 *  - Host de PLATAFORMA (listeny.app / www / localhost / 127.0.0.1 / *.vercel.app):
 *    landing pública em `/`, `/criar`, `/login`. Acesso direto a `/portal` é bloqueado
 *    (é a área interna do tenant).
 *  - Host de TENANT (`<slug>.listeny.app`, domínio próprio, `<slug>.localhost` em dev):
 *    reescreve tudo para dentro do grupo `(tenant)` em `/portal/*` e passa o host no
 *    header `x-tenant-host`, que o layout do tenant lê para resolver a marca.
 *
 * A resolução real do tenant (banco) fica no layout do portal (runtime Node).
 */
const APP_DOMAIN = (
  process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app"
).toLowerCase();

function isPlatformHost(host: string): boolean {
  return (
    host === APP_DOMAIN ||
    host === `www.${APP_DOMAIN}` ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  );
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  // Plataforma: /portal é interno do tenant, não existe aqui.
  if (isPlatformHost(host)) {
    if (pathname === "/portal" || pathname.startsWith("/portal/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Host de tenant: já reescrito? segue. Senão, prefixa /portal e injeta o host.
  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-host", host);

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/portal" : `/portal${pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Tudo, menos estáticos do Next e arquivos de imagem.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
