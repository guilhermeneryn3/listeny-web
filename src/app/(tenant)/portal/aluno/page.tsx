import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/student";
import { createClient } from "@/lib/supabase/server";

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

type Sess = {
  id: string; title: string; kind: "in_person" | "online";
  starts_at: string; duration_min: number;
  location: string | null; meeting_url: string | null; recording_url: string | null;
  status: "scheduled" | "done" | "canceled" | "no_show";
};

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Área logada do aluno neste professor/escola: saudação + próximas sessões. */
export default async function AlunoPage() {
  const { tenant, studentId } = await requireStudent();
  const supabase = await createClient();

  let name = "";
  if (studentId) {
    const { data } = await supabase.from("students").select("name").eq("id", studentId).maybeSingle();
    name = ((data as { name?: string } | null)?.name ?? "").trim();
  }
  const firstName = name.split(/\s+/)[0] || "aluno(a)";

  let sessions: Sess[] = [];
  if (studentId) {
    const { data } = await supabase
      .from("session_students")
      .select("sessions(id, title, kind, starts_at, duration_min, location, meeting_url, recording_url, status)")
      .eq("student_id", studentId);
    sessions = (data ?? [])
      .map((r) => {
        const s = (r as { sessions: Sess | Sess[] | null }).sessions;
        return Array.isArray(s) ? s[0] : s;
      })
      .filter((s): s is Sess => !!s);
  }

  // eslint-disable-next-line react-hooks/purity -- Server Component: hora atual por request é ok
  const now = Date.now();
  const upcoming = sessions
    .filter((s) => s.status !== "canceled" && new Date(s.starts_at).getTime() > now - 2 * 3600 * 1000)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

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

      <h2 className="mb-2 text-sm font-semibold text-sub">Próximas aulas</h2>
      {upcoming.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-edge bg-soft p-8 text-center text-sm text-sub">
          Nenhuma aula agendada no momento.
        </div>
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
                  <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                    {s.kind === "online" ? "online" : "presencial"}
                  </span>
                </div>
                <div className="mt-0.5 text-sm capitalize text-sub">{dayFmt.format(new Date(s.starts_at))}</div>
                {s.kind === "online" && s.meeting_url && (
                  <a href={s.meeting_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-primary-dark hover:underline">Entrar na aula</a>
                )}
                {s.kind === "in_person" && s.location && (
                  <div className="mt-1 text-sm text-sub">{s.location}</div>
                )}
                {s.recording_url && (
                  <a href={s.recording_url} target="_blank" rel="noreferrer" className="mt-1 ml-3 inline-block text-sm font-medium text-primary-dark hover:underline">Ver gravação</a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
