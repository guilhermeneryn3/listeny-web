import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/student";
import { createClient } from "@/lib/supabase/server";
import { setLessonDone } from "./actions";
import { StudentBooking } from "./_components/StudentBooking";

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const TYPE_LABEL: Record<string, string> = { lesson: "Aula", homework: "Tarefa", goal: "Meta" };
const brl = (v: number, c: string) => {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v); }
  catch { return `R$ ${v.toFixed(2)}`; }
};
type Charge = { id: string; title: string; amount: number; currency: string; due_date: string | null; status: "pending" | "paid" | "canceled" };
type EvLite = { id: string; title: string; type: string; event_date: string; start_time: string | null; location: string | null };
const EV_TYPE_LABEL: Record<string, string> = { excursao: "Excursão", reuniao: "Reunião", evento: "Evento", feriado: "Feriado", aviso: "Aviso" };

type Sess = {
  id: string; title: string; kind: "in_person" | "online";
  starts_at: string; duration_min: number;
  location: string | null; meeting_url: string | null; recording_url: string | null;
  status: "scheduled" | "done" | "canceled" | "no_show";
};
type LessonInfo = { id: string; title: string; type: string; description: string | null; due_date: string | null };
type Lesson = LessonInfo & { status: "pending" | "done"; media: { url: string; name: string | null }[] };

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function AlunoPage() {
  const { tenant, studentId, portalEnabled } = await requireStudent();

  // Portal do Aluno desligado no org → área indisponível (contas preservadas).
  if (!portalEnabled) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-10 text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Área do aluno indisponível</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-sub">
            {tenant.org.name} ainda não disponibiliza a área do aluno.
          </p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-sub transition-colors hover:bg-soft hover:text-ink">
              Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  let name = "";
  if (studentId) {
    const { data } = await supabase.from("students").select("name").eq("id", studentId).maybeSingle();
    name = ((data as { name?: string } | null)?.name ?? "").trim();
  }
  const firstName = name.split(/\s+/)[0] || "aluno(a)";

  // ── Sessões (agenda) ──
  let sessions: Sess[] = [];
  if (studentId) {
    const { data } = await supabase
      .from("session_students")
      .select("sessions(id, title, kind, starts_at, duration_min, location, meeting_url, recording_url, status)")
      .eq("student_id", studentId);
    sessions = (data ?? [])
      .map((r) => { const s = (r as { sessions: Sess | Sess[] | null }).sessions; return Array.isArray(s) ? s[0] : s; })
      .filter((s): s is Sess => !!s);
  }
  // eslint-disable-next-line react-hooks/purity -- Server Component: hora atual por request é ok
  const now = Date.now();
  const upcoming = sessions
    .filter((s) => s.status !== "canceled" && new Date(s.starts_at).getTime() > now - 2 * 3600 * 1000)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  // ── Tarefas/aulas (conteúdo) ──
  let lessons: Lesson[] = [];
  if (studentId) {
    const { data } = await supabase
      .from("lesson_assignments")
      .select("status, lessons(id, title, type, description, due_date)")
      .eq("student_id", studentId);
    const rows = (data ?? []).map((r) => {
      const l = (r as { lessons: LessonInfo | LessonInfo[] | null }).lessons;
      const info = Array.isArray(l) ? l[0] : l;
      return info ? { ...info, status: (r as { status: "pending" | "done" }).status, media: [] as Lesson["media"] } : null;
    }).filter((x): x is Lesson => !!x);

    const lids = rows.map((l) => l.id);
    if (lids.length > 0) {
      const { data: media } = await supabase.from("lesson_media").select("lesson_id, url, name").in("lesson_id", lids);
      const byLesson = (media ?? []) as { lesson_id: string; url: string; name: string | null }[];
      for (const l of rows) l.media = byLesson.filter((m) => m.lesson_id === l.id).map((m) => ({ url: m.url, name: m.name }));
    }
    lessons = rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
    });
  }

  // ── Cobranças ──
  let charges: Charge[] = [];
  if (studentId) {
    const { data } = await supabase
      .from("charges")
      .select("id, title, amount, currency, due_date, status")
      .eq("student_id", studentId)
      .neq("status", "canceled")
      .order("due_date", { ascending: true, nullsFirst: false });
    charges = (data ?? []).map((c) => ({
      id: c.id as string, title: c.title as string, amount: Number(c.amount),
      currency: (c.currency as string) ?? "BRL", due_date: (c.due_date as string | null) ?? null,
      status: c.status as Charge["status"],
    }));
  }
  const todayStr = new Date(now).toISOString().slice(0, 10);

  // ── Eventos públicos (próximos) ──
  const { data: evData } = await supabase
    .from("events")
    .select("id, title, type, event_date, start_time, location")
    .eq("org_id", tenant.org.id)
    .eq("visibility", "public")
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .limit(8);
  const events = (evData ?? []) as EvLite[];

  // ── Vagas abertas p/ agendar (se o professor ligou) ──
  let openSlots: Sess[] = [];
  const { data: bk } = await supabase.from("org_booking").select("enabled").eq("org_id", tenant.org.id).maybeSingle();
  const bookingEnabled = !!(bk as { enabled?: boolean } | null)?.enabled;
  if (bookingEnabled) {
    const { data } = await supabase
      .from("sessions")
      .select("id, title, kind, starts_at, duration_min, location, meeting_url, recording_url, status")
      .eq("org_id", tenant.org.id)
      .eq("bookable", true)
      .gt("starts_at", new Date(now).toISOString())
      .order("starts_at");
    openSlots = (data ?? []) as Sess[];
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Olá, {firstName}!</h1>
          <p className="mt-1 text-sm text-sub">Sua área em {tenant.org.name}.</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-sub hover:bg-soft hover:text-ink">Sair</button>
        </form>
      </div>

      {/* Tarefas e aulas */}
      <h2 className="mb-2 text-sm font-semibold text-sub">Suas tarefas e aulas</h2>
      {lessons.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">Nada por aqui ainda.</div>
      ) : (
        <ul className="mb-8 flex flex-col gap-2">
          {lessons.map((l) => {
            const done = l.status === "done";
            return (
              <li key={l.id} className={`rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm ${done ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold text-ink ${done ? "line-through" : ""}`}>{l.title}</span>
                      <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{TYPE_LABEL[l.type] ?? l.type}</span>
                      {l.due_date && <span className="text-xs text-hint">prazo {dateFmt.format(new Date(l.due_date + "T00:00:00"))}</span>}
                    </div>
                    {l.description && <p className="mt-1 whitespace-pre-line text-sm text-sub">{l.description}</p>}
                    {l.media.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {l.media.map((m, i) => (
                          <a key={i} href={m.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-dark hover:underline">{m.name || "Material"}</a>
                        ))}
                      </div>
                    )}
                  </div>
                  <form action={setLessonDone} className="shrink-0">
                    <input type="hidden" name="lesson_id" value={l.id} />
                    <input type="hidden" name="done" value={done ? "false" : "true"} />
                    <button type="submit" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${done ? "text-sub hover:bg-soft" : "bg-primary text-surface hover:bg-primary-dark"}`}>
                      {done ? "Desfazer" : "Concluir"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Cobranças */}
      {charges.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-sub">Suas cobranças</h2>
          <ul className="mb-8 flex flex-col gap-2">
            {charges.map((c) => {
              const overdue = c.status === "pending" && !!c.due_date && c.due_date < todayStr;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{brl(c.amount, c.currency)}</span>
                      {c.status === "paid" ? (
                        <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">paga</span>
                      ) : overdue ? (
                        <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface">vencida</span>
                      ) : (
                        <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hint">pendente</span>
                      )}
                    </div>
                    <div className="truncate text-sm text-sub">
                      {c.title}{c.due_date ? ` · vence ${dateFmt.format(new Date(c.due_date + "T00:00:00"))}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Eventos públicos */}
      {events.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-sub">Eventos</h2>
          <ul className="mb-8 flex flex-col gap-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{e.title}</span>
                  <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">{EV_TYPE_LABEL[e.type] ?? e.type}</span>
                </div>
                <div className="mt-0.5 text-sm text-sub">
                  {dateFmt.format(new Date(e.event_date + "T00:00:00"))}{e.start_time ? ` · ${e.start_time.slice(0, 5)}` : ""}{e.location ? ` · ${e.location}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Agendar (vagas abertas) */}
      {bookingEnabled && openSlots.length > 0 && (
        <StudentBooking openSlots={openSlots} todayKey={todayStr} />
      )}

      {/* Agenda */}
      <h2 className="mb-2 text-sm font-semibold text-sub">Próximas aulas</h2>
      {upcoming.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-6 text-center text-sm text-sub">Nenhuma aula agendada no momento.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.map((s) => (
            <li key={s.id} className="flex items-start gap-3 rounded-[var(--radius)] border border-edge bg-surface p-4 shadow-sm">
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
                {s.kind === "online" && s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-primary-dark hover:underline">Entrar na aula</a>}
                {s.kind === "in_person" && s.location && <div className="mt-1 text-sm text-sub">{s.location}</div>}
                {s.recording_url && <a href={s.recording_url} target="_blank" rel="noreferrer" className="mt-1 ml-3 inline-block text-sm font-medium text-primary-dark hover:underline">Ver gravação</a>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
