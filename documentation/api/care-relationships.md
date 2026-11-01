# Fase 3 — relações entre utilizadores e profissionais

Âmbito: **ambiente local e dados exclusivamente fictícios**. Foram lidos integralmente [profile-relationships](../architecture/profile-relationships.md), [profile-permissions](../architecture/profile-permissions.md) e [professional-profiles](../architecture/professional-profiles.md), comparando-os com Auth, User, Professional e gateway. Estes documentos de arquitetura foram preservados; as adaptações aprovadas para esta fase académica estão descritas abaixo.

## Ownership e decisões aprovadas

- **Professional** é proprietário de `CareRelationship`, dos estados, da elegibilidade das capacidades e do histórico. Os IDs Auth dos dois participantes são referências externas, não `populate` ou consultas diretas à base do Auth.
- **Auth** continua a confirmar a identidade e papel atuais no `/auth/me`. Não recebeu endpoints de pesquisa de contas, atribuição de papéis ou partilha de chaves.
- **User** mantém perfis pessoais e os dados sensíveis. Um futuro `DataAccessGrant` continuará a pertencer ao User; nenhuma relação desta fase cria grants.
- **Gateway** encaminha os caminhos de relações para o Professional. Management, Agenda e restantes serviços não receberam responsabilidades novas.

Antes da implementação foram aprovadas expressamente:

1. Estado, versão e histórico completo limitado a **8 eventos por relação**, no mesmo documento, atualizados numa única operação MongoDB. Eventos existentes nunca são substituídos ou apagados. Uma relação terminada não reabre.
2. Expiração inicial de **7 dias**, configurável no servidor e guardada em `expiresAt` por pedido, sem índices TTL destrutivos.
3. Perda de elegibilidade bloqueia novas operações que a exigem. Os participantes conservam somente metadados mínimos e a possibilidade de terminar uma relação anteriormente aceite. Não há reativação automática nem modificação retroativa do histórico.

A aprovação também definiu unicidade por **utilizador + profissional + tipo de acompanhamento**, mesmo entre capacidades do mesmo profissional em jurisdições diferentes. Esta regra é mais restrita do que o índice por capacidade proposto inicialmente no desenho. Não limita o utilizador a um único PT/nutricionista global: profissionais diferentes e os dois tipos de acompanhamento são independentes.

## Elegibilidade: integração deliberadamente fechada

A aprovação da fase 2 é simulada, não atribui o papel `profissional`, não verifica oficialmente credenciais e mantém `eligibleForProfessionalActions=false`. O `/auth/me` só consulta a pessoa autenticada, não fornece uma consulta autorizada do papel atual de um terceiro. Faltam ainda os contratos de verificação/validade profissional previstos na arquitetura.

Por isso, o adaptador real `ProfessionalCareEligibility` **não emite decisões positivas nesta entrega**:

- Com revisão desativada, criação de pedidos para um profissional devolve 404 genérico de destino inexistente/inelegível; o diretório elegível e as capacidades autorizadas ficam vazios.
- Mesmo que exista uma candidatura simulada publicada, isso não serve como prova de elegibilidade. As verificações locais exigem coerência de perfil/capacidade/candidatura e não substituem os contratos em falta.
- Se uma decisão necessária não puder ser confirmada, a operação privilegiada falha fechada com 503; uma falha técnica não é interpretada como suspensão ou uma aprovação.

Não foram ativadas a revisão, contas administrativas ou capacidades aprovadas na base do projeto. Não há variável de ambiente, cabeçalho ou rota que force elegibilidade. O servidor normal constrói sempre o adaptador real.

Os testes injetam uma dependência de elegibilidade e um Auth **simulados em memória**, num processo isolado; os profissionais/estados positivos desses testes não são inseridos como perfis aprovados em MongoDB. A injeção por construtor é um ponto de teste, não uma opção HTTP ou de configuração do servidor. Os registos de relações dos testes ficam num MongoDB temporário em tmpfs, em bases aleatórias.

