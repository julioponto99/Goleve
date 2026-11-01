# Coach IA — Fase 5.7

**Estado:** backend implementado e validado exclusivamente em ambiente local
isolado, com dados fictícios. Desligado por defeito e bloqueado em produção.
Nenhum fornecedor comercial foi configurado ou chamado nesta entrega.

Referências: [arquitetura e decisões](../architecture/ai-coach.md),
[plano do backend](../backend-completion-plan.md),
[política de privacidade alvo](../architecture/profile-permissions.md).

## Contratos HTTP

Todos os endpoints `/ai-coach` exigem Bearer validado no Auth, incluindo acesso
direto ao serviço. O Gateway encaminha o fluxo original; não concede permissões.
Respostas privadas têm `Cache-Control: no-store`. Identidade e proprietário vêm
do Auth; campos livres de titular, URLs, headers e métodos HTTP são rejeitados.

| Método | Endpoint | Operação |
| --- | --- | --- |
| GET | `/health` | Saúde, modo e fornecedor configurado; DB verificada quando ativo |
| GET | `/ai-coach/capabilities` | Catálogo fechado e prazos locais |
| POST | `/ai-coach/conversations` | Criar conversa com autorização explícita |
| GET | `/ai-coach/conversations` | Listar conversas próprias válidas |
| PATCH | `/ai-coach/conversations/:id/permissions` | Alterar contexto/ferramentas; requer versão atual |
| DELETE | `/ai-coach/conversations/:id` | Eliminar fisicamente conversa, mensagens e propostas próprias |
| POST | `/ai-coach/conversations/:id/messages` | Gerar resposta e propostas sem efeitos de domínio |
| GET | `/ai-coach/conversations/:id/messages` | Histórico de mensagens e resultados de ações |
| GET | `/ai-coach/conversations/:id/recommendations` | Recomendações, proveniência e indicação não clínica |
| GET | `/ai-coach/conversations/:id/proposals` | Propostas, versões, prazos e resultados |
| GET | `/ai-coach/conversations/:id/actions` | Tentativas de execução e respetivos resultados |
| POST | `/ai-coach/proposals/:id/confirm` | Confirmar explicitamente uma ação imutável |
| POST | `/ai-coach/proposals/:id/reject` | Rejeitar proposta pendente |
| POST | `/ai-coach/proposals/:id/reconcile` | Verificar recurso próprio para resultado incerto; sem repetir a escrita |

Listagens recebem `limit=1..50` e cursor `before` por ID decrescente;
devolvem `data.items` e `data.nextBefore`. Respostas normais usam `{data: ...}`;
erros usam `{error: {code, message}}`, sem detalhes de transporte ou conteúdo.

Criação de conversa, mensagens, confirmação e rejeição exigem
`Idempotency-Key` de 8–128 caracteres `[A-Za-z0-9._-]`. As chaves são guardadas
como HMAC, ligadas ao comando, titular e recurso; a mesma mensagem não volta
a chamar o modelo. Reutilização para outro conteúdo dá 409. Uma confirmação
repetida com a mesma chave devolve o estado persistido, sem segunda escrita.
Uma chave nova não reabre propostas resolvidas. Após expurgo de conteúdo não
se promete conservar recibos de idempotência indefinidamente.

### Criar conversa

```json
{
  "purpose": "organisation",
  "timezone": "Europe/Lisbon",
  "categories": [],
  "selectedGoalIds": [],
  "allowedTools": []
}
```

Finalidades: `training`, `hydration`, `goals`, `consistency`, `organisation`.
Listas vazias são uma escolha explícita válida. Não há acesso implícito ao
perfil, saúde, profissional ou contexto alheio. Alterar permissões usa as
mesmas seleções e `version`; rejeita propostas pendentes da versão anterior.
Histórico de versões antigas deixa de integrar o contexto enviado ao modelo,
mas permanece consultável pelo próprio até eliminação/expiração.

Uma operação em curso bloqueia alterações concorrentes de permissões ou
eliminação com 409. O titular deve repetir a alteração quando terminar;
não se declara uma revogação concluída enquanto o pedido estiver bloqueado.
Operações interrompidas são recuperadas passivamente após 60 segundos;
uma execução interrompida fica `unknown`, sem repetição automática.

### Mensagens e confirmação

Mensagem: `{"content":"Sugere uma atividade fictícia para amanhã"}`.
Limite de 2.000 caracteres. A resposta tem `message`, `proposals`,
`notMedicalAdvice=true` e `actionsExecuted=false`. O modelo não executa ações.

