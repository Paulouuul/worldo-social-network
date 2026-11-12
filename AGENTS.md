<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Worldo — Social Network (frontend + API Next.js)

Rede social com marketplace de molduras cosméticas. Este repositório contém o app Next.js (páginas,
rotas de API, NextAuth, Prisma, Elasticsearch, Stripe). Partes do sistema rodam no backend Python
separado (`worldo-backend-module`: carrinho no Redis, criação de molduras, edição de perfil e upload
para o Cloudflare R2), que tem o próprio `AGENTS.md`.

Idioma do projeto: **português** (textos de UI, comentários, mensagens de erro e commits).

## Ambiente

- Node **26.13.1** (LTS) — `.nvmrc` e `engines`. Com mise: `mise exec node@26.13.1 -- <comando>`.
- npm 11 só executa scripts de instalação aprovados no campo `allowScripts` do `package.json`
  (Prisma, esbuild, cypress, @parcel/watcher). Ao atualizar esses pacotes, aprove a nova versão com
  `npm install-scripts approve <pacote>`.
- Serviços locais via `docker compose up -d` (PostgreSQL e Elasticsearch). O backend Python fica em
  `http://localhost:8000` (`NEXT_PUBLIC_BACKEND_URL`).
- `next.config.js` usa `trailingSlash: true`: as URLs terminam com `/` (`/worldo/coins/`).

## Verificação obrigatória antes de concluir

```bash
npx tsc --noEmit -p .   # tipos
npx eslint .            # lint (ESLint 10, flat config)
npx prettier --check app components lib hooks constants styles scripts
```

- Não rode `next build` se houver um `next start` usando a mesma pasta `.next` (o build
  sobrescreve os arquivos do servidor em execução). Para testar em execução use
  `npx next dev --turbopack -p 3001`.
- O projeto não tem testes automatizados; valide no navegador as telas alteradas.

## Estrutura de pastas

```
app/                      Rotas do App Router (a pasta é a URL — não renomear sem mudar as rotas)
  api/                    Rotas de API (route.ts)
    worldo/               API do app (cosmetics, coins, me, user)
    back/[...path]/       Proxy para o backend Python
  worldo/                 Páginas do usuário logado
components/
  auth/                   Login/cadastro (AuthShell, LogoutButton)
  cosmetics/              Domínio de cosméticos
    catalog/              Layout, filtros e card das grades de catálogo
    marketplace/ inventory/ cart/
  layout/                 Header (e header/: CartBadge, CoinBalance), MainWrapper, GlobalMediaProtector
  profile/                Componentes do perfil
  providers/              AuthProvider (sessão) e QueryProvider (React Query)
  ui/                     Componentes genéricos, sem regra de negócio
    buttons/ dataDisplay/ feedback/ forms/ media/ navigation/ overlays/
constants/                Valores compartilhados (rotas, limites, regras) — ver abaixo
hooks/queries/            Hooks de React Query (useMe, useWallet, useCatalog)
lib/                      Código não visual, agrupado por função
  api/                    fetcher (fetchJson/backendJson), backendApiClient, rarityParam
  auth/backendToken/      JWT do backend Python (gerador, cache cliente/servidor, tokenConfig)
  db/                     Cliente Prisma
  query/                  queryKeys (chaves e políticas de cache) e invalidate
  search/                 Elasticsearch e sincronização PostgreSQL → índice
  storage/ media/ utils/
styles/                   CSS por categoria, importado por app/globals.css
scripts/                  Scripts manuais de manutenção (executados pelo nome com npx tsx)
```

Onde colocar código novo:

- Componente usado em mais de uma tela → `components/` na categoria do domínio, ou em `components/ui/`
  se for genérico. Componente usado só dentro de um arquivo pode ficar local no próprio arquivo.
- Lógica sem JSX → `lib/<categoria>/`. Hook de dados → `hooks/queries/`.
- Crie subpastas por categoria/funcionalidade quando um grupo crescer; mais de um nível é permitido.

## Nomes

- Componentes e providers: **PascalCase** (`CosmeticCard.tsx`, `QueryProvider.tsx`).
- Hooks, utilitários, constantes e pastas que não são rotas: **camelCase** (`useMe.ts`,
  `queryKeys.ts`, `dataDisplay/`).
