import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";

/**
 * Página inicial do portal do tenant (placeholder da Fase 0). Prova que a "cara"
 * vem 100% da marca do tenant (tokens do banco → variáveis CSS herdadas do shell).
 * Sem cursos/aulas ainda.
 */
export default async function TenantHome() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (!tenant) return null;

  const { org } = tenant;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-6 inline-flex items-center rounded-full bg-tint px-4 py-1.5 text-sm font-semibold text-primary-dark">
        Portal em construção
      </span>

      <h1 className="text-balance text-4xl font-extrabold tracking-tight">
        Bem-vindo à {org.name}
      </h1>
      <p className="mt-4 max-w-xl text-balance text-lg text-sub">
        Este é o portal de ensino da {org.name}. Em breve, os cursos e aulas
        aparecerão aqui.
      </p>

      <button
        type="button"
        className="mt-10 rounded-[var(--radius)] bg-primary px-7 py-3 text-base font-semibold text-surface shadow-sm transition-colors hover:bg-primary-dark"
      >
        Começar
      </button>
    </main>
  );
}