O catálogo público `/professionals/catalog` da fase 2 continua a ser um catálogo de aprovação simulada. O novo `/professionals/eligible-capabilities` é uma consulta distinta e mais restritiva. Consultar um catálogo não autoriza uma criação: a decisão atual é novamente verificada no pedido.

## Modelo e estados

`CareRelationship`, coleção `care_relationships`, guarda:

- ID local; `subjectAuthUserId`, `professionalAuthUserId`, `professionalId`, `capabilityId` e `relationshipKind`, imutáveis;
- `status`, `isOpen`, `version`, `schemaVersion=1`, `dataMode=synthetic`;
- `createdAt`, `updatedAt`, `expiresAt`, e `acceptedAt`/`closedAt` quando aplicáveis;
- histórico de eventos, cada um com ID, versão, ação, estados anterior/seguinte, tipo/ID Auth do ator quando humano, data, correlação e motivo codificado;
- recibos internos de idempotência, excluídos das consultas por defeito e de todos os DTOs.

Tipos canónicos: `personal_training` e `nutrition`, correspondentes às capacidades `personal_trainer` e `nutritionist`. Os nomes de estados seguem a arquitetura: `accepted` significa o vínculo ativo sugerido como `active`; `declined` significa o pedido rejeitado sugerido como `rejected`.

| Estado inicial | Ação | Quem | Estado final |
|---|---|---|---|
| inexistente | criar | Titular autenticado | pending |
| pending, dentro do prazo | accept | Destinatário, papel profissional e capacidade atualmente elegível | accepted |
| pending, dentro do prazo | decline | Destinatário, papel profissional e capacidade atualmente elegível | declined |
| pending, dentro do prazo | cancel | Titular que pediu | cancelled |
| pending, prazo atingido | expiração passiva | Servidor, durante operação autorizada | expired |
| accepted | end | Qualquer participante autenticado | ended |

Não existem PATCH de estado, reabertura ou transições a partir de estados finais. Nova tentativa após cancelamento, rejeição, expiração ou terminação cria novo ID. A chave de idempotência de uma criação anterior continua vinculada ao registo anterior; não deve ser reutilizada para a nova tentativa.

`isOpen=true` apenas em `pending` e `accepted`, controlado pelo servidor. Um índice único parcial impede duplicações abertas por titular/profissional/tipo; há também unicidade da chave de criação por titular. Índices de consulta por participante, estado, ID e expiração são normais: **nenhum elimina documentos por tempo**.

O histórico é um subschema `RelationshipTransition` no documento. A criação conta como primeiro evento; o limite total é 8. A máquina de estados atual é acíclica e termina antes desse limite em uso normal. Qualquer registo que já o tenha atingido devolve 409 `RELATIONSHIP_HISTORY_LIMIT` para outra transição, incluindo expiração, preservando estado, versão e eventos. Uma futura versão poderá separar o histórico para coleção própria ou serviço de auditoria, com consistência e migração previamente aprovadas.

`termsVersion=synthetic-workflow-v1` identifica apenas esta versão técnica académica; não prova aceitação de termos legais nem fundamento de tratamento.

## Endpoints

Base local: `http://127.0.0.1:3000`. **Todos os novos endpoints exigem Bearer JWT**, inclusive acesso direto ao Professional dentro da rede Docker.

| Método | Caminho | Operação |
|---|---|---|
| GET | `/professionals/eligible-capabilities` | Lista paginada de capacidades confirmadas como elegíveis |
| POST | `/care-relationships` | Pedir acompanhamento para o próprio titular |
| GET | `/care-relationships/me` | Metadados das relações em que a identidade atual é um dos participantes |
| GET | `/care-relationships/:id` | Metadados mínimos de uma relação própria |
| GET | `/care-relationships/:id/history` | Histórico mínimo da relação própria, sem IDs Auth dos atores |
| GET | `/professionals/me/care-relationships` | Caixa recebida, limitada ao papel profissional e capacidades atualmente autorizadas |
| POST | `/care-relationships/:id/accept` | Aceitar pedido dirigido à capacidade própria |
| POST | `/care-relationships/:id/decline` | Rejeitar pedido dirigido à capacidade própria |
| POST | `/care-relationships/:id/cancel` | Cancelar pedido pendente próprio |
| POST | `/care-relationships/:id/end` | Terminar vínculo anteriormente aceite |

