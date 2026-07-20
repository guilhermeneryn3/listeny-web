import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

/** Usuário logado, mas sem vínculo de gestão neste portal. */
export default function SemAcessoPage() {
  return (
    <main className="grid flex-1 place-items-center px-6 py-24 text-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Sem acesso a este painel
        </h1>
        <p className="mt-2 max-w-md text-sub">
          A conta logada não gerencia este portal. Se você é aluno, use a sua área de aluno; se
          entrou com a conta errada, saia e entre novamente.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
            >
              Sair e entrar com outra conta
            </button>
          </form>
          <Link href="/" className="text-sm font-medium text-sub hover:text-ink">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  );
}
