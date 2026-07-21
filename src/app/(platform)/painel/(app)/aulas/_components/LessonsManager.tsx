"use client";

import { useActionState, useEffect, useState } from "react";
import { createLesson, updateLesson, removeLesson, type LessonState } from "../actions";

export type Media = { url: string; name: string | null };
export type LessonRow = {
  id: string;
  title: string;
  type: "lesson" | "homework" | "goal";
  description: string | null;
  due_date: string | null;
  class_id: string | null;
  studentIds: string[];
  doneCount: number;
  totalCount: number;
  media: Media[];
};
export type StudentLite = { id: string; name: string };
export type ClassLite = { id: string; name: string };

export const TYPE_LABEL: Record<LessonRow["type"], string> = { lesson: "Aula", homework: "Tarefa", goal: "Meta" };

const field = "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function LessonForm({
  lesson,
  students,
  classes,
  onDone,
}: {
  lesson?: LessonRow;
  students: StudentLite[];
  classes: ClassLite[];
  onDone: () => void;
}) {
  const isEdit = !!lesson;
  const [state, action, pending] = useActionState<LessonState, FormData>(isEdit ? updateLesson : createLesson, {});
  const [media, setMedia] = useState<Media[]>(lesson?.media.length ? lesson.media : [{ url: "", name: "" }]);
  const picked = new Set(lesson?.studentIds ?? []);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);

  return (
    <form action={action} className={`rounded-[var(--radius)] border bg-surface p-4 shadow-sm ${isEdit ? "border-primary" : "border-edge"}`}>
      {isEdit && <input type="hidden" name="id" value={lesson.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" required placeholder="Título" defaultValue={lesson?.title ?? ""} className={`sm:col-span-2 ${field}`} />
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Tipo</span>
          <select name="type" defaultValue={lesson?.type ?? "lesson"} className={field}>
            <option value="lesson">Aula</option>
            <option value="homework">Tarefa</option>
            <option value="goal">Meta</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Prazo (opcional)</span>
          <input type="date" name="due_date" defaultValue={lesson?.due_date ?? ""} className={field} />
        </label>
        <textarea name="description" rows={3} placeholder="Descrição / instruções" defaultValue={lesson?.description ?? ""} className={`sm:col-span-2 ${field}`} />
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-sub">Turma (opcional)</span>
          <select name="class_id" defaultValue={lesson?.class_id ?? ""} className={field}>
            <option value="">—</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-sm font-medium text-sub">Atribuir a alunos</span>
        {students.length === 0 ? (
          <p className="text-sm text-hint">Cadastre alunos para atribuir.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1 text-sm">
                <input type="checkbox" name="student_ids" value={s.id} defaultChecked={picked.has(s.id)} />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-sm font-medium text-sub">Vídeo e materiais (links)</span>
        <p className="mb-1.5 text-xs text-hint">Link do YouTube ou Vimeo vira player de vídeo na aula. Outros links (PDF, Drive) viram material.</p>
        <div className="flex flex-col gap-2">
          {media.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input name="media_url" defaultValue={m.url} placeholder="https://youtube.com/… ou PDF/Drive" className={field} />
              <input name="media_name" defaultValue={m.name ?? ""} placeholder="Nome (opcional)" className={`${field} sm:w-48`} />
              <button type="button" onClick={() => setMedia(media.filter((_, j) => j !== i))} className="shrink-0 rounded-lg px-2 text-sm text-danger hover:bg-soft">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setMedia([...media, { url: "", name: "" }])} className="mt-2 text-sm font-medium text-primary-dark hover:underline">
          + adicionar link
        </button>
      </div>

      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function LessonCard({ lesson, onEdit }: { lesson: LessonRow; onEdit: () => void }) {
  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{lesson.title}</span>
            <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{TYPE_LABEL[lesson.type]}</span>
            {lesson.due_date && <span className="text-xs text-hint">prazo {dateFmt.format(new Date(lesson.due_date + "T00:00:00"))}</span>}
          </div>
          {lesson.description && <p className="mt-1 line-clamp-2 text-sm text-sub">{lesson.description}</p>}
          <div className="mt-1 text-sm text-sub">
            {lesson.totalCount > 0 ? `${lesson.doneCount}/${lesson.totalCount} concluíram` : "sem alunos atribuídos"}
            {lesson.media.length > 0 ? ` · ${lesson.media.length} material(is)` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEdit} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
          <form action={removeLesson} onSubmit={(e) => { if (!window.confirm(`Remover "${lesson.title}"?`)) e.preventDefault(); }}>
            <input type="hidden" name="id" value={lesson.id} />
            <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function LessonsManager({ lessons, students, classes }: { lessons: LessonRow[]; students: StudentLite[]; classes: ClassLite[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Aulas</h1>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Nova aula
          </button>
        )}
      </div>

      {adding && <div className="mb-4"><LessonForm students={students} classes={classes} onDone={() => setAdding(false)} /></div>}

      {lessons.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhuma aula ainda. Crie uma aula, tarefa ou meta e atribua aos alunos.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((l) =>
            editingId === l.id ? (
              <li key={l.id}><LessonForm lesson={l} students={students} classes={classes} onDone={() => setEditingId(null)} /></li>
            ) : (
              <li key={l.id}><LessonCard lesson={l} onEdit={() => { setEditingId(l.id); setAdding(false); }} /></li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
