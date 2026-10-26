# Scoundrels — Plano do projeto

Site de reviews de jogos com **crítica oficial** (jornalistas Scoundrel) e **reviews do público**, no estilo Metacritic/Letterboxd.

## Decisões

| Tema | Decisão |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) + TypeScript |
| UI | Tailwind v4 + componentes próprios (ver `DESIGN_SYSTEM.md`) |
| Banco | Postgres — Neon (via integração Vercel) em produção, Docker local em dev |
| ORM | Drizzle (`postgres` driver) |
| Auth | Better Auth — Google, Discord, magic link (Resend) |
| Papéis | `user`, `critic`, `editor`, `admin` |
| Back-office | Área `/redacao` no mesmo app, protegida por papel |
| Fluxo de crítica | `draft → in_review → published`, com volta `in_review → changes_requested → in_review` (editor publica ou pede ajustes) |
| Notas | 0–10 com meio ponto, crítica e público |
| Catálogo | Importação do IGDB (admin) |
| Moderação | User review publica na hora; denúncias vão para fila na `/redacao`; 3 denúncias ocultam até decisão (descartar devolve ao ar) |
| Idiomas | PT-BR (padrão) e EN, rotas `/pt/...` e `/en/...`. Dicionários nativos do Next (`next/root-params`) |
| Deploy | Vercel |

## Entregas

1. **Fundação** — scaffold, design system, schema, auth com papéis, i18n, página de jogo de exemplo. ✅
2. **Redação** — importação IGDB, editor de review (Tiptap), fluxo de aprovação, gestão de papéis, denúncias, página pública da review. ✅
3. **Site público** — home, catálogo com filtros (gênero/plataforma/ano/estúdio), perfil e lista de críticos, críticas e público por jogo, listagem de reviews, busca, sitemap. ✅
4. **User reviews** — régua de nota, texto opcional com spoiler, status (jogando/zerei/abandonei), "Sua review" editável, denúncia com 4 motivos e ocultação automática com 3 denúncias, limites anti-spam. ✅
5. **Social** — curtidas, comentários, status de jogo, listas, seguir + feed.

## Pendências do usuário

- ~~Credenciais IGDB~~ (configuradas no `.env.local`; falta adicionar na Vercel)
- OAuth Google e Discord
- Conta Resend (magic link)
- Ativar Neon na Vercel e copiar `DATABASE_URL`
