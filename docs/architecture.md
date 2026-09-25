# Etapa 2 — arquitetura Next.js

Este documento registra a estrutura entregue na etapa 2. A autenticação
provisória descrita abaixo foi substituída na etapa 3 por Auth.js e RBAC;
consulte [security.md](security.md) para os arquivos implementados e a configuração atual.
Na etapa 4, as telas de calendário e impressão foram adicionadas com dados fictícios;
consulte [calendar-ui.md](calendar-ui.md) para a árvore e o comportamento atualizados.

Base executável com App Router, TypeScript estrito, Server Components e Tailwind
CSS. A estrutura separa páginas, funcionalidades e acesso a dados. Nesta etapa,
as páginas dos dashboards são apenas cabeçalhos; calendário, formulários e tabela
de impressão ainda não foram implementados.

## Árvore implementada na etapa 2

```text
scav/
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── .env.example
├── docs/
│   ├── data-layer.md
│   └── architecture.md
└── src/
    ├── app/
    │   ├── layout.tsx                  # Idioma, metadados e CSS global
    │   ├── globals.css
    │   ├── page.tsx                    # / → /dashboard
    │   ├── (public)/
    │   │   ├── login/page.tsx          # /login
    │   │   └── acesso-negado/page.tsx  # /acesso-negado
    │   └── (protected)/
    │       └── dashboard/
    │           ├── layout.tsx         # Sessão, shell e renderização dinâmica
    │           ├── page.tsx           # Redirecionamento para o perfil
    │           ├── gestao/page.tsx
    │           ├── coordenacao/page.tsx
    │           ├── professores/page.tsx
    │           └── secretaria/page.tsx
    ├── components/
    │   └── layout/
    │       ├── dashboard-shell.tsx
    │       └── page-heading.tsx
    ├── features/
    │   └── README.md                  # Convenção para funcionalidades
    ├── generated/prisma/              # Gerado pela CLI, fora do Git
    ├── lib/
    │   └── routes.ts                  # Destinos e nomes dos quatro perfis
    └── server/
        ├── README.md                  # Fronteira de acesso aos recursos
        └── auth/
            ├── session.ts            # Contrato da identidade autenticada
            └── guards.ts             # Sessão ativa e perfil da página
```

Os grupos `(public)` e `(protected)` organizam arquivos sem aparecer nas URLs.
O nome `(protected)` não concede proteção automaticamente. A proteção depende
das verificações executadas no servidor.

## Rotas e acesso pretendido

| URL | Acesso | Conteúdo previsto |
| --- | --- | --- |
| `/login` | Público | Entrada via Auth.js |
| `/acesso-negado` | Público, sem dados internos | Orientação de acesso |
| `/dashboard` | Qualquer usuário ativo autenticado | Destino conforme o perfil |
| `/dashboard/gestao` | `GESTAO` | Calendário, slots e cobrança de atrasos |
| `/dashboard/coordenacao` | `COORDENACAO` | Calendário, revisão e vínculos da sua área |
| `/dashboard/professores` | `PROFESSOR` | Calendário e provas atribuídas ao usuário |
| `/dashboard/secretaria` | `SECRETARIA` | Tabela de aprovadas da próxima segunda |

Gestão não recebe acesso implícito às rotas dos demais perfis. Sua própria tela
terá a visão gerencial. Secretaria não recebe o componente do calendário nem seus
dados: a página será alimentada por uma consulta específica de impressão.

## Estado de autenticação na entrega da etapa 2 (histórico)

`getCurrentUser()` retorna `null` de propósito. Todos os dashboards redirecionam
para `/login`, sem usuário fictício ou mecanismo para escolher um perfil no navegador.
A página de login é provisória e ainda não oferece autenticação.

Os guardas já marcam os pontos onde a aplicação exige identidade e perfil, mas
isso **não equivale à integração Auth.js/RBAC concluída**. Na etapa 3, implementar
`getCurrentUser()` usando a sessão e consultando o usuário no banco, inclusive
`isActive` e o perfil atual. Depois, verificar os quatro cenários de acesso e os
escopos de área e professor com sessões reais.

O layout verifica a identidade para montar o shell. Cada página também chama seu
próprio guarda antes de buscar dados: a execução de filhos não deve depender de
o layout ter terminado a verificação. O dashboard é dinâmico e usa Node.js.

## Expansão planejada na etapa 2

Na etapa 3 foram implementados `auth.ts`, `auth.config.ts`, `proxy.ts`, o handler
Auth.js, o cliente Prisma com driver e `types/next-auth.d.ts`. Os demais módulos
abaixo permanecem planejados.

