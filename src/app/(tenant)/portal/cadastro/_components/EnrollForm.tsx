"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { studentField, fieldsByGroup, type FieldConfig } from "@/lib/studentFields";

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function FieldInput({ cfg }: { cfg: FieldConfig }) {
  const f = studentField(cfg.key);
  if (!f) return null;
  const label = <span className="mb-1 block text-sm font-medium text-sub">{f.label}{cfg.required ? " *" : ""}</span>;

  if (f.type === "select") {
    return (
      <label className="text-sm">{label}
        <select name={cfg.key} required={cfg.required} defaultValue="" className={field}>
          <option value="">—</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (f.type === "textarea") {
    return (
      <label className="text-sm sm:col-span-2">{label}
        <textarea name={cfg.key} required={cfg.required} rows={3} className={field} />
      </label>
    );
  }
  const t = f.type === "date" ? "date" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : f.type === "url" ? "url" : "text";
  return (
    <label className="text-sm">{label}
      <input name={cfg.key} type={t} required={cfg.required} className={field} />
    </label>
  );
}

/** Formulário público de autocadastro. Envia via RPC self_enroll (aluno entra pendente). */
export function EnrollForm({ orgId, fields }: { orgId: string; fields: FieldConfig[] }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const profile: Record<string, string> = {};
    let name = "";
    let email: string | null = null;
    let phone: string | null = null;
    for (const cfg of fields) {
      const v = String(fd.get(cfg.key) ?? "").trim();
      if (cfg.key === "name") name = v;
      else if (cfg.key === "email") email = v ? v.toLowerCase() : null;
      else if (cfg.key === "phone") phone = v || null;
      else if (v) profile[cfg.key] = v;
    }

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("self_enroll", {
      p_org: orgId, p_name: name, p_email: email, p_phone: phone, p_profile: profile,
    });
    setLoading(false);
    if (rpcError) {
      const m = rpcError.message || "";
      setError(
        m.includes("já cadastrado") ? "Esse e-mail já está cadastrado neste portal."
        : m.includes("desativado") ? "O cadastro não está disponível no momento."
        : "Não foi possível enviar. Tente novamente.",
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius)] border border-edge bg-surface p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-ink">Cadastro enviado!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-sub">
          Recebemos seu cadastro. Ele está aguardando aprovação — você será avisado quando for liberado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fieldsByGroup(fields).map(({ group, items }) => (
        <div key={group} className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-hint">{group}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((cfg) => <FieldInput key={cfg.key} cfg={cfg} />)}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-[var(--radius)] bg-primary px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar cadastro"}
      </button>
    </form>
  );
}
