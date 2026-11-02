# Validação direcionada — Administração V1

Execução local em 2026-11-02, branch `feat/administration-v1`. Dados
exclusivamente fictícios. Não constitui certificação de produção.

## Ambiente e reprodução

Um MongoDB replica set temporário autorizado, `administration511`, com tmpfs,
limite de memória, rede própria e porta publicada só em loopback. Bases
independentes `goleve_administration511_<id>_{auth,management,professional}`.
Chaves MFA, instalação e contratos técnicos geradas exclusivamente para os
testes. Não foram lidos segredos existentes nem usado RabbitMQ.

Fornecer explicitamente, num ambiente de testes previamente autorizado:

- `NODE_ENV=test` e `DOTENV_CONFIG_PATH` apontado para um caminho inexistente,
  impedindo carregamento de `.env` privado.
- `ADMINISTRATION511_TEST_MONGO_URI`: loopback, replica set `administration511`,
  `directConnection=true`; nunca o MongoDB principal.
- `AUTH_MFA_ENCRYPTION_KEY_FILE` e `AUTH_INSTALLATION_CREDENTIAL_FILE`: ficheiros
  temporários independentes com chaves aleatórias de testes.

Na pasta `backend`, `npm run test:administration --workspace=@goleve/auth-service`
compila os quatro workspaces envolvidos e executa as duas suites novas. O
comando não cria infraestrutura automaticamente. As suites recusam URI fora
de loopback/replica set esperado; a injeção de relógio só é possível com
`NODE_ENV=test` e a base Auth de testes identificada pelo prefixo acima.
Não alteram o relógio global nem simulam validação MFA.

## Cobertura

- Bootstrap desativado por defeito/sem rota HTTP, concorrência pela CLI,
  marcador permanente mesmo perante Administrador antigo suspenso, rollback
  quando a auditoria falha e nenhuma sessão privilegiada antes de MFA.
- TOTP real com vetores RFC, Base32, janela/contador, AES-GCM com chave/AAD
  incorretas ou cifra adulterada; códigos de recuperação com consumo único.
- Formação do quórum apenas após segundo MFA, convite único, expiração e
  aceitação concorrente; nenhuma reabertura automática.
- JWT sem sessão recusado, MFA obrigatório, rate limit, sessões isoladas,
  logout, suspensão/reativação e revogação global.
- Step-up vinculado a ator/sessão/ação/recurso/parâmetros, uso concorrente,
  expiração, replay, rollback e ausência de segredos na auditoria.
- Mudança de papel independente, autoalteração proibida, autoridade do
  requerente revogada e suspensão concorrente preservando um Administrador.
- Gestão de convites/atribuições reforçada, recusa independente, expiração,
  revogação, perfis Gestor e invalidação definitiva de âmbitos antigos após
  perda/restauro de papel ou suspensão/reativação/revogação global.
- Supervisão profissional mínima, suspensão auditada, bloqueio no contrato de
  elegibilidade Agenda e suspensão concorrente de serviço com uma única
  transição/histórico. Gateway não expõe o contrato interno.
- Falha Auth nega acesso; chave MFA ausente não degrada autenticação; produção
  não aceita revisão sintética. Maiúsculas, barra final e ID codificado na URL
  não dispensam o step-up administrativo.

Auth e Management usam aplicações HTTP reais; Professional usa os seus routers
internos reais e persistência própria; o Gateway usa o proxy Management real.
Não foram iniciadas instâncias completas de Agenda/Payment/User. Os respetivos
contratos existentes foram inspecionados; não se executou regressão global ou
teste ponta a ponta de todos os microserviços.

## Verificações complementares

Build TypeScript de Auth, Management, Professional e API Gateway. Testes
existentes direcionados: Auth `token`, `validation`, `security`; Management
`management.unit`; Professional `validation`, `offering-validation`,
`care-validation`, `security`. Não foram instaladas dependências.

