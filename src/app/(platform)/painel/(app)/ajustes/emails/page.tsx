import { requireManager } from "@/lib/teacher";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_TYPES } from "@/lib/emails";
import { EmailsManager, type EmailItem } from "./_components/EmailsManager";

type Row = { key: string; enabled: boolean; subject: string | null; body: string | null };

/** Submódulo E-mails automáticos: o professor configura os e-mails disparados aos alunos. */
export default async function EmailsPage() {
  const { tenant } = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_email_templates")
    .select("key, enabled, subject, body")
    .eq("org_id", tenant.org.id);

  const rows = new Map((data ?? []).map((r) => [(r as Row).key, r as Row]));
  const items: EmailItem[] = EMAIL_TYPES.map((t) => {
    const r = rows.get(t.key);
    return {
      key: t.key,
      label: t.label,
      description: t.description,
      enabled: r?.enabled ?? false,
      subject: r?.subject ?? t.defaultSubject,
      body: r?.body ?? t.defaultBody,
    };
  });

  return <EmailsManager items={items} />;
}
