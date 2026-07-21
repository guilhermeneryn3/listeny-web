"use client";

import { useState } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";

export type PublicEvent = {
  id: string;
  title: string;
  type: "excursao" | "reuniao" | "evento" | "feriado" | "aviso";
  event_date: string;
  start_time: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
};

const TYPE_LABEL: Record<PublicEvent["type"], string> = {
  excursao: "Excursão", reuniao: "Reunião", evento: "Evento", feriado: "Feriado", aviso: "Aviso",
};
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const fmt = (d: string) => dateFmt.format(new Date(d + "T00:00:00"));

/** Calendário público (site do tenant): eventos públicos, somente leitura. */
export function PublicCalendar({ events, todayKey }: { events: PublicEvent[]; todayKey: string }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cy, cm] = todayKey.split("-").map(Number);
  const items = events.map((e) => ({ key: e.event_date, tone: "primary" as const }));
  const shown = selectedDay ? events.filter((e) => e.event_date === selectedDay) : events;

  return (
    <div>
      <div className="mb-4">
        <MonthCalendar year={cy} month={cm - 1} todayKey={todayKey} items={items} selectedKey={selectedDay} onSelect={setSelectedDay} />
      </div>
      {selectedDay && (
        <div className="mb-3 text-right">
          <button type="button" onClick={() => setSelectedDay(null)} className="text-sm font-medium text-primary-dark hover:underline">Ver todos</button>
        </div>
      )}
      {shown.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
          {selectedDay ? "Nenhum evento neste dia." : "Nenhum evento no momento."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((e) => (
            <li key={e.id} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{e.title}</span>
                <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{TYPE_LABEL[e.type]}</span>
              </div>
              <div className="mt-0.5 text-sm text-sub">
                {fmt(e.event_date)}{e.start_time ? ` · ${e.start_time.slice(0, 5)}` : ""}{e.end_date ? ` até ${fmt(e.end_date)}` : ""}{e.location ? ` · ${e.location}` : ""}
              </div>
              {e.description && <p className="mt-1 whitespace-pre-line text-sm text-sub">{e.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
