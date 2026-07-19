import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { ClassesManager, type ClassRow, type StudentLite } from "./_components/ClassesManager";

/** Turmas do professor + vínculo de alunos. Dados reais (RLS por org). */
export default async function TurmasPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();

  const [classesRes, studentsRes, linksRes] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, description")
      .eq("org_id", tenant.org.id)
      .order("name"),
    supabase
      .from("students")
      .select("id, name")
      .eq("org_id", tenant.org.id)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("class_students")
      .select("class_id, student_id"),
  ]);

  const links = (linksRes.data ?? []) as { class_id: string; student_id: string }[];
  const classes: ClassRow[] = (classesRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    description: (c.description as string | null) ?? null,
    studentIds: links.filter((l) => l.class_id === c.id).map((l) => l.student_id),
  }));
  const students = (studentsRes.data ?? []) as StudentLite[];

  return <ClassesManager classes={classes} students={students} />;
}
