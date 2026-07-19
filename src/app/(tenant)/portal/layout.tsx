import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { tokensToCssVars } from "@/lib/theme";

/**
 * Shell do TENANT. Resolve a marca pelo host da requisição (header `x-tenant-host`
 * injetado pelo proxy; fallback para `host`) e injeta os tokens do banco como
 * variáveis CSS inline no wrapper — toda a subárvore herda a cara do tenant.
 * Sem tenant → "portal não encontrado".
 */
export default async function TenantLayout({
  children,
}: {
  children: ReactNode;
}) {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (!tenant) {
    return (
      <main className="grid flex-1 place-items-center bg-bg px-6 text-ink">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Portal não encontrado
          </h1>
          <p className="mt-2 text-sub">
            Nenhum portal está publicado neste endereço.
          </p>
        </div>
      </main>
    );
  }

  const { org, branding, tokens } = tenant;
  const style = {
    ...tokensToCssVars(tokens),
    fontFamily: "var(--font-tenant)",
  } as CSSProperties;

  return (
    <div style={style} className="flex min-h-full flex-1 flex-col bg-bg text-ink">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-4">
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt={org.name}
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-surface">
              {org.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-lg font-extrabold tracking-tight">
            {org.name}
          </span>
        </div>
      </header>

      {children}
    </div>
  );
}
