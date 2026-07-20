"use client";

import { useActionState, useEffect, useState } from "react";
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
  status: "active" | "inactive";
  hasAccess: boolean;
};

/** Botão "Dar acesso": cria/vincula a conta do aluno e mostra a senha de 1º acesso. */
function GrantAccess({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<GrantState, FormData>(grantStudentAccess, {});

  if (state.tempPassword) {
    return (
      <span className="text-xs text-sub">
        Senha de 1º acesso: <span className="font-mono font-semibold text-ink">{state.tempPassword}</span> (envie ao aluno)
      </span>
    );
  }
  if (state.linked) {
    return <span className="text-xs text-success">Acesso vinculado à conta existente</span>;
  }
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

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

/** Campos compartilhados por adicionar/editar. */
function Fields({ student }: { student?: Student }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Nome" required defaultValue={student?.name ?? ""} className={field} />
      <input name="email" type="email" placeholder="E-mail (opcional)" defaultValue={student?.email ?? ""} className={field} />
      <input name="phone" placeholder="Telefone (opcional)" defaultValue={student?.phone ?? ""} className={field} />
      <input name="notes" placeholder="Observações (opcional)" defaultValue={student?.notes ?? ""} className={field} />
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<StudentState, FormData>(createStudent, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <Fields />
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar aluno"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EditForm({ student, onDone }: { student: Student; onDone: () => void }) {
  const [state, action, pending] = useActionState<StudentState, FormData>(updateStudent, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="rounded-[var(--radius)] border border-primary bg-surface p-4 shadow-sm">
      <input type="hidden" name="id" value={student.id} />
      <Fields student={student} />
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function StudentsManager({ students }: { students: Student[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Alunos</h1>
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
          >
            Adicionar aluno
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <AddForm onDone={() => setAdding(false)} />
        </div>
      )}

      {students.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhum aluno ainda. Clique em “Adicionar aluno” para começar.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>
                <EditForm student={s} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint text-sm font-bold text-primary-dark">
                  {s.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{s.name}</span>
                    {s.status === "inactive" && (
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">
                        inativo
                      </span>
                    )}
                    {s.hasAccess && (
                      <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                        com acesso
                      </span>
                    )}
                  </div>
                  <div className="truncate text-sm text-sub">
                    {s.email ?? s.phone ?? "—"}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {s.email && !s.hasAccess && s.status === "active" && <GrantAccess studentId={s.id} />}
                  <button
                    type="button"
                    onClick={() => { setEditingId(s.id); setAdding(false); }}
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink"
                  >
                    Editar
                  </button>

                  <form action={setStudentStatus}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value={s.status === "active" ? "inactive" : "active"} />
                    <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">
                      {s.status === "active" ? "Inativar" : "Reativar"}
                    </button>
                  </form>

                  <form
                    action={removeStudent}
                    onSubmit={(e) => {
                      if (!window.confirm(`Remover ${s.name}? Essa ação não pode ser desfeita.`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">
                      Remover
                    </button>
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
