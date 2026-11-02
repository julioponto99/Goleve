# Referência de integração do backend V1 — desenvolvimento

Base: `000cc43ee2a47af9de5b0f8ace7fb09e8a5d5dd6`, branch `feat/backend-release-v1`.
Não é uma versão de produção. [Entrega](../release-v1/README.md),
[instalação independente](../release-v1/local-setup.md), [frontend](../release-v1/frontend.md).

O [índice completo de endpoints](backend-release-v1-endpoints.md) contém as operações
realmente declaradas e encaminháveis pelo Gateway. O
[OpenAPI central 3.1](backend-release-v1.openapi.json) reúne os onze serviços,
reutilizando os contratos administrativos existentes. O
[inventário verificável](backend-release-v1.routes.json) indica ficheiro/linha,
payload, parâmetros, cabeçalhos e condições de disponibilidade.

Gerar/verificar offline, com as dependências de desenvolvimento de `backend/`
já instaladas: `node scripts/release-contracts.cjs`.
`--write` regenera a documentação depois de rever alterações; não inicia serviços.
Não é necessário instalar dependências no host para apenas arrancar com Docker.

## Alcance e precisão

O índice distingue declaração, disponibilidade configurada e validação funcional.
A existência de uma rota não concede elegibilidade ou permissões. Campos de pedido
estão descritos por schemas e contratos dos proprietários; validações relacionais,
condicionais e temporais continuam no servidor. DTOs com schema genérico e respostas
`2XX` remetem explicitamente para o proprietário: **não tratar este ficheiro como
SDK estrito completo para todos os DTOs**. As respostas administrativas reutilizadas
mantêm schemas detalhados. Confirmar o DTO do módulo antes de gerar clientes tipados.

O validador compara rotas Express com o inventário/OpenAPI, expande ações reais de
loops e expressões regulares, resolve referências JSON e deteta drift nos artefactos.
É uma verificação estática/estrutural, não um ensaio HTTP de todas as operações ou
uma certificação por todas as ferramentas externas de OpenAPI.

| Serviço | Prefixos Gateway | Situação desta entrega |
|---|---|---|
| Auth | `/auth` | Identidade, sessões, MFA e operações administrativas reais; sem contas administrativas provisionadas automaticamente |
| User | `/users` | Perfis próprios; recolha desta instalação exclusivamente fictícia |
| Training | `/training` | Exercícios, planos e sessões próprios |
| Hydration | `/hydration` | Metas, ingestões e lembretes; dispatch automático de lembretes não demonstrado |
| Performance | `/performance` | Medições, passos, frequência cardíaca e objetivos próprios |
| Agenda | `/agenda` | Agenda pessoal operacional; reservas exigem elegibilidade profissional |
| Professional | `/professionals`, `/care-relationships` | Candidaturas próprias; elegibilidade real indisponível |
| Management | `/management` | RBAC + âmbito e administração; percurso privilegiado depende de provisionamento autorizado |
| Payment | `/payments` | MockBank autónomo; integração com reservas desativada/bloqueada |
| Notification | `/notifications` | Notificações internas e preferências do titular |
| Coach IA | `/ai-coach` | Encaminhado, autenticado e desativado; 503 esperado |

`/management/professional-applications` é um proxy legado para revisão Professional,
desativada nesta configuração. `/professional-applications` não é um prefixo público
direto do Gateway. Endpoints `/internal/*`, contratos técnicos e bootstrap CLI não
fazem parte da API frontend. A consulta da cotação de reservas é interna, não existe
uma rota pública `/quotes`. `POST /payments/appointment-payments/{id}/reconcile` é
exclusivo da integração de demonstração e não reconcilia o pagamento autónomo incerto.

## Base URL, autenticação e sessão

URL local de exemplo: `http://127.0.0.1:64344`, sem prefixo `/api`.
Nunca usar `localhost:3001`, hostnames Docker ou MongoDB diretamente no frontend.
Cada programador gera a sua instância, passwords e chaves.

`POST /auth/register`: `{name,email,password}`, apenas. O papel público é sempre
`utilizador`; `userType`, `role`, owner IDs ou hashes adicionais são recusados.
Login usa `{email,password}`. Resposta normal, fora de um envelope `data`:

```json
{"user":{"id":"<id devolvido>","userType":"utilizador"},"accessToken":"<não registar>","tokenType":"Bearer","expiresIn":3600}
```

O exemplo mostra uma projeção, não todos os campos públicos. `GET /auth/me` responde
`{user:{...}}`; a maioria dos outros módulos usa `{data:...}`. Não aplicar um unwrap
global que perca os campos Auth. JWT exige assinatura, issuer, audience, expiração
e sessão persistida `sid/sv`; os proprietários confirmam o titular no Auth. Não
aceitar JWT antigo sem sessão nem usar claims de papel do cliente como autorização.

