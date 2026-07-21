"use client";

import { useActionState, useState } from "react";
import { STUDENT_FIELDS, type FieldConfig } from "@/lib/studentFields";
import { saveStudentForm, type StudentState } from "../../actions";

type Sel = Record<string, { enabled: boolean; required: boolean }>;

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

export function FieldsConfigurator({
  initial, enrollEnabled, enrollLink,
}: {
  initial: FieldConfig[];
  enrollEnabled: boolean;
  enrollLink: string;
}) {
  const [state, action, pending] = useActionState<StudentState, FormData>(saveStudentForm, {});
  const cfg = new Map(initial.map((f) => [f.key, f]));
  const [sel, setSel] = useState<Sel>(() =>
    Object.fromEntries(
      STUDENT_FIELDS.map((f) => {
        const c = cfg.get(f.key);
        return [f.key, { enabled: f.alwaysOn ? true : !!c, required: f.alwaysOn ? true : !!c?.required }];
      }),
    ),
  );
  const [copied, setCopied] = useState(false);

  const fields: FieldConfig[] = STUDENT_FIELDS.filter((f) => sel[f.key]?.enabled).map((f) => ({
    key: f.key,
    required: !!sel[f.key]?.required,
  }));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="enroll_enabled" defaultChecked={enrollEnabled} />
          Ativar link de autocadastro
        </label>
        <p className="mt-2 text-sm text-sub">
          Compartilhe este link para o aluno se cadastrar sozinho — ele entra como{" "}
          <span className="font-medium text-ink">pendente</span> para você aprovar.
        </p>
        <div className="mt-2 flex gap-2">
          <input readOnly value={enrollLink} className={field} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(enrollLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="shrink-0 rounded-lg border border-edge px-3 text-sm font-medium text-sub hover:border-primary"
          >
            {copied ? "copiado!" : "copiar"}
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-hint">Campos do cadastro</h2>
        <p className="mt-1 text-xs text-sub">Escolha o que aparece no cadastro (do professor e do link) e o que é obrigatório.</p>
        <ul className="mt-3 flex flex-col divide-y divide-edge">
          {STUDENT_FIELDS.map((f) => {
            const s = sel[f.key];
            return (
              <li key={f.key} className="flex items-center justify-between gap-4 py-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    disabled={f.alwaysOn}
                    onChange={(e) =>
                      setSel((prev) => ({
                        ...prev,
                        [f.key]: { enabled: e.target.checked, required: e.target.checked ? prev[f.key].required : false },
                      }))
                    }
                  />
                  {f.label}
                </label>
                <label className={`flex items-center gap-2 text-sm ${s.enabled ? "text-sub" : "text-hint opacity-50"}`}>
                  <input
                    type="checkbox"
                    checked={s.required}
                    disabled={f.alwaysOn || !s.enabled}
                    onChange={(e) => setSel((prev) => ({ ...prev, [f.key]: { ...prev[f.key], required: e.target.checked } }))}
                  />
                  obrigatório
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-end gap-3">
        {state.ok && <span className="text-sm text-success">Salvo!</span>}
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
