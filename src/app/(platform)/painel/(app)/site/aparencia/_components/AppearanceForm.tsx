"use client";

import { useActionState } from "react";
import { saveAppearance, type SiteState } from "../../actions";
import { Section, SaveBar, field, labelCls } from "../../_components/ui";

export type Template = { id: string; key: string; name: string };

export function AppearanceForm({
  templates, themeTemplateId, logoUrl, primary,
}: {
  templates: Template[];
  themeTemplateId: string;
  logoUrl: string;
  primary: string;
}) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveAppearance, {});

  return (
    <form action={action} className="space-y-4">
      <Section title="Tema" desc="A base visual do seu site e da área do aluno.">
        <div className="grid gap-2 sm:grid-cols-2">
          {templates.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2.5 text-sm font-medium text-ink has-[:checked]:border-primary has-[:checked]:bg-tint"
            >
              <input type="radio" name="theme_template_id" value={t.id} defaultChecked={t.id === themeTemplateId} />
              {t.name}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Marca">
        <div>
          <label className={labelCls}>Logo (URL) — opcional</label>
          <input name="logo_url" type="url" defaultValue={logoUrl} placeholder="https://…/logo.png" className={field} />
        </div>
        <div>
          <label className={labelCls}>Cor principal</label>
          <div className="flex items-center gap-3">
            <input type="color" name="primary" defaultValue={primary} className="h-10 w-16 cursor-pointer rounded-lg border border-edge bg-surface p-1" />
            <span className="text-sm text-sub">Botões, links e destaques usam essa cor.</span>
          </div>
        </div>
      </Section>

      <SaveBar ok={state.ok} error={state.error} pending={pending} />
    </form>
  );
}
