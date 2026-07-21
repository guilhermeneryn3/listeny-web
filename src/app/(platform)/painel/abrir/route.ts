import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listManagerOrgs } from "@/lib/teacher";
import { PORTAL_COOKIE } from "@/lib/urls";

/**
 * Fixa o portal selecionado no cookie e leva ao console. Valida que o usuário gerencia o portal
 * (route handler pode gravar cookie; um Server Component não). Uso: `/painel/abrir?portal=<slug>`.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/painel", req.url));

  const slug = new URL(req.url).searchParams.get("portal") ?? "";
  const orgs = await listManagerOrgs(user.id);
  if (!slug || !orgs.some((o) => o.slug === slug)) {
    return NextResponse.redirect(new URL("/painel", req.url));
  }

  const res = NextResponse.redirect(new URL("/painel/inicio", req.url));
  res.cookies.set(PORTAL_COOKIE, slug, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
