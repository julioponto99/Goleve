# Integração frontend web, Android e iPhone

Este guia descreve o backend de desenvolvimento em `000cc43` e os seus limites.
Não implementa interfaces nem escolhe um framework. Começar pela
[instalação independente](local-setup.md) e pelo [contrato central](../api/backend-release-v1.md).
Usar apenas contas e dados fictícios nesta instalação.

## Ligação por plataforma

| Cliente | Base URL de desenvolvimento | Condição |
|---|---|---|
| Web no host Docker | `http://127.0.0.1:64344` | Origin `http://localhost:5173` ou `http://127.0.0.1:5173`; sem prefixo `/api` |
| Android Emulator padrão | `http://10.0.2.2:64344` | Alias para o loopback do host; validar a ligação no emulador usado |
| iOS Simulator | Loopback do Mac que executa o backend | Requer Mac/Xcode; não transforma o loopback do Windows num endereço remoto |
| Android/iPhone físicos ou Mac remoto | Ainda sem endereço acessível | A stack publica apenas loopback; requer solução de desenvolvimento TLS/rede/túnel aprovada separadamente |

O alias Android está na [documentação oficial de rede do emulador](https://developer.android.com/studio/run/emulator-networking-address).
O [Xcode](https://developer.apple.com/xcode/) fornece os simuladores Apple no Mac.
As regras de transporte HTTP de desenvolvimento devem ficar restritas ao build de
debug e ao destino necessário. Não desativar globalmente TLS, CORS ou validação de
certificados. Não expor MongoDB, RabbitMQ ou serviços internos para ligar um telemóvel.
Não se alterou qualquer porta/rede nesta entrega.

Configuração pública do cliente: apenas base URL, versão de contrato e flags de UI.
Nunca incluir JWT_SECRET, chaves de cifragem/MFA, credenciais Mongo/RabbitMQ,
secrets de serviço ou o conteúdo de `.integration/`. A ausência de Origin num cliente
nativo não dispensa autenticação nem autorização.

## Estrutura recomendada, ainda não criada

```text
frontend/
  web/                     # aplicação web
  mobile/                  # se houver uma base multiplataforma
packages/
  api-contracts/           # DTOs e cliente público, quando revistos
```

Se a opção for desenvolvimento nativo, substituir `mobile/` por `android/` e `ios/`.
A escolha nativo/multiplataforma e do framework permanece pendente. Não introduzir
frontends em `backend/services/`: os workspaces atuais pertencem ao backend.
Cada cliente deve separar transporte/API, sessão, funcionalidades e apresentação.
Partilhar contratos públicos e testes de contrato; não partilhar código do servidor,
segredos ou regras locais que substituam a autorização do backend.

O [OpenAPI](../api/backend-release-v1.openapi.json) identifica todas as operações,
mas alguns DTOs de resposta ainda são genéricos. Rever os contratos dos proprietários
antes de gerar um SDK estrito. Não inferir campos pela designação de um modelo.

## Autenticação e armazenamento

1. Registar com `POST /auth/register`, apenas `{name,email,password}`. Não enviar papel.
2. Login com `POST /auth/login`. Uma resposta normal contém `user`, `accessToken`,
   `tokenType` e `expiresIn` na raiz; não está dentro de `data`.
3. Enviar `Authorization: Bearer <token>` em pedidos protegidos e obter identidade
   atual com `GET /auth/me`. Claims no cliente não concedem permissões.
4. `GET /auth/sessions` consulta sessões próprias; `POST /auth/logout` revoga a atual
   e devolve 204. Não há refresh token nem renovação silenciosa implementada.
5. Ao receber 401, descartar o token e pedir login. Não reutilizar JWT antigos sem
   sessão, nem restaurar acessos antigos após reativação ou mudança de papel.

Na web, preferir token em memória e novo login após reload nesta primeira integração.
Não há contrato de cookie HttpOnly/BFF implementado; introduzi-lo exige desenho próprio.
Evitar tokens em URLs, localStorage, logs, analytics ou relatórios de erro. No mobile,
usar armazenamento protegido do sistema. O [Android Keystore](https://developer.android.com/privacy-and-security/keystore)
protege chaves criptográficas: a persistência do token precisa de uma camada cifrada
apropriada, não de guardar diretamente um JWT como chave. No iOS, usar o
[Keychain](https://developer.apple.com/documentation/security/using-the-keychain-to-manage-user-secrets).
As bibliotecas concretas dependem da escolha do cliente e ficam para essa fase.

## MFA, step-up e permissões

Login administrativo pode devolver `challenge`, `mfaRequired` e `enrollmentRequired`,
sem access token. Apresentar apenas o percurso MFA, nunca a área administrativa.
`POST /auth/mfa/enroll` recebe `{challenge,password}`; `POST /auth/mfa/complete`
recebe `{challenge,otp}` ou `{challenge,recoveryCode}`. O segredo/URI TOTP e códigos
de recuperação são material sensível de apresentação única, sem logs ou telemetria.

Operações sensíveis usam `POST /auth/admin/step-up`: password + fator real, ação,
alvo e parâmetros exatos. A prova de cinco minutos, vinculada à sessão, é de uso
único e segue em `X-Admin-Step-Up`. A representação dos parâmetros é específica
da operação: consultar a [administração V1](../api/administration-v1.md) e a
[Management V1](../api/management-v1.md), incluindo o envelope que incorpora `If-Match`.
Não reutilizar provas após conflito/timeout nem simplificar a vinculação no cliente.

O papel Gestor só permite operações com âmbito atual aprovado, não expirado ou
revogado. Administrador não é prova de elegibilidade profissional. Esconder um botão
é conveniência da UI, não controlo de segurança. Não há Administradores de demonstração
disponíveis na instalação normal; os fluxos positivos privilegiados continuam bloqueados.

## Transporte, concorrência e erros

Um adaptador mínimo pode preservar status, ETag e os diferentes envelopes:

```ts
async function request(base: string, path: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(base + path, { ...init, headers });
  const body = response.status === 204 ? undefined : await response.json();
  if (!response.ok) {
    // Encaminhar para tratamento central; nunca registar headers/body de autenticação.
    throw { status: response.status, code: body?.error?.code,
      retryAfter: response.headers.get('Retry-After') };
  }
  return { status: response.status, body, etag: response.headers.get('ETag') };
}
```

Em produção do cliente, tratar também timeout, resposta não JSON e cancelamento de
fetch como erros de transporte, sem revelar conteúdo bruto. Não adicionar retry
automático de escritas ao adaptador. Resultados incertos exigem consulta de estado,
particularmente em pagamentos. Guardar a chave de idempotência associada à intenção
enquanto o proprietário permitir o replay; nunca gerar uma chave nova para disfarçar
uma tentativa cujo resultado se desconhece.

| Estado | Comportamento |
|---|---|
| 400/422 | Mostrar validação do campo/regra sem reenviar automaticamente |
| 401 | Invalidar sessão local e pedir login |
| 403 | Explicar permissão/âmbito/MFA/Origin insuficiente |
| 404 | Recurso indisponível; pode proteger um recurso de terceiro |
| 409/412/428 | Reler estado/ETag e recolher nova intenção quando necessário |
| 429 | Respeitar `Retry-After` |
| 502/503 | Distinguir indisponibilidade, funcionalidade desativada e reconciliação financeira |

Perfis User usam ETag e precondições; Hydration/Performance e preferências Notification
usam versões no corpo. Idempotência Hydration está no corpo; Payment usa header.
Não criar uma convenção universal diferente da [tabela de contratos](../api/backend-release-v1.md).
Paginação varia entre `page/pageSize`, `limit/before` e `limit/cursor` opaco.
Preservar o fuso IANA e os instantes UTC; User usa g/mm, Performance kg/cm.

DTOs pessoais usados nas primeiras interfaces, dentro de `data`:

| Recurso | Campos principais efetivos | Fonte do contrato |
|---|---|---|
| Training exercício | `id,name,description?,muscleGroup,equipment,environments,difficulty,type,instructions`, proprietário quando próprio | [serviço Training](../../backend/services/training-service/src/services/training.service.ts) |
| Training plano | `id,title,description?,goals,days,environment?,exercises,status,version,history` e timestamps | [modelo](../../backend/services/training-service/src/models/plan.model.ts) |
| Training sessão | `id,planId?,status,startedAt?,pausedAt?,completedAt?,durationSeconds?,exercises,version` e timestamps | [modelo](../../backend/services/training-service/src/models/session.model.ts) |
| Hydration ingestão | `id,amountMl,consumedAt,timezone,localDate,idempotencyKey` e timestamps | [modelo](../../backend/services/hydration-service/src/models/intake.model.ts) |
| Hydration diário | `date,timezone,items,totalMl,targetMl,percentage`; meta/percentagem podem ser nulas | [serviço Hydration](../../backend/services/hydration-service/src/services/hydration.service.ts) |
| Performance medição | `id,kind,value,unit,measuredAt,timezone,source,idempotencyKey?` e timestamps | [serviço Performance](../../backend/services/performance-service/src/services/performance.service.ts) |
| Performance passos diário | `date,timezone,items,total,target,percentage`; sem meta, os últimos dois são nulos | [serviço Performance](../../backend/services/performance-service/src/services/performance.service.ts) |
| Agenda pessoal | `id,authUserId,title,description?,kind,environment?,startAt,endAt,timezone,status,version`, timestamps e datas de transição quando existentes | [modelo](../../backend/services/agenda-service/src/models/activity.model.ts) |

Listas paginadas envolvem estes DTOs em `items`; criação de ingestão/medição pode
devolver 201 ou 200 em replay. Sessão Training usa estados `planned`, `running`,
`paused`, `completed`, `cancelled`; plano usa `active/archived`. Estes resumos são
projeções para UI, não autorização para enviar campos calculados ou proprietários
de volta nas mutações. Os corpos de escrita constam do índice/OpenAPI.

## Notificações internas

Consultar `GET /notifications` com `page,pageSize,unread`,
`GET /notifications/unread-count`, `POST /notifications/{id}/read` e
`POST /notifications/read-all`. O DTO contém `id`, `ownerId`, `eventId`, `eventType`,
`source`, `title`, `body`, `occurredAt`, `createdAt`, `updatedAt` e `readAt` quando lida;
eventos Agenda/Payment acrescentam `category` e referências mínimas. A ausência de
`readAt` significa não lida; não inventar um campo `isRead`.

Usar polling com intervalo moderado, pausa fora de foco e tratamento de 429;
não existe websocket/SSE, email, SMS ou push externo implementado. Deduplicar a
lista por ID e respeitar o proprietário. As preferências Notification editáveis
em `PUT /notifications/preferences` são `enabled`, `hydrationReminders`,
`trainingEvents`, `agendaReminders`, `paymentEvents` e `version` atual.
Não assumir sincronização com as preferências do User Service.
Ver [eventos e payloads mínimos](../events/agenda-payment-notifications.md).

## Dados fictícios e sequência de integração

Não é necessário novo seed: as APIs existentes permitem registo normal e criação
de dados próprios. O programador deve gerar um email único no domínio reservado
`.invalid` e uma password aleatória apenas local, sem as guardar em fixtures, logs
ou documentação. Usar nomes explícitos como «Pessoa fictícia» e datas relativas
ao relógio do servidor. Os exemplos do contrato central criam perfil, treino,
hidratação e agenda; guardar IDs/ETags devolvidos, nunca reutilizar IDs do autor.
O procedimento não foi executado nesta etapa documental.

Ordem para o frontend: autenticação/sessão → perfil/preferências → treino,
hidratação e performance → agenda pessoal → notificações. Acompanhamento,
reservas elegíveis, Payment+Agenda e operações positivas Gestor/Admin dependem dos
[bloqueios preservados](readiness.md). Payment autónomo é sempre simulado, incluindo
o resultado incerto: não o apresentar como banco real nem disponibilizar «tentar de
novo» para uma cobrança incerta. Coach permanece desativado.

Trabalhar em branches frontend próprias, com PR para a branch partilhada proposta
na [entrega](README.md). Não mudar contratos ou flags de segurança para desbloquear UI.
