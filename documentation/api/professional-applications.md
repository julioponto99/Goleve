# Professional Service — fase 2: aprovação simulada

Âmbito aprovado: **exclusivamente desenvolvimento local com dados fictícios**. Esta fase não verifica habilitações oficiais, não atribui o papel Auth `profissional` e não concede acesso a clientes ou atos profissionais reais. As condições administrativas foram perguntadas e aprovadas antes da implementação.

## Análise e autorização administrativa

O Auth permite apenas `utilizador` no registo público, confirma o papel atual no `/auth/me` e não tem provisionamento administrativo seguro, MFA, atribuições de revisão ou comandos de promoção de papéis. O Management era um processo de saúde inicial. Não foram criadas contas administrativas, rotas de papéis, alterações no Auth ou escritas na base de outros microserviços.

O controlo aprovado nesta simulação exige, em **cada pedido administrativo**:

1. Bearer JWT válido, confirmado através do Auth existente, sem cache de identidade ou confiança em claims/cabeçalhos livres do cliente.
2. Papel atual `administrador` devolvido pelo Auth. Gestores, profissionais e utilizadores não recebem a permissão, mesmo que o seu ID esteja na configuração.
3. ID Auth presente na lista explícita de revisores do servidor Professional.
4. Dados e revisão explicitamente em modo `synthetic`.
5. Candidatura de outra identidade: não há autoaprovação, autorrejeição, autossuspensão ou consulta administrativa da própria candidatura. A consulta própria usa o endpoint do titular.

O Professional aplica estas condições tanto a chamadas encaminhadas como a chamadas diretas. O Management encaminha o Bearer original sem o persistir, sem decisões positivas em cache e sem escrever na base do Professional. Se Professional/Auth falhar, o pedido falha; não há fallback permissivo. A lista de revisores nunca é devolvida na API. O histórico administrativo inclui o ID do ator responsável por cada decisão, não a lista de pessoas autorizadas.

Configuração segura de `.env.example` e do Compose:

~~~dotenv
PROFESSIONAL_DATA_MODE=disabled
PROFESSIONAL_REVIEW_MODE=disabled
PROFESSIONAL_REVIEWER_IDS=
~~~

O ambiente local existente mantém apenas os dados fictícios ativos; a revisão continua desativada por defeito, sem revisores configurados. Não se criaram administradores para a ativar.

Quando existir um administrador **já provisionado por um processo seguro aprovado**, a simulação pode ser explicitamente configurada com `PROFESSIONAL_DATA_MODE=synthetic`, `PROFESSIONAL_REVIEW_MODE=synthetic` e `PROFESSIONAL_REVIEWER_IDS` contendo os IDs Auth autorizados, separados por vírgulas. Uma lista de IDs não cria contas nem transforma uma conta normal em administrador. Não colocar credenciais ou JWT nessa variável.

IDs devem ser ObjectIds hexadecimais minúsculos, únicos, máximo 50. Lista ausente com revisão ativa, IDs inválidos/duplicados, modo desconhecido ou revisão ativa sem modo de dados fictícios são rejeitados no arranque, sem mostrar valores. Configuração ausente/desativada não autoriza revisão. Alterações à configuração exigem recriar o Professional; não existe rota pública para as efetuar. **O provisionamento administrativo real permanece pendente.**

## Estado e modelos

Novo agregado Mongoose `ProfessionalApplication`, coleção `professional_applications`, pertencente exclusivamente ao Professional. Há uma candidatura por perfil/titular. Guarda:

- referência ao perfil e ID externo Auth, `dataMode=synthetic`, versão e timestamps;
- estado canónico `draft`, `pending`, `approved`, `rejected` ou `suspended`;
- cópia fixa dos dados profissionais da submissão atual: nome, biografia, país/idiomas, atividades, modalidades, especializações, experiência declarada e qualificações;
- pedido explícito de publicação do candidato e seleção limitada de resumos de qualificações públicas;
- publicação autorizada, última decisão, ator Auth responsável, data e motivo quando aplicável;
- histórico de transições com ID de evento, versão, estados anterior/seguinte, ação, ator, data, motivo e recibo de idempotência interno.

