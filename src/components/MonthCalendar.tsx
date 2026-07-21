"use client";

import { useState } from "react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export type CalItem = { key: string; tone?: "primary" | "success" };

/** Chave YYYY-MM-DD a partir de uma data ISO, no fuso LOCAL. */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function key(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Calendário mensal reutilizável. Navegação por estado numérico (year/month) — sem `Date.now()`
 * no render (a matemática de data usa `Date.UTC`, que é puro). `items` marca os dias com bolinha.
 */
export function MonthCalendar({
  year: y0,
  month: m0,
  todayKey,
  items,
  selectedKey,
  onSelect,
}: {
  year: number;
  month: number;
  todayKey: string;
  items: CalItem[];
  selectedKey?: string | null;
  onSelect: (key: string) => void;
}) {
  const [y, setY] = useState(y0);
  const [m, setM] = useState(m0);

  const firstWeekday = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  const marks = new Map<string, CalItem["tone"]>();
  for (const it of items) {
    const prev = marks.get(it.key);
    marks.set(it.key, it.tone === "success" || prev === "success" ? "success" : "primary");
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => (m === 0 ? (setY(y - 1), setM(11)) : setM(m - 1));
  const next = () => (m === 11 ? (setY(y + 1), setM(0)) : setM(m + 1));

  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prev} aria-label="Mês anterior" className="rounded-lg px-2.5 py-1 text-lg text-sub hover:bg-soft hover:text-ink">‹</button>
        <div className="text-sm font-semibold text-ink">{MONTHS[m]} {y}</div>
        <button type="button" onClick={next} aria-label="Próximo mês" className="rounded-lg px-2.5 py-1 text-lg text-sub hover:bg-soft hover:text-ink">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-hint">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const k = key(y, m, d);
          const tone = marks.get(k);
          const isToday = k === todayKey;
          const isSel = k === selectedKey;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(k)}
              className={`relative grid aspect-square place-items-center rounded-lg text-sm transition-colors ${
                isSel ? "bg-primary font-semibold text-surface" : isToday ? "bg-tint font-semibold text-primary-dark" : "text-ink hover:bg-soft"
              }`}
            >
              {d}
              {tone && !isSel && (
                <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${tone === "success" ? "bg-success" : "bg-primary"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