O teste JWT existente foi atualizado para os novos claims `sid`/`sv`; os testes
negativos continuam a testar assinatura, expiração, issuer e audience, com
claims de sessão estruturalmente válidos. Fixtures HTTP antigas que assinavam
JWT sem sessão devem passar a efetuar login antes de uma futura regressão global;
não foi criado modo de compatibilidade que enfraqueça revogação.

Problemas corrigidos durante validação: relógio global dos testes interferia
com o heartbeat do Mongoose, substituído por relógio injetado restrito; tipos e
verificações de estado de conta alinhados; revogação de âmbitos reforçada;
normalização da rota na autorização; suspensão propagada à elegibilidade.
Aviso observado: dependência existente do proxy usa `util._extend` depreciado;
nenhuma biblioteca foi atualizada nesta fase.

## Limites e implantação

Ver [arquitetura](../architecture/administration-v1.md) e
[procedimento](../architecture/administration-v1-installation.md). Dependem de
revisão integrada de segurança, replica set/configuração de chaves em instalação
autorizada, autoridade profissional real e política operacional de recuperação
completa/rotação. Não houve provisionamento real ou migração. Os 14 serviços
principais não foram reconstruídos ou atualizados para esta implementação.

O resultado final e a confirmação de limpeza são registados abaixo após a
conclusão dos testes.

- `backend/services/auth-service/package.json`
- `backend/services/auth-service/src/administration/audit.middleware.ts`
- `backend/services/auth-service/src/administration/cli.ts`
- `backend/services/auth-service/src/administration/crypto.ts`
- `backend/services/auth-service/src/administration/models.ts`
- `backend/services/auth-service/src/administration/routes.ts`
- `backend/services/auth-service/src/administration/security.service.ts`
- `backend/services/auth-service/src/app.ts`
- `backend/services/auth-service/src/config/token.ts`
- `backend/services/auth-service/src/controllers/auth.controller.ts`
- `backend/services/auth-service/src/manager-invitations.ts`
- `backend/services/auth-service/src/middlewares/auth.middleware.ts`
- `backend/services/auth-service/src/models/auth-user.model.ts`
- `backend/services/auth-service/src/server.ts`
- `backend/services/auth-service/src/services/auth.service.ts`
- `backend/services/auth-service/tests/administration.integration.test.cjs`
- `backend/services/auth-service/tests/administration.unit.test.cjs`
- `backend/services/auth-service/tests/token.test.cjs`
- `backend/services/management-service/src/app.ts`
- `backend/services/management-service/src/middlewares/administration.middleware.ts`
- `backend/services/management-service/src/middlewares/auth.middleware.ts`
- `backend/services/management-service/src/models/index.ts`
- `backend/services/management-service/src/routes/administration.routes.ts`
- `backend/services/management-service/src/routes/management.routes.ts`
- `backend/services/management-service/src/services/management.service.ts`
- `backend/services/management-service/src/services/owner-client.service.ts`
- `backend/services/professional-service/src/app.ts`
- `backend/services/professional-service/src/internal/administration.routes.ts`
- `backend/services/professional-service/src/internal/agenda.routes.ts`
- `backend/services/professional-service/src/internal/management.routes.ts`
- `backend/services/professional-service/src/middlewares/administration.middleware.ts`
- `backend/services/professional-service/src/models/professional-profile.model.ts`
- `backend/services/professional-service/src/models/professional-service.model.ts`
- `backend/services/professional-service/src/services/application.service.ts`
- `backend/services/professional-service/src/services/professional-offering.service.ts`
- `documentation/api/administration-v1-validation.md`
- `documentation/api/administration-v1.md`
- `documentation/api/administration-v1.openapi.json`
- `documentation/api/management-v1.md`
- `documentation/api/management-v1.openapi.json`
- `documentation/architecture/administration-v1-installation.md`
- `documentation/architecture/administration-v1-transition.md`
- `documentation/architecture/administration-v1.md`
- `documentation/architecture/profile-permissions.md`
- `documentation/backend-completion-plan.md`