Confirmação: `{"confirm":true,"version":1}`. Rejeição: `{"version":1}`.
Não recebem parâmetros novos: executam apenas o conteúdo validado mostrado na
proposta. Reconciliação: `{"version":3,"resourceId":"<ID próprio>"}`.

Principais códigos: 400 validação/credenciais no texto, 401 JWT inválido ou
audiência incompatível, 403 ferramenta/contexto recusados, 404 recurso alheio,
409 concorrência/replay/versão/prazo, 413 limites, 429 capacidade, 502 resposta
do modelo inválida e 503 fornecedor/dependência indisponível ou modo desligado.
Falhas de execução são também resultados persistidos da proposta; o cliente
deve verificar `data.status` e `data.result`, mesmo com HTTP 200.

## Contexto mínimo autorizado

| Categoria | Serviço/API de origem | Dados enviados ao modelo |
| --- | --- | --- |
| `preferences` | User: `/users/me/preferences` | Idioma e fuso |
| `selected_goals` | User: `/users/me/goals/:id` | Tipo/estado e alvo quantitativo de até 3 objetivos explicitamente selecionados de atividade, fitness ou hidratação; sem títulos/notas |
| `training` | Training: exercícios e sessões próprias/acessíveis | Até 20 IDs de catálogo, ambientes, dificuldade, tipo, número de equipamentos e estados recentes; sem instruções/textos livres |
| `hydration` | Hydration: objetivo e consumo diário | Alvo, versão e total consumido no dia/fuso selecionado; sem lista de ingestões |
| `activity` | Performance: resumo de passos | Total, dias e média dos últimos 7 dias; sem peso, frequência cardíaca ou medidas corporais |
| `agenda` | Agenda: atividades pessoais | Até 20 intervalos/tipos/estados dos próximos 7 dias; sem títulos, descrições ou participantes |

Sem categoria autorizada não há consulta desse contexto. Falha de uma origem
selecionada interrompe a geração; não inventa dados. O contexto não é guardado
como snapshot nem incluído na auditoria. IDs de exercícios só são enviados
quando necessários para selecionar itens acessíveis do catálogo.

São enviados até oito mensagens anteriores da mesma versão de permissões,
limitadas a 2.000 caracteres cada, mais a mensagem atual. Contexto de domínio:
máximo de 8 KiB. Máximo técnico de cerca de 200 mensagens por conversa,
5 recomendações e 3 propostas por resposta. Há limite local de 120 pedidos
por titular/minuto e até 1.000 buckets; não é rate limiting distribuído.

O Professional foi analisado, mas o contrato interno Agenda não autoriza o
Coach. Não há consultas a clientes, aprovação, agenda profissional ou
elegibilidade sintética nesta integração. Não são consultadas bases alheias.

## Ferramentas implementadas e testadas

| Ferramenta | Parâmetros validados | API de execução |
| --- | --- | --- |
| `hydration.set_goal` | `targetMl` inteiro 250–20000; `timezone`; exige objetivo existente e versão capturada pelo backend | `PUT /hydration/goal` com versão original |
| `training.create_plan` | Título, objetivos, dias, ambiente e 1–20 exercícios acessíveis com sets/repetições | `POST /training/plans` |
| `user.create_activity_goal` | Título, métrica `steps/active_minutes`, valor inteiro; backend fixa unidade, período diário e `daily_activity` | `POST /users/me/goals` |
| `agenda.create_activity` | Título, `personal/workout`, ambiente condicional, intervalo futuro até 24h e fuso | `POST /agenda/activities` como `planned` |

Os intervalos numéricos são limites técnicos, sem recomendação de volume,
carga ou objetivo clínico. Planos são autónomos; não são prescrições aprovadas
por profissionais. A Agenda mantém sobreposições não bloqueantes, comunicadas
no resultado como `overlapWarning` e `overlapCount`.

Validação ocorre na proposta e imediatamente antes da execução. O Auth e o
destino voltam a validar o JWT e ownership; usa-se o contrato atual comum
`iss=goleve-auth`, `aud=goleve-api`. Audiência diferente é recusada, inclusive
se um stub Auth permissivo tentasse aceitá-la. O Coach não recebe o segredo
HS256, não emite tokens nem concede permissões. Bearer só existe em memória
no pedido síncrono e nunca entra no input do fornecedor.

