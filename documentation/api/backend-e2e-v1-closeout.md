# Encerramento técnico da Fase 5.13

Data: 2026-11-02. Branch: `feat/backend-e2e-v1`.
Stack: `goleve-integration-v1-ad8ea9a1719b5a21`, gateway `127.0.0.1:64344`.
Ver [histórico integral](backend-e2e-v1-validation.md) e
[procedimento de reconciliação](../operations/payment-reconciliation.md).

## Resultado consolidado

A regressão global original foi repetida às **08:50:49–08:51:41 UTC/Europe/Lisbon**:
**80 casos aprovados, zero falhas, 12 bloqueados**, em 92 casos. Código de saída 0.
O comando foi `node scripts/integration/e2e.cjs`, sem `--recovery` e sem alterar
os validadores. Os dez bloqueios anteriores mantêm-se; os outros dois correspondem
às paragens/recuperações de MongoDB e RabbitMQ não autorizadas nesta etapa.

Os 12 testes reais de segurança/governança do Auth passaram numa base de testes
separada e estão incluídos num único caso; não são somados novamente aos 80.
Não houve provisionamento administrativo na base de desenvolvimento, builds,
reinícios, criação de infraestrutura, migrações, commit, push ou merge nesta etapa.

| Evidência histórica | Resultado | Interpretação |
|---|---|---|
| Primeiro E2E não disruptivo | 78 aprovados / 2 falhados / 12 bloqueados | Corrida bancária e erro de transporte transitório no cliente do teste Coach |
| E2E com recuperação antes da reverificação de inventário | 80 / 2 / 10 | Corrida bancária e comparação de campos dinâmicos Docker |
| Resultado histórico após reverificação de leitura | 81 / 1 / 10 | Falha real de duas chamadas ao banco; histórico preservado |
| Correção Payment, testes direcionados | 16 novos + 3 existentes aprovados | Persistência, concorrência, falhas e recuperação de processos |
| Imagem corrigida e testes HTTP | 10 verificações aprovadas / 0 falhadas | Aprovação, replay, resultado incerto, isolamento, eventos e dados |
| Regresso global de encerramento | **80 / 0 / 12** | Concorrência Payment corrigida; resiliência disruptiva não repetida |

Estas contagens têm âmbitos diferentes. Não somar repetições nem apresentar os
casos bloqueados como aprovados. O resultado 81/1/10 não foi convertido retroativamente.
Há ainda uma verificação operacional complementar da imagem anterior não resolvida,
descrita abaixo; não é um caso funcional falhado desta regressão.

## Funcionalidades validadas e limites

| Processo | Resultado desta execução |
|---|---|
| Gateway e autenticação | Readiness dos 11 destinos; acesso sem JWT, CORS e rotas técnicas protegidos |
| Auth | Registo, email duplicado, papéis públicos restritos, sessões persistidas e revogação seletiva; suite MFA/step-up/quórum isolada aprovada |
| User | Perfil, ETag concorrente, preferências/hábitos, medição cifrada, histórico e objetivos próprios |
| Training | Exercícios/planos privados, sessão, concorrência de estados, evento único, arquivo e paginação |
| Hydration | Objetivo, versão, ingestão idempotente, totais, evento e persistência de lembretes |
| Performance | Medições, evolução, passos, objetivos e frequência cardíaca com isolamento |
| Agenda pessoal | Criação, filtros/sobreposição, edição concorrente, cancelamento e registo retroativo |
| Professional | Candidatura privada PT/Nutricionista, qualificações não verificadas, proposta de serviço e submissão sem privilégios |
| Agenda profissional | Contrato autenticado de elegibilidade e recusa segura de profissionais inelegíveis, incluindo concorrência negativa |
| Payment autónomo | Preços backend, aprovação/recusa/cancelamento simulados, idempotência e claim antes da chamada bancária |
| Notification/RabbitMQ | Eventos Training/Hydration/Payment exercitados, reentrega deduplicada, preferências e retry/DLQ |
| Management/Administração | Acessos indevidos recusados e auditados; MFA/governança Auth isolados, sem percurso privilegiado completo na stack normal |
| Isolamento | Dez identidades MongoDB sem acesso a outra base; dados fictícios por titular |
| Coach IA | Continua desativado; indisponibilidade explícita, sem fornecedor invocado |

