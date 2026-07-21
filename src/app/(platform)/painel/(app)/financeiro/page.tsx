import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { ModuleLocked } from "@/components/ModuleLocked";
import { ChargesManager, type ChargeRow, type StudentLite } from "./_components/ChargesManager";

const brl = (v: number) => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }
  catch { return `R$ ${v.toFixed(2)}`; }
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "ok" }) {
  const color = tone === "danger" ? "text-danger" : tone === "ok" ? "text-success" : "text-ink";
  return (
    <div className="rounded-[var(--radius)] border border-edge bg-surface p-5 shadow-sm">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-sub">{label}</div>
    </div>
  );
}

export default async function FinanceiroPage() {
  const { tenant, modules } = await requireManager();
  if (!modules.includes("financeiro")) return <ModuleLocked moduleKey="financeiro" />;

  const supabase = await createClient();
  const orgId = tenant.org.id;

  const [chargesRes, studentsRes] = await Promise.all([
    supabase
      .from("charges")
      .select("id, student_id, title, amount, currency, due_date, status, paid_at")
      .eq("org_id", orgId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("students").select("id, name").eq("org_id", orgId).order("name"),
  ]);

  const students = (studentsRes.data ?? []) as StudentLite[];
  const nameOf = new Map(students.map((s) => [s.id, s.name]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const ym = todayStr.slice(0, 7);

  const charges: ChargeRow[] = (chargesRes.data ?? []).map((c) => ({
    id: c.id as string,
    studentId: c.student_id as string,
    studentName: nameOf.get(c.student_id as string) ?? "—",
    title: c.title as string,
    amount: Number(c.amount),
    currency: (c.currency as string) ?? "BRL",
    due_date: (c.due_date as string | null) ?? null,
    status: c.status as ChargeRow["status"],
    overdue: c.status === "pending" && !!c.due_date && (c.due_date as string) < todayStr,
  }));
  const sum = (arr: ChargeRow[]) => arr.reduce((s, c) => s + c.amount, 0);
  const aReceber = sum(charges.filter((c) => c.status === "pending"));
  const vencido = sum(charges.filter((c) => c.overdue));
  const recebidoMes = (chargesRes.data ?? [])
    .filter((c) => c.status === "paid" && typeof c.paid_at === "string" && (c.paid_at as string).slice(0, 7) === ym)
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="A receber (pendente)" value={brl(aReceber)} />
        <Stat label="Recebido no mês" value={brl(recebidoMes)} tone="ok" />
        <Stat label="Vencido" value={brl(vencido)} tone={vencido > 0 ? "danger" : undefined} />
      </div>
      <ChargesManager charges={charges} students={students} />
    </div>
  );
}