Listagens aceitam `limit` 1–100, por defeito 20, e `before`. As listagens de relações aceitam também `status` canónico. As respostas contêm `data.items` e `data.nextBefore`. O filtro de participantes vem sempre do Auth, não de query/body. Não se aceitam operadores MongoDB ou filtros livres por pessoa.

A paginação usa o último ID analisado. Ao processar expiração ou perder elegibilidade durante uma listagem, uma página pode conter menos resultados; se houver `nextBefore`, deve continuar por esse cursor mesmo se a página estiver vazia.

Exemplo de corpo de criação, exclusivamente fictício e dependente de destino elegível:

~~~json
{
  "professionalId": "<id-perfil-profissional>",
  "capabilityId": "<id-capacidade>",
  "relationshipKind": "personal_training"
}
~~~

Não se recebe o ID do titular, o estado, permissões, dados de saúde ou notas livres. O servidor resolve o ID Auth do profissional através da autoridade de elegibilidade e impede autoassociação. Tipo e capacidade têm de ser compatíveis. Não existe ligação a clientes pesquisados por email.

Criação exige `Idempotency-Key` (1–128 caracteres `A-Z a-z 0-9 . _ -`). Comandos de estado exigem corpo `{}`, chave de idempotência e `If-Match` com o ETag forte devolvido na leitura, por exemplo `"<id-relacao>:<versao>"`.

Sucesso usa `{ "data": ... }`. Criação nova devolve 201; repetição idêntica devolve 200 e `Idempotency-Replayed: true`. Reutilização da chave com outro conteúdo/comando dá 409; falta de precondição dá 428; versão de outro recurso/desatualizada dá 412; transição inválida ou pedido expirado dá 409. Referências de relações de terceiros devolvem 404 mesmo para administradores. Corpos desconhecidos/inválidos dão 400 e JSON acima de 16 KiB dá 413.

Receber a mesma criação simultaneamente devolve um único documento. Pedidos diferentes concorrentes para a mesma relação aberta são arbitrados pelo índice único. Comandos concorrentes usam comparação atómica de versão/estado e só um acrescenta o evento. Estado, versão, abertura/fecho e histórico são atualizados na mesma operação, sem transações entre coleções.

## Expiração e configuração

~~~dotenv
CARE_INVITATION_TTL_DAYS=7
~~~

É uma configuração do servidor Professional, inteiro de 1 a 365 dias. Valores inválidos são rejeitados no arranque. O prazo efetivo é guardado na criação; alterar a variável não muda prazos de pedidos já existentes. Não foi alterado o `.env` local.

No instante `hora-do-servidor >= expiresAt`, um pedido pendente já não pode ser aceite nem rejeitado. Consultas, comandos e tentativas de substituição processam a transição para `expired` por CAS, acrescentando um único evento de sistema. O predicado das alterações pendentes volta a testar a validade antes da escrita; a aceitação não pode ultrapassar o prazo durante a validação de elegibilidade. A hora do MongoDB também impede uma escrita pendente já expirada no relógio da base.

A expiração é passiva: **um documento pode continuar fisicamente `pending` até à próxima operação que processe a expiração**. Não há worker, limpeza automática ou TTL. Consultar histórico preserva o documento expirado. Ao criar novo pedido com outra chave, o pedido antigo expirado é encerrado antes de disputar o índice de unicidade; a nova relação não reabre a antiga.

## Perda de elegibilidade, autorização e privacidade

Uma suspensão/revogação profissional não substitui nem apaga o histórico da relação. Nesta versão, também não acrescenta automaticamente uma transição de suspensão: respeita-se a regra aprovada de não alterar automaticamente o histórico por essa causa. `accepted` é o estado histórico de aceitação, **não uma autorização operacional**.

