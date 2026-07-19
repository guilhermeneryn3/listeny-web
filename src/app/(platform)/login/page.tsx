"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/BrandMark";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/criar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    // Recarrega para o servidor enxergar a sessão.
    window.location.href = next;
  }

  const fieldClass =
    "w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
        <BrandMark />
        Educaty
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[var(--radius)] border border-edge bg-surface p-6 shadow-sm"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid flex-1 place-items-center bg-bg px-6 text-ink">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
