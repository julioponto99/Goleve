# Payment Service — Fase 5.8.1

Serviço local de demonstração para pagamentos fictícios. Não comunica com bancos, não movimenta fundos e não aceita dados de cartões, IBAN, credenciais ou tokens bancários.

## Configuração

O serviço só arranca com `PAYMENT_DEMO_ENABLED=true` e fora de `NODE_ENV=production`. Os preços têm de estar previamente definidos no backend através de fixtures:

```dotenv
PAYMENT_DEMO_FIXTURES=demo-training:2500:approve,demo-decline:999:decline
```

O formato é `priceReference:amountCents:approve|decline`. O cliente envia apenas uma referência e o montante deve coincidir com a fixture; não pode escolher o resultado.

## Endpoints

Todos exigem JWT Bearer válido e isolamento pelo utilizador autenticado:

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/payments` | Criar pagamento `pending`; exige `Idempotency-Key` |
| GET | `/payments` | Listar pagamentos próprios (`limit`, `before`) |
| GET | `/payments/:paymentId` | Consultar pagamento próprio |
| POST | `/payments/:paymentId/confirm` | Autorizar/recusar através do banco simulado |
| POST | `/payments/:paymentId/cancel` | Cancelar pagamento pendente |

Confirmação e cancelamento também exigem `Idempotency-Key`. As transições são CAS no MongoDB: apenas um pedido concorrente pode sair de `pending`.

## Modelo

A coleção `payments` guarda `ownerId`, `priceReference`, `serviceReference`, `amountCents`, `currency=EUR`, `state`, `method=mock`, referência de transação simulada, chaves de idempotência e histórico mínimo. Existem índices por `(ownerId, idempotencyKey)`, `(ownerId, createdAt)` e confirmação.

Estados permitidos: `pending -> approved`, `pending -> declined`, `pending -> cancelled`. Estados finais não reabrem.

## Correção de concorrência — Fase 5.13

O percurso autónomo adquire agora um claim persistente **antes** de invocar o banco.
Uma única operação `findOneAndUpdate`, com write concern `majority`, exige titular,
estado `pending`, ausência de `bankAttempt` e espaço reservado na outbox. Guarda
`confirmationKey`, `bankAttempt` e a entrada de histórico `bank_claim_acquired`.
Não utiliza mutex em memória. A confirmação e o cancelamento disputam o mesmo
documento; um cancelamento só vence enquanto ainda não existir claim.

`bankAttempt` é um subdocumento opcional, sem novo índice ou migração:

| Campo | Significado |
|---|---|
| `claimId` | Identificador não previsível do único direito de dispatch |
| `providerKey` | `goleve:payment:<paymentId>`, independente da chave escolhida pelo cliente |
| `status` | `processing`, `unknown` ou `settled`, exclusivamente interno |
| `startedAt`, `deadlineAt` | Instantes UTC de início e limite da confirmação |

Os estados públicos `pending`, `approved`, `declined`, `cancelled` e os endpoints
mantêm-se. Documentos anteriores sem `bankAttempt` continuam utilizáveis. O DTO
acrescenta apenas campos opcionais: `confirmationStatus=processing` ou
`confirmationStatus=reconciliation_required` com `reconciliationRequired=true`.
O claim e as chaves internas não são expostos pelo DTO.

| Situação | Resposta |
|---|---|
| Outra confirmação já adquiriu o claim | `409 PAYMENT_PROCESSING` |
| Mesma chave após confirmação concluída | Recibo persistido, sem chamar o banco |
| Chave diferente após estado final | `409 INVALID_STATE` |
| Chave de confirmação colide no índice existente | `409 IDEMPOTENCY_CONFLICT`, antes do banco |
| Timeout, resposta inválida ou resultado não demonstrável | `503 PAYMENT_RECONCILIATION_REQUIRED` |
| Cancelamento durante confirmação ou reconciliação | Recusado; nunca liberta o claim |

O timeout de dispatch é de dois segundos. O adaptador recebe uma chave de
idempotência estável e um `AbortSignal`; fornecedores que suportem idempotência
devem encaminhar a chave para a sua API. O MockBankProvider não foi alterado e não
simula uma garantia de deduplicação externa que não possui. Nenhum fornecedor real
foi ativado. Abortar é uma tentativa de cancelamento local, não prova de que uma
cobrança não aconteceu.

### Recuperação e reconciliação

O prazo do claim **não é um lease renovável nem permite takeover para nova cobrança**.
Depois de adquirido, nunca é apagado ou reaberto automaticamente. Uma exceção ou
timeout guarda `bankAttempt.status=unknown`, preservando `state=pending` e o histórico,
e grava atomicamente o evento existente `payment.simulated.unknown.v1`. Nenhuma
aprovação ou recusa é inventada. Resultados tardios não substituem `unknown`.
Quando há recibo final já persistido, uma falha no respetivo acknowledgement pode
ser recuperada pela leitura desse recibo, sem repetir o banco.

Após interrupção de processo, `get`, `list`, `confirm` e `cancel` detetam passivamente
claims expirados. A transição para `unknown` é condicional ao mesmo claim e estado;
consultas concorrentes não duplicam o evento. Se a base estiver indisponível, o
claim durável continua a impedir dispatch por outra instância; a recuperação
persistente é feita numa operação posterior. Não existe retry de cobrança em fundo.

Os eventos `approved`, `declined`, `cancelled` e `unknown` reutilizam a outbox embutida,
versões e templates existentes. O lease de publicação da outbox pode ser recuperado
porque Notification deduplica eventos; esta regra não é aplicada à chamada bancária.
Agenda e os seus contratos/ledgers/transações não foram alterados.

Um processo morto imediatamente após o claim, mesmo antes do banco, fica bloqueado
de forma conservadora: não é possível inferir ausência de cobrança de um estado local.
A reconciliação financeira ainda exige um futuro contrato autorizado de consulta
do recibo no fornecedor pela `providerKey`, validação da referência, montante, moeda
e pagamento e atualização CAS auditada. Não há endpoint para limpar claims ou
repetir manualmente uma cobrança incerta. Fornecedor indisponível ou evidência
insuficiente mantém o bloqueio; não se deve criar outra tentativa para o contornar.

### Procedimento seguro para resultados incertos

Consultar o [runbook operacional completo](../operations/payment-reconciliation.md)
para contenção, registo mínimo do caso, permissões e requisitos da decisão futura.

1. Identificar o pagamento e o titular pela API autenticada. Consultar
   `GET /payments/:paymentId` e preservar a referência de correlação e o histórico.
   `confirmationStatus=reconciliation_required` não significa aprovação ou recusa.
2. Não repetir `confirm`, criar outro pagamento para substituir a cobrança incerta,
   cancelar para libertar o claim ou alterar diretamente MongoDB. A expiração do
   prazo também não autoriza nova cobrança. Uma resposta 503 de reconciliação deve
   ser apresentada ao titular como resultado pendente de confirmação.
3. Quando existir fornecedor e contrato de consulta autorizados, obter um recibo
   exclusivamente por operação de leitura, usando a `providerKey` guardada pelo
   backend. Nunca chamar novamente a operação de autorização para descobrir o estado.
4. Verificar a identidade do fornecedor e a correspondência de pagamento, referência,
   titular, montante e moeda. Uma resposta ausente, contraditória, provisória ou uma
   falha de comunicação mantém o bloqueio. Não inferir ausência de cobrança apenas
   porque uma consulta não encontrou imediatamente o recibo.
5. Uma decisão financeira exige uma operação própria autenticada e auditada, com
   motivo, correlação, controlo de versão/claim e atualização atómica do resultado,
   histórico e outbox. Revalidar autorização imediatamente antes da decisão. Essa
   operação não está implementada nem pode ser substituída por um patch manual na base.
6. Sem contrato de consulta ou autoridade para decidir, registar o caso no processo
   operacional autorizado e mantê-lo pendente; não executar correções financeiras.
   O MockBankProvider atual não tem consulta de recibos persistente. Nesta fase é
   possível validar contenção e comunicação do resultado incerto, mas não concluir
   reconciliação bancária operacional. Nunca reenviar uma cobrança para resolver o caso.

Este procedimento define contenção e requisitos da decisão futura; não cria uma
rota administrativa, permissões novas ou um mecanismo de desbloqueio. Não executar
reembolsos reais nem declarar reembolso concluído a partir de um resultado incerto.

### Implantação e testes

A implantação deve drenar todos os escritores antigos antes de executar a nova
versão: o código antigo não conhece o claim e não pode coexistir com escritores
corrigidos sobre os mesmos pagamentos. Não fazer rollback para o percurso antigo
sobre documentos com claims. Nenhuma implantação, migração ou reinício foi executado
nesta correção; a imagem da stack paralela permanece a versão anterior.

Na raiz, com dependências já instaladas e a stack paralela autorizada existente:

```powershell
npm.cmd --prefix backend run build --workspace=@goleve/payment-service
node --test backend/services/payment-service/tests/payment.test.cjs
node scripts/integration/payment-confirmation.cjs
```

O launcher recusa outra branch/base/identidade MongoDB e usa processos Node privados
no Payment paralelo existente. Carrega o modelo e serviço compilados atuais em
memória, com os módulos/dependências reais da imagem; não substitui ficheiros ou o
processo HTTP. Testes usam coleções fictícias novas na base isolada da instância.
Executa ainda a sonda E2E original sem alterar o ficheiro ou a sua asserção, verifica
notificação através do gateway e compara o inventário sem reinícios. Os artefactos
de resultado ficam em `.integration/`, ignorado pelo Git. Ver [resultados e limites
da correção](backend-e2e-v1-validation.md#correção-direcionada-da-concorrência-payment).

### Validação da imagem Docker corrigida

Em 2026-11-02 foi reconstruído e recriado, com autorização explícita e `--no-deps`,
apenas o Payment da stack paralela `goleve-integration-v1-ad8ea9a1719b5a21`.
O servidor HTTP dessa stack já executa a correção; as afirmações acima de que a
imagem permanecia anterior referem-se à primeira validação de componente.

Passaram dez verificações direcionadas: aprovação HTTP concorrente com chaves
distintas/iguais, replay, isolamento, resultado incerto consultado pela API, bloqueio
de novas confirmações/cancelamento, publicação/notificação e preservação dos dados.
A sonda original contou uma chamada ao banco, usando diretamente os módulos
instalados na imagem, sem preload. O timeout foi provocado pela sonda; o fornecedor
normal do servidor HTTP continua imediato, sem flags de falha. Ver o
[relatório atualizado](backend-e2e-v1-validation.md#validação-http-após-reconstrução-autorizada--concluída).

Os validadores E2E e MockBankProvider mantiveram-se inalterados. Não se executou
regressão global, nem se resolveu a integração financeira com reservas ou a
reconciliação operacional. Os requisitos de drenagem e proibição de escritores
antigos continuam válidos. A validação é local e não constitui prontidão para produção.

## Limitações históricas da Fase 5.8.1

Esta parte não integra Agenda, Notification ou RabbitMQ. A referência ao serviço/reserva é apenas uma referência opaca validada; preços reais e cobrança devem ser definidos numa fase posterior com contratos seguros. O MongoDB principal não deve ser usado para testes destrutivos nem são criados contentores automaticamente.
