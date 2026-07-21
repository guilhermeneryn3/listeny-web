import { redirect } from "next/navigation";

/** Ajustes abre em Meios de pagamento. */
export default function AjustesIndex() {
  redirect("/painel/ajustes/pagamentos");
}
