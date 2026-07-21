import type { ReactNode } from "react";
import { AjustesNav } from "./_components/AjustesNav";

/** Hub de Ajustes: título + sub-navegação + conteúdo. */
export default function AjustesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-ink">Ajustes</h1>
      <div className="flex flex-col gap-6 sm:flex-row">
        <aside className="sm:w-52 sm:shrink-0">
          <AjustesNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
