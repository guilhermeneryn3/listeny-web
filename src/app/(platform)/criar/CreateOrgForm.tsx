"use client";

import { useActionState, useState } from "react";
import { createOrg, type CreateOrgState } from "./actions";

export type TemplateOption = {
  id: string;
  key: string;
  name: string;
};

const APP_DOMAIN = process.env.NEXT_PUBLIC_LISTENY_APP_DOMAIN ?? "listeny.app";

/** Normaliza o que o usuário digita no campo de endereço em um slug válido. */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrgForm({ templates }: { templates: TemplateOption[] }) {
  const [state, formAction, pending] = useActionState<CreateOrgState, FormData>(
    createOrg,
    {},
  );
  const [slug, setSlug] = useState("");

  if (state.createdSlug) {
    return (
      <div className="rounded-[var(--radius)] border border-edge bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold text-success">Portal criado!</h2>
        <p className="mt-2 text-sub">Seu portal já está no ar em:</p>
        <p className="mt-2 font-semibold text-ink">
          {state.createdSlug}.{APP_DOMAIN}
        </p>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[var(--radius)] border border-edge bg-surface p-6 shadow-sm"
    >
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Nome do portal
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Escola do João"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="kind" className="mb-1.5 block text-sm font-medium">
          Tipo de conta
        </label>
        <select id="kind" name="kind" defaultValue="individual" className={fieldClass}>
          <option value="individual">Professor individual</option>
          <option value="institution">Instituição / escola</option>
        </select>
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">
          Endereço
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(toSlug(e.target.value))}
          placeholder="escola-do-joao"
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-hint">
          {slug ? `${slug}.${APP_DOMAIN}` : `seu-portal.${APP_DOMAIN}`}
        </p>
      </div>

      <div>
        <label
          htmlFor="theme_template_id"
          className="mb-1.5 block text-sm font-medium"
        >
          Tema
        </label>
        <select
          id="theme_template_id"
          name="theme_template_id"
          required
          defaultValue={templates[0]?.id ?? ""}
          className={fieldClass}
        >
          {templates.length === 0 && (
            <option value="" disabled>
              Nenhum tema disponível
            </option>
          )}
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="logo_url" className="mb-1.5 block text-sm font-medium">
          Logo (URL) <span className="text-hint">— opcional</span>
        </label>
        <input
          id="logo_url"
          name="logo_url"
          type="url"
          placeholder="https://…/logo.png"
          className={fieldClass}
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || templates.length === 0}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Criando…" : "Criar portal"}
      </button>
    </form>
  );
}
