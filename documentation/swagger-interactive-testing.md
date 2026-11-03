# Testes interativos com Swagger

O Swagger UI interativo só deve ser usado num Gateway de desenvolvimento local
em `127.0.0.1` ou `localhost`. A documentação de produção permanece desativada.

## Ativar

A partir da raiz do repositório, preparar e compilar o Gateway:

```powershell
cd backend
npm run docs:check --workspace=@goleve/api-gateway
npm run build --workspace=@goleve/api-gateway
cd api-gateway
$env:NODE_ENV = 'development'
$env:GATEWAY_API_DOCS_ENABLED = 'true'
$env:GATEWAY_API_DOCS_TRY_IT_OUT = 'true'
$env:GATEWAY_API_DOCS_ORIGIN = 'http://127.0.0.1:3000'
$env:CORS_ALLOWED_ORIGINS = 'http://127.0.0.1:3000'
$env:PORT = '3000'
node -e "require('./dist/app').createApp().listen(Number(process.env.PORT), '127.0.0.1')"
```

Abra `http://127.0.0.1:3000/api-docs`. O Gateway deve conseguir alcançar os
serviços autorizados através das variáveis `*_SERVICE_URL`; não exponha portas
privadas apenas para usar esta interface.

Existe também uma interface essencial independente em
`http://127.0.0.1:3000/api-docs/essentials`. Ela é derivada do mesmo contrato
OpenAPI e contém apenas 30 operações funcionais selecionadas explicitamente para
demonstração: autenticação, perfil, treino, hidratação, desempenho, agenda,
catálogo profissional, pagamentos MockBank e notificações. Os health checks e
readiness são documentação técnica e não aparecem nesta interface.
As operações AI Coach não aparecem porque estão `disabled-by-default` no
ambiente atual. A seleção não inclui automaticamente novas operações
administrativas ou sensíveis.

Operações selecionadas no modo essencial:

```text
POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/logout
GET/PATCH /users/me
GET /training/exercises, GET /training/plans, GET/POST /training/sessions
POST /training/sessions/{sessionId}/exercises
GET /hydration/goal, GET /hydration/intakes, POST /hydration/intakes
GET /performance/goals, GET /performance/measurements
GET /performance/measurements/evolution, GET /performance/summary
GET/POST /agenda/activities
GET/POST /agenda/professional-appointments
GET /agenda/professionals/{professionalId}/availability
GET /professionals/catalog, GET /professionals/services
GET /payments, POST /payments, GET /payments/{paymentId}
GET /notifications, GET /notifications/unread-count
```

Esta seleção cobre autenticação, perfil e dados de demonstração sem expor
operações técnicas, administrativas, de step-up, relações
profissionais sensíveis, pagamentos de agenda ou rotas AI Coach desativadas.

O modo interativo exige simultaneamente:

- `NODE_ENV=development`;
- `GATEWAY_API_DOCS_ENABLED=true`;
- `GATEWAY_API_DOCS_TRY_IT_OUT=true`;
- origem HTTP(S) loopback explícita em `GATEWAY_API_DOCS_ORIGIN`;
- a mesma origem em `CORS_ALLOWED_ORIGINS`.

Uma origem externa, credenciais na URL, caminhos adicionais ou configuração
incompleta fazem o Gateway recusar a configuração.

## Login e Authorize

Os passos seguintes funcionam em ambas as interfaces; escolha o endereço
completo ou essencial conforme o fluxo que pretende testar.

Use uma das cinco identidades fictícias local-demo já provisionadas no ambiente
autorizado. As passwords não são documentadas nem copiadas para o repositório;
obtenha-as apenas do mecanismo local-demo existente.

1. Abra `POST /auth/login` e selecione **Try it out**.
2. Preencha o email e a password da identidade fictícia escolhida.
3. Execute o pedido e copie somente o JWT da resposta.
4. Clique em **Authorize**, introduza `Bearer <JWT>` e confirme.
5. Execute `GET /auth/me` para confirmar a sessão e a identidade.

O JWT permanece apenas na memória do Swagger UI (`persistAuthorization=false`).
Não o cole em issues, logs, documentação ou capturas de ecrã.

Os perfis disponíveis são Utilizador, Personal Trainer, Nutricionista, Gestor
e Administrador. Cada sessão continua sujeita às permissões, relações,
elegibilidade profissional, MFA e step-up definidos pelos serviços.

## Executar operações

Expanda uma operação, clique em **Try it out**, preencha os parâmetros e o JSON
do contrato e clique em **Execute**. A interface envia o pedido apenas para o
Gateway atual. Os headers de concorrência e idempotência documentados, como
`If-Match`, `If-None-Match` e `Idempotency-Key`, continuam obrigatórios quando
o contrato os indicar.

Exemplos seguros para começar:

- `GET /health`: deve devolver `200` sem JWT.
- `GET /auth/me`: deve devolver `200` com uma sessão válida e `401` sem JWT.
- Uma operação de leitura autorizada pelo perfil selecionado.

As operações de escrita devem usar exclusivamente dados sintéticos e recursos
do ambiente de demonstração. Os fluxos de pagamento usam MockBank fictício.

## Respostas e limitações

- `401`: sessão ausente, inválida, expirada ou revogada.
- `403`: sessão válida sem a permissão, relação ou condição necessária.
- `404`: rota inexistente, rota interna ou recurso não disponível.
- `409`: conflito de versão, idempotência ou estado do recurso.
- `422`: payload válido em JSON, mas inválido para o contrato.
- `429`: limite de pedidos atingido.
- `502`/`503`: serviço autorizado indisponível ou não alcançável pelo Gateway.

As 215 operações e 170 caminhos continuam documentados. A extensão
`x-availability` descreve limitações de runtime; não concede permissões:

- AI Coach: desativado por defeito.
- Administração e gestão privilegiada: requerem autoridade provisionada e
  MFA/step-up quando aplicável.
- Agenda profissional e relações: requerem elegibilidade e relações válidas.
- Pagamentos de agenda e aplicações profissionais: permanecem bloqueados pelas
  políticas de demonstração/revisão.

Nenhuma rota `/internal/*` é exposta no documento público ou aceite pelo
interceptor do Swagger. Destinos externos, credenciais de serviço e métodos
fora do contrato também são recusados.

## Voltar ao modo somente leitura

Pare o processo e reinicie-o com:

```powershell
$env:GATEWAY_API_DOCS_TRY_IT_OUT = 'false'
```

Também é possível deixar `GATEWAY_API_DOCS_ENABLED` como `false` para ocultar
completamente a documentação. Em `production`, `test` e ambientes não
reconhecidos, o endpoint permanece indisponível independentemente das flags.