Pedidos novos e resoluções profissionais exigem elegibilidade atual; a caixa recebida usa apenas capacidades autorizadas. Se o papel deixar de ser profissional, não há acesso à caixa. Uma capacidade inelegível desaparece dessa vista. Se a decisão não puder ser confirmada, a operação privilegiada é negada, sem confiar no estado antigo ou no JWT como prova de habilitação.

Os participantes autenticados podem continuar a usar `/care-relationships/me`, detalhe e histórico mínimos, e terminar um vínculo aceite. Recuperar elegibilidade não muda automaticamente qualquer estado e nunca reabre relações terminadas ou canceladas. Pedidos pendentes ainda válidos só podem ser aceites por um novo comando explícito autorizado.

Os DTOs de relações contêm apenas ID da relação, tipo, estado, versão e datas relevantes; histórico mostra ações, transições, tipo de ator e motivos codificados, não os seus IDs Auth. Não incluem contactos, nomes de utentes, perfil pessoal, IDs Auth dos participantes, medições, peso, hábitos, objetivos ou recibos internos. As respostas indicam sempre `access=metadata_only` e `sensitiveDataAuthorized=false`, inclusive após aceitação.

Não se criam `DataAccessGrant`, consentimentos, snapshots de saúde ou acessos entre bases. A apresentação futura de nomes/contactos dos participantes exigirá contrato mínimo autorizado próprio. Os pontos de integração disponíveis são a referência/versão da relação, a decisão atual de elegibilidade e o contrato de evento; um futuro proprietário de dados terá ainda de validar grants e a sua política. Nenhum serviço deve interpretar `accepted` isoladamente como permissão.

## Auditoria e preparação RabbitMQ

O histórico de negócio e o estado são atómicos no próprio documento. A auditoria técnica existente do Professional regista intenções/resultados com metadados, sem corpos, tokens ou dados de saúde. Falha na auditoria inicial impede execução/entrega. Como essa auditoria fica numa coleção separada e o MongoDB é standalone, uma falha na conclusão pode devolver 503 apesar de uma escrita de negócio já persistida; o cliente deve reler ou repetir com a mesma chave. Não há promessa de atomicidade entre coleções.

`careRelationshipChanged()` prepara `care.relationship.changed.v1` de forma determinística a partir do evento guardado: ID do evento, relação, versão, estado, data, produtor e correlação. Não inclui nomes, contactos, participantes ou conteúdos sensíveis. O histórico fornece IDs estáveis para uma integração futura; **não foram criados publisher, consumer, outbox, filas ou dependência de RabbitMQ**. Não se afirma entrega de eventos nesta fase.

## Validação e testes

A suite nova usa gateway e Professional reais em processo, Auth/eligibilidade simulados em memória e bases de relações aleatórias em MongoDB temporário tmpfs. Nenhum profissional aprovado, administrador ou utilizador Auth foi inserido por estes testes novos. As regressões existentes mantêm os seus próprios cenários fictícios isolados, sem tocar nas bases normais do projeto.

Os testes incluem criação, destinos inexistentes/inelegíveis, autoassociação, incompatibilidade de atividade, identidade injetada, duplicações por tipo/capacidade, idempotência com oito criações concorrentes, aceitação/rejeição/cancelamento/terminação, IDOR e administradores sem bypass, perda/recuperação de elegibilidade, metadados mínimos, expiração concorrente e durante uma aceitação, nova tentativa após expiração, limite de histórico, preservação dos eventos, paginação, falhas de Auth/DB/elegibilidade/auditoria e contrato RabbitMQ sem dados pessoais.

~~~powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:<porta-do-mongo-temporario>'
npm --prefix backend test --workspace=@goleve/professional-service
npm --prefix backend test --workspace=@goleve/user-service
npm --prefix backend test --workspace=@goleve/auth-service
~~~

Sem URI explícita, a integração é ignorada e os testes unitários não comprovam o fluxo completo. Não usar as bases normais como fixtures.

O build Docker mantém os workspaces e o lockfile existentes, sem dependências ou Dockerfiles novos. Apenas Professional e gateway precisam de reconstrução, com as dependências já saudáveis:

~~~sh
docker compose up -d --no-deps --build --wait --wait-timeout 180 professional-service api-gateway
~~~

