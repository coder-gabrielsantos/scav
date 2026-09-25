# Camada de dados

Este documento descreve a modelagem original. A autenticação foi integrada na
etapa 3 (`security.md`) e a interface demonstrativa na etapa 4 (`calendar-ui.md`).
As operações acadêmicas abaixo ainda aguardam integração persistente no servidor.

## Escopo e premissas

O MVP atende uma escola, com um perfil por usuário e uma prova por
professor/disciplina/slot. Turmas, turnos, provas substitutivas e múltiplas escolas
não fazem parte deste primeiro modelo. Se a escola produzir provas diferentes por
turma, será necessário incluir a turma no vínculo docente e na unicidade da prova.

`Role` é um enum com `GESTAO`, `COORDENACAO`, `PROFESSOR` e `SECRETARIA`:
os quatro perfis são fixos, portanto não precisam de cadastro em tabela separada.
Os campos de usuário e os modelos `Account`, `Session` e `VerificationToken`
preparam a integração com Auth.js; ainda não implementam login ou autorização.
`passwordHash` é opcional para permitir Credentials ou OAuth. Nunca armazene senha
em texto puro. Novas contas começam inativas e dependem de ativação pela Gestão.

## Relações

| Entidade | Responsabilidade |
| --- | --- |
| `User` | Identidade, perfil e ativação da conta |
| `SubjectArea` | Área de conhecimento, como Humanas |
| `AreaCoordinator` | Escopo de atuação de cada coordenador |
| `Subject` | Disciplina pertencente a uma área |
| `TeacherSubject` | Vínculo ativo entre professor e disciplina |
| `AssessmentDate` | Dia civil único do calendário, criado pela Gestão |
| `AssessmentSlot` | Área selecionada para aquele dia e prazo de envio |
| `AssessmentDocument` | Prova esperada e seu status, mesmo sem PDF |
| `AssessmentDocumentVersion` | Versão imutável do PDF no storage |
| `AssessmentReview` | Decisão e comentário do coordenador sobre uma versão |

Uma data comporta várias áreas. Cada área possui várias disciplinas; cada
disciplina pode ter vários professores. A prova se liga ao professor, à disciplina
e ao slot. A revisão se liga à versão exata e ao coordenador responsável.

Os registros acadêmicos usam exclusão restrita para preservar histórico. Usuários,
áreas, disciplinas e vínculos podem ser desativados. Apenas contas externas e
sessões do Auth.js possuem exclusão em cascata.

## Fluxo transacional a implementar nas Server Actions

1. A Gestão cria `AssessmentDate` e os `AssessmentSlot` selecionados. Na mesma
   transação, cria um `AssessmentDocument` pendente para cada vínculo docente
   ativo nas disciplinas das áreas selecionadas. Assim, ausência de upload
   aparece na cobrança e no total esperado do calendário.
2. O professor envia o PDF a um bucket privado. Após validar o arquivo no servidor,
   a aplicação cria a versão 1 e atualiza a prova para `UNDER_REVIEW` na mesma
   transação de banco. O storage não participa dessa transação: falhas exigem
   limpeza do objeto órfão. A chave do objeto deve ser aleatória e nunca sobrescrita.
3. O coordenador da área abre a versão atual e registra `AssessmentReview`.
   Aprovação muda o status para `APPROVED`; solicitação de ajustes exige comentário
   e muda para `CHANGES_REQUESTED`.
4. Um reenvio após ajustes cria a próxima versão e retorna para `UNDER_REVIEW`.
   Revisões anteriores permanecem no histórico e nunca aprovam a nova versão.
5. A Secretaria consulta apenas provas `APPROVED` na próxima segunda-feira e
   recebe downloads autorizados da versão atual. O ZIP deve repetir exatamente
   esse filtro no servidor.

Transições previstas:

```text
PENDING_SUBMISSION ── upload ──> UNDER_REVIEW ── aprovação ──> APPROVED
                                      │
                                  ajustes
                                      ↓
                               CHANGES_REQUESTED
                                      │
                                   reenvio
                                      └──────────────> UNDER_REVIEW
```

No MVP, a prova aprovada é encerrada e não aceita substituição. Reabertura futura
deve ser uma operação explícita com auditoria. A versão atual é aquela com maior
`version`, sem depender da ordenação por timestamp. Cada versão aceita uma decisão
final (`versionId` único em `AssessmentReview`).

Uploads e decisões devem atualizar o documento com comparação de `revision` e do
status esperado, incrementando `revision` na mesma transação. Em uma aprovação,
validar também que o ID recebido é o da versão atual. Se nenhuma linha for
atualizada, abortar e informar conflito. Isso evita aprovar PDF desatualizado,
duplicar decisões ou permitir dois reenvios concorrentes.

