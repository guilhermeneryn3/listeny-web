import { requireTeacher } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { StudentsManager, type Student } from "./_components/StudentsManager";

/** Roster de alunos do professor. Dados reais (RLS por org); estado vazio quando não há. */
export default async function AlunosPage() {
  const { tenant } = await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("id, name, email, phone, notes, status")
    .eq("org_id", tenant.org.id)
    .order("name");

  const students = (data ?? []) as Student[];

  return <StudentsManager students={students} />;
}