`GET /auth/sessions` lista até 100 sessões próprias atuais; `POST /auth/logout` com
`{}` devolve 204 e revoga a sessão atual. Não existe refresh token ou endpoint de
renovação. Não há DELETE de uma sessão arbitrária no contrato atual. Após 401,
limpar a sessão e pedir login; suspender/reactivar conta não restaura sessões antigas.

## MFA e step-up

Um login administrativo pode responder `{challenge,mfaRequired,enrollmentRequired,
expiresIn:600}`, sem access token. Não abrir a área privilegiada nesse estado.
Se for primeiro enrolment, `/auth/mfa/enroll` recebe `{challenge,password}` e devolve
`{data:{secret,otpauthUri}}`; concluir com `/auth/mfa/complete` e `{challenge,otp}`
ou `{challenge,recoveryCode}`. Códigos de recuperação só são apresentados uma vez.
Nunca enviar fatores ou QR para logs, analytics, screenshots de issues ou o Git.

`POST /auth/admin/step-up` exige sessão MFA e `{password,otp,action,targetId,parameters}`
(ou recoveryCode). A prova dura cinco minutos, é de uso único e vincula sessão,
ação, alvo e parâmetros exatos. Enviar a prova em `X-Admin-Step-Up` apenas na mutação
prevista; após conflito/timeout, consultar estado antes de obter outra prova.
As combinações exatas Auth/Management estão na [matriz administrativa](administration-v1.md).
Administrador não implica elegibilidade profissional; Gestor sem âmbito válido não
tem acesso operacional. O frontend pode adaptar UI, mas o backend decide cada pedido.

## Concorrência e idempotência por proprietário

| Domínio | Contrato do cliente |
|---|---|
| User | PUT de perfil/preferências/hábitos exige `If-None-Match: *`; PATCH exige `If-Match` com ETag atual; medições POST exigem `Idempotency-Key` |
| Professional próprio | Criação PUT exige `If-None-Match`; PATCH/desativação usa ETag; qualificações e comandos de candidatura/relação usam idempotência conforme índice |
| Relações | Comandos usam ETag e `Idempotency-Key`; criação usa idempotência |
| Agenda pessoal | Não exige ETag/Idempotency-Key; concorrência é controlada internamente e devolve 409 |
| Agenda profissional | Mutações usam `Idempotency-Key` e versão/ETag quando indicado; associação de serviço usa `If-Match` |
| Training | CAS interno; cliente relê depois de 409, sem header de idempotência universal |
| Hydration | `idempotencyKey` no corpo da ingestão; metas/lembretes usam `version` no corpo |
| Performance | `idempotencyKey` opcional no corpo dos registos; objetivos usam `version` |
| Payment autónomo | `Idempotency-Key` na criação/confirmação/cancelamento; claim durável antes do banco |
| Notification | Preferências usam `version`; leitura de notificações é do titular |
| Management | `If-Match` nas mutações versionadas e step-up quando exigido |

ETag de recursos versionados tem a forma `"<id>:<version>"`. Guardar a string completa,
com aspas, da resposta. Não fabricar uma versão ou usar `If-Match: *` para contornar
concorrência. Não repetir POST automaticamente após falha de rede. Mesmo com chave,
confirmar a semântica do proprietário e consultar resultado/histórico primeiro.
Pagamento incerto nunca é repetido: ver [runbook](../operations/payment-reconciliation.md).

## Paginação, filtros e datas

| Família | Entrada | Resposta |
|---|---|---|
| User medições/objetivos | `limit` 1–100, `cursor` opaco, filtro `kind`/`status` | `{data:{items,nextCursor}}`; cursor vinculado ao titular e filtro |
| Professional/relações | `limit` 1–100, `before` ObjectId; status de relações/candidaturas quando aplicável | `{data:{items,nextBefore}}` |
| Auth admin/Management/Payment | `limit` 1–100, `before`; filtros específicos no OpenAPI | `{data:{items,nextBefore}}`, exceto listas não paginadas documentadas |
| Training/Hydration/Performance/Agenda pessoal/Notification | `page>=1`, `pageSize` 1–100, padrão 20 | `{data:{items,page,pageSize,total,totalPages}}`, conforme operação |
| Agenda profissional | `limit`, `before`, `status`, `from`, `to`, `capabilityId`; disponibilidade tem `capabilityId,from,to,mode,environment` | DTO próprio; intervalos crescentes até 31 dias |
| Coach | `limit` até 50 e `before`, apenas se ativado no ambiente autorizado | Indisponível por defeito |