O histórico é um subschema estrito e limitado, no mesmo documento da candidatura. Não é um array ilimitado nem uma coleção de auditoria separada que pudesse perder atomicidade com o estado. Não há rotas para alterar decisões anteriores. O último espaço do limite de 50 eventos fica reservado para suspensão: as restantes transições param antes de o consumir. Ao atingir o limite, é necessário um processo de arquivo controlado futuro; não se apagam decisões para continuar.

O modelo de auditoria técnica existente também passa a aceitar operações de candidatura/revisão, com metadados e sem conteúdos profissionais. O perfil ganha um token interno de exclusão de escritas (`select:false`), nunca exposto por DTO. Os schemas, qualificações e capacidades da fase 1 continuam separados e não se tornam oficialmente verificados.

Antes da primeira submissão, `application-status` apresenta um estado `draft` derivado do perfil sem criar documentos por GET. A candidatura persistente nasce na submissão. `applicationStatus` no GET do perfil e o endpoint de estado são a autoridade da revisão simulada; os campos de ciclo de vida `profileStatus`, `directoryVisibility` e verificação da fase 1 não são usados como uma segunda fonte de aprovação. O catálogo é projetado da candidatura aprovada e da sua cópia submetida, sem replicar estados entre coleções.

## Transições

| Estado inicial | Comando | Quem | Estado final |
|---|---|---|---|
| draft | submit | Titular | pending |
| pending | approve | Administrador autorizado distinto do titular | approved |
| pending | reject, com motivo | Administrador autorizado distinto do titular | rejected |
| rejected | reopen | Titular | draft |
| approved | suspend, com motivo | Administrador autorizado distinto do titular | suspended |

Outras transições são recusadas. Nesta fase não há retoma de suspensões, cancelamento de pendências ou edição de dados já aprovados. O titular reabre explicitamente uma rejeição, corrige os dados e volta a submeter. A decisão/motivo anteriores permanecem no histórico. A cópia de dados submetida é substituída na nova submissão; esta simulação conserva metadados das decisões anteriores, não um arquivo de todas as versões dos conteúdos/provas. Esse arquivo exige desenho próprio antes de verificação real.

Para submeter são necessários perfil válido, 1–20 capacidades em rascunho e 1–50 qualificações declaradas, com pelo menos uma qualificação própria vinculada a cada capacidade. Isto é um critério de completude da **simulação**, não uma política legal de habilitação. A disponibilidade privada não é prova de habilitação nem requisito para aprovação. Contactos e horários privados não são copiados para a vista administrativa de revisão.

## Endpoints

Base pelo gateway local: `http://127.0.0.1:3000`. Respostas de sucesso usam `{ "data": ... }`; erros `{ "error": { "code": "...", "message": "..." } }`.

| Método | Caminho | Acesso |
|---|---|---|
| POST | `/professionals/me/submit` | Próprio titular autenticado |
| GET | `/professionals/me/application-status` | Próprio titular autenticado; inclui motivo de rejeição/suspensão |
| POST | `/professionals/me/reopen` | Titular, apenas rejeitada |
| GET | `/management/professional-applications` | Administrador autorizado; `pending` por defeito |
| GET | `/management/professional-applications/:id` | Administrador autorizado; dados da submissão |
| GET | `/management/professional-applications/:id/history` | Administrador autorizado; histórico limitado completo |
| POST | `/management/professional-applications/:id/approve` | Administrador autorizado |
| POST | `/management/professional-applications/:id/reject` | Administrador autorizado; motivo obrigatório |
| POST | `/management/professional-applications/:id/suspend` | Administrador autorizado; motivo obrigatório |
| GET | `/professionals/catalog` | Catálogo público de resumos aprovados e publicados, apenas em modo fictício |
| GET | `/professionals/specializations` | Catálogo de códigos fictícios da fase 1, autenticado |