## Datas e cores do calendário

`AssessmentDate.date` usa `DATE` do MySQL: é um dia civil da escola. Na fronteira
com Prisma, converter `YYYY-MM-DD` para meia-noite UTC e serializar novamente como
data civil; não formatar esse valor como um instante local, o que pode exibir a
véspera. Prazos, uploads e revisões são instantes em UTC. A aplicação deve usar
`America/Sao_Paulo` para entrada e exibição de horários.

Datas devem ser segundas-feiras. O exemplo 20 de maio corresponde a uma segunda
em 2024, mas o ano precisa ser considerado na validação.

Para cada dia, aplicar a precedência abaixo às provas visíveis ao usuário:

1. **Vermelho:** existe `CHANGES_REQUESTED`, ou uma prova em `PENDING_SUBMISSION`
   cujo `submissionDeadline` já passou.
2. **Amarelo:** sem vermelho, existe `UNDER_REVIEW`.
3. **Verde:** há pelo menos uma prova esperada, cada slot visível tem provas
   atribuídas e todas estão `APPROVED`.
4. **Destaque neutro:** há slot, mas as provas ainda estão dentro do prazo de envio
   ou faltam professores para atribuir as provas. Sem slot, fundo padrão.

Uma prova enviada antes do prazo e ainda em revisão permanece amarela. Um dia com
slot vazio não fica verde. Atraso é derivado em cada leitura, sem depender de cron
para atualizar um enum. Manter texto/legenda junto às cores para acessibilidade.

Para a Secretaria, “próxima segunda-feira” é a primeira segunda **posterior** ao dia
atual no fuso da escola: na própria segunda, aponta para a semana seguinte. Na
quinta-feira, aponta para a segunda que vem. Este critério deve ser aplicado tanto
na tabela quanto nos endpoints de download individual e ZIP.

## Integridade: banco versus aplicação

O banco garante chaves estrangeiras, unicidade de data e slot, uma prova por
professor/disciplina/slot, numeração única de versões, localização única de objetos
e uma decisão por versão. Índices apoiam consultas por professor/status, área/prazo
e provas aprovadas por slot.

As seguintes regras **não estão implementadas pelo schema** e precisam de validação
nas Server Actions e nos endpoints, além de qualquer middleware:

- Sessão válida, usuário ativo e perfil apropriado em toda operação.
- Apenas Gestão pode criar datas/slots e ativar usuários; prazos devem anteceder
  o dia da avaliação no fuso da escola e a data deve ser segunda-feira.
- Professores só enviam as próprias provas; o vínculo docente deve estar ativo e
  a disciplina deve pertencer à área do slot. Desativar um vínculo com provas
  futuras exige resolver essas pendências explicitamente.
- Coordenação só vincula professores e revisa provas das áreas atribuídas a ela;
  o usuário vinculado deve ser professor e o revisor deve ser coordenador.
- Mudanças de área de uma disciplina com histórico devem ser impedidas. Crie uma
  nova disciplina/vínculo quando houver uma reorganização.
- Alterar slots/vínculos futuros exige reconciliar as provas esperadas em transação;
  não apagar provas que já possuem upload ou revisão.
- IDs de autor, professor, revisor e status devem vir da sessão e do fluxo validado,
  nunca ser aceitos livremente do formulário.
- Validar conteúdo real do PDF, MIME, tamanho positivo (limite sugerido: 20 MiB),
  checksum SHA-256 e número de versão positivo. Extensão `.pdf` não basta.
- Comentário obrigatório em `CHANGES_REQUESTED`; revisão somente da versão atual,
  respeitando transições e concorrência descritas acima.
- Secretaria só pode ler/download de aprovados da segunda definida, incluindo no
  ZIP. Consultas do calendário também devem respeitar professor e área.

## Armazenamento

O MySQL guarda somente metadados e a localização do arquivo: provedor, bucket,
chave, URL estável, nome original, tamanho, MIME e checksum. PDFs permanecem em
Supabase Storage, S3 ou R2 privados. Não armazenar blobs/base64 nem tornar o bucket
público. A URL estável identifica o objeto e não concede acesso por si só.

A aplicação usará as credenciais de servidor para gerar URLs assinadas curtas ou
transmitir o download após autorização. URLs assinadas não são persistidas porque
expiram. A integração real com storage e a montagem do ZIP pertencem às próximas
etapas; este schema apenas fornece os dados necessários.
