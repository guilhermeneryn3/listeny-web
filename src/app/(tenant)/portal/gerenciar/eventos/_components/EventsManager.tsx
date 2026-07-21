"use client";

import { useActionState, useEffect, useState } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";
import { createEvent, updateEvent, removeEvent, type EventState } from "../actions";

export type EventRow = {
  id: string;
  title: string;
  type: "excursao" | "reuniao" | "evento" | "feriado" | "aviso";
  event_date: string;
  start_time: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  visibility: "public" | "internal";
};

export const TYPE_LABEL: Record<EventRow["type"], string> = {
  excursao: "Excursão", reuniao: "Reunião", evento: "Evento", feriado: "Feriado", aviso: "Aviso",
};

const field = "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
export const fmtDate = (d: string) => dateFmt.format(new Date(d + "T00:00:00"));

function EventForm({ event, defaultDate, onDone }: { event?: EventRow; defaultDate?: string | null; onDone: () => void }) {
  const isEdit = !!event;
  const [state, action, pending] = useActionState<EventState, FormData>(isEdit ? updateEvent : createEvent, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className={`rounded-[var(--radius)] border bg-surface p-4 shadow-sm ${isEdit ? "border-primary" : "border-edge"}`}>
      {isEdit && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" required placeholder="Título (ex.: Reunião de pais)" defaultValue={event?.title ?? ""} className={`sm:col-span-2 ${field}`} />
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Tipo</span>
          <select name="type" defaultValue={event?.type ?? "evento"} className={field}>
            {(Object.keys(TYPE_LABEL) as EventRow["type"][]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Visibilidade</span>
          <select name="visibility" defaultValue={event?.visibility ?? "public"} className={field}>
            <option value="public">Público (pais/alunos/site)</option>
            <option value="internal">Interno (só equipe)</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Data</span>
          <input type="date" name="event_date" required defaultValue={event?.event_date ?? defaultDate ?? ""} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Hora (opcional)</span>
          <input type="time" name="start_time" defaultValue={event?.start_time?.slice(0, 5) ?? ""} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Data fim (opcional)</span>
          <input type="date" name="end_date" defaultValue={event?.end_date ?? ""} className={field} />
        </label>
        <input name="location" placeholder="Local (opcional)" defaultValue={event?.location ?? ""} className={field} />
        <textarea name="description" rows={2} placeholder="Descrição (opcional)" defaultValue={event?.description ?? ""} className={`sm:col-span-2 ${field}`} />
      </div>
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar evento"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

export function EventsManager({ events, todayKey }: { events: EventRow[]; todayKey: string }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [cy, cm] = todayKey.split("-").map(Number);
  const items = events.map((e) => ({ key: e.event_date, tone: (e.visibility === "public" ? "primary" : "success") as "primary" | "success" }));
  const shown = selectedDay ? events.filter((e) => e.event_date === selectedDay) : events;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Eventos</h1>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Novo evento
          </button>
        )}
      </div>

      <div className="mb-4">
        <MonthCalendar year={cy} month={cm - 1} todayKey={todayKey} items={items} selectedKey={selectedDay} onSelect={(k) => { setSelectedDay(k); setAdding(false); }} />
      </div>
      {selectedDay && (
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-sub">Dia selecionado</span>
          <button type="button" onClick={() => setSelectedDay(null)} className="font-medium text-primary-dark hover:underline">Ver todos</button>
        </div>
      )}

      {adding && <div className="mb-4"><EventForm defaultDate={selectedDay} onDone={() => setAdding(false)} /></div>}

      {shown.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          {selectedDay ? "Nenhum evento neste dia." : "Nenhum evento ainda. Crie excursões, reuniões, avisos…"}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((e) =>
            editingId === e.id ? (
              <li key={e.id}><EventForm event={e} onDone={() => setEditingId(null)} /></li>
            ) : (
              <li key={e.id} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{e.title}</span>
                      <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{TYPE_LABEL[e.type]}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${e.visibility === "public" ? "bg-success text-surface" : "bg-soft text-hint"}`}>
                        {e.visibility === "public" ? "público" : "interno"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-sm text-sub">
                      {fmtDate(e.event_date)}{e.start_time ? ` · ${e.start_time.slice(0, 5)}` : ""}{e.end_date ? ` até ${fmtDate(e.end_date)}` : ""}{e.location ? ` · ${e.location}` : ""}
                    </div>
                    {e.description && <p className="mt-1 line-clamp-2 text-sm text-sub">{e.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => { setEditingId(e.id); setAdding(false); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
                    <form action={removeEvent} onSubmit={(ev) => { if (!window.confirm(`Remover "${e.title}"?`)) ev.preventDefault(); }}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-danger hover:bg-soft">Remover</button>
                    </form>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
