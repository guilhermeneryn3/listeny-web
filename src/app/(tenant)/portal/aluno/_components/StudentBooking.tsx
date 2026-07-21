"use client";

import { useState } from "react";
import { MonthCalendar, localDateKey } from "@/components/MonthCalendar";
import { bookSession } from "../actions";

type Slot = {
  id: string;
  title: string;
  kind: "in_person" | "online";
  starts_at: string;
  duration_min: number;
};

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Área do aluno: calendário de disponibilidade (vagas abertas) + reservar. */
export function StudentBooking({ openSlots, todayKey }: { openSlots: Slot[]; todayKey: string }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const items = openSlots.map((s) => ({ key: localDateKey(s.starts_at), tone: "success" as const }));
  const [cy, cm] = todayKey.split("-").map(Number);
  const shown = selectedDay ? openSlots.filter((s) => localDateKey(s.starts_at) === selectedDay) : openSlots;

  return (
    <>
      <h2 className="mb-2 text-sm font-semibold text-sub">Agendar uma aula</h2>
      <div className="mb-3">
        <MonthCalendar year={cy} month={cm - 1} todayKey={todayKey} items={items} selectedKey={selectedDay} onSelect={setSelectedDay} />
      </div>
      {selectedDay && (
        <div className="mb-2 text-right">
          <button type="button" onClick={() => setSelectedDay(null)} className="text-sm font-medium text-primary-dark hover:underline">Ver todas as vagas</button>
        </div>
      )}
      {shown.length === 0 ? (
        <div className="mb-8 rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">
          {selectedDay ? "Sem vagas neste dia." : "Sem vagas abertas no momento."}
        </div>
      ) : (
        <ul className="mb-8 flex flex-col gap-2">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
              <div className="w-16 shrink-0 text-center">
                <div className="text-lg font-extrabold text-ink">{timeFmt.format(new Date(s.starts_at))}</div>
                <div className="text-xs text-hint">{s.duration_min}min</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{s.title}</span>
                  <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{s.kind === "online" ? "online" : "presencial"}</span>
                </div>
                <div className="mt-0.5 text-sm capitalize text-sub">{dayFmt.format(new Date(s.starts_at))}</div>
              </div>
              <form action={bookSession} className="shrink-0">
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">Reservar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
