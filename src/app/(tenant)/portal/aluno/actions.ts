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
