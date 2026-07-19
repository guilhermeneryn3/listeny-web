"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createSession,
  updateSession,
  setSessionStatus,
  setAttendance,
  removeSession,
  type SessionState,
} from "../actions";

export type Participant = { student_id: string; name: string; attendance: "pending" | "present" | "absent" };
export type SessionRow = {
  id: string;
  title: string;
  kind: "in_person" | "online";
  starts_at: string;
  duration_min: number;
  location: string | null;
  meeting_url: string | null;
  recording_url: string | null;
  class_id: string | null;
  notes: string | null;
  status: "scheduled" | "done" | "canceled" | "no_show";
  participants: Participant[];
};
export type StudentLite = { id: string; name: string };
export type ClassLite = { id: string; name: string };

const field =
  "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

/** ISO (UTC) → valor do input datetime-local no fuso do navegador. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function SessionForm({
  session,
  students,
  classes,
  onDone,
}: {
  session?: SessionRow;
  students: StudentLite[];
  classes: ClassLite[];
  onDone: () => void;
}) {
  const isEdit = !!session;
  const [state, action, pending] = useActionState<SessionState, FormData>(
    isEdit ? updateSession : createSession,
    {},
  );
  const [local, setLocal] = useState(session ? toLocalInput(session.starts_at) : "");
  const startsAtIso = local ? new Date(local).toISOString() : "";
  const picked = new Set(session?.participants.map((p) => p.student_id) ?? []);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className={`rounded-[var(--radius)] border bg-surface p-4 shadow-sm ${isEdit ? "border-primary" : "border-edge"}`}>
      {isEdit && <input type="hidden" name="id" value={session.id} />}
      <input type="hidden" name="starts_at" value={startsAtIso} />

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" placeholder="Título (ex.: Treino, Aula de violão)" required defaultValue={session?.title ?? ""} className={`sm:col-span-2 ${field}`} />

        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Tipo</span>
          <select name="kind" defaultValue={session?.kind ?? "in_person"} className={field}>
            <option value="in_person">Presencial</option>
            <option value="online">Online</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Data e hora</span>
          <input type="datetime-local" required value={local} onChange={(e) => setLocal(e.target.value)} className={field} />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Duração (min)</span>
          <input name="duration_min" type="number" min={5} step={5} defaultValue={session?.duration_min ?? 60} className={field} />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Turma (opcional)</span>
          <select name="class_id" defaultValue={session?.class_id ?? ""} className={field}>
            <option value="">—</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <input name="location" placeholder="Local / endereço (se presencial)" defaultValue={session?.location ?? ""} className={field} />
        <input name="meeting_url" placeholder="Link da chamada (se online)" defaultValue={session?.meeting_url ?? ""} className={field} />
        <input name="recording_url" placeholder="Link da gravação (assistir depois)" defaultValue={session?.recording_url ?? ""} className={`sm:col-span-2 ${field}`} />
        <input name="notes" placeholder="Observações (opcional)" defaultValue={session?.notes ?? ""} className={`sm:col-span-2 ${field}`} />
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-sm font-medium text-sub">Participantes</span>
        {students.length === 0 ? (
          <p className="text-sm text-hint">Cadastre alunos para adicionar à sessão.</p>
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

      {!isEdit && (
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-sub">Repetir semanalmente por (semanas)</span>
          <input name="repeat_weeks" type="number" min={0} max={52} defaultValue={0} className={`${field} sm:w-40`} />
        </label>
      )}

      {state.error && <p className="mt-3 text-sm text-danger" role="alert">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : isEdit ? "Salvar" : "Agendar"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

const STATUS_LABEL: Record<SessionRow["status"], string> = {
  scheduled: "Agendada",
  done: "Concluída",
  canceled: "Cancelada",
  no_show: "Falta",
};

function SessionCard({ s, onEdit }: { s: SessionRow; onEdit: () => void }) {
  const cancelled = s.status === "canceled";
  return (
    <div className={`rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm ${cancelled ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-16 shrink-0 text-center">
          <div className="text-lg font-extrabold text-ink">{timeFmt.format(new Date(s.starts_at))}</div>
          <div className="text-xs text-hint">{s.duration_min}min</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{s.title}</span>
            <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
              {s.kind === "online" ? "online" : "presencial"}
            </span>
            {s.status !== "scheduled" && (
              <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">
                {STATUS_LABEL[s.status]}
              </span>
            )}
          </div>
          {(s.location || s.meeting_url) && (
            <div className="mt-0.5 truncate text-sm text-sub">{s.location ?? s.meeting_url}</div>
          )}
          {s.recording_url && (
            <a href={s.recording_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-sm font-medium text-primary-dark hover:underline">
              Ver gravação
            </a>
          )}
        </div>
      </div>

      {s.participants.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-edge pt-3">
          {s.participants.map((p) => (
            <li key={p.student_id} className="flex items-center justify-between text-sm">
              <span className="text-ink">{p.name}</span>
              <div className="flex gap-1">
                {(["present", "absent"] as const).map((att) => (
                  <form key={att} action={setAttendance}>
                    <input type="hidden" name="session_id" value={s.id} />
                    <input type="hidden" name="student_id" value={p.student_id} />
                    <input type="hidden" name="attendance" value={p.attendance === att ? "pending" : att} />
                    <button
                      type="submit"
                      className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                        p.attendance === att
                          ? att === "present" ? "bg-success text-surface" : "bg-danger text-surface"
                          : "text-sub hover:bg-soft"
                      }`}
                    >
                      {att === "present" ? "Presente" : "Faltou"}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-edge pt-3">
        {s.status !== "done" && (
          <form action={setSessionStatus}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="status" value="done" />
            <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Concluir</button>
          </form>
        )}
        {s.status !== "canceled" ? (
          <form action={setSessionStatus}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="status" value="canceled" />
            <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Cancelar</button>
          </form>
        ) : (
          <form action={setSessionStatus}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="status" value="scheduled" />
            <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Reabrir</button>
          </form>
        )}
        <button type="button" onClick={onEdit} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
        <form action={removeSession} onSubmit={(e) => { if (!window.confirm("Remover esta sessão?")) e.preventDefault(); }}>
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
        </form>
      </div>
    </div>
  );
}

export function AgendaManager({
  sessions,
  students,
  classes,
}: {
  sessions: SessionRow[];
  students: StudentLite[];
  classes: ClassLite[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // agrupa por dia (local)
  const groups = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const key = dayFmt.format(new Date(s.starts_at));
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(s);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Agenda</h1>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Nova sessão
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <SessionForm students={students} classes={classes} onDone={() => setAdding(false)} />
        </div>
      )}

      {sessions.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhuma sessão agendada. Crie a primeira — presencial ou online.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-sub">{day}</h2>
              <div className="flex flex-col gap-2">
                {items.map((s) =>
                  editingId === s.id ? (
                    <SessionForm key={s.id} session={s} students={students} classes={classes} onDone={() => setEditingId(null)} />
                  ) : (
                    <SessionCard key={s.id} s={s} onEdit={() => { setEditingId(s.id); setAdding(false); }} />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