A sonda original voltou a medir **1 chamada bancária, 0 aprovações, `pending`**.
A barreira da sonda excede o timeout do serviço, pelo que o resultado permanece
incerto. Isso não contradiz a aprovação HTTP normal validada anteriormente.
A contagem de chamadas é observada na sonda; os POSTs HTTP normais verificam claim,
recibo, estado e eventos, sem instrumentação do banco em execução no servidor.

## Classificação individual dos dez bloqueios históricos

Os identificadores abaixo são documentais e correspondem aos dez casos originais;
não criam permissões ou regras novas.

| ID | Caso bloqueado | Classificação | Como desbloquear com segurança |
|---|---|---|---|
| B01 | Preservação integral do inventário histórico da Fase 5.12 | Evidência histórica irrecuperável no estado atual; não é falha funcional | Aceitar formalmente a divergência das cinco remoções externas confirmadas e usar um novo baseline operacional auditado. Não recriar recursos apenas para simular preservação nem marcar o passado como preservado. |
| B02 | Aceitar uma reserva de profissional elegível | Autoridade de verificação/elegibilidade ausente | Definir fonte/política real e processo autorizado de elegibilidade. Um ensaio com dependência simulada exige namespace isolado aprovado e não substitui o teste positivo do adaptador normal, que continua a exigir `authority=real`. |
| B03 | Reagendar preservando a reserva original | Pré-condição funcional de B02 | Obter uma reserva aceite legitimamente e janelas válidas; testar aceitação manual, preservação da original, prazos, rollback e recusa/expiração. Não escrever reservas artificiais na base normal. |
| B04 | Cancelar reserva profissional aceite | Pré-condição funcional de B02 | Criar/aceitar pelo percurso autorizado e validar cancelamento dentro das políticas existentes, histórico/outbox e sinalização financeira quando aplicável. Não executar reembolso real. |
| B05 | Reservas concorrentes PT/Nutricionista do mesmo profissional | Duas capacidades elegíveis ausentes | Disponibilizar capacidades autorizadas e serviços ativos; executar concorrência real no calendário comum/transações do replica set, incluindo buffers. Não afrouxar elegibilidade para obter dados de teste. |
| B06 | Expiração e notificação positiva de reserva | Pedido elegível de origem ausente | Criar pedido válido e observar a expiração pelo mecanismo real. Acelerar o relógio apenas num processo de teste isolado aprovado, sem alterar o relógio do sistema ou falsificar estados na base. Verificar outbox e destinatário. |
| B07 | Reserva aceite → cotação → pagamento, reembolso e faturação do reagendamento | Incompatibilidade de configuração/isolamento e elegibilidade | Preparar, com autorização, ambiente que satisfaça as guardas: MongoDB loopback, namespaces `goleve_payagenda_<instância>_<serviço>`, chaves próprias por par e elegibilidade autorizada do ambiente. Não mudar os validadores nem contornar as guardas Docker atuais. Testar cotação, titularidade, ledger e falhas entre proprietários. |
| B08 | Convite de Gestor e atribuição canónica pelo gateway | Identidades privilegiadas/âmbitos de teste não provisionados | Autorizar um namespace E2E separado com dois Administradores fictícios, MFA e provisionamento pelo mecanismo legítimo, convidar Gestor e usar IDs de serviços validados pelo Professional. Não criar Administradores na base normal. |
| B09 | Aprovação independente, revogação, expiração e dashboard por âmbito | Pré-condição de B08 e dados operacionais suficientes | Usar dois decisores distintos, step-up/épocas atuais, âmbitos aprovados e dados fictícios autorizados. Exercitar revogação imediata, expiração e supressão de indicadores; um teste Auth isolado não valida o percurso completo Management–proprietários. |
| B10 | Aprovação/suspensão profissional administrativa entre serviços | Autorização ausente e aprovação real sem fonte/política | Consulta/suspensão exigem identidades autorizadas, MFA/step-up e auditoria no percurso normal. Aprovação real exige ainda autoridade/política de verificação; não a substituir por elegibilidade sintética, nem reativar serviços sem confirmação. |

