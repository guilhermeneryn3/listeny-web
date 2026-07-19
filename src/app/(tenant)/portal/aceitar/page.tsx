import Link from "next/link";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { AcceptButton } from "./AcceptButton";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid flex-1 place-items-center px-6 py-16">
      <div className="w-full max-w-sm rounded-[var(--radius)] border border-edge bg-surface p-6 text-center shadow-sm">
        {children}
      </div>
    </main>
  );
}

/**
 * Aceite de convite no subdomínio do org. Exige login com o e-mail convidado (a RLS de
 * `invitations` só devolve o convite pro e-mail dono). Aceitar cria a membership sem tirar os
 * outros vínculos (RPC accept_invitation) — é aqui que o professor entra na escola.
 */
export default async function AceitarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgName = tenant?.org.name ?? "este portal";

  if (!token) {
    return <Shell><p className="text-sub">Convite inválido.</p></Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-ink">Convite para {orgName}</h1>
        <p className="mt-2 text-sm text-sub">Entre com o e-mail que recebeu o convite para aceitar.</p>
        <Link
          href={`/entrar?next=/aceitar?token=${token}`}
          className="mt-5 inline-flex w-full justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
        >
          Entrar
        </Link>
      </Shell>
    );
  }

  // A RLS só devolve o convite se o e-mail do convite == e-mail logado.
  const { data: inv } = await supabase
    .from("invitations")
    .select("role, org_id, status")
    .eq("token", token)
    .maybeSingle();

  const valid =
    inv && inv.status === "pending" && (!tenant || inv.org_id === tenant.org.id);

  if (!valid) {
    return (
      <Shell>
        <h1 className="text-lg font-bold text-ink">Convite indisponível</h1>
        <p className="mt-2 text-sm text-sub">
          Ele pode ter expirado, já ter sido usado, ou ser para outro e-mail. Você está logado como{" "}
          <span className="font-medium text-ink">{user.email}</span>.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-lg font-bold text-ink">Convite para {orgName}</h1>
      <p className="mt-2 text-sm text-sub">
        Você foi convidado como <span className="font-semibold text-ink">{ROLE_LABEL[inv.role as Role]}</span>.
        Aceitar não afeta seus outros acessos.
      </p>
      <div className="mt-5">
        <AcceptButton token={token} />
      </div>
    </Shell>
  );
}
