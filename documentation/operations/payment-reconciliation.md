# Pagamentos incertos — procedimento operacional

Âmbito: Payment autónomo do GoLeve, exclusivamente simulado e local nesta versão.
Relaciona-se com o [contrato Payment](../api/payment-service.md) e o
[encerramento da Fase 5.13](../api/backend-e2e-v1-closeout.md).
Este procedimento permite conter e acompanhar resultados incertos; a decisão
financeira final depende de contratos e autorização ainda não implementados.

## Reconhecer e conter

1. O titular consulta `GET /payments/:paymentId` com a sua sessão autenticada.
   `state=pending` com `confirmationStatus=reconciliation_required` e
   `reconciliationRequired=true` significa resultado desconhecido, não recusa.
   `POST /payments/:paymentId/confirm` e `cancel` recusam esse caso com
   `503 PAYMENT_RECONCILIATION_REQUIRED`.
2. Suspender tentativas automáticas ou manuais para o mesmo caso. Não mudar a
   chave de idempotência, criar outro pagamento substituto, cancelar para libertar
   o claim ou considerar a sua expiração uma autorização para cobrar novamente.
3. Informar o titular: «O resultado do pagamento simulado está por confirmar.
   Não será efetuada uma nova tentativa automática.» Não apresentar sucesso,
   falha definitiva ou reembolso concluído sem evidência autorizada.
4. Registar um caso no processo operacional autorizado, com dados mínimos:
   identificador do caso, `paymentId`, âmbito/ambiente, instante UTC, estado,
   código de erro, `requestId` quando disponível e responsável pelo acompanhamento.
   Usar o motivo factual `resultado_incerto`; não atribuir uma causa específica
   sem evidência. Guardar apenas referências para evidências protegidas.

Não guardar passwords, JWT, fatores MFA, cabeçalhos completos, segredos, dados de
cartão/conta bancária ou dumps. O prazo de retenção e os acessos a estes casos
precisam de política aprovada; não é definido um prazo arbitrário neste documento.

O papel Gestor ou Administrador não concede implicitamente acesso a pagamentos
alheios nem poder para decidir reconciliações. A equipa operacional não deve
impersonar o titular ou pedir o seu JWT. Não existe nesta versão uma API de
reconciliação privilegiada nem um contrato que permita escrever essa decisão.

## Recolher evidência sem cobrar

O backend conserva `bankAttempt`, incluindo a `providerKey` estável por pagamento,
o claim, o prazo e o histórico. Essas chaves internas não são devolvidas no DTO.
Não obter acesso direto à base de dados como substituto de uma API autorizada.

Quando existir o contrato de leitura e a autorização correspondentes, um adaptador
do Payment poderá consultar o recibo do fornecedor pela chave interna. Essa
consulta deve ser autenticada por destino, limitada ao pagamento/caso e incapaz
de iniciar cobrança. O contrato deve distinguir resultado definitivo de resposta
provisória e proteger a integridade das evidências.

Verificar a correspondência de fornecedor/ambiente, operação, `paymentId`, chave de
idempotência, referência de transação, titular quando previsto no contrato,
montante e moeda. Não aceitar preço ou destinatário enviados pelo frontend como
prova. Timeout local, ausência momentânea de recibo, logs isolados ou um claim
expirado não demonstram ausência de cobrança.

| Evidência obtida | Acompanhamento permitido agora | Resolução futura necessária |
|---|---|---|
| Sem consulta disponível, erro ou resposta contraditória | Manter o bloqueio; acompanhar o caso e informar o titular | Contrato de consulta e investigação autorizada |
| Recibo final e autenticado de aprovação | Preservar evidência; não voltar a cobrar | Decisão autorizada e atualização CAS para aprovação |
| Recibo final e autenticado de recusa | Preservar evidência; não inventar nova tentativa | Decisão autorizada e atualização CAS para recusa |
| «Não encontrado» sem garantia contratual de finalização | Manter resultado incerto | Prova definitiva ou política aprovada de finalização |

O MockBankProvider atual não persiste recibos consultáveis e não implementa uma
API de consulta. Portanto, os casos incertos da demonstração **permanecem bloqueados**.
Não usar uma nova chamada a `authorize` como forma de descobrir o resultado anterior.

## Decidir e fechar — capacidade ainda pendente

Antes de implementar este passo, aprovar o contrato e a política de segurança.
Uma futura operação de reconciliação deverá:

- Revalidar a identidade, sessão, autorização específica, âmbito e eventual
  reforço exigido pela política aprovada. Não inferir autorização de um papel global.
- Exigir caso, evidência verificável, motivo e correlação; validar novamente a
  correspondência dos valores financeiros no proprietário Payment.
- Disputar atomicamente o mesmo pagamento, claim e versão, sem libertar o direito
  de dispatch. Repetir a decisão deve devolver o resultado persistido, sem cobrar.
- Gravar decisão, histórico, auditoria e outbox de forma consistente no proprietário,
  preservando os eventos anteriores. Notification mantém deduplicação por evento.
- Respeitar os contratos de Agenda quando aplicáveis; não alterar a base de Agenda,
  reabrir reservas, reembolsar ou corrigir outro ledger diretamente.

Nenhum destes requisitos autoriza um patch manual em MongoDB, uma migração,
um endpoint administrativo novo ou uma exceção de autenticação. Não há comandos
de escrita financeira seguros disponíveis para o operador nesta versão.

## Reinício, recuperação e acompanhamento

Um reinício não apaga o claim. Consultas posteriores processam passivamente o seu
prazo e mantêm a confirmação incerta bloqueada. Não recuperar a cobrança por
takeover de lease; o lease recuperável da outbox serve apenas para publicar eventos.
Não voltar ao escritor antigo que desconheça `bankAttempt`. Drenar escritores
anteriores é requisito de qualquer implantação futura.

Antes de encerrar um caso, exigir decisão persistida por mecanismo autorizado,
auditoria, evidência e notificação coerentes. Enquanto esse mecanismo não existir,
o caso fica pendente; pode registar-se o diagnóstico, mas não declarar reconciliação
financeira concluída. Não simular aprovações para melhorar o relatório de testes.

## Evidência já validada

Foram testados claim persistente, timeout, resposta tardia, perda de acknowledgement,
falha de persistência, processos interrompidos e contenção após reinício. Na imagem
Docker corrigida passaram HTTP concorrente, replay, isolamento, consulta/bloqueio
do resultado incerto e publicação de uma única notificação.
O timeout foi provocado na sonda de componente, não num POST ao banco iniciado
pelo servidor HTTP. A consulta externa de recibos e a decisão operacional não foram
implementadas ou validadas, e não existe prontidão para pagamentos reais.
