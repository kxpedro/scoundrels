# Scoundrels — Design System

Estilo **Cyber-brutalista**: fusão de três direções aprovadas.

| Origem | O que contribui | Onde aparece |
|---|---|---|
| **Night City** (C1) | Amarelo da marca, cantos chanfrados, glitch | Logo (único glitch), nota Scoundrel, CTA principal, cantos de cards e selos |
| **Neon Brutal** (C2) | Fundo preto-arroxeado, sombra sólida magenta, ciano | Capa em destaque e CTA principal (únicos com sombra), nota do público, links, estados selecionados |
| **Netrunner** (C3) | Fonte monoespaçada de terminal | Apenas rótulos curtos e metadados (autor, cargo, status, legendas) |

Princípio central: **cada efeito tem um papel e aparece pouco**. Na dúvida, menos.

---

## 1. Cores

Tokens definidos em `src/app/globals.css` (`@theme`). Use sempre as classes Tailwind geradas (`bg-ink`, `text-cyan`…), nunca hex solto no JSX.

### Superfícies
| Token | Hex | Uso |
|---|---|---|
| `ink` | `#0C0B12` | Fundo da página |
| `panel` | `#15131F` | Cards, selos do público |
| `raised` | `#221F31` | Tags neutras, avatar sem destaque |
| `line` | `#22202E` | Divisores |
| `line-strong` | `#3A3650` | Bordas de botões secundários |

### Texto
| Token | Hex | Uso |
|---|---|---|
| `fg` | `#F5F3FA` | Títulos, nomes, valores |
| `body` | `#D9D6E5` | Texto corrido |
| `label` | `#C9C5DA` | Rótulos mono |
| `muted` | `#9C98B0` | Metadados secundários (datas relativas, contagens) |

### Acentos
| Token | Hex | Papel | Texto sobre ele |
|---|---|---|---|
| `brand` (amarelo) | `#FCEE0A` | Marca, **nota Scoundrel**, CTA principal | `ink` |
| `cyan` | `#00E5FF` | Público, links, selecionado, nota alta do público | `#04191D` |
| `magenta` | `#FF2BD6` | Sombra sólida, tag de gênero, hover de tags, curtida ativa | `#1A0416` |
| `amber` | `#FFB020` | Nota média do público, status "jogando" | `#1F1400` |
| `red` | `#FF3B5C` | Nota baixa do público, status "abandonou", erros | `#1F0008` |

### Regra das notas
- **Nota de crítico Scoundrel → sempre amarelo**, independente do valor.
- **Nota do público → cor por faixa**: `>= 7` ciano · `>= 5` âmbar · `< 5` vermelho.
- Implementado em `src/lib/score.ts` (`scoreTone`). Nunca decida a cor da nota inline.

---

## 2. Tipografia

| Família | Token | Uso |
|---|---|---|
| **Archivo Black** | `font-display` | Títulos de página e de seção, logo. Títulos de jogo em CAIXA ALTA |
| **Chakra Petch** 500/700 | `font-score` | Números de nota, plataformas, CTA |
| **Share Tech Mono** | `font-mono` | Rótulos, cargo, status, legendas. Sempre CAIXA ALTA, `tracking-wider` |
| **Inter** 400/500 | `font-sans` | Texto corrido, navegação, botões secundários |

Regras:
- Mono **nunca** em cinza apagado sobre fundo escuro: use `text-label`, `text-fg` ou sobre fundo colorido. Só data relativa e rodapé podem ser `text-muted`.
- Review completa (corpo longo) usa `font-sans`, 16–17px, `leading-relaxed`.

---

## 3. Forma

- **Sem border-radius.** Tudo é reto ou chanfrado.
- **Chanfro** (canto superior direito cortado):
  - `.chamfer` → 12px (cards, capas, selos grandes)
  - `.chamfer-sm` → 7px (selos pequenos, avatares, tags de nota)
- **Sombra sólida** `.shadow-hard` → `4px 4px 0 magenta` (CTA) / `.shadow-hard-lg` → `6px 6px 0 magenta` (capa em destaque). **Máximo dois elementos com sombra por tela.**
- Bordas: 1.5px em botões, 3px como faixa de destaque no topo/esquerda de cards.