```text
src/
├── auth.ts                                  # Configuração Auth.js (etapa 3)
├── proxy.ts                                 # Redirecionamentos (etapa 3)
├── app/api/
│   ├── auth/[...nextauth]/route.ts           # Handlers Auth.js
│   ├── documents/[id]/download/route.ts      # PDF autorizado
│   └── printing/weekly-package/route.ts      # ZIP das aprovadas
├── components/ui/                           # Primitivos shadcn/ui (etapa 4)
├── features/
│   ├── calendar/
│   │   ├── components/assessment-calendar.tsx
│   │   ├── components/assessment-day-sheet.tsx
│   │   ├── calendar.types.ts
│   │   └── calendar-status.ts
│   ├── scheduling/
│   │   ├── actions.ts                       # Criar/alterar slots
│   │   └── schemas.ts
│   ├── teaching/
│   │   ├── actions.ts                       # Vínculos por área
│   │   └── schemas.ts
│   ├── assessments/
│   │   ├── actions.ts                       # Envio e revisão
│   │   ├── schemas.ts
│   │   └── components/pdf-dropzone.tsx
│   └── printing/
│       └── components/printing-table.tsx
├── server/
│   ├── db/prisma.ts                         # Cliente + driver adapter
│   ├── assessments/queries.ts               # Consultas filtradas e DTOs
│   ├── assessments/service.ts               # Transações e versões
│   ├── teaching/service.ts                  # Vínculos e escopo da área
│   ├── printing/queries.ts                  # Semana + status APPROVED
│   ├── printing/service.ts                  # ZIP e autorização dos arquivos
│   └── storage/
│       ├── contract.ts                      # Interface de storage privado
│       └── provider.ts                      # Supabase, S3 ou R2 escolhido
└── types/next-auth.d.ts                     # Tipos da sessão
```

`proxy.ts` é o nome usado no Next.js 16 para a convenção anteriormente chamada
`middleware.ts`. A etapa 3 deve explicar essa equivalência ao entregar a camada de
segurança; não criar os dois arquivos simultaneamente. Proxy é uma verificação
inicial para navegação e não substitui autorização junto aos dados.

## Fluxo entre camadas

```text
Leitura:
page.tsx (Server Component)
  → requireRole()
  → server/*/queries.ts (escopo do usuário + Prisma)
  → DTO mínimo
  → componentes visuais

Mutação:
Client Component (interação, sem credenciais)
  → features/*/actions.ts ("use server")
  → validar sessão, perfil, payload e recurso
  → server/*/service.ts (transação + storage quando necessário)
  → invalidar a página afetada e retornar resultado tipado

Download:
Route Handler
  → validar sessão, perfil e acesso ao documento
  → selecionar versão autorizada
  → transmitir arquivo/ZIP ou gerar URL assinada curta
```

As páginas continuam Server Components. Apenas o calendário interativo, os sheets,
dropzones e controles de seleção precisarão de `"use client"`. O calendário recebe
DTOs serializáveis já filtrados: dias como `YYYY-MM-DD`, status, disciplina e IDs
permitidos. Não recebe instâncias Prisma, tokens ou caminhos privados do storage.

Server Actions ficam junto à funcionalidade e exportam somente funções assíncronas.
Schemas e funções puras ficam em arquivos separados. Cada action refaz a autorização,
mesmo quando a página chamadora já foi autorizada. Erros de domínio retornam um
resultado tipado; detalhes internos não devem aparecer nas mensagens da interface.

Módulos em `server/` importam `server-only`. Não chamar os próprios endpoints HTTP
em Server Components para acessar o banco: usar diretamente consultas do servidor.
Os Route Handlers ficam reservados a Auth.js e às respostas de arquivo/streaming.
Endpoints retornam HTTP 401/403 para falhas de acesso, em vez de redirecionar o
cliente para HTML de login.

## Execução e verificação

```powershell
npm install
# Configure .env seguindo .env.example antes de gerar o cliente.
npm run db:generate
npm run typecheck
npm run build
npm run dev
```

Na etapa 3, visitas anônimas não consultam MySQL; login e sessões autenticadas
usam o banco. Configure também `AUTH_URL`, `AUTH_SECRET` e a conta inicial conforme
`security.md`. As fases seguintes adicionarão componentes e operações de negócio
sem remover os guardas de servidor.

## Referências

- [Next.js — organização do projeto](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js — autenticação e autorização](https://nextjs.org/docs/app/guides/authentication)
- [Next.js — convenção proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Tailwind CSS — integração Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
