import { requireTeacher } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import {
  AgendaManager,
  type SessionRow,
  type StudentLite,
  type ClassLite,
  type Participant,
} from "./_components/AgendaManager";

/** Agenda do professor: sessões (presencial/online) + participantes e presença. */
export default async function AgendaPage() {
  const { tenant } = await requireTeacher();
  const supabase = await createClient();
  const orgId = tenant.org.id;

  const [sessRes, studentsRes, classesRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, kind, starts_at, duration_min, location, meeting_url, recording_url, class_id, notes, status")
      .eq("org_id", orgId)
      .order("starts_at"),
    supabase
      .from("students")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("status", "active")
      .order("name"),
    supabase.from("classes").select("id, name").eq("org_id", orgId).order("name"),
  ]);

  const baseSessions = (sessRes.data ?? []) as Omit<SessionRow, "participants">[];
  const ids = baseSessions.map((s) => s.id);

  type PartRow = {
    session_id: string;
    student_id: string;
    attendance: Participant["attendance"];
    students: { name: string } | { name: string }[] | null;
  };
  let parts: PartRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("session_students")
      .select("session_id, student_id, attendance, students(name)")
      .in("session_id", ids);
    parts = (data ?? []) as PartRow[];
  }

  const nameOf = (p: PartRow): string =>
    (Array.isArray(p.students) ? p.students[0]?.name : p.students?.name) ?? "—";

  const sessions: SessionRow[] = baseSessions.map((s) => ({
    ...s,
    participants: parts
      .filter((p) => p.session_id === s.id)
      .map((p) => ({ student_id: p.student_id, name: nameOf(p), attendance: p.attendance })),
  }));

  const students = (studentsRes.data ?? []) as StudentLite[];
  const classes = (classesRes.data ?? []) as ClassLite[];

  return <AgendaManager sessions={sessions} students={students} classes={classes} />;
}