Além destes dez, **MongoDB stop/start e RabbitMQ stop/start** ficaram bloqueados
por falta de autorização nesta etapa. Os resultados positivos de resiliência
anteriores continuam como evidência histórica, não como testes repetidos agora.
Uma nova execução disruptiva exige autorização específica e verificação de IDs/dados.

## Reconciliação de pagamentos: operativo e pendente

O [procedimento operacional](../operations/payment-reconciliation.md) distingue
contenção, recolha mínima de evidência, consulta futura do fornecedor e decisão
financeira. Agora é possível detetar/informar o resultado incerto e impedir replay.
Não existe consulta persistente de recibos no MockBankProvider nem endpoint
autorizado de decisão; os casos incertos permanecem bloqueados. Não limpar claims,
repetir cobranças, assumir recusa ou aplicar correções diretamente em MongoDB.

## Imagem antiga: diagnóstico não destrutivo

Continuam indisponíveis por `docker image inspect` tanto a referência antiga do
contentor (`ec6eae5b2a4b…`) como a label antiga Compose (`3a5db725ad3f…`).
A nova imagem `6223c1526ac2…` está disponível e em execução. A label Compose e o
campo `Image` não eram iguais; a mesma divergência de referências ocorre no MongoDB
principal inalterado, cuja imagem em execução continua disponível. Uma label antiga
não prova, por si só, que o respetivo artefacto esteja atualmente acessível.

A consulta de eventos de imagens entre 07:20 UTC e 08:51:38 UTC devolveu zero
eventos históricos. Não há evidência suficiente para explicar quando ou por que
o artefacto anterior deixou de ser resolvido. Não concluir corrupção, remoção pelo
Codex, intervenção externa ou garbage collection sem prova. Não se executaram
pull, restore, tag, prune, build ou reinício nesta investigação.

O facto comprovado é a indisponibilidade de recuperação local por essas referências.
Não é uma falha atual do serviço ou dos dados. A recuperação futura requer artefactos
versionados e retidos; não voltar ao escritor antigo que ignore os claims.

## Inventário, baseline e rastreabilidade

Estado final: **14 componentes principais e 14 paralelos saudáveis**. O gateway
principal responde `/health` 200 e `/ready` 404, limitação pré-existente; o paralelo
responde 200 em ambos. Os 40 contentores mantiveram IDs, imagens, mounts, redes,
estados e datas de arranque durante a regressão. Payment paralelo permanece no
contentor `5bd4f8aa7489…`, imagem corrigida `6223c1526ac2…`. Os seis contentores
antigos anteriormente parados mantiveram-se parados; serviços tmpfs não foram tocados.

O arranque do roteiro original exigiu reconciliação dos metadados de seis paragens
antigas já autorizadas: os endpoints Docker tinham sido libertados. Antes de o
fazer, foram validados os IDs da lista fechada, mounts, imagens, instantes de arranque,
estado `exited`, rede/NetworkID e o registo das paragens. Apenas `state`, `health` e
os metadados de endpoint no baseline operacional foram atualizados; nenhum container,
controlo do validador ou ausência histórica foi alterado.

O `.integration/active.json` anterior e seis artefactos de validação foram copiados
para `.integration/<instância>/closeout-history-1793609436786/`, com hashes num manifest.
O original 81/1/10, os relatórios de falhas anteriores e o snapshot anterior ao
Payment novo permanecem nesse arquivo. As cinco ausências externas continuam no
baseline e em B01. A reconciliação não converteu esse caso em aprovação.

