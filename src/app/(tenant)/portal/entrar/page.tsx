import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant";
import { LoginForm } from "@/components/LoginForm";

/**
 * Login do PROFESSOR no subdomínio do tenant (cookie de sessão é por host). Após entrar,
 * segue para `/gerenciar`. A marca já vem do shell do tenant (portal/layout).
 */
export default async function TenantLoginPage() {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host") ?? "";
  const tenant = await resolveTenant(host);
  const brandName = tenant?.org.name ?? "Listeny";

  return (
    <main className="grid flex-1 place-items-center px-6 py-16">
      <LoginForm defaultNext="/gerenciar" brandName={brandName} />
    </main>
  );
}
