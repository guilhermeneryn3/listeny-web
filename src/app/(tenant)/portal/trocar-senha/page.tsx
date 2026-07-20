"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** 1º acesso: força o aluno (conta criada com senha temporária) a definir a própria senha. */
export default function TrocarSenhaPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("Use ao menos 8 caracteres.");
    if (pw !== pw2) return setError("As senhas não conferem.");

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/entrar"; return; }

    const { error: upErr } = await supabase.auth.updateUser({ password: pw });
    if (upErr) { setError("Não foi possível trocar a senha."); setLoading(false); return; }
    await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id);
    window.location.href = "/ir";
  }

  const field = "w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <main className="grid flex-1 place-items-center px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-[var(--radius)] border border-edge bg-surface p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-ink">Crie sua senha</h1>
          <p className="mt-1 text-sm text-sub">É o seu primeiro acesso. Defina uma senha só sua.</p>
        </div>
        <div>
          <label htmlFor="pw" className="mb-1.5 block text-sm font-medium">Nova senha</label>
          <input id="pw" type="password" required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="pw2" className="mb-1.5 block text-sm font-medium">Confirmar senha</label>
          <input id="pw2" type="password" required autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={field} />
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {loading ? "Salvando…" : "Salvar e entrar"}
        </button>
      </form>
    </main>
  );
}
