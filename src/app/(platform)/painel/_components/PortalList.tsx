"use client";

import { useState } from "react";
import Link from "next/link";
import { PLAN_LABEL, type Plan } from "@/lib/plans";
import { deletePortal } from "../actions";

export type PortalItem = { id: string; name: string; slug: string; plan: string; owned: boolean };

/** Lista de portais: abrir cada um; o DONO pode excluir (confirmação por nome, irreversível). */
export function PortalList({ portals }: { portals: PortalItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {portals.map((p) => (
        <PortalRow key={p.id} p={p} />
      ))}
    </ul>
  );
}

function PortalRow({ p }: { p: PortalItem }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === p.name.trim();

  return (
    <li className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{p.name}</div>
          <div className="mt-0.5 text-sm text-sub">
            {p.slug} · {PLAN_LABEL[p.plan as Plan] ?? p.plan}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {p.owned && (
            <button
              type="button"
              onClick={() => setConfirming((v) => !v)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-sub transition-colors hover:bg-soft hover:text-danger"
            >
              Excluir
            </button>
          )}
          <Link
            href={`/painel/abrir?portal=${encodeURIComponent(p.slug)}`}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
          >
            Abrir
          </Link>
        </div>
      </div>

      {confirming && p.owned && (
        <form action={deletePortal} className="mt-3 rounded-lg border border-edge bg-soft p-3">
          <p className="text-sm text-sub">
            Excluir <span className="font-semibold text-ink">{p.name}</span> é{" "}
            <span className="font-semibold text-danger">irreversível</span> — apaga alunos, turmas,
            agenda, cobranças e tudo do portal. Digite o nome do portal para confirmar.
          </p>
          <input type="hidden" name="slug" value={p.slug} />
          <input
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={p.name}
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-danger"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-sub transition-colors hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!matches}
              className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Excluir portal
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
