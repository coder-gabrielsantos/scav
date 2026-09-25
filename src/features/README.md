# Funcionalidades

Agrupar componentes e casos de uso por domínio: `calendar`, `scheduling`,
`teaching`, `assessments` e `printing`. Criar esses diretórios à medida que cada
funcionalidade for implementada. A árvore prevista está em `docs/architecture.md`.

Server Actions ficam em `actions.ts` com `"use server"`; schemas, tipos e utilitários
ficam em módulos separados. Componentes interativos recebem DTOs filtrados pelo
servidor. Consultas Prisma e credenciais de storage pertencem a `src/server`.
