import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consoleUrl } from "@/lib/urls";

/**
 * A gestão saiu do subdomínio para o console central (`listeny.app/painel`). Qualquer link
 * antigo a `<slug>.listeny.app/gerenciar/*` redireciona pro console.
 */
export default async function GerenciarMoved() {
  const h = await headers();
  // host CRU (com porta) para montar a URL do console — x-tenant-host vem sem porta.
  const host = h.get("host") ?? h.get("x-tenant-host") ?? "";
  redirect(consoleUrl(host));
}
