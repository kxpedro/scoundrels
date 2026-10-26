# Scoundrels

Reviews de jogos com **crítica oficial** (redação Scoundrel) e **reviews do público**.

- Plano e decisões: [`docs/PLANO.md`](docs/PLANO.md)
- Design system: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

## Rodando localmente

Requisitos: Node 24+, Docker.

```bash
cp .env.example .env.local      # e preencha BETTER_AUTH_SECRET
npm install
npm run db:up                   # Postgres em localhost:5433
npm run db:push                 # aplica o schema
npm run db:seed                 # jogos, críticos e reviews de exemplo
npm run dev                     # http://localhost:3000 → /pt
```

Sem `RESEND_API_KEY`, o link de login por e-mail é impresso no terminal do `npm run dev`.

Para acessar a `/redacao`, promova sua conta:

```bash
docker compose exec db psql -U scoundrels -c "update \"user\" set role='admin' where email='voce@email.com';"
```

## Scripts

| Script | O que faz |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint e TypeScript |
| `db:up` | Sobe o Postgres local (Docker) |
| `db:push` | Sincroniza o schema direto (dev) |
| `db:generate` / `db:migrate` | Gera e aplica migrations (produção) |
| `db:seed` | Recria os dados de exemplo |
| `db:studio` | Drizzle Studio |

## Estrutura

```
src/
  app/[lang]/        rotas localizadas (pt, en) — layout raiz fica aqui
  app/api/auth/      Better Auth
  components/ui/     design system (ScoreBadge, Tag, Button…)
  components/game/   blocos da página de jogo
  db/                schema Drizzle, seed, agregação de notas
  i18n/              dicionários e config de idiomas
  lib/               auth, sessão/papéis, queries cacheadas, formatação
  proxy.ts           redireciona / → /pt ou /en (Accept-Language)
```

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Em **Storage**, adicione **Neon Postgres** — `DATABASE_URL` entra sozinha.
3. Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e, quando tiver, as chaves OAuth/Resend/IGDB.
4. Rode `npm run db:migrate` apontando para o Neon antes do primeiro deploy.
