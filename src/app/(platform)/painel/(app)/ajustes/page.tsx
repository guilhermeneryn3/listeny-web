import Link from "next/link";
import { requireManager } from "@/lib/teacher";
import { isAdmin } from "@/lib/roles";

/** Ajustes do org. A gestão de módulos/profissões mora na Loja — aqui fica o atalho. */
export default async function AjustesPage() {
  const { role } = await requireManager();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ajustes</h1>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-sub">Módulos e profissões</h2>
      {isAdmin(role) ? (
        <Link
          href="/painel/loja"
          className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm transition-colors hover:border-primary"
        >
          <div>
            <div className="font-medium text-ink">Loja</div>
            <p className="mt-0.5 text-sm text-sub">
              Instale módulos e profissões e veja o total da sua mensalidade.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary-dark">Abrir →</span>
        </Link>
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
          Somente dono e diretor podem gerenciar módulos.
        </p>
      )}
    </div>
  );
}