Estados: `pending → executing → succeeded/failed/unknown`, ou
`pending → rejected/expired`; `unknown → reconciled` quando há evidência de
um recurso próprio correspondente. Propostas expiram após dez minutos,
limitados também pela validade da conversa. Claim e auditoria de intenção
são transacionais; confirmação concorrente só permite uma tentativa de escrita.

Os destinos não têm idempotência comprovada em todas estas criações. Não há
retry automático de escritas. Timeout, ligação interrompida, 5xx ou falha do
recibo local depois de possível commit ficam incertos. Reconciliação só lê
uma rota fixa do domínio e compara o recurso indicado pelo titular; declara
`causalExecutionProven=false`, sem provar causalidade ou ausência da escrita.
Não encontrar recurso mantém o bloqueio. Provas fortes de execução/ausência
exigem recibos/idempotência novos nos proprietários, ainda pendentes.

Propostas múltiplas têm confirmação e resultado separados. Uma falha não
afirma desfazer efeitos já concluídos noutro serviço. Não há transação
distribuída, pagamentos, administração, comandos, SQL ou HTTP arbitrário.

## Modelos e retenção

Base própria `goleve_ai_test_<16 hex>_<sufixo>` ou
`goleve_ai_local_<16 hex>_<sufixo>`, em MongoDB local replica set.

| Modelo / coleção | Conteúdo |
| --- | --- |
| AIConversation / `ai_conversations` | Titular, finalidade, seleções técnicas, versões, lock e prazo fixo |
| AIMessage / `ai_messages` | Uma mensagem por documento, payload cifrado, proveniência, recibo e versão de permissões |
| AIProposal / `ai_proposals` | Ferramenta fechada, parâmetros/precondições cifrados e imutáveis, estado, confirmação, prazo e resultado cifrado |
| AIAudit / `ai_audit` | Titular, IDs técnicos, serviço/categoria consultados, ação, resultado codificado e datas; sem conteúdo |

AES-256-GCM com chave própria, nonce aleatório e AAD ligada à coleção lógica,
titular e recurso. Hashes de comandos usam chave derivada separada. A chave
não fica na DB. Não se persiste raciocínio interno do modelo, prompt montado,
contexto de domínio, Bearer, credenciais, contactos ou respostas HTTP brutas.
Texto livre conhecido como credencial é recusado e contactos reconhecíveis
são removidos; esta filtragem não é anonimização infalível nem aprovação para
introduzir dados reais. Saídas com diagnóstico/prescrição/doses reconhecíveis
são recusadas; não existe garantia clínica baseada nestas expressões.

Conversas e conteúdo expiram no máximo sete dias após a criação, sem renovação
por utilização. O prazo é verificado em cada acesso; a purga síncrona própria
remove conteúdo expirado e os índices TTL oferecem limpeza física eventual
mesmo sem pedidos. O monitor TTL pode atrasar o expurgo físico; não se promete
eliminação atómica ao milissegundo pela infraestrutura. A purga física ao prazo
e a eliminação explícita foram verificadas no MongoDB isolado. Auditoria tem
prazo próprio de trinta dias e não mantém cópias de conteúdo eliminado.

DELETE elimina mensagens/propostas/conversa numa transação e conserva apenas
auditoria mínima com o seu prazo. Nenhum dado de domínio é eliminado. Não há
jobs de IA em fundo, tokens em filas, migrações, backups ou alterações de DBs
principais. As autorizações por conversa são técnicas e locais, conforme
aprovação específica desta fase; não são ConsentRecord/AccessGrant do User,
consentimentos legais ou substitutos de bases de tratamento de produção.

## Fornecedor e configuração

Exemplo sem segredos: [configuração do workspace](../../backend/services/ai-coach-service/.env.example).
`AI_COACH_ENABLED=false` é o default. Ativação exige `NODE_ENV=test/development`,
`AI_COACH_MODE=isolated`, URI própria e ficheiro de chave de dados independente.
Modo ativo recusa standalone antes de criar modelos/índices. Modo desligado
não lê chaves nem abre DB. O Compose e os Dockerfiles existentes foram preservados.

Fornecedores: `none` e `http-json-v1`. O segundo chama um endpoint HTTPS
explicitamente configurado, sem redirects, com timeout de oito segundos e
resposta limitada a 32 KiB. Credencial opcional vem de ficheiro próprio; não
é o JWT do titular. Não existe fornecedor mock configurável no servidor.
Injeção de mock/relógio exige `NODE_ENV=test` e base com prefixo de teste.

