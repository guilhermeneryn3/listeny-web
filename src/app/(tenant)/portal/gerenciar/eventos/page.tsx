import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { ModuleLocked } from "@/components/ModuleLocked";
import { EventsManager, type EventRow } from "./_components/EventsManager";

export default async function EventosPage() {
  const { tenant, modules } = await requireManager();
  if (!modules.includes("eventos")) return <ModuleLocked moduleKey="eventos" />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, type, event_date, start_time, end_date, location, description, visibility")
    .eq("org_id", tenant.org.id)
    .order("event_date", { ascending: true });

  const events = (data ?? []) as EventRow[];
  const todayKey = new Date().toISOString().slice(0, 10);

  return <EventsManager events={events} todayKey={todayKey} />;
}
