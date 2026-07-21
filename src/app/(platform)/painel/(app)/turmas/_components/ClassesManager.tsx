"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createClass,
  updateClass,
  removeClass,
  setClassStudent,
  type ClassState,
} from "../actions";

export type ClassRow = {
  id: string;
  name: string;
  description: string | null;
  studentIds: string[];
};
export type StudentLite = { id: string; name: string };

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function ClassForm({
  klass,
  onDone,
}: {
  klass?: ClassRow;
  onDone: () => void;
}) {
  const action = klass ? updateClass : createClass;
  const [state, formAction, pending] = useActionState<ClassState, FormData>(action, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      className={`rounded-[var(--radius)] border bg-surface p-4 shadow-sm ${klass ? "border-primary" : "border-edge"}`}
    >
      {klass && <input type="hidden" name="id" value={klass.id} />}
      <div className="grid gap-3">
        <input name="name" placeholder="Nome da turma" required defaultValue={klass?.name ?? ""} className={field} />
        <input name="description" placeholder="Descrição (opcional)" defaultValue={klass?.description ?? ""} className={field} />
      </div>
      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : klass ? "Salvar" : "Criar turma"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function StudentsPanel({ klass, students }: { klass: ClassRow; students: StudentLite[] }) {
  if (students.length === 0) {
    return (
      <p className="mt-3 rounded-lg bg-soft p-3 text-sm text-sub">
        Você ainda não tem alunos para vincular.
      </p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-1">
      {students.map((s) => {
        const linked = klass.studentIds.includes(s.id);
        return (
          <li key={s.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-soft">
            <span className="text-sm text-ink">{s.name}</span>
            <form action={setClassStudent}>
              <input type="hidden" name="class_id" value={klass.id} />
              <input type="hidden" name="student_id" value={s.id} />
              <input type="hidden" name="on" value={linked ? "false" : "true"} />
              <button
                type="submit"
                className={`rounded-lg px-2.5 py-1 text-sm font-medium ${linked ? "text-danger hover:bg-surface" : "text-primary-dark hover:bg-surface"}`}
              >
                {linked ? "Remover" : "Adicionar"}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

export function ClassesManager({
  classes,
  students,
}: {
  classes: ClassRow[];
  students: StudentLite[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Turmas</h1>
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
          >
            Nova turma
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <ClassForm onDone={() => setAdding(false)} />
        </div>
      )}

      {classes.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhuma turma ainda. Crie uma para agrupar seus alunos.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {classes.map((c) =>
            editingId === c.id ? (
              <li key={c.id}>
                <ClassForm klass={c} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li key={c.id} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{c.name}</div>
                    <div className="text-sm text-sub">
                      {c.studentIds.length} {c.studentIds.length === 1 ? "aluno" : "alunos"}
                      {c.description ? ` · ${c.description}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">
                      Alunos
                    </button>
                    <button type="button" onClick={() => { setEditingId(c.id); setAdding(false); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">
                      Editar
                    </button>
                    <form
                      action={removeClass}
                      onSubmit={(e) => {
                        if (!window.confirm(`Remover a turma ${c.name}?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
                {expandedId === c.id && <StudentsPanel klass={c} students={students} />}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
