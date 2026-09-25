# Etapa 3 — autenticação e autorização

Login por e-mail/senha com Auth.js (`next-auth@5.0.0-beta.32`, versão fixada),
sessões JWT em cookie e contas armazenadas no MySQL via Prisma. A API v5 ainda é
beta; essa escolha acompanha a integração App Router usada aqui. Calendário e
operações de prova continuam para a próxima etapa.

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `src/auth.config.ts` | Configuração JWT, sessão mínima e destinos permitidos |
| `src/auth.ts` | Provider Credentials e revalidação do token no banco |
| `src/proxy.ts` | Entrada no dashboard conforme perfil e bloqueio entre áreas |
| `src/types/next-auth.d.ts` | Tipos de perfil e identidade da sessão |
| `src/app/api/auth/[...nextauth]/route.ts` | GET/POST oficiais do Auth.js |
| `src/server/auth/credentials.ts` | Validação de credenciais e conta ativa |
| `src/server/auth/token.ts` | Conferência de usuário, perfil e versão da sessão |
| `src/server/auth/session.ts` | Identidade validada para a renderização atual |
| `src/server/auth/guards.ts` | Guardas de navegação das páginas |
| `src/server/auth/authorization.ts` | Guardas para actions/APIs e escopo da coordenação |
| `src/server/auth/password.ts` | Hash e verificação de senha com scrypt |
| `src/server/auth/login-throttle.ts` | Limite compartilhado de tentativas no MySQL |
| `src/server/db/prisma.ts` | Cliente Prisma inicializado apenas quando necessário |
| `src/features/auth/actions.ts` | Entrar e sair por Server Actions |
| `src/features/auth/components/login-form.tsx` | Formulário com estado de envio e erros |
| `scripts/create-admin.ts` | Criação explícita da conta inicial de Gestão |

No Next.js 16, `proxy.ts` corresponde ao `middleware.ts` solicitado originalmente.
Não manter ambos no projeto. O matcher atua em `/dashboard/:path*`, incluindo
subrotas. Login, assets e handlers Auth.js ficam fora dele.

## Como o acesso é verificado

1. O provider valida e normaliza o e-mail, aplica o limite de tentativas, lê o
   usuário e verifica a senha. Contas inativas não entram. O papel vem do banco;
   campos adicionais de formulário são descartados.
2. Auth.js emite seu cookie de sessão HttpOnly, SameSite=Lax, com JWT protegido.
   Em HTTPS, usa cookie Secure. A duração configurada é oito horas, renovável
   conforme o comportamento de sessão do Auth.js. Senha e hash nunca entram no JWT.
3. Proxy lê a sessão sem consultar o banco. Visitantes vão para `/login`;
   `/dashboard` vai para o painel do perfil; acesso ao painel de outro perfil vai
   para `/acesso-negado`. Prefixos parecidos, como `gestao-outro`, não são aceitos.
4. As páginas repetem a verificação usando a configuração completa de Auth.js.
   O callback JWT confere no MySQL que a conta continua ativa, com o mesmo perfil
   e `authVersion`. Uma sessão antiga não basta para ler dados.
5. Alterar o perfil, desativar ou remover a conta invalida a sessão na próxima
   verificação de servidor. Incrementar `authVersion` revoga todas as sessões
   anteriores. Isso deve fazer parte da mesma transação de qualquer troca de senha.

O Proxy pode observar brevemente o perfil antigo de um cookie ainda válido;
a página/consulta bloqueia esse acesso pelo banco e envia para o login. Login
não passa pelo Proxy e revalida a sessão, evitando ciclos de redirecionamento.
`/api/auth/session` também faz a conferência no banco.

`cache()` deduplica a leitura da sessão apenas dentro da renderização React atual.
Não há cache compartilhado de identidades entre usuários. A conta não é confiada
somente porque passou pelo layout ou pelo Proxy.

Actions e APIs de negócio devem chamar `authorizeUser()` e conferir o recurso.
`AuthorizationError.status` distingue 401/403 sem redirecionar downloads para HTML.
`authorizeCoordinatorArea()` já confere vínculo e ativação da área. Os endpoints
de PDFs/ZIP e as actions de envio/revisão ainda não existem: deverão validar dono,
área, status e semana antes de acessar storage ou modificar provas.

## Senhas, provisionamento e tentativas

Senhas usam scrypt com salt aleatório de 16 bytes, N=65536, r=8, p=2 e chave de
64 bytes. A comparação usa `timingSafeEqual`. Novas senhas têm 12 a 128 caracteres.
Um hash fictício mantém o custo da verificação quando o e-mail não existe.
Hash malformado não pode definir parâmetros de custo arbitrários.

O cadastro público via Google cria apenas contas de Gestão quando o e-mail é
verificado. Convites emitidos pela gestão definem os demais perfis. Não há senha
padrão nem elevação de perfil via formulário. `auth:create-admin` também pode
criar uma conta ativa de Gestão e recusa e-mails existentes,
sem sobrescrever senha ou perfil. As demais contas e a recuperação de senha
precisarão de um fluxo administrativo posterior; a UI ainda não implementa isso.

