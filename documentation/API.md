# GoLeve V1 — Referência da API

## 1. Introdução

O GoLeve V1 disponibiliza uma API REST através do API Gateway. Este documento
resume o contrato público e descreve as 30 operações selecionadas para o
Swagger essencial local.

A fonte canónica é
[backend-release-v1.openapi.json](api/backend-release-v1.openapi.json). A
existência de uma operação no contrato não garante que todos os perfis,
integrações ou pré-condições de negócio estejam disponíveis no ambiente atual.

## 2. Arquitetura da API

Os clientes Web e Mobile comunicam com o Gateway. O Gateway encaminha os
pedidos para Auth, User, Training, Hydration, Performance, Agenda,
Professional, Payment, Notification, Management e AI Coach. A persistência é
feita pelos serviços em MongoDB e os eventos são publicados em RabbitMQ.

O contrato completo contém 215 operações em 170 caminhos. O contrato essencial
é uma seleção determinística por allowlist, com 30 operações em 24 caminhos.

## 3. API Gateway

O Gateway local está em `http://127.0.0.1:3000`. Publica os prefixos de
domínio, aplica a fronteira CORS/rate limit e bloqueia rotas internas,
traversal, hosts externos e credenciais em URLs de proxy.

As autorizações de negócio são verificadas pelos serviços. O Gateway não
transforma uma operação autenticada numa operação autorizada para todos os
perfis.

## 4. Convenções REST

- Os caminhos usam os prefixos de domínio definidos no contrato.
- Os corpos usam `application/json`.
- Datas e instantes são representados como strings conforme o schema OpenAPI.
- Paginação usa `page` e `pageSize` quando definidos.
- Recursos próprios são limitados ao utilizador autenticado.
- `ETag`/`If-Match` são usados onde o contrato exige controlo de concorrência.
- `Idempotency-Key` é obrigatório nas operações que criam pedidos repetíveis.
- Respostas de erro usam o contrato `Error`; o Gateway também pode devolver
  códigos próprios de fronteira ou indisponibilidade.

## 5. Formatos JSON

Os envelopes, schemas e referências completos estão no contrato OpenAPI. O
contrato analisado não define valores `example`/`examples`; os snippets desta
documentação são apenas modelos estruturais com placeholders e não resultados
reais.

Formato de erro observado no Gateway:

```json
{
  "error": {
    "code": "CODIGO_DO_ERRO",
    "message": "Mensagem fornecida pelo serviço, quando aplicável"
  }
}
```

O campo `message` pode não existir em todas as respostas. Nunca colocar tokens,
passwords ou dados pessoais reais em exemplos ou URLs.

## 6. Autenticação JWT

As operações protegidas usam o esquema OpenAPI `Bearer`. O pedido deve incluir:

```http
Authorization: Bearer <JWT-emitido-pelo-Auth-Service>
```

O JWT é emitido pelo login/registo conforme o fluxo aplicável, associado a uma
sessão persistida e revogável. O endpoint `/auth/me` permite confirmar a
identidade e o estado da sessão. O logout revoga a sessão atual.

O login de uma conta administrativa pode devolver um desafio MFA em vez de um
JWT privilegiado. MFA e step-up continuam obrigatórios quando o serviço os
exige.

## 7. Autorização por perfis

| Tipo de operação | Autorização |
|---|---|
| Registo e login | Público, sujeito às regras do Auth |
| Catálogo de profissionais/serviços | Público no contrato |
| Perfil, treino, hidratação, desempenho e notificações | Bearer JWT e proprietário do recurso |
| Agenda pessoal | Bearer JWT e proprietário da atividade |
| Agenda profissional | Bearer JWT, elegibilidade e regras de relação/capacidade |
| Pagamentos | Bearer JWT, proprietário do pagamento e guardas MockBank |
| Rotas administrativas/internas | Fora do Swagger essencial; exigem autorização específica |

As operações essenciais não expõem rotas `/internal/*` nem operações
administrativas de manutenção.

## 8. Swagger UI

Interfaces locais:

