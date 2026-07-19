import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function PlatformLanding() {
  return (
    <main className="flex flex-1 flex-col bg-bg text-ink">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <BrandMark />
          Educaty
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-sub transition-colors hover:text-ink"
        >
          Entrar
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-tint px-4 py-1.5 text-sm font-semibold text-primary-dark">
          Plataforma white-label de ensino
        </span>

        <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Seu portal de ensino, com a{" "}
          <span className="text-primary">sua marca</span>.
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-sub">
          Cada professor ou criador ganha um portal próprio: logo, cores, tema e
          domínio seus. A Educaty é o motor — a cara é sempre a sua.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/criar"
            className="rounded-[var(--radius)] bg-primary px-7 py-3 text-base font-semibold text-surface shadow-sm transition-colors hover:bg-primary-dark"
          >
            Crie seu portal
          </Link>
          <Link
            href="/login"
            className="rounded-[var(--radius)] border border-edge bg-surface px-7 py-3 text-base font-semibold text-ink transition-colors hover:bg-soft"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-center text-sm text-hint">
        Educaty — um produto N3 Labz.
      </footer>
    </main>
  );
}
