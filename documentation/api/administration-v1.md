# API de Administração V1

[OpenAPI 3.1](administration-v1.openapi.json),
[arquitetura e matriz](../architecture/administration-v1.md),
[instalação](../architecture/administration-v1-installation.md).
Os proxies Auth e Management existentes no Gateway servem estes endpoints.
Contratos `/internal` nunca são públicos.

## Sessões e MFA

| Método / endpoint | Contrato |
|---|---|
| `POST /auth/login` | `{email,password}`; utilizador normal recebe sessão; administrador recebe `{challenge,mfaRequired,enrollmentRequired,expiresIn:600}` |
| `POST /auth/mfa/enroll` | `{challenge,password}` → `{data:{secret,otpauthUri}}`; só desafio de primeiro enrolment |
| `POST /auth/mfa/complete` | `{challenge,otp}` ou `{challenge,recoveryCode}` → sessão; primeiro enrolment retorna também `recoveryCodes` uma única vez |
| `POST /auth/initial-admin-invitation/accept` | `{token,name,password}` → `{data:{id,mfaEnrollmentRequired:true}}`; não concede sessão administrativa |
| `POST /auth/admin/step-up` | Bearer MFA + `{password,otp ou recoveryCode,action,targetId,parameters}` → `201 {data:{stepUpToken,expiresIn:300}}` |
| `GET /auth/sessions` | Sessões próprias atuais: ID, datas, indicador atual e MFA; nunca JWT |
| `POST /auth/logout` | Bearer; corpo vazio → `204`; revoga somente a sessão atual |

Não expor QR/segredo, códigos ou tokens em logs/telemetria. Respostas de segurança
usam `Cache-Control: no-store`. Nenhum endpoint HTTP emite o convite excecional ou
executa bootstrap. Sessões existentes antes desta versão exigem novo login.

## Administração Auth

Todos exigem sessão MFA válida e quórum formado. Listagens retornam
`{data:{items,nextBefore}}`; `limit` 1–100 (20 por defeito), `before` ObjectId.

| Método / endpoint | Parâmetros / resposta mínima |
|---|---|
| `GET /auth/administration/users` | `q` até 80 caracteres (nome/email), `role`, `status=active|suspended`, paginação |
| `GET /auth/administration/users/:id` | ID, nome, email, papel, estado, versão administrativa, datas |
| `GET /auth/administration/users/:id/history` | Auditoria do recurso; apenas paginação |
| `POST /auth/administration/users/:id/suspend` | `{version,reasonCode}`; step-up `user.suspend` |
| `POST /auth/administration/users/:id/reactivate` | Mesmo corpo; step-up `user.reactivate` |
| `POST /auth/administration/users/:id/revoke` | Mesmo corpo; step-up `user.revoke`; revoga todas as sessões |
| `POST /auth/administration/users/:id/role-requests` | `{newRole,version,reasonCode}`; step-up `role.request` → `201` pedido pendente |
| `GET /auth/administration/role-requests` | Paginação e `status=pending|approved|rejected` |
| `POST /auth/administration/role-requests/:id/approve` | `{version,reasonCode}`; step-up `role.approve` |
| `POST /auth/administration/role-requests/:id/reject` | Mesmo corpo; step-up `role.reject` |
| `GET /auth/administration/audit` | Apenas paginação; ator, ação, recurso, UTC, resultado, motivo, correlação |

Enviar `X-Admin-Step-Up` em cada mutação sensível. Para Auth, `targetId` é o ID
no caminho e `parameters` é o corpo **exato**, incluindo versão e motivo.
Papéis fechados: `utilizador`, `profissional`, `gestor`, `administrador`.
Sem autoalteração; requerente e decisor distintos, ambos diferentes do alvo.
Papéis não conferem elegibilidade nem atribuições operacionais.

## Management e Professional

As rotas e corpos da [API Gestor](management-v1.md) permanecem. Acrescentam-se:

| Método / endpoint | Finalidade |
|---|---|
| `GET /management/operators` | Perfis Gestor persistidos com papel/estado atuais confirmados pelo Auth |
| `GET /management/assignments/:id/history` | Histórico de decisões da atribuição |
| `POST /management/assignments/:id/reject` | Recusa independente, `{reasonCode}`, `If-Match` e step-up |
| `GET /management/administration/professionals` | Metadados mínimos de profissionais; não contactos/documentos |
| `GET /management/administration/applications` | Estado/versão/publicação de candidaturas; autoridade real indisponível |
| `GET /management/administration/services` | Serviço/profissional/capacidade, duração, estado, versão; sem dados bancários |
| `GET /management/administration/professionals/:id/history` | Decisões administrativas do profissional |
| `POST /management/administration/professionals/:id/suspend` | `{reasonCode}`, `If-Match: "<id>:<version>"`, step-up `professional.admin.suspend` |
| `POST /management/administration/services/:id/suspend` | Mesmo contrato; step-up `professional.admin.service.suspend` |

Listagens Management aceitam `limit`, `before`, `q`, `status` conforme domínio;
candidaturas recusam pesquisa livre. Históricos só aceitam paginação.
Mutações devolvem ETag atualizado. Não se implementa reativação administrativa.

Vínculos exatos de step-up adicionais:

| Operação | action | targetId | parameters |
|---|---|---|---|
| Convite Gestor | `manager.invite` | email normalizado | `{email}` |
| Revogar convite | `manager.invite.revoke` | ID convite | `{}` |
| Criar operador | `management.operator.create` | authUserId | Corpo exato |
| Criar âmbito | `management.scope.create` | `new` | Corpo exato |
| Pedir atribuição | `management.assignment.request` | operatorProfileId | Corpo exato |
| Aprovar/recusar/revogar atribuição | `management.assignment.<ação>` | ID atribuição | `{body:<corpo exato>,ifMatch:<cabeçalho exato ou null>}` |
| Suspensão administrativa profissional/serviço | Ação indicada acima | ID recurso | `{version:<versão do If-Match>,reasonCode}` |

## Contratos internos

`POST /internal/v1/management/admin-check` no Auth recebe ação/alvo/parâmetros
e prova quando necessária, além de identidade técnica Management e Bearer do
ator. Retorna autorização vinculada; não modifica papéis por si só. Recusa
consumo remoto de provas para bootstrap ou mutações locais Auth.

Professional usa `POST /internal/v1/management/administration/<operação>`;
operações fechadas: `professionals`, `applications`, `services`, `history`,
`suspend`, `service-suspend`. A confirmação atual passa por
`POST /internal/v1/management/administration-authorize` no Management e Auth.
Reutiliza chaves por par, audiência, prazo curto, nonce e hash do corpo/Bearer.
Nenhum serviço lê as bases dos outros.

## Erros e concorrência

`{error:{code,message}}`: 400 validação; 401 sessão/desafio/MFA inválido;
403 papel/quórum/prova/independência; 404 recurso; 409 estado/último administrador;
410 convite indisponível; 412 versão; 428 ausência de If-Match; 429 tentativas;
503 chave, transação, auditoria ou dependência indisponível. Falhas inesperadas
retornam mensagem genérica, sem dados do driver ou credenciais.

Validar `version` atual antes de pedir a prova. Não repetir mutações após
timeout/resultado de commit desconhecido: consultar estado/histórico primeiro.
Transações locais preservam estado e auditoria; chamadas entre serviços não
constituem transação distribuída e podem consumir a prova antes de uma falha remota.