Os restantes endpoints próprios da fase 1 mantêm-se. Edições são bloqueadas durante `pending`, `approved`, `rejected` e `suspended`; uma rejeição tem de ser reaberta primeiro. Não existem consultas públicas de candidaturas por AuthId ou endpoints de promoção de papéis.

Listagens administrativas aceitam apenas `status` (um dos cinco estados), `limit` 1–100 (20 por defeito) e `before`. O catálogo aceita apenas `limit`/`before`. Devolvem `data.items` e `data.nextBefore`. Não há filtros MongoDB livres. O histórico é limitado a 50 eventos, sem truncar decisões silenciosamente.

O caminho externo Management é encaminhado pelo gateway para o Management e deste para `/professional-applications/*` no Professional, que autentica e autoriza cada operação. Não há nova porta publicada nem escrita entre bases. Os dois serviços não recebem a chave JWT; o Management também não recebe credenciais MongoDB/RabbitMQ para esta funcionalidade.

## Pedidos e concorrência

Todos os comandos de submissão, reabertura e decisão exigem `Idempotency-Key` (1–128 caracteres `A-Z a-z 0-9 . _ -`) e `If-Match`. São recusados campos desconhecidos, IDs/estados/papéis de autoria enviados no corpo, razões vazias ou superiores a 500 caracteres e JSON superior a 16 KiB.

Antes de **cada submissão**, obter o ETag atual de `GET /professionals/me`, pois inclui invalidação de versão após alterações aos dados dependentes. Exemplo fictício:

~~~http
POST /professionals/me/submit
Authorization: Bearer <JWT>
If-Match: "<id-perfil>:<versao-atual>"
Idempotency-Key: synthetic-submit-001
Content-Type: application/json

{
  "publicationRequested": true,
  "publicQualificationIds": ["<id-qualificacao-propria>"]
}
~~~

Sem opt-in, pode enviar `{}`: a candidatura não solicita publicação. Qualificações selecionadas têm de pertencer à submissão, no máximo 20. Ao pedir publicação, o titular autoriza apenas os campos mínimos do DTO público abaixo, não contactos ou horários.

Submissão nova devolve 201. O ID e ETag devolvidos a partir dessa resposta são da candidatura. Reabertura e decisões usam o ETag atual da candidatura obtido no endpoint de estado/detalhe; nunca o ETag de outra candidatura ou do perfil.

Corpo de aprovação: `{ "publish": true }` ou `{ "publish": false }`, escolha obrigatória. Publicar exige pedido prévio do candidato. Aprovar com publicação falsa mantém o perfil fora do catálogo. Rejeição/suspensão: `{ "reason": "Motivo exclusivamente fictício" }`. Reabertura: `{}`.

Uma repetição com mesma chave, ator, ação, corpo e precondição devolve o estado atual sem repetir a transição (`Idempotency-Replayed: true`). Guardam-se hashes internos dos recibos, não JWT ou chaves secretas. Reutilização da chave para comando diferente dá 409. Falta de precondição dá 428; versão antiga dá 412; transição inválida dá 409. A autorização atual é verificada também nas repetições: um papel retirado não recebe uma resposta anterior privilegiada em cache.

Estado, publicação e novo evento de decisão são escritos atomicamente com CAS no mesmo documento, incluindo decisões concorrentes. Submissão e edições do perfil/capacidades/qualificações/horários partilham uma exclusão de escrita no perfil. A cópia submetida não pode ser aprovada enquanto uma edição estiver a meio. Alterações dependentes invalidam conservadoramente a versão do perfil, inclusive tentativas falhadas após adquirir a exclusão, pelo que o cliente deve reler o ETag antes de submeter.