Contrato do adaptador HTTP: POST JSON com `contractVersion=1`, `model`,
`instructions`, `purpose`, `messages`, `context`, catálogo de `tools` e
`store=false`; resposta estrita `{reply, recommendations:[{category,text}],
proposals:[{tool,parameters}]}`. Não há compatibilidade automática com SDKs
ou APIs comerciais: um fornecedor/adaptador deve implementar este contrato.
`store=false` exprime o pedido técnico, sem provar a política de retenção do
fornecedor. Sem configuração ou com erro é devolvida indisponibilidade explícita.

## Validação desta entrega

- **42 testes do Coach aprovados**, zero falhas/ignorados: cifra/AAD, credenciais,
  configuração, audiência, produção, contratos, conversas, paginação, isolamento,
  categorias reais, memória limitada/revogação, indisponibilidade, ferramentas,
  confirmação/rejeição/expiração, replay, concorrência, quatro ações HTTP reais,
  versões, privacidade, rollback de auditoria, timeout e commit de domínio sem
  resposta, reconciliação, resultados parciais, eliminação e retenção física.
- **377 testes de regressão dos serviços** aprovados, zero falhas/ignorados,
  incluindo concorrência e transações da Agenda Profissional e outbox RabbitMQ.
- **14 testes antigos da demonstração** aprovados em standalone separado,
  sem alterar os seus ficheiros ou configurações para contornar validações.
- **433 testes distintos**; todos os workspaces TypeScript compilaram.
- Limpeza concluída: removidos apenas os três contentores tmpfs, a rede
  exclusiva, as fixtures e os ficheiros temporários desta execução. Não foi
  removido qualquer volume. Os 31 contentores preexistentes conservaram IDs,
  estados, saúde, montagens e redes; os 14 serviços principais estão saudáveis.
- Testes usam aplicações HTTP reais com bases fictícias isoladas e fornecedor
  simulado apenas em testes. Não foi validada qualidade de respostas de um LLM
  real, nem foi enviado conteúdo a um fornecedor externo.

Na preparação foram corrigidos o isolamento de Mongoose por workspace no
harness e a validação do sufixo da DB de teste. Uma tentativa offline de obter
a versão 8 não encontrou cache; o Coach usa a versão 9.11.4 já declarada e
instalada em Auth/User. Não foram alteradas dependências dos restantes serviços.

## Bloqueadores de produção

Fornecedores/região/contratos e retenção, aprovação de tratamento real,
identidade técnica e grants de finalidade, delegação/token exchange com scopes
por destino, recibos e reconciliação forte, rate limiting distribuído, KMS e
rotação, TLS/ACLs, direitos/backups/expurgo com garantias operacionais, avaliação
de segurança e qualidade clínica do modelo. Produção permanece bloqueada;
não há aprovação profissional real, partilha clínica, consentimentos legais,
pagamentos, automações proativas ou alteração de dados de terceiros.

## Ficheiros desta etapa

29 ficheiros, limitados ao Coach, proxy Gateway, lockfile e documentação:

```text
backend/api-gateway/src/app.ts
backend/api-gateway/src/routes/ai-coach.routes.ts
backend/api-gateway/src/services/ai-coach-proxy.service.ts
backend/package-lock.json
backend/services/ai-coach-service/.env.example
backend/services/ai-coach-service/package.json
backend/services/ai-coach-service/src/app.ts
backend/services/ai-coach-service/src/config/database.ts
backend/services/ai-coach-service/src/config/encryption.ts
backend/services/ai-coach-service/src/config/errors.ts
backend/services/ai-coach-service/src/config/privacy.ts
backend/services/ai-coach-service/src/config/settings.ts
backend/services/ai-coach-service/src/config/validation.ts
backend/services/ai-coach-service/src/controllers/coach.controller.ts
backend/services/ai-coach-service/src/middlewares/auth.middleware.ts
backend/services/ai-coach-service/src/middlewares/error.middleware.ts
backend/services/ai-coach-service/src/models/index.ts
backend/services/ai-coach-service/src/providers/provider.ts
backend/services/ai-coach-service/src/routes/coach.routes.ts
backend/services/ai-coach-service/src/server.ts
backend/services/ai-coach-service/src/services/coach.service.ts
backend/services/ai-coach-service/src/services/domain-client.ts
backend/services/ai-coach-service/src/services/tools.ts
backend/services/ai-coach-service/src/services/transaction.ts
backend/services/ai-coach-service/tests/integration.test.cjs
backend/services/ai-coach-service/tests/unit.test.cjs
documentation/api/ai-coach.md
documentation/architecture/ai-coach.md
documentation/backend-completion-plan.md
```
