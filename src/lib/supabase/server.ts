import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client do Supabase (projeto Listeny) para Server Components / Server Actions, com sessão via cookies. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Em Server Components a escrita de cookies pode falhar (render-only); é seguro ignorar.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // noop
          }
        },
      },
    },
  );
}