O bloqueio espera até aproximadamente um segundo por outro escritor e devolve 409 se continuar ocupado. Não expira automaticamente para entregar o recurso a outro escritor que possa ainda estar ativo. Se o processo morrer com o bloqueio adquirido ou a libertação falhar, novas escritas/submissões falham fechadas e exigem um procedimento de recuperação controlada futuro. Não foi criado um endpoint de desbloqueio ou reparação automática insegura.

## Publicação e minimização

O catálogo lê diretamente candidaturas `approved + publicationEnabled=true + synthetic`, sem cache positiva ou projeção RabbitMQ. Uma suspensão retira a candidatura das novas leituras imediatamente após a escrita autoritativa.

O DTO público contém apenas ID público do perfil, nome profissional, biografia se declarada, atividades/especializações/modalidades e resumos das qualificações selecionadas pelo candidato e abrangidas pela aprovação. Cada resumo contém apenas tipo e título. Respostas assinalam `approvalType=simulated` e `professionalPrivileges=false`.

Não devolve AuthId, papel, IDs de revisores, cédulas, documentos privados, contactos, instituição/datas privadas das qualificações, motivos, histórico ou horários. Fotografias continuam ausentes porque a fase 1 não implementou assets públicos aprovados; não se aceitam URLs livres como substituto. A aprovação simulada não altera os campos oficiais de verificação das capacidades/qualificações nem ativa acompanhamentos.

## Auditoria e limites

O histórico de negócio fica na mesma escrita do estado, publicação e decisão responsável. A auditoria técnica de intenção/conclusão permanece em coleção separada: não há transação multidocumento no MongoDB standalone. Se a auditoria inicial falhar, a operação não prossegue. Uma falha após a decisão persistida pode devolver 503 apesar de estado/histórico já alterados; a repetição idempotente ou releitura permite determinar o resultado. Não se promete atomicidade entre essa auditoria técnica e a decisão nem entrega de eventos distribuída.

Não foram acrescentados TTL, eliminações, migrações destrutivas, replica set ou eventos RabbitMQ. A retenção/arquivo do histórico e a recuperação de bloqueios exigem processos aprovados antes de utilização real.

## Verificação

As novas provas de autorização usam um Auth simulado com identidades/JWT fictícios e papel atual consultado a cada operação; não criam nem promovem contas reais. Exercitam o fluxo HTTP completo gateway → Management → Professional → Auth simulado com MongoDB real temporário em tmpfs. As regressões existentes continuam a usar bases fictícias isoladas, incluindo a integração com o Auth real em processo.

~~~powershell
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:<porta-do-mongo-temporario>'
npm --prefix backend test --workspace=@goleve/professional-service
npm --prefix backend test --workspace=@goleve/user-service
npm --prefix backend test --workspace=@goleve/auth-service
~~~

Sem URI de teste explícita, a integração é ignorada e não comprova o fluxo completo. Não apontar os testes para as bases de dados normais do projeto. Para reconstruir apenas os serviços desta etapa com dependências já saudáveis:

~~~sh
docker compose up -d --no-deps --build --wait --wait-timeout 180 professional-service management-service api-gateway
~~~

Resultados finais, sem falhas nem testes ignorados:

| Verificação | Resultado |
|---|---|
| Professional: fases 1 e 2 | 91 testes aprovados, incluindo 25 novos testes da aprovação simulada |
| User: regressão | 90 testes aprovados |
| Auth: regressão | 85 testes aprovados |
| Total | **266 testes aprovados** |
| TypeScript | Professional, Management, gateway, User e Auth compilados |
| Docker | Imagens Professional, Management e gateway reconstruídas e saudáveis |
| Serviços configurados | **14 contentores running/healthy** |
| Configuração no Professional Docker | Revisão desativada, zero revisores, sem JWT_SECRET/RABBITMQ_URL |
| Configuração no Management Docker | Sem JWT_SECRET, MONGO_URI ou RABBITMQ_URL |
| Testes HTTP no Docker | Saúde 200; catálogo 200 vazio; administração sem JWT 401 pelo gateway, Management direto e Professional direto |
| Preservação | 136 ficheiros protegidos inalterados; só três contentores recriados; volume `goleve_mongo_data` preservado |
| Git/segredos | `git diff --check` sem erros; `.env` e `.secrets/` continuam ignorados; sem segredos locais nos candidatos |