Os validadores permaneceram exatamente com estes SHA-256:

```text
e2e.cjs       bea75cca59fb160aa5127e209b74ea6a508b1c36fdade00803a7c3e45fd63c50
e2e-probe.cjs f10820d4734688304ec75ea5db7f830ec0705321afa64a579a8bdaf4296dc3d9
```

O último resultado está em `.integration/<instância>/e2e-validation.json`.
Os artefactos locais são ignorados pelo Git. As sessões/passwords fictícias usadas
pelo roteiro ficam apenas em memória; relatórios persistem contagens/metadados mínimos.
O subteste Auth reinicializa apenas coleções fictícias na sua base separada e marcada,
sem provisionar a base de desenvolvimento ou alterar contas existentes normais.

A execução final também foi preservada como
`e2e-validation-closeout-2026-11-02T08-51-41-176Z.json`. Os avisos de depreciação
Mongoose da suite administrativa existente não originaram falhas; nenhuma alteração
de código de negócio foi feita neste encerramento para os suprimir.

## Requisitos ainda pendentes para produção

- Resolver B02–B10 com contratos, autoridades e ambientes de teste aprovados;
  concluir o percurso integrado real de Gestor/Administração e operações profissionais.
- Implementar e rever o contrato de reconciliação e a idempotência do fornecedor
  real, retenção/auditoria e controlos financeiros; pagamentos continuam simulados.
- Decidir propriedade/convergência de medições User (g/mm) e Performance (kg/cm)
  e preferências User versus Notification; validar disparo automático dos lembretes.
- Validar recuperação, backup/restore e retenção de artefactos de implantação;
  tratar o readiness ausente no gateway principal numa tarefa autorizada.
- Concluir revisão de segurança, privacidade/dados reais, segredos/rotação,
  observabilidade e testes globais dos percursos ainda bloqueados. Coach continua
  desativado; não ativar integrações sintéticas ou consentimentos IA em produção.

O encerramento técnico documenta a evidência disponível e as lacunas.
**Não constitui aprovação de disponibilização em produção.**

## Revisão dos ficheiros e segredos

Foram revistos os 13 ficheiros pendentes, incluindo não versionados. Nenhum ficheiro
inesperado foi identificado. `git diff --check`, `git diff --cached --check` e a
verificação explícita de whitespace dos ficheiros novos passaram; 45 ligações locais
dos documentos alterados tinham destino existente. Não foram detetadas chaves
privadas, JWT literais ou correspondências com segredos próprios da stack nos
candidatos. Os exemplos e fixtures no código são fictícios.

`.env`, `.secrets/` e `.integration/` continuam ignorados e não versionados.
Não foram lidas as credenciais principais ou incluídos dumps, backups, dados de
conversas, segredos ou artefactos locais nos candidatos. O índice não foi preparado
e não houve commit/push/merge. Os avisos Git de normalização LF/CRLF não são erros
de whitespace; os ficheiros não foram reformatados por esse motivo.

Nesta etapa foram criados/atualizados apenas estes documentos:

- `documentation/api/backend-e2e-v1-closeout.md`
- `documentation/api/backend-e2e-v1-validation.md`
- `documentation/api/payment-service.md`
- `documentation/operations/payment-reconciliation.md`
- `documentation/backend-completion-plan.md`

Também foram escritos metadados/arquivos de evidência em `.integration/`, ignorado.
As alterações pendentes de código/testes/roteiros pertencem às etapas anteriores
e foram preservadas, sem novas modificações de código neste encerramento:

- `backend/services/payment-service/src/models/payment.model.ts`
- `backend/services/payment-service/src/services/payment.service.ts`
- `backend/services/payment-service/src/services/bank-provider.ts`
- `backend/services/payment-service/tests/confirmation-concurrency.test.cjs`
- `scripts/integration/e2e.cjs`
- `scripts/integration/e2e-probe.cjs`
- `scripts/integration/payment-confirmation.cjs`
- `scripts/integration/payment-http.cjs`
