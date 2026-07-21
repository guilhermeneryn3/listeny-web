"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { studentField, fieldsByGroup, type FieldConfig } from "@/lib/studentFields";
import {
  createStudent,
  updateStudent,
  setStudentStatus,
  removeStudent,
  grantStudentAccess,
  type StudentState,
  type GrantState,
} from "../actions";

export type Student = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: "active" | "inactive" | "pending";
  hasAccess: boolean;
  avatarUrl: string | null;
  profile: Record<string, string>;
};

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function fieldValue(student: Student | undefined, key: string): string {
  if (!student) return "";
  switch (key) {
    case "name": return student.name;
    case "email": return student.email ?? "";
    case "phone": return student.phone ?? "";
    case "notes": return student.notes ?? "";
    case "avatar_url": return student.avatarUrl ?? "";
    default: return student.profile[key] ?? "";
  }
}

function FieldInput({ cfg, student }: { cfg: FieldConfig; student?: Student }) {
  const f = studentField(cfg.key);
  if (!f) return null;
  const val = fieldValue(student, cfg.key);
  const label = (
    <span className="mb-1 block text-sm font-medium text-sub">{f.label}{cfg.required ? " *" : ""}</span>
  );

  if (f.type === "select") {
    return (
      <label className="text-sm">{label}
        <select name={cfg.key} defaultValue={val} required={cfg.required} className={field}>
          <option value="">—</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (f.type === "textarea") {
    return (
      <label className="text-sm sm:col-span-2">{label}
        <textarea name={cfg.key} defaultValue={val} required={cfg.required} rows={3} className={field} />
      </label>
    );
  }
  const inputType = f.type === "date" ? "date" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : f.type === "url" ? "url" : "text";
  return (
    <label className="text-sm">{label}
      <input name={cfg.key} type={inputType} defaultValue={val} required={cfg.required} className={field} />
    </label>
  );
}

function Fields({ fields, student }: { fields: FieldConfig[]; student?: Student }) {
  return (
    <div className="space-y-4">
      {fieldsByGroup(fields).map(({ group, items }) => (
        <div key={group}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-hint">{group}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((cfg) => <FieldInput key={cfg.key} cfg={cfg} student={student} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); } catch { window.prompt("Copie a senha:", value); }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-primary-dark hover:bg-surface"
    >
      {copied ? "copiado!" : "copiar"}
    </button>
  );
}

function GrantAccess({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<GrantState, FormData>(grantStudentAccess, {});
  if (state.tempPassword) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-tint px-2 py-1 text-xs">
        <span className="text-hint">senha 1º acesso:</span>
        <code className="font-mono text-sm font-bold text-ink">{state.tempPassword}</code>
        <CopyBtn value={state.tempPassword} />
      </span>
    );
  }
  if (state.linked) return <span className="text-xs font-medium text-success">acesso vinculado à conta existente</span>;
  return (
    <form action={action}>
      <input type="hidden" name="student_id" value={studentId} />
      <button type="submit" disabled={pending} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-dark hover:bg-soft disabled:opacity-60">
        {pending ? "…" : "Dar acesso"}
      </button>
      {state.error && <span className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}

function AddForm({ fields, onDone }: { fields: FieldConfig[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<StudentState, FormData>(createStudent, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <Fields fields={fields} />
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar aluno"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function EditForm({ fields, student, onDone }: { fields: FieldConfig[]; student: Student; onDone: () => void }) {
  const [state, action, pending] = useActionState<StudentState, FormData>(updateStudent, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className="rounded-[var(--radius)] border border-primary bg-surface p-4 shadow-sm">
      <input type="hidden" name="id" value={student.id} />
      <Fields fields={fields} student={student} />
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function Avatar({ student }: { student: Student }) {
  if (student.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={student.avatarUrl} alt={student.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint text-sm font-bold text-primary-dark">
      {student.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function StudentsManager({ students, fields }: { students: Student[]; fields: FieldConfig[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students;
  const activeCount = students.filter((s) => s.status === "active").length;
  const pendingCount = students.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Alunos</h1>
          <p className="mt-0.5 text-sm text-sub">
            {activeCount} {activeCount === 1 ? "aluno ativo" : "alunos ativos"}
            {pendingCount > 0 ? ` · ${pendingCount} pendente${pendingCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/painel/alunos/campos" className="rounded-[var(--radius)] border border-edge px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary">
            Campos do cadastro
          </Link>
          {!adding && (
            <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
              Adicionar aluno
            </button>
          )}
        </div>
      </div>

      {adding && <div className="mb-4"><AddForm fields={fields} onDone={() => setAdding(false)} /></div>}

      {students.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar aluno pelo nome…"
          className={`mb-3 ${field}`}
        />
      )}

      {students.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhum aluno ainda. Clique em “Adicionar aluno” para começar.
        </div>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-sub">Nenhum aluno encontrado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((s) =>
            editingId === s.id ? (
              <li key={s.id}><EditForm fields={fields} student={s} onDone={() => setEditingId(null)} /></li>
            ) : (
              <li key={s.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <Avatar student={s} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink">{s.name}</span>
                    {s.status === "pending" && (
                      <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">pendente</span>
                    )}
                    {s.status === "inactive" && (
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">inativo</span>
                    )}
                    {s.hasAccess && (
                      <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">com acesso</span>
                    )}
                  </div>
                  <div className="truncate text-sm text-sub">{s.email ?? s.phone ?? "—"}</div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {s.status === "pending" && (
                    <form action={setStudentStatus}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value="active" />
                      <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-surface hover:bg-primary-dark">Aprovar</button>
                    </form>
                  )}
                  {s.email && !s.hasAccess && s.status === "active" && <GrantAccess studentId={s.id} />}
                  <button type="button" onClick={() => { setEditingId(s.id); setAdding(false); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
                  {s.status !== "pending" && (
                    <form action={setStudentStatus}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value={s.status === "active" ? "inactive" : "active"} />
                      <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">
                        {s.status === "active" ? "Inativar" : "Reativar"}
                      </button>
                    </form>
                  )}
                  <form action={removeStudent} onSubmit={(e) => { if (!window.confirm(`Remover ${s.name}? Essa ação não pode ser desfeita.`)) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
