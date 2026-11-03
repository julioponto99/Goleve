# Auditoria Swagger/OpenAPI GoLeve V1

Data: 2026-11-03. Auditoria somente de leitura, sem alteração de contratos,
dados, contentores ou serviços.

## Escopo e método

Foi comparada a extração estática das rotas públicas montadas pelo API Gateway
(`scripts/release-contracts.cjs`) com o documento canónico
`documentation/api/backend-release-v1.openapi.json` e com o artefacto servido
`backend/api-gateway/src/generated/api-docs-document.ts`.

As rotas internas dos serviços foram também inventariadas. Elas não fazem parte
do contrato público: são montadas sob `/internal/*` ou em grupos de serviço,
exigem autenticação técnica/autorização própria e são recusadas pelo Gateway.
Por isso, a sua ausência do OpenAPI público é intencional, não uma operação em
falta.

## Resultado de cobertura pública

| Microserviço / Gateway | Operações implementadas expostas | Operações documentadas | Em falta | Documentadas inexistentes | Problemas de schema | Auth/autorização | Cobertura | Estado |
|---|---:|---:|---:|---:|---|---|---:|---|
| Auth | 23 | 23 | 0 | 0 | Nenhum encontrado | Bearer/sessão e desafios documentados; administração restringida | 100% | Aprovado |
| User | 18 | 18 | 0 | 0 | Nenhum encontrado | Bearer/sessão; dados sintéticos controlados | 100% | Aprovado |
| Training | 20 | 20 | 0 | 0 | Nenhum encontrado | Bearer/sessão | 100% | Aprovado |
| Hydration | 11 | 11 | 0 | 0 | Nenhum encontrado | Bearer/sessão | 100% | Aprovado |
| Performance | 15 | 15 | 0 | 0 | Nenhum encontrado | Bearer/sessão | 100% | Aprovado |
| Agenda | 26 | 26 | 0 | 0 | Nenhum encontrado | Bearer/sessão; elegibilidade profissional | 100% | Aprovado |
| Professional | 41 | 41 | 0 | 0 | Nenhum encontrado | Catálogo público; restante com Bearer e revisão/elegibilidade | 100% | Aprovado |
| Management | 30 | 30 | 0 | 0 | Nenhum encontrado | Bearer, autorização administrativa e owner/admin | 100% | Aprovado |
| Payment | 10 | 10 | 0 | 0 | Nenhum encontrado | Bearer; restrição local-demo; MockBank fictício | 100% | Aprovado |
| Notification | 6 | 6 | 0 | 0 | Nenhum encontrado | Bearer/sessão | 100% | Aprovado |
| AI Coach | 13 | 13 | 0 | 0 | Nenhum encontrado | Bearer; serviço desativado por defeito e rate limit | 100% | Aprovado |
| API Gateway (health/readiness) | 2 | 2 | 0 | 0 | Nenhum encontrado | Público, sem dados de negócio | 100% | Aprovado |
| **Total** | **215** | **215** | **0** | **0** | **Nenhum** | **Nenhuma divergência pública** | **100%** | **Aprovado** |

Os 215 métodos estão distribuídos por 170 caminhos públicos. O inventário
inclui `GET /health` e `GET /ready`; as rotas da própria documentação
(`/api-docs/*`) não são operações de negócio e não entram nesta contagem.

## Inventário de segurança e rotas internas

- O Gateway publica apenas os prefixos `/auth`, `/users`, `/training`,
  `/hydration`, `/performance`, `/agenda`, `/professionals`,
  `/care-relationships`, `/management`, `/payments`, `/notifications` e
  `/ai-coach`, além de `/health` e `/ready`.
- Os serviços montam grupos internos de gestão, agenda, payment-demo,
  local-demo, administração e proxies técnicos sob `/internal/v1/*` ou
  equivalentes. Esses grupos não são publicados no OpenAPI público.
- A fronteira do Gateway rejeita `/internal`, segmentos `.`/`..` e cabeçalhos
  técnicos de autenticação. A autorização de negócio permanece nos serviços.
- Operações públicas autenticadas usam Bearer JWT com sessão persistida,
  conforme o contrato. Catálogos explicitamente públicos e endpoints de
  login/registo/challenge não usam Bearer de forma indevida.
- O fluxo local-demo é identificado como autoridade fictícia de desenvolvimento
  e não é apresentado como autenticação de produção.
- Payment está descrito como MockBank/local-demo e não como cobrança bancária
  real ou pagamento de appointment.

## Validação técnica executada

- Os quatro documentos OpenAPI analisados usam OpenAPI `3.1.0` e foram
  carregados como JSON válido.
- `node scripts/gateway-swagger.cjs` passou: 215 operações, 170 caminhos,
  zero referências externas e zero drift do artefacto gerado.
- O verificador confirmou referências locais resolvidas, ausência de caminhos
  internos no documento servido e igualdade entre as rotas extraídas e as
  operações OpenAPI.
- Não existem valores `example`/`examples` nos documentos analisados. Os campos
  `password`, `token` e `secret` são schemas de entrada sem valores reais;
  não foram encontrados passwords, tokens ou segredos concretos.
- Os testes `backend/api-gateway/tests/api-docs.test.cjs` passaram: 12/12.
  Cobrem desativação por defeito/produção, headers, CSP, referências, limites
  de origem, Try it out e ausência de credenciais.
- O teste browser opcional foi descoberto, mas ficou `skipped` por não haver
  `GOLEVE_SWAGGER_TEST_BROWSER` configurado. Não é uma falha da documentação.
- Verificações read-only no Gateway oficial: `GET /health`, `GET /ready`,
  `GET /api-docs` e `GET /api-docs/openapi.json` responderam HTTP 200.

## Interface Swagger UI

Estado: **operacional no Gateway oficial em desenvolvimento**.

URL: [http://127.0.0.1:3000/api-docs](http://127.0.0.1:3000/api-docs)

O documento pode ser consultado em
[http://127.0.0.1:3000/api-docs/openapi.json](http://127.0.0.1:3000/api-docs/openapi.json).
O modo Try it out continua sujeito às flags de desenvolvimento, origem loopback,
CORS, autenticação e permissões reais; a UI não concede privilégios.

## Erros e prioridades

Não foram encontrados erros públicos bloqueadores ou de alta prioridade.

| Prioridade | Estado | Observação |
|---|---|---|
| P0/P1 | Nenhum | Não há divergência pública de rotas, schemas ou segurança documentada. |
| P2 | Monitorização | O teste real de browser depende de um executável explicitamente configurado e foi omitido nesta execução. |
| P3 | Melhoria | Manter a geração/verificação no CI sempre que uma rota ou schema mudar. |

## Plano recomendado

1. Manter `node scripts/gateway-swagger.cjs` e os testes de API docs como
   bloqueio de CI.
2. Executar o teste browser opcional em ambiente controlado quando houver um
   Chromium aprovado, sem ativar Try it out contra dados oficiais.
3. Atualizar o documento canónico e regenerar o artefacto sempre que as rotas
   públicas mudarem; não documentar rotas internas como públicas.
4. Repetir esta auditoria após alterações de autorização, schemas de Payment ou
   exposição de novos grupos no Gateway.
