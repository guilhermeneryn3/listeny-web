import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { ModuleLocked } from "@/components/ModuleLocked";
import { LessonsManager, type LessonRow, type StudentLite, type ClassLite } from "./_components/LessonsManager";

export default async function AulasPage() {
  const { tenant, modules } = await requireManager();
  if (!modules.includes("aulas")) return <ModuleLocked moduleKey="aulas" />;

  const supabase = await createClient();
  const orgId = tenant.org.id;

  const [lessonsRes, studentsRes, classesRes] = await Promise.all([
    supabase.from("lessons").select("id, title, type, description, due_date, class_id").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("students").select("id, name").eq("org_id", orgId).eq("status", "active").order("name"),
    supabase.from("classes").select("id, name").eq("org_id", orgId).order("name"),
  ]);

  const base = (lessonsRes.data ?? []) as Omit<LessonRow, "studentIds" | "doneCount" | "totalCount" | "media">[];
  const ids = base.map((l) => l.id);

  const [assignsRes, mediaRes] = await Promise.all([
    ids.length ? supabase.from("lesson_assignments").select("lesson_id, student_id, status").in("lesson_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("lesson_media").select("lesson_id, url, name").in("lesson_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const assigns = (assignsRes.data ?? []) as { lesson_id: string; student_id: string; status: string }[];
  const media = (mediaRes.data ?? []) as { lesson_id: string; url: string; name: string | null }[];

  const lessons: LessonRow[] = base.map((l) => {
    const a = assigns.filter((x) => x.lesson_id === l.id);
    return {
      ...l,
      studentIds: a.map((x) => x.student_id),
      totalCount: a.length,
      doneCount: a.filter((x) => x.status === "done").length,
      media: media.filter((m) => m.lesson_id === l.id).map((m) => ({ url: m.url, name: m.name })),
    };
  });

  return (
    <LessonsManager
      lessons={lessons}
      students={(studentsRes.data ?? []) as StudentLite[]}
      classes={(classesRes.data ?? []) as ClassLite[]}
    />
  );
}
