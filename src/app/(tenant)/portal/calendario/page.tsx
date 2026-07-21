import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { PublicCalendar, type PublicEvent } from "./_components/PublicCalendar";

/** Calendário PÚBLICO do tenant (site): eventos com visibilidade pública. Sem login. */
export default async function CalendarioPage() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, type, event_date, start_time, end_date, location, description")
    .eq("org_id", tenant.org.id)
    .eq("visibility", "public")
    .order("event_date", { ascending: true });

  const events = (data ?? []) as PublicEvent[];
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink">Calendário — {tenant.org.name}</h1>
      <PublicCalendar events={events} todayKey={todayKey} />
    </main>
  );
}
