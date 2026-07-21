"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Aceita o convite via RPC accept_invitation e entra no console (plataforma). */
export function AcceptButton({ token, nextUrl }: { token: string; nextUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_invitation", { p_token: token });
    if (error) {
      setError("Não foi possível aceitar o convite. Ele pode ter expirado.");
      setLoading(false);
      return;
    }
    window.location.href = nextUrl;
  }

  return (
    <div>
      <button
        type="button"
        onClick={accept}
        disabled={loading}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Aceitar e entrar"}
      </button>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
