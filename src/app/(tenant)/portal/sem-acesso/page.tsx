import Link from "next/link";

/** Usuário logado, mas sem vínculo de gestão neste portal. */
export default function SemAcessoPage() {
  return (
    <main className="grid flex-1 place-items-center px-6 py-24 text-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Sem acesso a este painel
        </h1>
        <p className="mt-2 max-w-md text-sub">
          Sua conta não gerencia este portal. Se você é aluno, use o link enviado pelo seu
          professor.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
        >
          Voltar ao portal
        </Link>
      </div>
    </main>
  );
}
