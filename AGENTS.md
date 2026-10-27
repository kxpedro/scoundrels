<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Scoundrels — convenções do projeto

- Leia `docs/PLANO.md` (decisões e entregas) e `docs/DESIGN_SYSTEM.md` antes de mexer em UI.
- Cores, fontes e efeitos vêm dos tokens em `src/app/globals.css`. Nunca hex solto em JSX.
- Nota de crítico é sempre amarela; nota do público usa `scoreTone()` de `src/lib/score.ts`.
- Todo metadado (gênero, plataforma, estúdio, autor, status) é link — ver mapa de rotas no design system.
- Cache Components está ligado: leitura de sessão/cookies/params fica sob `<Suspense>`; queries públicas usam `"use cache"` + `cacheTag` (`src/lib/queries`).
- `next/root-params` só em Server Components: utilitários usados no cliente não podem importar `src/i18n/dictionaries.ts` (use `src/i18n/interpolate.ts`).
- Ao publicar/alterar reviews, chame `recomputeGameScores()` e invalide a tag `game:<slug>`.
- Textos de UI em `src/i18n/dictionaries/{pt,en}.json` — sempre os dois.
- Redação: toda Server Action em `src/lib/newsroom/actions.ts` revalida sessão e papel (`actor()`) e usa as regras de `src/lib/newsroom/permissions.ts` — nunca confie na UI.
- Corpo de review é JSON do Tiptap: passa por `sanitizeDoc()` ao salvar e ao renderizar; nós novos entram em `extensions.ts` **e** em `ALLOWED_NODES`. Ao enviar do cliente, serialize com `JSON.parse(JSON.stringify(...))` (attrs do ProseMirror não são objetos simples).
- `getSession()` chama `connection()` antes de ler a sessão (o Better Auth usa `new Date()`).
- **Antes de qualquer `drizzle-kit push`/`db:seed` ou de subir o dev server, confira que `DATABASE_URL` do `.env.local` é `localhost:5433`.** A integração Neon/Vercel pode sobrescrever o `.env.local` com o banco de produção. Migrations de produção só via `npm run prod:migrate` (lê `.env.production.local`), e sempre com SQL idempotente (`IF NOT EXISTS`).
- Contas com senha só são criadas pelo admin (`src/lib/admin/actions.ts`); cadastro público por senha está desligado (`disableSignUp`). Suspensão: `user.bannedAt` bloqueia novas sessões (hook em `auth.ts`) e `getSession()` ignora sessões de suspensos.
- Subconsulta correlacionada em `sql`: em selects sem join o Drizzle escreve a coluna sem tabela (`"id"`), que dentro da subconsulta resolve para a tabela interna. Use referência qualificada (`sql.raw('"user"."id"')`), como em `src/lib/queries/social.ts`.
- Estado "do visitante" em páginas cacheadas (curtiu? segue?) vem do cliente: `requestLiked` agrupa os ids da página numa única chamada (`src/components/social/viewer-likes.ts`).