- [Swagger completo](http://127.0.0.1:3000/api-docs): 215 operações/170 caminhos;
- [Swagger essencial](http://127.0.0.1:3000/api-docs/essentials): 30
  operações/24 caminhos no código local.

Utilização:

1. Abrir uma das interfaces.
2. Expandir a operação pretendida.
3. Selecionar **Try it out**, apenas em desenvolvimento local autorizado.
4. Preencher parâmetros e corpo JSON conforme o schema.
5. Selecionar **Authorize** e inserir um JWT Bearer válido, sem o guardar em
   ficheiros ou URLs.
6. Executar o pedido.
7. Interpretar o código HTTP, corpo, headers, `ETag`, `Retry-After` e
   `Idempotency-Replayed` quando presentes.

O código local já contém a seleção 30/24, mas a imagem Docker observada ainda
servia 31/26 até ser reconstruída. O documento servido deve ser confirmado
antes de declarar as duas versões sincronizadas.

## 9. Operações essenciais

As operações seguintes são a allowlist exata de
[swagger-documents.ts](../backend/api-gateway/src/docs/swagger-documents.ts).
Nos quadros, `*` indica campo/parâmetro obrigatório no contrato. “Sem corpo”
significa que os parâmetros pertencem à query ou ao path.

## 10. Autenticação

### `POST /auth/register`

| Item | Contrato |
|---|---|
| Descrição | Criar apenas uma conta normal fictícia e uma sessão persistente |
| Perfil | Público; não cria privilégios administrativos |
| Headers | `Content-Type: application/json` |
| Corpo | `name*`, `email*`, `password*` |
| Respostas | `201`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível no local-demo, sujeito às políticas do Auth |

```json
{
  "name": "<nome>",
  "email": "<email>",
  "password": "<password>"
}
```

### `POST /auth/login`

| Item | Contrato |
|---|---|
| Descrição | Iniciar sessão com password |
| Perfil | Público; administradores podem receber desafio MFA |
| Headers | `Content-Type: application/json` |
| Corpo | `email*`, `password*` |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `410`, `412`, `428`, `429`, `503` |
| Estado | Disponível para identidades autorizadas |

```json
{
  "email": "<email>",
  "password": "<password>"
}
```

### `GET /auth/me`

| Item | Contrato |
|---|---|
| Descrição | Consultar identidade e sessão atuais |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível; sem JWT deve resultar em `401` |

### `POST /auth/logout`

| Item | Contrato |
|---|---|
| Descrição | Revogar a sessão atual |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Objeto JSON vazio |
| Respostas | `204`; erros `400`, `401`, `403`, `404`, `409`, `410`, `412`, `428`, `429`, `503` |
| Estado | Disponível para a sessão atual |

```json
{}
```

## 11. Perfil

### `GET /users/me`

| Item | Contrato |
|---|---|
| Descrição | Consultar o próprio perfil |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível para o proprietário |

### `PATCH /users/me`

| Item | Contrato |
|---|---|
| Descrição | Atualizar o perfil com `ETag` exato |
| Perfil | Utilizador autenticado, proprietário |
| Headers | `Authorization`, `Content-Type: application/json`, `If-Match*` |
| Corpo | `displayName`; opcionalmente `birthDate`, `gender`, `genderDescription`, `contactEmail`, `phoneE164`, `countryCode`, `approximateLocation` (estes campos aceitam também `null` conforme schema) |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível; conflito de versão resulta em erro de pré-condição |

```json
{
  "displayName": "<nome-de-apresentacao>",
  "birthDate": "<data-ou-null>",
  "gender": "<valor-ou-null>",
  "genderDescription": "<descricao-ou-null>",
  "contactEmail": "<email-ou-null>",
  "phoneE164": "<telefone-ou-null>",
  "countryCode": "<codigo-ou-null>",
  "approximateLocation": "<objeto-ou-null>"
}
```

## 12. Treinos

### `GET /training/exercises`

| Item | Contrato |
|---|---|
| Descrição | Consultar exercícios |
| Perfil | Utilizador autenticado |
| Query | `page`, `pageSize`, `environment`, `difficulty`, `type`, `muscleGroup` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível conforme filtros e dados existentes |

### `GET /training/plans`

| Item | Contrato |
|---|---|
| Descrição | Consultar planos próprios |
| Perfil | Utilizador autenticado |
| Query | `page` (inteiro, mínimo 1, por defeito 1), `pageSize` (inteiro, 1–100, por defeito 20) |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

### `GET /training/sessions`

| Item | Contrato |
|---|---|
| Descrição | Consultar sessões próprias |
| Perfil | Utilizador autenticado |
| Query | `page` (inteiro, mínimo 1, por defeito 1), `pageSize` (inteiro, 1–100, por defeito 20) |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

### `POST /training/sessions`

| Item | Contrato |
|---|---|
| Descrição | Criar uma sessão de treino planeada própria |
| Perfil | Utilizador autenticado |
| Headers | `Authorization`, `Content-Type: application/json` |
| Corpo | `planId*` |
| Respostas | `201`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível conforme plano autorizado |

```json
{
  "planId": "<id-do-plano>"
}
```

### `POST /training/sessions/{sessionId}/exercises`

| Item | Contrato |
|---|---|
| Descrição | Registar exercício realizado |
| Perfil | Utilizador autenticado, proprietário da sessão |
| Headers | `Authorization`, `Content-Type: application/json` |
| Path | `sessionId*` |
| Corpo | `exerciseId*`, `sets*` (array), `notes` |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível conforme estado da sessão |

```json
{
  "exerciseId": "<id-do-exercicio>",
  "sets": [],
  "notes": "<notas-opcionais>"
}
```

## 13. Hidratação

### `GET /hydration/goal`

| Item | Contrato |
|---|---|
| Descrição | Consultar a própria meta de hidratação |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

### `GET /hydration/intakes`

| Item | Contrato |
|---|---|
| Descrição | Consultar consumo de água |
| Perfil | Utilizador autenticado |
| Query | `page`, `pageSize`, `from`, `to`, `timezone` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível |

### `POST /hydration/intakes`

| Item | Contrato |
|---|---|
| Descrição | Registar consumo de forma idempotente e escrever outbox |
| Perfil | Utilizador autenticado |
| Headers | `Authorization`, `Content-Type: application/json` |
| Corpo | `amountMl*` (inteiro), `timezone*`, `consumedAt`, `idempotencyKey*` |
| Respostas | `200` ou `201`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível; repetição controlada por chave de idempotência |

```json
{
  "amountMl": 0,
  "timezone": "<fuso-horario>",
  "consumedAt": "<instante-opcional>",
  "idempotencyKey": "<chave-unica>"
}
```

## 14. Desempenho

### `GET /performance/goals`

| Item | Contrato |
|---|---|
| Descrição | Consultar objetivos próprios de desempenho |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível; convergência com medições User permanece limitada |

### `GET /performance/measurements`

| Item | Contrato |
|---|---|
| Descrição | Consultar medições de desempenho |
| Perfil | Utilizador autenticado |
| Query | `page`, `pageSize`, `from`, `to` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível |

### `GET /performance/measurements/evolution`

| Item | Contrato |
|---|---|
| Descrição | Consultar evolução das medições |
| Perfil | Utilizador autenticado |
| Query | `page`, `pageSize`, `from`, `to` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível; interpretação clínica não é fornecida |

### `GET /performance/summary`

| Item | Contrato |
|---|---|
| Descrição | Consultar resumo de desempenho |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível |

## 15. Agenda

### `GET /agenda/activities`

| Item | Contrato |
|---|---|
| Descrição | Consultar agenda pessoal |
| Perfil | Utilizador autenticado, proprietário |
| Query | `page`, `pageSize`, `from`, `to`, `status`, `kind`, `environment` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

### `POST /agenda/activities`

| Item | Contrato |
|---|---|
| Descrição | Adicionar atividade própria; sobreposição devolve aviso |
| Perfil | Utilizador autenticado |
| Headers | `Authorization`, `Content-Type: application/json` |
| Corpo | `title*`, `description`, `kind*`, `environment`, `startAt*`, `endAt*`, `timezone*`, `status` |
| Respostas | `201`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

```json
{
  "title": "<titulo>",
  "description": "<descricao-opcional>",
  "kind": "<tipo>",
  "environment": "<ambiente-opcional>",
  "startAt": "<instante>",
  "endAt": "<instante>",
  "timezone": "<fuso-horario>",
  "status": "<estado-opcional>"
}
```

### `GET /agenda/professional-appointments`

| Item | Contrato |
|---|---|
| Descrição | Consultar marcações profissionais próprias |
| Perfil | Utilizador autenticado |
| Query | `from`, `to`, `limit`, `before`, `status`, `capabilityId` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Parcial; a aceitação positiva requer elegibilidade real |

### `POST /agenda/professional-appointments`

| Item | Contrato |
|---|---|
| Descrição | Efetuar pedido de marcação profissional |
| Perfil | Utilizador autenticado e elegível |
| Headers | `Authorization`, `Content-Type: application/json`, `Idempotency-Key*` |
| Corpo | `serviceId`, `professionalId*`, `capabilityId*`, `appointmentType*`, `relationshipId`, `mode*`, `environment`, `startAtUtc*`, `endAtUtc*`, `timezone*` |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Parcial; não declarar uma marcação aceite sem elegibilidade |

```json
{
  "serviceId": "<id-do-servico-ou-omitido>",
  "professionalId": "<id-do-profissional>",
  "capabilityId": "<id-da-capacidade>",
  "appointmentType": "<tipo>",
  "relationshipId": "<relacao-ou-omitido>",
  "mode": "<modo>",
  "environment": "<ambiente-ou-omitido>",
  "startAtUtc": "<instante-UTC>",
  "endAtUtc": "<instante-UTC>",
  "timezone": "<fuso-horario>"
}
```

### `GET /agenda/professionals/{professionalId}/availability`

| Item | Contrato |
|---|---|
| Descrição | Consultar disponibilidade profissional |
| Perfil | Utilizador autenticado |
| Path | `professionalId*` |
| Query | `capabilityId`, `from`, `to`, `mode`, `environment` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Parcial; depende de dados e elegibilidade profissionais |

## 16. Profissionais

### `GET /professionals/catalog`

| Item | Contrato |
|---|---|
| Descrição | Pesquisar profissionais |
| Perfil | Público |
| Query | `limit`, `before` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível como catálogo |

### `GET /professionals/services`

| Item | Contrato |
|---|---|
| Descrição | Consultar e filtrar serviços |
| Perfil | Público |
| Query | `limit`, `before`, `q`, `category`, `capabilityId` |
| Corpo | Sem corpo |
| Respostas | Resposta de sucesso do contrato; erro por `default` |
| Estado | Disponível como catálogo |

## 17. Pagamentos MockBank

### `GET /payments`

| Item | Contrato |
|---|---|
| Descrição | Consultar pagamentos próprios simulados |
| Perfil | Utilizador autenticado, proprietário |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível apenas como MockBank/local-demo |

### `POST /payments`

| Item | Contrato |
|---|---|
| Descrição | Criar pagamento autónomo local MockBank; não paga uma marcação aceite |
| Perfil | Utilizador autenticado |
| Headers | `Authorization`, `Content-Type: application/json`, `Idempotency-Key*` |
| Corpo | `priceReference*`, `serviceReference*`, `amountCents*` (inteiro) |
| Respostas | `201`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível para teste isolado; sem transação bancária real |

```json
{
  "priceReference": "<referencia-de-preco>",
  "serviceReference": "<referencia-de-servico>",
  "amountCents": 0
}
```

### `GET /payments/{paymentId}`

| Item | Contrato |
|---|---|
| Descrição | Consultar pagamento simulado próprio |
| Perfil | Utilizador autenticado, proprietário |
| Path | `paymentId*`, string com padrão hexadecimal de 24 caracteres |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível para pagamentos MockBank próprios |

## 18. Notificações

### `GET /notifications`

| Item | Contrato |
|---|---|
| Descrição | Consultar notificações internas próprias |
| Perfil | Utilizador autenticado |
| Query | `page` (inteiro, mínimo 1, por defeito 1), `pageSize` (inteiro, 1–100, por defeito 20), `unread` (booleano) |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível; depende dos eventos consumidos pelo Notification Service |

### `GET /notifications/unread-count`

| Item | Contrato |
|---|---|
| Descrição | Contar notificações próprias não lidas |
| Perfil | Utilizador autenticado |
| Headers | `Authorization: Bearer <JWT>` |
| Corpo | Sem corpo |
| Respostas | `200`; erros `400`, `401`, `403`, `404`, `409`, `412`, `422`, `428`, `429`, `502`, `503` |
| Estado | Disponível |

## 19. Códigos HTTP e tratamento de erros

| Código | Significado geral |
|---:|---|
| `200` | Operação de leitura/alteração concluída |
| `201` | Recurso ou pedido criado |
| `204` | Operação concluída sem corpo, como logout |
| `400` | Pedido inválido ou parâmetros malformados |
| `401` | JWT ausente, inválido ou sessão não autenticada |
| `403` | Origem, perfil ou autorização recusados |
| `404` | Recurso/rota não encontrado |
| `409` | Conflito de estado, unicidade ou idempotência |
| `410` | Recurso/sessão já expirado |
| `412` | Falha de `If-Match`/pré-condição |
| `422` | Validação semântica rejeitada |
| `428` | Pré-condição obrigatória em falta |
| `429` | Rate limit excedido |
| `502` | Serviço dependente indisponível através do proxy |
| `503` | Serviço ou capacidade temporariamente indisponível |

Os códigos exatos de cada operação continuam a ser os do OpenAPI. Uma
resposta de erro não deve ser interpretada como autorização para repetir
automaticamente uma escrita sem verificar idempotência.

## 20. Segurança

- Usar apenas `Authorization: Bearer` com JWT obtido por fluxo autorizado.
- Não incluir tokens, passwords ou credenciais de serviço em query strings.
- MFA e step-up permanecem ativos nos percursos administrativos.
- O Gateway bloqueia `/internal/*` e cabeçalhos técnicos fora da fronteira.
- CORS exige origens explicitamente configuradas; não usar `*`.
- Os corpos são validados pelos schemas e validators dos serviços.
- `If-Match` protege alterações de perfil contra concorrência perdida.
- `Idempotency-Key` protege hidratação, marcações e pagamentos onde definido.
- Payment é MockBank; não representa cobrança, reembolso ou reconciliação
  bancária real.

## 21. Limitações e disponibilidade

O contrato completo está amplamente documentado, mas a disponibilidade efetiva
depende do perfil, dos dados e da configuração local. Continuam limitações
conhecidas:

1. A imagem Docker observada pode estar desfasada da allowlist local 30/24.
2. Marcações profissionais aceites dependem de elegibilidade real.
3. Pagamentos são exclusivamente simulados.
4. AI Coach está desativado por defeito e não pertence ao essencial.
5. Recuperação de password não tem contrato aprovado.
6. O ambiente MongoDB local tem um único membro.

## 22. Exemplos de utilização

Os exemplos abaixo mostram apenas a forma do pedido. Os valores entre `< >` são
placeholders e não devem ser enviados literalmente.

```http
GET /users/me HTTP/1.1
Host: 127.0.0.1:3000
Authorization: Bearer <JWT>
```

```http
PATCH /users/me HTTP/1.1
Host: 127.0.0.1:3000
Authorization: Bearer <JWT>
If-Match: <ETag>
Content-Type: application/json

{"displayName":"<nome>"}
```

```http
POST /hydration/intakes HTTP/1.1
Host: 127.0.0.1:3000
Authorization: Bearer <JWT>
Content-Type: application/json

{"amountMl":0,"timezone":"<fuso-horario>","idempotencyKey":"<chave-unica>"}
```

Para respostas, consultar o schema correspondente no Swagger; não há exemplos
concretos definidos no contrato canónico.

## 23. Conclusão

A API GoLeve V1 oferece uma fronteira REST documentada, autenticada e separada
por domínios. As 30 operações essenciais estão identificadas com os seus
parâmetros, corpos, requisitos e limitações. O contrato completo permanece a
referência técnica; o Swagger essencial é uma seleção funcional para
desenvolvimento e demonstração local.
