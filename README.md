# la-dolce-app

Site institucional da **La Dolce Experience** (sorveteria premium itinerante para eventos em São Paulo), com um painel para o cliente editar textos, imagens e dados comerciais sem mexer em código.

- **Site público** (`/`): página única e responsiva, com botão flutuante e formulário de orçamento que abrem o WhatsApp com a mensagem pronta.
- **Painel** (`/admin`): login, edição de todas as seções, galeria de imagens, contatos, endereço e SEO.

> **Pendências em aberto:** `la-dolce-docs/pendencias-cliente.md`.

## Repositórios do projeto

| Repositório | Conteúdo |
|---|---|
| **la-dolce-app** | Site público e painel administrativo (este repositório) |
| `la-dolce-api` | Schema, RLS, Storage e configuração do Supabase |
| `la-dolce-data` | Conteúdo inicial (seed) e imagens originais |
| `la-dolce-docs` | Documentação, manual do cliente e pendências |

Clone os quatro **lado a lado** na mesma pasta:

```
la-dolce/
  la-dolce-app/
  la-dolce-api/
  la-dolce-data/
  la-dolce-docs/
```

O app funciona sozinho para desenvolver o site público, usando o conteúdo padrão embutido. Os outros repositórios são necessários para o painel, os testes E2E e a geração de imagens.

## Tecnologias

### Aplicação

