import { createClient } from "@supabase/supabase-js";

/**
 * Client service-role do Supabase (projeto Educaty). **SOMENTE no servidor** — usado por
 * endpoints sem sessão de usuário que precisam ignorar a RLS: webhooks de pagamento/assinatura
 * e a verificação/ativação de domínios próprios de tenant.
 *
 * A chave NÃO tem prefixo NEXT_PUBLIC, então nunca vai pro bundle do navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