---

## 4. Efeitos

- **Glitch**: somente no logo (`.glitch` → `text-shadow: 2px 0 cyan, -2px 0 magenta`).
- **Hover de elementos clicáveis**:
  - Tags/plataformas: `translate(-2px,-2px)` + sombra magenta 3px.
  - Links de texto: viram amarelo com sublinhado.
  - Cards/capas: `translate(-3px,-3px)`.
- Todas as transições ≤150ms e desligadas com `prefers-reduced-motion`.
- Sem linhas de varredura, sem gradientes, sem blur.

---

## 5. Componentes

Em `src/components/ui/`.

### `ScoreBadge`
Um componente, quatro variantes. Recebe `value`, `kind: "critic" | "user"`.

| Variante | Onde | Anatomia |
|---|---|---|
| `hero` | Topo da página do jogo | Bloco chanfrado, rótulo mono, número 36px, contagem abaixo |
| `card` | Sobre a capa (jogos relacionados, listas) | Rótulo `SCD`/`PUB` + número + medidor |
| `list` | Coluna esquerda das reviews do público | Coluna 64px, faixa colorida no topo, número 28px, `/10`, medidor |
| `inline` | Canto de cards de crítica | Bloco chanfrado pequeno só com número |

### `Tag`
Variantes: `genre` (magenta sólido), `neutral` (raised), `platform` (borda ciano, Chakra), `status` (cor do status com fundo translúcido). **Toda tag é um link.**

### `Button`
- `primary`: amarelo, Chakra 700, `shadow-hard`. **Um por tela.**
- `secondary`: transparente, borda `line-strong`; selecionado → borda e texto ciano.

### `CriticByline`
Avatar chanfrado (iniciais), nome em `fg`, cargo em mono colorido (editor-chefe = amarelo, crítico = ciano). Link para `/criticos/[handle]`.

---

## 6. Tudo é clicável

Metadados são portas de navegação. Mapa de rotas:

| Elemento | Rota |
|---|---|
| Gênero | `/[lang]/jogos?genero=<slug>` |
| Data de lançamento | `/[lang]/jogos?lancamento=<AAAA-MM>` |
| Estúdio | `/[lang]/estudios/<slug>` |
| Plataforma | `/[lang]/jogos?plataforma=<slug>` |
| Nota Scoundrel (hero) | `/[lang]/jogos/<slug>/criticas` |
| Nota do público (hero) | `/[lang]/jogos/<slug>/publico` |
| Crítico | `/[lang]/criticos/<handle>` |
| Título da crítica | `/[lang]/reviews/<slug>` |
| % positivas/mistas/negativas | `/[lang]/jogos/<slug>/publico?tom=<positivas|mistas|negativas>` |
| Usuário | `/[lang]/u/<handle>` |
| Status do usuário | `/[lang]/u/<handle>/<zerados|jogando|quero-jogar|abandonados>` |
| Card de jogo | `/[lang]/jogos/<slug>` |

---

## 7. Status de jogo

| Status | Slug | Cor |
|---|---|---|
| Jogando | `jogando` | amber |
| Zerado | `zerados` | cyan |
| Quero jogar | `quero-jogar` | label/neutral |
| Abandonou | `abandonados` | red |

---

## 8. Back-office `/redacao`

Layout **"Mesa de redação"**: barra lateral fixa (itens por papel) + conteúdo. Mesma base de tokens; mais rótulos mono por ser área interna, Inter no editor.

### Status editorial
| Status | Cor | Classe |
|---|---|---|
| Rascunho | neutro | `bg-raised text-label` |
| Em revisão | amber | `bg-amber/15 text-amber` |
| Ajustes pedidos | magenta | `bg-magenta/15 text-magenta` |
| Publicada | cyan | `bg-cyan/15 text-cyan` |

Fonte única: `statusStyle` em `src/components/newsroom/status-tag.tsx`.

### Corpo da review
Classe `.review-prose` (globals.css) — usada no editor e na página pública, para o crítico ver exatamente o que será publicado.
