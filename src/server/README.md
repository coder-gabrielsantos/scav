# Código exclusivo do servidor

Módulos desta pasta devem importar `server-only`. A pasta conterá autenticação,
acesso ao banco, consultas com escopo, transações e integração com storage.

Auth.js valida a sessão contra o usuário ativo no banco em cada verificação de
servidor. Não inserir usuários ou perfis simulados para liberar rotas protegidas.
`db/client.ts` e `auth/password.ts` também são usados pelos scripts Node de
provisionamento; a aplicação os acessa através das entradas com `server-only`.

Autorização de recurso deve ocorrer antes de consultar ou alterar dados. Uma
checagem de perfil não substitui verificar professor responsável, área coordenada,
status aprovado ou data permitida para impressão.
