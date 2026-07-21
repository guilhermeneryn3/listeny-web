"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/student";
import { createClient } from "@/lib/supabase/server";

/** O aluno marca/desmarca a própria tarefa como concluída. */
export async function setLessonDone(formData: FormData): Promise<void> {
  const { studentId } = await requireStudent();
  const lessonId = String(formData.get("lesson_id") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!lessonId || !studentId) return;

  const supabase = await createClient();
  await supabase
    .from("lesson_assignments")
    .update({ status: done ? "done" : "pending", completed_at: done ? new Date().toISOString() : null })
    .eq("lesson_id", lessonId)
    .eq("student_id", studentId);
  revalidatePath("/aluno");
}

/** O aluno reserva uma vaga aberta (a RPC valida tudo e cria o vínculo). */
export async function bookSession(formData: FormData): Promise<void> {
  await requireStudent();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;
  const supabase = await createClient();
  await supabase.rpc("book_session", { p_session: sessionId });
  revalidatePath("/aluno");
}
