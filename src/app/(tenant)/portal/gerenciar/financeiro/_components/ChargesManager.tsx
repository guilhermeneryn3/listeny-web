"use client";

import { useActionState, useEffect, useState } from "react";
import { createCharge, updateCharge, setChargeStatus, removeCharge, type ChargeState } from "../actions";

export type ChargeRow = {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  amount: number;
  currency: string;
  due_date: string | null;
  status: "pending" | "paid" | "canceled";
  overdue: boolean;
};
export type StudentLite = { id: string; name: string };

const field = "w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
export const money = (v: number, c: string) => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v); }
  catch { return `R$ ${v.toFixed(2)}`; }
};

function CreateForm({ students, onDone }: { students: StudentLite[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<ChargeState, FormData>(createCharge, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);

  return (
    <form action={action} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-sub">Aluno</span>
          <select name="student_id" required defaultValue="" className={field}>
            <option value="" disabled>Escolha…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <input name="title" required placeholder="Título (ex.: Mensalidade de agosto)" className={`sm:col-span-2 ${field}`} />
        <input name="amount" inputMode="decimal" required placeholder="Valor (ex.: 240,00)" className={field} />
        <label className="text-sm">
          <span className="mb-1 block font-medium text-sub">Vencimento</span>
          <input type="date" name="due_date" className={field} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-sub">Repetir mensalmente por (meses)</span>
          <input type="number" name="repeat_months" min={0} max={24} defaultValue={0} className={`${field} sm:w-40`} />
        </label>
      </div>
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Criar cobrança"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

function EditForm({ charge, onDone }: { charge: ChargeRow; onDone: () => void }) {
  const [state, action, pending] = useActionState<ChargeState, FormData>(updateCharge, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className="rounded-[var(--radius)] border border-primary bg-surface p-4 shadow-sm">
      <input type="hidden" name="id" value={charge.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="title" required defaultValue={charge.title} className={`sm:col-span-2 ${field}`} />
        <input name="amount" inputMode="decimal" required defaultValue={String(charge.amount).replace(".", ",")} className={field} />
        <input type="date" name="due_date" defaultValue={charge.due_date ?? ""} className={field} />
      </div>
      {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-sub hover:text-ink">Cancelar</button>
      </div>
    </form>
  );
}

const STATUS: Record<ChargeRow["status"], { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-soft text-hint" },
  paid: { label: "Paga", cls: "bg-tint text-primary-dark" },
  canceled: { label: "Cancelada", cls: "bg-soft text-hint" },
};

export function ChargesManager({ charges, students }: { charges: ChargeRow[]; students: StudentLite[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Cobranças</h1>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark">
            Nova cobrança
          </button>
        )}
      </div>

      {adding && <div className="mb-4"><CreateForm students={students} onDone={() => setAdding(false)} /></div>}

      {charges.length === 0 && !adding ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhuma cobrança ainda.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {charges.map((c) =>
            editingId === c.id ? (
              <li key={c.id}><EditForm charge={c} onDone={() => setEditingId(null)} /></li>
            ) : (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{money(c.amount, c.currency)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
                    {c.overdue && <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface">vencida</span>}
                  </div>
                  <div className="truncate text-sm text-sub">
                    {c.studentName} · {c.title}{c.due_date ? ` · vence ${dateFmt.format(new Date(c.due_date + "T00:00:00"))}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <form action={setChargeStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value={c.status === "paid" ? "pending" : "paid"} />
                    <button type="submit" className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-dark hover:bg-soft">
                      {c.status === "paid" ? "Reabrir" : "Marcar paga"}
                    </button>
                  </form>
                  <button type="button" onClick={() => { setEditingId(c.id); setAdding(false); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Editar</button>
                  <form action={removeCharge} onSubmit={(e) => { if (!window.confirm("Remover esta cobrança?")) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={c.id} />
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