- Pastas em `app/` seguem a URL e não são renomeadas por convenção de nome.
- Arquivos em `scripts/` mantêm o nome atual (são executados pelo nome).

## Constantes — nunca repetir valores

Antes de escrever um número, limite, caminho ou lista, procure em `constants/`. Se o valor for usado
em mais de um lugar (ou representar uma regra de negócio), ele vai para uma constante.

| Arquivo                                | Conteúdo                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants/routes.ts`                  | `ROUTES` — todas as rotas de página (`ROUTES.marketplace`, `ROUTES.listing(id)`, `ROUTES.profileOf(id)`…). Nunca escreva caminhos de página à mão |
| `constants/validation.ts`              | Limites de texto (nome, username, senha, bio, local, site, nome/descrição de moldura)                                                             |
| `constants/uploads.ts`                 | Tipos de imagem aceitos, `IMAGE_ACCEPT`, `UPLOAD_LIMITS_MB`, `mbToBytes`, `uploadLimitText`                                                       |
| `constants/marketplace.ts`             | Preço/quantidade máximos de anúncio, taxa padrão, máximo por item no carrinho, `CATALOG_PAGE_SIZE`, `SORT`                                        |
| `constants/ui.ts`                      | `UI_TIMING` (tempo de mensagem e de transição) e `BREAKPOINTS`                                                                                    |
| `constants/cosmeticRarity.tsx`         | `RARITY`, `VALID_RARITIES` e estilos por raridade (`getRarityDesigns`)                                                                            |
| `lib/auth/backendToken/tokenConfig.ts` | Validade e margem de renovação do JWT do backend                                                                                                  |

- Limites que também são validados pelo backend Python existem nos dois repositórios; ao mudar um,
  mude o outro (os arquivos indicam o equivalente).
- Exceção: o `matcher` em `proxy.ts` precisa ser literal (o Next.js o lê estaticamente no build).

## Dados no cliente (React Query)

- Toda busca de dados em componente cliente usa React Query. Não use `useEffect` + `fetch` +
  `useState` para carregar dados.
- Requisições: `fetchJson` (rotas `/api/...` do Next) e `backendJson` (backend Python) em
  `lib/api/fetcher.ts`; elas lançam `HttpError` em respostas não-2xx.
- Chaves de cache: sempre via `qk` em `lib/query/queryKeys.ts`.
- Política de cache (`cachePolicy` em `queryKeys.ts`):
  - `critical` — preço, estoque, saldo e carrinho: **nunca** reaproveitados do cache.
  - `livePages` — páginas de listagem com preço (revalidadas e liberadas 30 s após sair da tela).
  - `inventory`, `static`, `profile`, `frame` — demais dados.
- Após mutações, invalide pelo evento de negócio com `invalidate` (`lib/query/invalidate.ts`:
  `cart`, `purchase`, `balance`, `inventory`, `me`) em vez de chamar chaves soltas.
- Perfil do usuário logado: `useMe()` (`/api/worldo/me`). A sessão do NextAuth guarda apenas
  identidade (`id`, `publicId`, `email`, `provider`); não coloque dados de perfil na sessão.
- Listas longas/rolagem infinita: `VirtualizedPagedGrid` (busca apenas as páginas visíveis e
  libera as que saem da tela). Não acumule páginas em estado.

## Rotas de API (app/api)

- Cada `route.ts` começa com o cabeçalho de caminho + descrição e cada handler tem JSDoc
  `/** GET /api/... — o que faz */`, incluindo os parâmetros de query aceitos.
- Valide a sessão com `auth()` e retorne 401 sem usuário. Erros: `NextResponse.json({ error }, { status })`.
- Filtro de raridade aceita várias raridades separadas por vírgula; leia com `parseRarities`
  (`lib/api/rarityParam.ts`). Lista vazia = sem filtro.
- Alterações em anúncios devem manter o Elasticsearch sincronizado (`syncToListing` /
  `removeFromElasticsearch` em `lib/search/prismaSync.ts`).

## Componentes de UI — reutilize antes de criar

| Necessidade                                   | Use                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mensagem de erro/sucesso/aviso/info           | `FeedbackMessage` (`ui/feedback`) — nunca monte caixas coloridas à mão nem use `alert()`  |
| Carregando                                    | `Spinner` (botões/ícones), `LoadingSpinner`/`LoadingMore` (`ui/feedback/Loading`)         |
| Lista vazia                                   | `EmptyState`                                                                              |
| Página de status (erro, cancelamento)         | `StatusPage` + `StatusCard`                                                               |
| Campo de formulário                           | `FieldLabel`, `FieldError`, `TextInput`, `TextArea`, `SelectInput` (`ui/forms/FormField`) |
| Botão principal / link com aparência de botão | `PrimaryButton` / `buttonClass.primary` e `buttonClass.secondary`                         |
| Chip de filtro                                | `ChipButton`                                                                              |
| Busca                                         | `SearchBar`                                                                               |
| Quantidade                                    | `QuantityStepper`                                                                         |
| Preço e quantidade sobre card                 | `PriceTag`, `QuantityTag`                                                                 |
| Linha "rótulo … valor"                        | `SummaryRow`                                                                              |
| Modal                                         | `Modal`                                                                                   |
| Trilha de navegação                           | `Breadcrumb`                                                                              |
| Imagem (inclui GIF animado)                   | `ClientImage`                                                                             |
| Página de catálogo                            | `CatalogLayout`, `CatalogHeader`, `CatalogFilters`, `SortSelector`, `CosmeticCard`        |
| Login/cadastro                                | `AuthShell`                                                                               |
| Carrinho/checkout                             | `CartItemCard`, `OrderPageHeader`, `ItemStatusTag`                                        |

Se um elemento visual se repetir em mais de um lugar, transforme-o em componente com parâmetros
em vez de copiar o JSX.

## CSS

- Tailwind CSS v4. Estilos próprios ficam em `styles/` por categoria (`theme`, `animations`, `base`,
  `surfaces`, `header`, `scrollbar`), importados por `app/globals.css` — não escreva estilos
  diretamente em `globals.css`.
- Classes reutilizáveis: `@utility <nome> { ... }` no arquivo da categoria. Animações: variável
  `--animate-<nome>` + `@keyframes` dentro de `@theme` em `styles/animations.css` (vira a classe
  `animate-<nome>`). Assim só o que é usado entra no CSS final.
- Cores do tema em `styles/theme.css` (`blue-600`/`blue-700` são sobrescritos pelo azul do app).
- Combinação de classes repetida em vários componentes vira `@utility` (ex.: `glow-backdrop`,
  `hairline-top`, `grid-overlay`) ou componente.
- Não existe plugin de animação instalado: classes como `animate-in`/`fade-in` não funcionam; use
  as de `animations.css` (`animate-fade-in`, `animate-zoom-in`, `animate-slide-*`).

## Comentários

- Primeira linha de todo arquivo: `// caminho/do/arquivo.ts`, seguida de uma ou mais linhas
  `// descrição` do que o arquivo faz (rotas: incluir a URL). Em arquivos com `'use client'`, o
  cabeçalho vem antes da diretiva.
- Toda função, componente, hook, interface e tipo nomeado tem JSDoc `/** ... */` descrevendo o que
  faz **hoje**.
- Comentários descrevem o comportamento atual: nada de "antes fazia X", "CORRIGIDO", "← NOVO",
  emojis ou passos numerados (`// 1.`) e separadores (`// ====`).
- Ao mudar código, atualize os comentários afetados. Ao citar um limite, referencie a constante em
  vez de repetir o número.
- Comentários e textos em português.

## Autenticação e proxy

- `auth.ts` configura o NextAuth (Google, GitHub e email/senha) com sessão JWT mínima.
- `proxy.ts` (middleware) redireciona: logado em `/`, `/login`, `/register` → `/worldo`; não logado
  em `/` ou `/worldo/*` → `/login`.
- Chamadas ao backend Python: `backendApiCall` (navegador, token via `/api/auth/back/token`) ou
  `backendApiServerCall` (servidor). O JWT leva só `id`, `publicId`, `email` e `provider`.
