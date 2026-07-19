# educaty-web

Portal web multi-tenant white-label do **Educaty** — um produto N3 Labz.

Cada professor/criador tem o SEU portal com marca própria (logo, cores, tema,
domínio opcional). O portal web **é** o produto; o backend é um projeto Supabase
(o "cérebro"), cujo schema mora em `../Educaty/supabase/migrations`.

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · @supabase/ssr ·
TypeScript strict. Alias `@/* → ./src/*`.

## Como o multi-tenant funciona

- **`src/proxy.ts`** roteia por host:
  - Host de plataforma (`educaty.app`, `www.educaty.app`, `localhost`,
    `127.0.0.1`, `*.vercel.app`) → páginas públicas (`/`, `/criar`, `/login`).
  - Host de tenant (`<slug>.educaty.app`, `<slug>.localhost` em dev, ou domínio
    próprio) → reescreve para `/portal/*` e injeta o header `x-tenant-host`.
- **`src/lib/tenant.ts` → `resolveTenant(host)`** resolve o tenant pelo host:
  slug (subdomínio) → `orgs`; domínio próprio → `org_domains` (status `active`).
  Devolve `{ org, branding, tokens }`, com `tokens` = template `theme_templates`
  sobreposto pelos overrides parciais de `org_branding.palette`. Usa o client
  anon do servidor (branding/orgs/domínios/templates são de leitura pública).
- **`src/app/(tenant)/portal/layout.tsx`** injeta os tokens como variáveis CSS
  inline (`--color-primary`, …), então TODA a subárvore herda a cara do tenant.
- **Contrato de tokens** em `src/lib/theme.ts` — chaves fixas
  (`primary, primaryDark, bg, surface, ink, sub, hint, edge, soft, success,
  warn, danger, tint, radius, font`), iguais às do banco. A UI nunca hardcoda
  cor: usa utilities do Tailwind (`bg-primary`, `text-ink`, …) que apontam para
  as variáveis, sobrescritas em runtime pelo tenant.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (só servidor)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_EDUCATY_APP_DOMAIN` (default `educaty.app`)

## DNS / deploy (para os tenants funcionarem)

- Wildcard `*.educaty.app` apontando para o app (Vercel) — habilita os
  subdomínios de tenant.
- Domínios próprios de tenant: attach/verificação/SSL são fase seguinte
  (a tabela `org_domains` já modela o estado).

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint`