Não enviar filtros universais a todas as rotas. Metas/resumos/históricos podem
devolver objetos ou arrays sem paginação. Usar exatamente o índice e o contrato
proprietário. Dashboard usa dias UTC `from`/`to`, máximo 31 dias e suprime contagens
entre 1 e 4, incluindo valores derivados; indisponibilidade não equivale a zero.

Enviar instantes ISO com fuso explícito; User exige UTC com `Z`. Conservar o fuso
IANA e a grafia do campo: User/Professional usam `timeZone` em vários contratos;
Agenda/Hydration/Performance usam `timezone`. User mede peso em **g** e comprimentos
em **mm**; Performance usa **kg/cm**. Não assumir sincronização dessas coleções.

## Exemplos fictícios para começar

Depois de registar e autenticar uma conta normal, criar perfil com
`PUT /users/me`, `If-None-Match: *`, corpo `{"displayName":"Pessoa fictícia"}`.
Configurar preferências com `PUT /users/me/preferences`, a mesma precondição e
`{"locale":"pt-PT","timeZone":"Europe/Lisbon"}`. Usar os ETags devolvidos em PATCH.

Um plano de treino mínimo: `POST /training/plans` com
`{"title":"Plano fictício","exercises":[],"environment":"home"}`.
Uma meta de hidratação: `PUT /hydration/goal` com
`{"targetMl":2000,"timezone":"Europe/Lisbon","source":"custom"}`.
Uma ingestão: `POST /hydration/intakes` com
`{"amountMl":250,"timezone":"Europe/Lisbon","idempotencyKey":"<UUID novo>"}`.

Atividade pessoal: `POST /agenda/activities`, datas futuras relativas ao relógio
do servidor, corpo:

```json
{"title":"Caminhada fictícia","kind":"workout","environment":"outdoor","startAt":"<ISO futuro>","endAt":"<ISO posterior>","timezone":"Europe/Lisbon","status":"planned"}
```

**Diferença face aos requisitos históricos:** o código atual aceita `kind=personal|workout`,
não seis tipos treino/caminhada/corrida/etc. `workout` exige ambiente; `personal`
não aceita ambiente. A API atual é `/agenda/activities`, não `/agenda/me/activities`.
Não corrigir essa diferença apenas no frontend fingindo suporte inexistente.
Criação/edição devolve `{data:{activity,overlapWarning,overlaps}}`, consulta individual
devolve `{data:<activity>}`; não assumir DTO idêntico em todas as operações.
O aviso atual pesquisa apenas atividades `planned`, até vinte IDs, com
`inicioA < fimB && inicioB < fimA`. A regra histórica abrangia todas as não canceladas;
essa diferença permanece pendente, sem alteração funcional nesta entrega. No registo
retroativo, `createdAt` distingue o registo das datas da atividade, mas não existe
um campo explícito de retroatividade nem preenchimento de `completedAt` nesse create.

Exemplos são guias, não um seed executado. Identificadores e ETags devem vir das
respostas. Não criar administradores, papéis profissionais ou aprovações por fixtures.

## Erros, limites e fronteira pública

Normalizar `{error:{code,message?,requestId?}}`; Gateway pode omitir `message`.
Preservar status e correlação e apresentar mensagem adequada; não registar bodies
Auth ou headers sensíveis. 204 não tem JSON. Uma resposta de proxy não JSON deve
ser tratada como erro de transporte sem mostrar conteúdo bruto ao utilizador.

| HTTP | Ação frontend |
|---|---|
| 400 / 413 | Corrigir campos/tamanho, sem retry automático |
| 401 | Sessão inválida/expirada/revogada; novo login |
| 403 | Papel, âmbito, MFA, Origin ou política insuficiente; não promover permissões |
| 404 | Recurso inexistente, de terceiro ou caminho interno ocultado |
| 409 / 412 | Recarregar estado/ETag e explicar conflito |
| 410 | Convite/proposta indisponível quando o proprietário o distinguir |
| 422 | Regra temporal/de negócio não satisfeita |
| 428 | Falta a precondição exigida |
| 429 | Respeitar `Retry-After`, sem ciclo de tentativas |
| 502 / 503 | Dependência/funcionalidade indisponível; distinguir `AI_COACH_DISABLED` e `PAYMENT_RECONCILIATION_REQUIRED` |

O Gateway limita por defeito 300 pedidos/minuto por IP; registo/login partilham
30 pedidos em 15 minutos. Os contadores atuais são por processo; HA exige outra
estratégia. CORS permite as duas origens web locais `localhost:5173`/`127.0.0.1:5173`,
os headers Authorization, Content-Type, If-Match, If-None-Match, Idempotency-Key e
X-Admin-Step-Up; expõe ETag, Idempotency-Replayed, Retry-After e RateLimit.
Clientes nativos sem Origin não ficam isentos de JWT ou permissões.
