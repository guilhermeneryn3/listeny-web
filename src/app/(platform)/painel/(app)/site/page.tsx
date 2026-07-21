import { redirect } from "next/navigation";

/** O módulo Site abre no submódulo Páginas. */
export default function SiteIndex() {
  redirect("/painel/site/paginas");
}
