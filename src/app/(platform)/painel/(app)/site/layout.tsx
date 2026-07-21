import type { ReactNode } from "react";
import { SiteNav } from "./_components/SiteNav";

/** Shell do módulo Site: título + sub-navegação (submódulos) à esquerda + conteúdo. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Site</h1>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="rounded-[var(--radius)] border border-edge bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary"
        >
          Ver site
        </a>
      </div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <aside className="sm:w-48 sm:shrink-0">
          <SiteNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
