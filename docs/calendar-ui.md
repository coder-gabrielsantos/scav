# Etapa 4 — calendário e interfaces por perfil

O calendário principal, os painéis laterais e a tabela de impressão usam Tailwind,
componentes shadcn/ui (Button, Badge, Sheet/Radix), Lucide, date-fns e date-fns-tz.
Os quatro entregáveis iniciais estão implementados como código base. O fluxo
visual desta etapa é demonstrativo; envio, revisão e agendamento ainda não são
persistidos no MySQL ou no storage.

## Abrir sem banco

Para uma instalação nova:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run db:generate
npm run dev
```

Abra `http://localhost:3000/demo`. O endereço usa a porta informada pelo Next.js.
A geração Prisma requer a URL de exemplo, mas não conecta ao banco. A rota
`/demo` não exige Auth.js ou um segredo: usa exclusivamente registros fictícios.
O login e as rotas de dashboard seguem exigindo a configuração da etapa 3.

Na entrega desta etapa, a prévia foi iniciada em `http://127.0.0.1:3137/demo`.

## Experimentar o fluxo completo

1. Em **Gestão**, clique em uma segunda-feira futura para selecionar áreas e prazo.
   A criação de uma área gera as pendências das disciplinas fictícias associadas.
   Datas passadas e dias que não são segunda-feira não aceitam agendamento.
2. No seletor **Ver como**, escolha **Professores**. Abra a próxima segunda-feira,
   cuja prova de Matemática está com ajuste solicitado. Envie um PDF de até 20 MB.
   O status passa para “Em revisão” e a versão aumenta.
3. Feche o painel e escolha **Coordenação**. Abra o mesmo dia e visualize o PDF.
   Clique em **Aprovar** ou **Solicitar ajustes**, que exige uma orientação escrita.
4. Escolha **Secretaria**. A prova aprovada passa a constar na tabela, junto das
   demais aprovadas da próxima segunda-feira. Baixe um PDF ou o pacote ZIP.
5. **Restaurar** volta ao cenário inicial. Recarregar ou sair da página também
   descarta as alterações. A troca de perfil dentro de `/demo` preserva o cenário.

## Comportamento do calendário

- Navegação entre meses, botão Hoje e filtro por área para Gestão.
- Todas as segundas recebem destaque suave. Dias com slots mostram área, contagem
  e bolinhas de status; os nomes de área ficam compactados em telas pequenas.
- Vermelho tem precedência: ajuste solicitado ou pendência com prazo vencido.
- Amarelo indica uma prova em revisão quando não há vermelho no conjunto.
- Verde exige todas as provas aprovadas, com ao menos uma prova em cada slot.
- Pendências dentro do prazo e slots vazios permanecem neutros.
- Os indicadores são calculados por documento, área e dia. Contadores e alertas
  acompanham o mês, o filtro e o recorte visível para o perfil.
- O relógio é atualizado a cada minuto. Datas são dias civis e prazos usam o fuso
  `America/Sao_Paulo`; uma data não muda para a véspera por conversão de UTC.

O calendário é uma tabela com botões, rótulos completos de data e status e suporte
às setas entre dias visíveis. Sheets têm título/descrição, foco modal, fechamento
por Escape e retorno ao controle que abriu o painel. Cores vêm acompanhadas de
texto, legenda e contagens. Upload também funciona pelo seletor de arquivo,
sem exigir arrastar e soltar.

## Arquivos e responsabilidades

```text
src/
├── app/(public)/demo/page.tsx
├── components/
│   ├── layout/workspace-frame.tsx
│   └── ui/{button,badge,sheet}.tsx
└── features/
    ├── calendar/
    │   ├── calendar.types.ts
    │   ├── calendar-date.ts
    │   ├── calendar-status.ts
    │   ├── demo-data.ts
    │   ├── demo-transitions.ts
    │   ├── demo-surface.tsx
    │   └── components/
    │       ├── assessment-calendar.tsx
    │       ├── assessment-day-sheet.tsx
    │       ├── assessment-workspace.tsx
    │       ├── demo-experience.tsx
    │       └── status-mark.tsx
    ├── assessments/
    │   ├── pdf-validation.ts
    │   └── components/pdf-dropzone.tsx
    └── printing/
        ├── downloads.ts
        └── components/printing-table.tsx
public/demo/avaliacao-exemplo.pdf
```

`AssessmentCalendar` recebe slots, mês, relógio e callbacks. Seu componente visual
não acessa Prisma, Auth.js ou storage. `DemoSurface` é um Server Component que
recorta os dados fictícios antes de passá-los aos dashboards protegidos. Professor
recebe somente Clara Oliveira/Matemática; Coordenação recebe Exatas; Secretaria
recebe apenas as aprovadas da semana. Esses são personagens da demonstração,
nunca identidades derivadas das contas reais.

O seletor de perfil só existe em `/demo`. Ele não muda sessão, cookie, banco nem
permissões de nenhum dashboard. Os guardas da etapa 3 foram preservados.

## PDFs e ZIP nesta demonstração

O PDF inicial é um arquivo público, explicitamente fictício. Seu gerador está em
`scripts/create-demo-pdf.mjs`. Uploads são lidos no navegador, validam extensão,
MIME quando disponível, tamanho e cabeçalho `%PDF-`, e recebem uma Blob URL local.
Não são enviados para o servidor, gravados em localStorage ou persistidos no banco.
URLs locais são revogadas ao restaurar ou desmontar a página.

O ZIP é montado no navegador com JSZip, somente com aprovadas da próxima segunda.
Arquivos têm nomes normalizados e identificadores para evitar colisões. Na própria
segunda-feira, “próxima” significa a segunda da semana seguinte. O download trata
erro e estado de preparação. A tabela não exibe o calendário.

## O que falta para operar com dados reais

Substituir `DemoSurface`/`demo-transitions` por consultas e Server Actions autorizadas,
preservando os componentes visuais. Implementar transações de agendamento, envio e
revisão com o controle de concorrência da camada de dados. Armazenar PDFs em bucket
privado, validar o conteúdo no servidor e gerar URLs temporárias após autorização.
O teste de cabeçalho no navegador é apenas feedback de UI, não uma validação de
segurança suficiente para uploads de produção.

Downloads e ZIP reais precisam de Route Handlers que repitam os filtros de perfil,
área, dono, aprovação e semana. As funções de recorte da demonstração não são
autorização de produção. O MySQL deve continuar guardando só URL e metadados.

## Verificação

- 73 testes automatizados, incluindo as verificações de autenticação anteriores.
- Novos testes de datas, cores, precedência, slots vazios, revisões, agendamento,
  recortes de perfil, nomes de download e rejeição de arquivos inválidos.
- Testes DOM com React Testing Library: agendamento contextual, Escape, upload,
  aprovação e aparecimento da prova na Secretaria sem calendário.
- `/demo` respondeu HTTP 200 com o calendário renderizado; o PDF de exemplo
  respondeu HTTP 200 com cabeçalho PDF e 1.215 bytes.
- TypeScript e build Next.js verificados.
- Inspeção visual em navegador não realizada: o controle de UI informou que
  nenhum navegador estava disponível. Os testes DOM não substituem essa inspeção.
- Integração com MySQL/storage reais e impressão física não foram exercitadas.

Referências: [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/radix/sheet)
e [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