Resultados finais, sem falhas ou testes ignorados:

| Verificação | Resultado |
|---|---|
| Professional: fases 1–3 | **122 testes aprovados**, incluindo 31 novos nesta fase |
| User: regressão | **90 testes aprovados** |
| Auth: regressão | **85 testes aprovados** |
| Total distinto | **297 testes aprovados** |
| TypeScript | Professional, gateway, Management, User e Auth compilados |
| Docker | Professional e gateway reconstruídos com sucesso |
| Serviços configurados | **14 contentores running/healthy** |
| Configuração no Professional Docker | Modo fictício, revisão desativada, zero revisores e prazo de 7 dias; sem JWT_SECRET/RABBITMQ_URL |
| Smoke HTTP Docker | Saúde/MongoDB 200; novos endpoints sem JWT 401, pelo gateway e diretamente no Professional |
| Preservação | 149 ficheiros protegidos inalterados; apenas dois contentores recriados; volume `goleve_mongo_data` preservado |
| Git e segredos | `git diff --check` sem erros; `.env`/`.secrets/` ignorados; sem segredos locais nos ficheiros candidatos |

Foi encontrada e corrigida uma corrida em que criações simultâneas com a mesma chave podiam devolver 409 depois de o primeiro pedido criar a relação. Agora os outros pedidos devolvem o mesmo ID com 200; há teste com oito pedidos concorrentes. Também foi corrigida a inferência TypeScript dos filtros de estado do Mongoose. A suite final passou integralmente; após preparar o teste de limite apenas com append de eventos, a integração de relações foi novamente executada (26 testes aprovados, já incluídos no total distinto acima).

O aviso `DEP0060` da dependência de proxy existente e o aviso Compose sobre dois contentores antigos não impediram os testes. Esses contentores foram preservados. A instância MongoDB temporária de testes usa somente tmpfs e é encerrada no fim, sem tocar nos volumes do projeto. Não ficaram erros de compilação/testes pendentes.

## Ficheiros criados ou alterados

19 ficheiros, limitados ao Professional, gateway, configuração e documentação:

~~~text
.env.example
README.md
backend/api-gateway/src/app.ts
backend/api-gateway/src/routes/care-relationship.routes.ts
backend/services/professional-service/src/app.ts
backend/services/professional-service/src/config/relationship-validation.ts
backend/services/professional-service/src/config/settings.ts
backend/services/professional-service/src/controllers/care-relationship.controller.ts
backend/services/professional-service/src/events/care-relationship.events.ts
backend/services/professional-service/src/models/audit-access.model.ts
backend/services/professional-service/src/models/care-relationship.model.ts
backend/services/professional-service/src/models/index.ts
backend/services/professional-service/src/routes/care-relationship.routes.ts
backend/services/professional-service/src/services/care-eligibility.service.ts
backend/services/professional-service/src/services/care-relationship.service.ts
backend/services/professional-service/tests/care-integration.test.cjs
backend/services/professional-service/tests/care-validation.test.cjs
compose.yaml
documentation/api/care-relationships.md
~~~

Não foram alterados Auth, User, Management, Agenda, os restantes microserviços, documentos de arquitetura, dependências ou Dockerfiles. Não houve commit ou push; HEAD permanece `1e63e8a78e102c51454d311f54cb0857defa1821`.

## Questões pendentes

- Contratos autoritativos para elegibilidade positiva, papel atual do profissional destinatário, verificação/validade das credenciais e políticas de atividade/jurisdição. Até existirem, o ambiente normal mantém a criação de relações inelegível e o diretório vazio.
- Grants por dataset/finalidade, apresentação autorizada da identidade dos participantes e políticas para dados reais; nada foi inferido da aceitação do vínculo.
- Eventual separação/migração do histórico para coleção/serviço próprio, auditoria operacional e retenção aprovada; sem eliminação automática ou prazos arbitrários.
- Publicação RabbitMQ, identidade técnica, outbox/inbox e reconciliação exigem etapa própria.
- Consultas, reservas, pagamentos, acesso clínico e consentimentos IA continuam fora do âmbito.
