import Link from "next/link";
import { requireTeacher } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";

/** Início do workspace: contadores reais + próximos passos. Sem mock data. */
export default async function GerenciarHome() {
  const { tenant, role } = await requireTeacher();
  const supabase = await createClient();

  const [{ count: alunos }, { count: turmas }] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("org_id", tenant.org.id)
      .eq("status", "active"),
    supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("org_id", tenant.org.id),
  ]);

  const nAlunos = alunos ?? 0;
  const nTurmas = turmas ?? 0;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Painel de {tenant.org.name}
        </h1>
        <p className="mt-1 text-sm text-sub">
          {role === "owner" ? "Você é o responsável" : "Acesso de equipe"} · gerencie seus
          alunos e turmas.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/gerenciar/alunos"
          className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm transition-colors hover:border-primary"
        >
          <div className="text-3xl font-extrabold text-ink">{nAlunos}</div>
          <div className="mt-1 text-sm font-medium text-sub">
            {nAlunos === 1 ? "aluno ativo" : "alunos ativos"}
          </div>
        </Link>

        <Link
          href="/gerenciar/turmas"
          className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm transition-colors hover:border-primary"
        >
          <div className="text-3xl font-extrabold text-ink">{nTurmas}</div>
          <div className="mt-1 text-sm font-medium text-sub">
            {nTurmas === 1 ? "turma" : "turmas"}
          </div>
        </Link>
      </div>

      {nAlunos === 0 && (
        <div className="mt-6 rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center">
          <p className="text-sm text-sub">
            Comece trazendo seus alunos para o Listeny.
          </p>
          <Link
            href="/gerenciar/alunos"
            className="mt-4 inline-flex rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
          >
            Adicionar aluno
          </Link>
        </div>
      )}
    </div>
  );
}