| Tecnologia | Versão | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | Interface do site e do painel |
| [TypeScript](https://www.typescriptlang.org) | 6 | Tipagem estática (modo `strict`) |
| [Vite](https://vite.dev) | 8 | Servidor de desenvolvimento e build |
| [React Router](https://reactrouter.com) | 7 | Rotas; o painel é carregado sob demanda (lazy) |
| CSS Modules | — | Estilos isolados por componente, com tokens de design em `src/styles/tokens.css` |
| [Lucide](https://lucide.dev) | 1.x | Ícones (os ícones de redes sociais são SVGs próprios) |
| [Inter](https://fontsource.org/fonts/inter) via Fontsource | 5 | Fonte servida pelo próprio site, sem Google Fonts |
| [supabase-js](https://supabase.com/docs/reference/javascript) | 2 | Login e edição no painel. O site público lê o conteúdo por `fetch` REST, sem a biblioteca |

### Backend e hospedagem

| Serviço | Uso |
|---|---|
| [Supabase](https://supabase.com) | Postgres com RLS, Auth e Storage, definidos no `la-dolce-api` |
| [Vercel](https://vercel.com) | Hospedagem do frontend estático, com headers de segurança e CSP em `vercel.json` |

### Qualidade e testes

| Ferramenta | Uso |
|---|---|
| [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | Testes unitários e de componentes (jsdom) |
| [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) | Testes E2E no build de produção e verificação de acessibilidade |
| [ESLint](https://eslint.org) + [Prettier](https://prettier.io) | Lint e formatação |
| [sharp](https://sharp.pixelplumbing.com) | Geração das imagens otimizadas (WebP em dois tamanhos) |
| [Gitleaks](https://github.com/gitleaks/gitleaks) + `scripts/check-secrets.mjs` | Busca de segredos no histórico do Git e no build público |
| GitHub Actions + Dependabot | Integração contínua e atualização de dependências |

## Estrutura de pastas

```
.github/                  CI, Dependabot e modelo de pull request
e2e/                      Testes Playwright (site público e painel)
public/                   Arquivos estáticos e imagens otimizadas
scripts/                  Otimização de imagens, plugin de SEO, servidor E2E, verificação de segredos
src/
  components/             Botões, imagem responsiva, títulos, ícones, WhatsApp flutuante
  content/                Conteúdo padrão (usado se o banco não responder)
  features/
    site/                 Seções da página pública
    quote/                Formulário de orçamento → WhatsApp
    admin/                Painel: autenticação, páginas, editores, tour guiado e Ajuda
  hooks/                  Contexto de conteúdo e metatags
  lib/                    Configuração do Supabase
  pages/                  Página inicial e 404
  services/               Leitura pública (REST), operações do painel, mensagens de erro
  styles/                 Tokens de design e estilos globais
  types/                  Tipos do domínio e do banco (cópia do la-dolce-api)
  utils/                  WhatsApp, telefone, localização, imagens, dados estruturados
```

## Rodando localmente

Pré-requisitos: **Node.js 20+** (o projeto usa 24, veja `.nvmrc`). Para o painel, também **Docker Desktop**.

1. Suba o banco no `la-dolce-api` e crie um administrador (detalhes no README dele):
   ```bash
   cd ../la-dolce-api
   npm install
   npm run db:start
   npm run db:status                                  # API_URL e ANON_KEY
   npm run admin:create -- --email voce@exemplo.com   # mostra uma senha temporária
   ```
2. Volte ao app e crie o `.env.local` a partir do [`.env.example`](.env.example). Ele está no `.gitignore` e **nunca** deve ser versionado.
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<ANON_KEY do db:status>
   VITE_SITE_URL=http://localhost:5173
   ```
3. Inicie o site:
   ```bash
   npm install
   npm run dev      # http://localhost:5173 e http://localhost:5173/admin
   ```

Opcionalmente, defina `VITE_SUPPORT_NAME`, `VITE_SUPPORT_WHATSAPP` e `VITE_SUPPORT_EMAIL` para o menu **Ajuda** do painel mostrar o contato do suporte técnico.

Sem as variáveis do Supabase, o site público funciona com o conteúdo padrão (`src/content/defaultContent.ts`), e o painel mostra instruções de configuração.

Este repositório só usa a chave **anon** (pública). A `service_role` fica apenas no `la-dolce-api`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção em `dist/` (inclui SEO do banco, `robots.txt` e `sitemap.xml`) |
| `npm run preview` | Serve o build localmente |
| `npm run check` | Formatação, lint, tipos, testes, build e verificação de segredos (o mesmo que o primeiro job da CI) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run format` | Formata o código com Prettier |
| `npm test` | Testes unitários e de componentes |
| `npm run test:e2e` | Playwright contra o build de produção (veja abaixo) |
| `npm run secrets:check` | Procura segredos nos arquivos do repositório e em `dist/` |
| `npm run types:sync` | Copia `types/database.ts` do `la-dolce-api` para `src/types/` |
| `npm run images:optimize` | Gera `public/images/` a partir de `../la-dolce-data/assets/` |

### Testes E2E

Com o banco do `la-dolce-api` rodando:

```bash
npx playwright install chromium   # só na primeira vez
E2E_ADMIN_EMAIL=voce@exemplo.com E2E_ADMIN_PASSWORD=<senha-do-admin-local> npm run test:e2e
```

Sem as variáveis `E2E_ADMIN_*`, os testes do painel são pulados e só os do site público rodam.

## CI (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push na `main` e em todo pull request:

| Job | Verifica |
|---|---|
| **Formatação, lint, tipos, testes e build** | `format:check`, `lint`, `typecheck`, testes unitários, build de produção e ausência de segredos no `dist/` |
| **Segredos e dependências** | Gitleaks em **todo o histórico** do Git, arquivos `.env` versionados, chaves `service_role`/`sb_secret_` e `npm audit` das dependências de produção |
| **Tipos do banco e testes E2E** | Baixa o `la-dolce-api` e o `la-dolce-data`; confere se os tipos do banco são iguais aos da API; sobe o Supabase local com migrations e seed, cria um admin temporário e roda o Playwright |

O job de E2E precisa do secret de organização **`LA_DOLCE_REPOS_TOKEN`**, somente leitura (instruções no README do `la-dolce-api`). Nenhuma chave de produção vai para o GitHub: elas ficam só nas variáveis de ambiente da Vercel.

## Publicação

A Vercel importa **apenas este repositório**. Variáveis de ambiente e passo a passo estão em `la-dolce-docs/04-implantacao-e-custos.md`.