`LoginAttemptBucket` guarda um contador atômico para cada e-mail normalizado e
janela fixa de 15 minutos, usando uma chave SHA-256. Dez tentativas por janela
são permitidas, incluindo logins bem-sucedidos. A seguinte é negada pelo próprio
provider, inclusive quando alguém tenta chamar o endpoint diretamente. A janela
fixa pode permitir novas tentativas imediatamente após sua virada.

O limite é compartilhado entre instâncias via MySQL. Ele é por e-mail, não um
limite global ou por IP; não substitui controle de volume na infraestrutura.
Mensagens de senha incorreta, conta inativa, conta inexistente e bloqueio temporário
não revelam qual condição ocorreu. Erros de banco não liberam acesso.

Execute `npm run auth:cleanup` periodicamente, por exemplo diariamente, para
remover contadores expirados. Não há agendador provisionado nesta entrega.

Credentials usa JWT e persistência explícita do usuário, portanto não requer
Prisma Adapter do Auth.js. `Account`, `Session` e `VerificationToken` permanecem
no schema para eventual OAuth/magic links; este fluxo não os utiliza.

## Configuração local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` somente se ainda não existir. Configure
   `DATABASE_URL`, `AUTH_URL` e um `AUTH_SECRET` aleatório de pelo menos 32 bytes.
   O arquivo de exemplo mostra o comando para gerar o segredo.
   Para o login com Google, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
   e cadastre `http://localhost:3000/api/auth/callback/google` como URI de
   redirecionamento autorizada no cliente OAuth. Uma conta Google verificada
   sem convite cria um novo usuário de Gestão, que cadastra sua instituição no
   primeiro acesso. Convites criados pela gestão definem os perfis dos demais
   usuários; o acesso é ativado quando o convidado entra com o mesmo e-mail
   verificado pelo Google.
   Se o MySQL local usar `caching_sha2_password` sem TLS, acrescente
   `?allowPublicKeyRetrieval=true` à URL do banco. Confirme também que o usuário
   e a senha de `DATABASE_URL` correspondem a uma conta válida no MySQL.
3. Rode `npm run db:generate` e `npm run db:migrate -- --name authentication` no
   banco de desenvolvimento. O schema acrescentou `User.authVersion` e
   `LoginAttemptBucket`; preserve migrações anteriores se já existirem.
4. Se preferir login por e-mail e senha, crie uma conta inicial com o comando abaixo.
5. Rode `npm run dev` e abra `http://localhost:3000/login`.

Exemplo PowerShell, com leitura de senha sem colocá-la no histórico do shell:

```powershell
$env:ADMIN_EMAIL = 'gestao@suaescola.com.br'
$env:ADMIN_NAME = 'Gestão da escola'
$scavPassword = Read-Host 'Senha inicial (12 a 128 caracteres)' -AsSecureString
$scavCredential = New-Object System.Net.NetworkCredential('', $scavPassword)
try {
  $env:ADMIN_PASSWORD = $scavCredential.Password
  npm run auth:create-admin
} finally {
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable scavPassword, scavCredential -ErrorAction SilentlyContinue
}
```

O segredo e as credenciais reais não foram criados nesta entrega. Em implantação,
configure `AUTH_URL` com a origem HTTPS canônica. Não habilitar confiança irrestrita
em headers de host encaminhados por clientes. O driver aceita a URL MySQL via
`DATABASE_URL`; conexão remota deve usar as opções TLS do seu provedor.

`src/server/db/client.ts` e `password.ts` são utilitários Node compartilhados pelos
scripts de provisionamento. Não importá-los em Client Components. As entradas da
aplicação (`prisma.ts`, `auth.ts` e serviços de autenticação) usam `server-only`.

## Verificação e limites desta entrega

- Schema validado, cliente Prisma gerado, TypeScript e build Next.js aprovados.
- 57 testes automatizados: matriz de acesso dos quatro perfis; senha, conta ativa,
  sessão revogada, escopo da coordenação, normalização de e-mail e limite de tentativas.
- Os handlers reais do Auth.js foram exercitados com Request/Response: login dos
  quatro perfis, cookie HttpOnly, sessão mínima, bloqueio de CSRF, callback externo
  descartado e invalidação após desativação. Nestes testes, o acesso ao banco é simulado.
- Não houve migração, criação de conta ou login completo contra MySQL real: o
  Docker instalado está com o serviço parado e não havia conexão configurada.
- A revisão automática bloqueou a inicialização do servidor local para a checagem
  HTTP adicional, sem fornecer motivo específico. Os testes dos handlers e o
  build não substituem a checagem completa em execução com banco real.
- Auditoria após atualização dos drivers: três alertas altos permanecem na cadeia
  `prisma` → `@prisma/config` → `deepmerge-ts`. A correção automática sugerida muda
  a versão principal do Prisma e não foi aplicada. Os overrides de `mariadb@3.5.4`
  e `mysql2@3.24.4` removem os alertas dos drivers; sua integração com MySQL real
  continua pendente da instância de teste.

## Referências

- [Auth.js — Credentials](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js — RBAC](https://authjs.dev/guides/role-based-access-control)
- [Next.js — Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js — autenticação e autorização](https://nextjs.org/docs/app/guides/authentication)