As provas novas incluem: submissão válida/incompleta, rejeição/reabertura/ressubmissão, aprovação autorizada, proibição de autoaprovação e de gestores/administradores não autorizados, papel atual retirado, publicação com duplo opt-in, minimização do catálogo, motivos, precondições, concorrência, idempotência, reserva de capacidade para suspensão, bloqueios interrompidos e falhas de dependências/auditoria. Os tokens/identidades novos pertencem apenas ao Auth simulado dos testes. Não se alteraram contas existentes.

O aviso de depreciação `DEP0060` da dependência de proxy e o aviso Compose sobre dois contentores antigos já existentes não impediram os testes; os contentores antigos foram preservados. Foi removido um espaço final identificado por `git diff --check`. Não ficaram erros de compilação ou testes pendentes. A instância MongoDB temporária dos testes usa apenas tmpfs e é encerrada no fim, sem tocar nos volumes do projeto.

## Ficheiros criados ou alterados

30 ficheiros versionáveis, limitados ao Professional, integração Management/gateway, configuração e documentação:

~~~text
.env.example
README.md
backend/api-gateway/src/app.ts
backend/api-gateway/src/routes/management.routes.ts
backend/api-gateway/src/services/management-proxy.service.ts
backend/package-lock.json
backend/services/management-service/package.json
backend/services/management-service/src/app.ts
backend/services/management-service/src/routes/professional-applications.routes.ts
backend/services/management-service/src/server.ts
backend/services/management-service/src/services/professional-review-proxy.service.ts
backend/services/professional-service/package.json
backend/services/professional-service/src/app.ts
backend/services/professional-service/src/config/application-validation.ts
backend/services/professional-service/src/config/settings.ts
backend/services/professional-service/src/controllers/application.controller.ts
backend/services/professional-service/src/models/audit-access.model.ts
backend/services/professional-service/src/models/index.ts
backend/services/professional-service/src/models/professional-application.model.ts
backend/services/professional-service/src/models/professional-profile.model.ts
backend/services/professional-service/src/routes/application.routes.ts
backend/services/professional-service/src/routes/professional.routes.ts
backend/services/professional-service/src/services/application.service.ts
backend/services/professional-service/src/services/draft-lock.service.ts
backend/services/professional-service/src/services/professional.service.ts
backend/services/professional-service/tests/applications.test.cjs
backend/services/professional-service/tests/integration.test.cjs
compose.yaml
documentation/api/professional-applications.md
documentation/api/professional-service.md
~~~

Os quatro documentos de arquitetura foram lidos e preservados. Não houve alterações de código no Auth, User, Agenda ou outros microserviços. Não foram executados commit ou push; HEAD permanece `3eee756a844d64e3c4092022354a666e503c7b3c`.

## Questões pendentes

- Provisionamento seguro de administradores, MFA/step-up, atribuições/âmbitos do Management e governação da lista de revisores: não resolvidos por esta simulação.
- Verificação oficial, políticas por atividade/jurisdição, títulos/provas, assets, proteção operacional, base de tratamento e retenção para dados reais.
- Arquivo/continuação após o limite de eventos, versões históricas de provas e recuperação controlada de escritas interrompidas.
- Retoma de suspensões e alterações posteriores a uma aprovação exigem novos comandos e regras; continuam recusadas.
- Relações com clientes, agenda operacional, reservas, consultas, planos, pagamentos e consentimentos IA continuam fora deste âmbito.
