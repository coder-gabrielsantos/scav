# SCAV — Sistema de Calendário e Avaliações

Os quatro entregáveis iniciais foram implementados: camada de dados MySQL/Prisma,
arquitetura Next.js App Router, autenticação Auth.js/RBAC e calendário interativo.
A interface usa React 19, TypeScript, Tailwind CSS 4, shadcn/ui e Lucide.
Agendamento, envio, revisão e impressão usam dados demonstrativos nesta base;
a integração dessas operações com MySQL e storage ainda precisa ser implementada.

## Experimentar a interface

Com as dependências instaladas e o cliente Prisma gerado, execute `npm run dev`
e abra `http://localhost:3000/demo`. A demonstração não exige banco ou login.
O seletor permite percorrer os quatro perfis, enviar um PDF local, aprovar e baixar
as provas aprovadas. Alterações ficam somente na página. Veja o roteiro completo
em [calendar-ui.md](docs/calendar-ui.md).

## Arquivos desta etapa

- `prisma/schema.prisma`: entidades, relações, índices e enums.
- `prisma.config.ts`: configuração da CLI e conexão via `DATABASE_URL`.
- `.env.example`: formato da conexão, sem credenciais reais.
- `docs/data-layer.md`: decisões, fluxo e regras que deverão ser implementadas no servidor.
- `docs/architecture.md`: árvore de pastas, rotas por perfil e responsabilidades das camadas.
- `src/app`: páginas públicas e dashboards separados para os quatro perfis.
- `src/server/auth`: credenciais, verificação de sessão no banco e guardas de acesso.
- `src/proxy.ts`: redirecionamento por perfil no Next.js 16.
- `docs/security.md`: configuração do login, cadastro inicial e limites da validação.
- `src/features/calendar`: calendário, regras de cores, painéis e dados demonstrativos.
- `src/features/printing`: tabela de aprovadas e downloads demonstrativos PDF/ZIP.
- `docs/calendar-ui.md`: roteiro da demonstração e próximos passos de integração.

## Aplicação Next.js

Após configurar `.env`, gerar o cliente Prisma, aplicar as migrações e criar
a conta de Gestão conforme [security.md](docs/security.md):

```powershell
npm run dev
```

Abra `http://localhost:3000/login`. Use a conta criada com `npm run auth:create-admin`.
Não há conta de login fictícia nem senha padrão. O primeiro login com uma conta
Google verificada pode criar um usuário de Gestão; convites definem os perfis
dos demais usuários. Os quatro dashboards
permanecem protegidos e exibem um recorte dos dados demonstrativos, identificado na UI.

Verifique os tipos com `npm run typecheck`, os testes com `npm test` e a compilação
com `npm run build`.
Para executar o resultado compilado, use `npm start`.

## Preparação

Use Node.js 22.12+ ou 24 LTS e MySQL 8.0+ com InnoDB e `utf8mb4`.
No PowerShell:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Ajuste DATABASE_URL, AUTH_URL e AUTH_SECRET em .env.
npm run db:validate
npm run db:generate
npm run db:migrate -- --name init
```

`db:migrate` cria e aplica a migração no banco configurado. Execute somente após
configurar sua instância. A geração do cliente deve ser executada explicitamente
quando o schema mudar. Versione as migrações produzidas e use `db:deploy` nos ambientes
de implantação, após revisão.

O schema e a geração do cliente podem ser verificados sem conectar ao MySQL;
a CLI ainda exige uma `DATABASE_URL` sintaticamente válida. Nenhum banco ou bucket
é provisionado por esta etapa. O cliente gerado fica em `src/generated/prisma`,
ignorado pelo Git. A aplicação usa o driver adapter MySQL/MariaDB do Prisma 7
exclusivamente no servidor, com inicialização preguiçosa.

## Verificação desta entrega

- `prisma format`, `prisma validate` e `prisma generate`: concluídos com sucesso.
- Etapa 4: `npm run typecheck`, `npm run build` e 73 testes concluídos com sucesso.
- `/demo` e o PDF demonstrativo responderam HTTP 200. Testes DOM exercitaram upload,
  aprovação e a lista da Secretaria. Não houve inspeção visual: navegador indisponível.
- Verificação HTTP histórica da etapa 2: `/login` e `/acesso-negado` retornaram 200;
  `/` redirecionou para `/dashboard`; o dashboard e suas quatro rotas de perfil
  retornaram 307 para `/login`, inclusive com `?role=GESTAO` na URL.
- Migração, provisionamento de conta e login com MySQL real: não executados;
  nenhuma instância foi configurada. Os testes de autenticação simulam o banco.
- A checagem HTTP adicional da etapa 3 teve a inicialização do servidor bloqueada
  pela revisão automática, sem motivo específico informado.
- `npm audit`: três alertas de severidade alta na cadeia do Prisma 7.10.0
  (`prisma`, `@prisma/config` e `deepmerge-ts`). O relatório oferece
  downgrade de versão principal como correção; ele não foi aplicado automaticamente.
  Esses alertas continuam pendentes de resolução antes da implantação.
  Os drivers `mariadb` e `mysql2` usam overrides com versões corrigidas.

Referências oficiais consultadas:

- [Prisma — schema e tipos MySQL](https://www.prisma.io/docs/orm/v7/reference/prisma-schema-reference)
- [Prisma — configuração MySQL](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql)
- [Auth.js — Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
