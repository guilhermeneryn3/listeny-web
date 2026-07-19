import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/BrandMark";
import { CreateOrgForm, type TemplateOption } from "./CreateOrgForm";

export const metadata = {
  title: "Crie seu portal — Educaty",
};

export default async function CriarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/criar");

  // Catálogo público de temas (RLS: is_public).
  const { data } = await supabase
    .from("theme_templates")
    .select("id, key, name")
    .eq("is_public", true)
    .order("created_at", { ascending: true });
  const templates = (data as TemplateOption[] | null) ?? [];

  return (
    <main className="flex flex-1 flex-col bg-bg text-ink">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 py-6 text-lg font-extrabold tracking-tight">
        <BrandMark />
        Educaty
      </header>

      <section className="mx-auto w-full max-w-2xl px-6 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Crie seu portal
        </h1>
        <p className="mt-2 text-sub">
          Dê um nome, escolha o endereço e o tema. Você poderá ajustar cores,
          logo e domínio próprio depois.
        </p>

        <div className="mt-8">
          <CreateOrgForm templates={templates} />
        </div>
      </section>
    </main>
  );
}
