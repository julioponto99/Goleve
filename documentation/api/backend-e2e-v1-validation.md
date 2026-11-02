# GoLeve V1 — Validação End-to-End, Fase 5.13

Estado consolidado: [encerramento técnico](backend-e2e-v1-closeout.md).
A última regressão global registou **80 aprovados, 0 falhados e 12 bloqueados**;
as secções seguintes preservam os resultados e incidentes históricos.

Data: 2026-11-02, UTC/Europe/Lisbon. Branch: `feat/backend-e2e-v1`.
Código dos serviços: `0bfd487225ba36d14210faadb0fbb542e052dbf3`.
Ambiente: stack paralela existente `goleve-integration-v1-ad8ea9a1719b5a21`,
gateway `http://127.0.0.1:64344`. Ver [instruções da stack](backend-integration-v1.md)
e [validação da Fase 5.12](backend-integration-v1-validation.md).

## Resultado e limites da evidência

**81 casos aprovados, 1 falhado e 10 bloqueados**, em 92 casos do roteiro.
Execução com recuperação: 01:38:58–01:40:21 UTC; a preservação do inventário
foi confirmada posteriormente por uma reverificação exclusivamente de leitura.
Os 12 testes administrativos do Auth passaram sem falhas e estão incluídos num
único caso do roteiro; não são somados novamente aos 81.

Há uma falha reproduzida de concorrência no Payment autónomo. Os fluxos positivos
de reservas elegíveis, pagamento associado a reservas e gestão administrativa
completa continuam bloqueados. Esta validação não demonstra prontidão para produção
nem substitui revisão de segurança ou cobertura global dos processos pendentes.

Os casos funcionais usam HTTP através do gateway real. Exceções identificadas:
contratos técnicos usam HTTP interno autenticado; evidências de persistência e ACL
usam o utilizador MongoDB do próprio serviço; MFA/governança usam o processo Auth
de teste e base isolada já existentes; a corrida do Payment usa o serviço compilado,
MongoDB real da stack paralela e um banco simulado instrumentado. Nenhuma destas
exceções deve ser apresentada como um fluxo administrativo completo pelo gateway.

## Cobertura por processo

| Processo | Casos aprovados / falhados / bloqueados | Evidência e cobertura restante |
|---|---|---|
| Infraestrutura e preservação final | 2 / 0 / 1 | 14 paralelos e 14 principais saudáveis; 40 contentores preservados desde o início da fase. Preservação integral do inventário histórico bloqueada pelas cinco remoções externas abaixo. |
| Gateway, autenticação obrigatória e segurança HTTP | 14 / 0 / 0 | Readiness dos 11 destinos, 11 acessos sem JWT recusados, CORS, precondições, bloqueio de rotas internas/traversal e cabeçalhos técnicos. |
| Auth | 5 / 0 / 0 | Registo de três contas fictícias, email normalizado duplicado, password/JWT inválidos, injeção de papéis recusada, sessões persistidas distintas e logout seletivo; token revogado recusado também pelo User. |
| User | 7 / 0 / 0 | Perfil com precondição, ETag concorrente com um vencedor, isolamento, preferências/hábitos, medição cifrada, idempotência, cursor vinculado ao titular, objetivo com baseline própria. |
| Training | 6 / 0 / 0 | Exercício e plano privados, sessão com registo/pausa/retoma, conclusão concorrente com um evento/notificação, corrida conclusão/cancelamento, arquivo e paginação. |
| Hydration | 4 / 0 / 0 | Objetivo e fuso, versão obsoleta recusada, ingestões idempotentes concorrentes, agregação diária, evento de objetivo atingido, edição isolada e lembretes persistidos. Disparo automático dos lembretes não validado. |
| Performance | 3 / 0 / 0 | Medições/evolução próprias, unidades, passos idempotentes e agregados, objetivo versionado, frequência cardíaca/histórico/resumo e limites inválidos. |
| Agenda pessoal | 3 / 0 / 0 | Criação futura, sobreposição informativa, filtros, isolamento, edição concorrente, cancelamento final, registo retroativo e datas inválidas. |
| Professional | 5 / 0 / 0 | Candidatura privada PT/Nutricionista, qualificações fictícias não verificadas, idempotência, declaração privada de horários, proposta de serviço não pública e submissão pendente sem promover o papel. Aprovação real não exercida. |
| Agenda profissional | 2 / 0 / 5 | Consulta interna de elegibilidade autenticada, replay/credencial inválida recusados; pedidos inelegíveis concorrentes não criam reservas. Fluxos positivos bloqueados. |
| Payment + Agenda | 3 / 0 / 1 | Guardas inalteradas verificadas nos três proprietários; fluxo financeiro associado a reserva bloqueado. |
| Payment autónomo MockBank | 3 / 1 / 0 | Preço backend, idempotência, isolamento, aprovação repetida, recusa/cancelamento simulados. Falha separada de chamada duplicada ao banco sob concorrência. |
| Notification | 3 / 0 / 0 | Reentrega deduplicada, leitura isolada, preferências locais, evento processado e suprimido, contrato inválido com retry/DLQ. Training e Hydration entregam notificações reais nesta stack; eventos profissionais positivos não exercidos. |
| Management e Administração | 8 / 0 / 3 | Seis acessos privilegiados recusados, auditoria de recusas/contrato interno, e um caso que executa os 12 testes Auth abaixo. Percurso positivo completo bloqueado. |
| Isolamento MongoDB | 10 / 0 / 0 | Credenciais dos dez serviços com persistência não conseguem ler outra base. Coach desativado não recebe ensaio funcional de dados. |
| Coach IA | 1 / 0 / 0 | Desativado; `/ai-coach/capabilities` devolve `503 AI_COACH_DISABLED`; nenhum fornecedor foi configurado ou invocado. |
| Resiliência | 2 / 0 / 0 | Stop/start separado de RabbitMQ e MongoDB, com recuperação de readiness, sessões, dados e entrega de eventos. |

Os 12 testes Auth existentes validam bootstrap concorrente fictício, formação do
quórum com TOTP real, cifragem MFA, sessões revogáveis, step-up vinculado e de uso
único, expiração aos cinco minutos, alteração de papel com aprovação independente,
suspensão/reativação, rejeição de JWT sem sessão, código de recuperação concorrente,
proteção do último Administrador ativo e auditoria sem fatores/credenciais.
Executaram apenas na base de testes Auth separada e marcada da stack; a base de
desenvolvimento permaneceu com **zero Administradores**. Não houve provisionamento real.

## Falha confirmada: chamada bancária antes do claim

Origem: [PaymentService.confirm](../../backend/services/payment-service/src/services/payment.service.ts),
que invoca `bank.authorize()` antes da alteração condicional `notificationTransition`.
Uma barreira no banco simulado permitiu que duas confirmações concorressem sobre um
pagamento fictício pendente, criado previamente por HTTP:

| Evidência | Resultado |
|---|---:|
| Chamadas ao banco instrumentado | 2 |
| Transições persistidas para `approved` | 1 |
| Promessas de confirmação resolvidas | 2 |
| Estado final | `approved` |

Reproduzido nas duas execuções do roteiro. A unicidade do histórico aprovado não
garante unicidade da chamada externa. É um teste de componente com MongoDB real e
banco instrumentado, não uma demonstração de duas cobranças bancárias reais ou de
duas chamadas HTTP concorrentes ao gateway. A integração Payment–Agenda tem outro
percurso e não foi validada positivamente nesta stack.

Correção necessária, não implementada nesta fase: claim atómico anterior ao banco,
idempotência comprovada no proprietário e tratamento explícito de timeout/resultado
incerto, sem repetir cobranças automaticamente. O roteiro mantém este caso falhado
e devolve código de saída 1 enquanto o defeito existir.

## Bloqueios e lacunas de contratos

1. **Elegibilidade profissional real indisponível.** A candidatura fictícia ficou
   pendente. O adaptador normal exige autoridade real e recusa provas sintéticas.
   Ficaram bloqueados: aceitação de reserva, reagendamento preservando original,
   cancelamento de reserva aceite, concorrência PT/Nutricionista do mesmo profissional
   e expiração com notificação profissional positiva. Não foram criadas aprovações.
2. **Payment–Agenda em Docker.** Integração de demonstração desativada; hostname
   MongoDB `mongodb` recusado pela guarda que exige loopback; bases atuais não usam
   o namespace obrigatório `goleve_payagenda_<instância>_<serviço>`; chaves entre pares
   de demonstração não configuradas; elegibilidade necessária ausente. Os guardas
   dos três serviços foram exercidos em processos privados de teste e continuaram
   a rejeitar produção. Não se alteraram validadores, flags dos servidores, namespaces
   ou segredos. Cotação, aprovação, reembolso e faturação do reagendamento não foram
   exercidos em conjunto. Exige decisão de segurança autorizada para um ambiente
   compatível; não se recomenda contornar a validação com resolução artificial de host.
3. **Gestor/Administrador pelo percurso normal.** Sem Administradores provisionados,
   Gestores ou âmbitos operacionais autorizados nesta base. Bloqueados: convite/aceitação
   de Gestor e âmbito canónico pelo gateway; aprovação independente, expiração,
   revogação e dashboard por âmbito; supervisão profissional privilegiada entre serviços.
   A suite Auth isolada não elimina este bloqueio. Requer preparação explicitamente
   autorizada de identidades e âmbitos fictícios num namespace E2E isolado, sem
   provisionamento real nem atribuições artificiais na base de desenvolvimento.
4. **Preferências separadas.** User guardou categoria hidratação desativada enquanto
   Notification manteve `hydrationReminders=true`. A preferência própria de Notification
   funciona, mas não existe convergência validada com a de User.
5. **Medições e unidades.** User usa g/mm e Performance kg/cm, com persistências próprias.
   Ambos validam o seu contrato; não foi validado contrato de sincronização ou uma
   decisão única sobre propriedade/conversão destes dados. Disparo agendado de lembretes
   de hidratação também permanece por verificar.

## Paragem e recuperação autorizadas

Antes de cada paragem: IDs e pertença ao projeto confirmados; os dois recursos
saudáveis; readiness global 200; sessão, perfil e versão de treino consultados.
Usaram-se exclusivamente `docker stop` e `docker start`, primeiro RabbitMQ e depois
MongoDB, com recuperação antes do teste seguinte. Nunca estiveram ambos parados.

| Recurso paralelo | ID do contentor | Stop | Readiness 503 após stop | Readiness 200 após início da recuperação | Total |
|---|---|---:|---:|---:|---:|
| RabbitMQ | `4b43099004e8b7346f9b2ceeebea759222c163dad83deba2c3e536ef01eb3ae5` | 1,655 s | 0,014 s | 16,827 s | 21,067 s |
| MongoDB | `da0848b7f0c9b96eab1eabb638495a9cbbb2180226e7fda1bd60a8e6fdc2f3af` | 1,347 s | 3,006 s | 8,119 s | 13,842 s |

Tempos observados nesta execução, incluindo sondagens; não constituem SLA.
`/health` do gateway continuou 200 durante a indisponibilidade e `/ready` passou a 503.
Com RabbitMQ parado, uma conclusão Training ficou na outbox: **1 evento pendente,
1 entrega após recuperação e 0 notificações duplicadas**. Com MongoDB recuperado,
a mesma sessão, perfil e versão de treino foram preservados e um novo evento chegou
à notificação. Os IDs dos contentores e a persistência mantiveram-se.

## Inventário e alterações externas

O inventário original da Fase 5.12 foi mantido. Cinco contentores alheios ao GoLeve
deixaram de existir antes destes testes; o utilizador confirmou explicitamente
remoção externa, sem intervenção do Codex:

| Nome histórico | Prefixo do ID histórico |
|---|---|
| `portainer` | `1ea465b85ab0` |
| `nodered_emqx` | `92a7cfc79013` |
| `emqx` | `560bad5601a4` |
| `mongo-express` | `fb8e8aa9e308` |
| `mongo-docker` | `7f0ca8d6c052` |

Não se afirma preservação integral dos 31 recursos do inventário histórico.
Os 26 sobreviventes históricos e os 14 paralelos constituem o inventário de 40
contentores verificado nesta fase. Imagens, mounts, IDs, pertença às redes, IPs e
configuração de rede foram comparados. Apenas nos dois recursos autorizados foram
aceites as renovações de `StartedAt`, `EndpointID` e MAC dinâmico próprias de stop/start;
os restantes contentores mantiveram também esses campos. Nenhum recurso adicional
foi criado, recriado ou removido. Os 14 principais e 14 paralelos terminaram saudáveis.

O comando histórico `integration.cjs status` continua a sinalizar os cinco recursos
ausentes: a divergência não foi ocultada nem o baseline original reescrito.
Uma futura reconciliação do inventário exige manter esta rastreabilidade.

## Incidentes do roteiro e reverificações

- A primeira tentativa detetou o inventário histórico divergente e interrompeu antes
  de qualquer paragem. Os testes disruptivos só retomaram após confirmação do utilizador.
- A primeira execução não disruptiva registou um erro de transporte Node `TypeError`
  na consulta do Coach após sondagens Docker síncronas. Três pedidos isolados seguintes
  devolveram 503 esperado. O cliente do roteiro passou a fechar ligações ociosas;
  a execução completa voltou a confirmar Coach desativado. Não se atribui uma causa
  backend comprovada a esse erro nem se introduziram retries automáticos de escritas.
- A comparação final inicial assinalou campos de endpoint/MAC dinâmicos renovados
  pelo stop/start como alterações inesperadas. O comparador foi corrigido apenas no
  roteiro, para os dois IDs autorizados. Reverificação sem paragens confirmou os 40
  contentores; o JSON anterior foi preservado e o caso assinala a reverificação.
  A falha real do Payment permaneceu falhada.

## Reprodução e artefactos

Na raiz, com a mesma stack e branch, sem iniciar recursos:

```powershell
node --check scripts/integration/e2e.cjs
node --check scripts/integration/e2e-probe.cjs
node scripts/integration/e2e.cjs
```

O último comando cria novas contas/dados fictícios pela API na stack paralela;
sem opções, não interrompe dependências e assinala os dois testes de resiliência
como bloqueados. Pode terminar com código 1 pelo defeito Payment conhecido.
Os dados fictícios permanecem na stack de desenvolvimento; não se apagaram volumes.
A suite Auth existente usa apenas as suas coleções da base de testes marcada.

Somente com autorização de paragem e confirmação do inventário externo:

```powershell
node scripts/integration/e2e.cjs --recovery --acknowledge-external-baseline
```

Para reverificar exclusivamente a preservação de uma execução já concluída:

```powershell
node scripts/integration/e2e.cjs --verify-preservation-only
```

As opções são instruções do operador, não substituem autorização. O relatório local
fica em `.integration/<instância>/e2e-validation.json`, com resultados, métodos,
tempos, bloqueios e evidência mínima, sem passwords ou Bearers. Inventário inicial,
execução não disruptiva e relatório anterior à reverificação ficam no mesmo diretório
ignorado. Não incluir `.integration/`, `.env` ou `.secrets/` num commit.
Credenciais da própria stack passam apenas aos processos privados necessários;
não se consultaram segredos principais. Não foram executados builds, instalações,
migrações, backups, alterações de serviços/validadores ou provisionamento real.

## Ficheiros desta fase e próximos passos

Criados: [roteiro E2E](../../scripts/integration/e2e.cjs),
[sondas privadas](../../scripts/integration/e2e-probe.cjs) e este relatório.
Nenhuma alteração ao código de negócio, Compose, dependências ou Coach IA.
Sem commit, push ou merge. Os dois scripts passaram a verificação de sintaxe Node;
ficheiros novos e diferenças Git foram verificados quanto a whitespace, ligações
documentais e presença de segredos da stack. Não foi necessário build TypeScript.

Prioridades para concluir a V1:

1. Corrigir e testar o claim anterior à chamada bancária no Payment autónomo.
2. Definir autoridade/política real de verificação profissional e validar os fluxos
   positivos, concorrência e eventos de reservas num ambiente E2E autorizado.
3. Resolver, por decisão explícita de segurança, o contrato de isolamento Docker da
   integração financeira, mantendo bloqueio em produção e os validadores atuais.
4. Preparar identidades/âmbitos exclusivamente de teste para o percurso completo de
   Administração e Gestor, incluindo falhas de dependências e revogação entre serviços.
5. Resolver propriedade/unidades das medições e origem das preferências, verificar
   o disparo de lembretes e concluir testes integrados/revisão de segurança antes
   de qualquer afirmação de prontidão para produção.

## Correção direcionada da concorrência Payment

Adenda de 2026-11-02, execução final 04:56:38–04:56:48 UTC/Europe/Lisbon.
O registo original acima permanece intacto: **81 aprovados, 1 falhado, 10 bloqueados**.
Não se reescreveu o resultado histórico nem se repetiu a suite global. Esta adenda
regista a correção do código e uma validação direcionada independente.

### Causa e correção

No percurso autónomo, `PaymentService.confirm` invocava o fornecedor antes de disputar
a transição CAS de `pending`. A idempotência de criação, a unicidade da aprovação
persistida e os leases da outbox não impediam duas chamadas externas.

A correção introduz um subdocumento opcional `bankAttempt`, adquirido atomicamente
antes do banco e durável com write concern `majority`. Só um titular do claim
despacha; as outras instâncias devolvem conflito ou o recibo final da mesma chave.
O deadline nunca permite retomar/repetir a cobrança. Falhas, timeout e processamento
interrompido ficam bloqueados para reconciliação, sem declarar aprovação ou recusa.
Uma chave estável por pagamento é encaminhada ao adaptador para fornecedores que
suportem idempotência. O banco simulado continua inalterado.

Não se alteraram estados públicos, endpoints ou contratos de eventos. Os campos
opcionais do DTO informam processamento/reconciliação; o histórico e o evento
`payment.simulated.unknown.v1` são gravados no mesmo documento. O cancelamento fica
impedido depois do claim. Consultas e pedidos posteriores recuperam passivamente
claims expirados, sem novo dispatch e sem eventos duplicados.

Detalhes, erros HTTP, compatibilidade e reconciliação estão no
[contrato atualizado do Payment](payment-service.md#correção-de-concorrência--fase-513).

### Testes executados

| Verificação | Resultado |
|---|---|
| Build TypeScript do workspace Payment | Aprovado |
| Testes existentes `payment.test.cjs` | 3 aprovados, 0 falhados |
| Novos testes `confirmation-concurrency.test.cjs` com MongoDB real isolado | 16 aprovados, 0 falhados, 0 omitidos |
| Reexecução da asserção original da sonda E2E | Uma chamada ao banco, asserção aprovada; hashes dos dois validadores preservados |
| Entrega do evento de resultado incerto pelo worker/Notification reais | Uma notificação, consultada pelo gateway |
| Inventário antes/depois | 40 contentores preservados, sem reinícios ou alteração da imagem Payment; 14 principais saudáveis |

Os 16 testes cobrem duas instâncias e conexões MongoDB independentes, confirmações
simultâneas com a mesma chave, replay após conclusão, chave estável do fornecedor,
falha antes de persistir o claim, acknowledgement perdido após persistir o claim,
timeout com resposta tardia, erro/resposta inválida do fornecedor, claim expirado
sem takeover, finalizador antigo impedido de aprovar, indisponibilidade simulada de
escrita, falha de persistência/acknowledgement do recibo, cancelamento antes/depois
do claim, titular incorreto, outbox cheia, fixture ausente e compatibilidade com
pagamentos anteriores. Dois desses testes terminam de facto processos Node filhos
após o claim e após o banco simulado guardar um recibo fictício; novas instâncias
recuperam sem chamar novamente o fornecedor. Nenhum contentor foi terminado.

A primeira versão da suite tinha 14 testes aprovados; a execução final acrescentou
dois cenários de recuperação, totalizando 16 distintos. Não se somam execuções repetidas.
O comando PowerShell `npm` foi recusado pela política de assinatura de `npm.ps1`;
o build passou com `npm.cmd`, sem alterar a política ou instalar dependências.

### Limite importante da sonda E2E original

Foi reutilizado `e2e-probe.cjs` sem alterações, sobre um novo pagamento fictício
criado pela API e com o serviço/modelo corrigidos carregados em memória num processo
privado. A asserção original `bankCalls === 1` passou:

| Campo da sonda | Antes | Depois |
|---|---:|---:|
| Chamadas ao banco | 2 | 1 |
| Aprovações persistidas | 1 | 0 |
| Confirmações resolvidas | 2 | 0 |
| Estado público | `approved` | `pending`, com reconciliação necessária |

A barreira artificial da sonda espera uma segunda chamada ou cinco segundos; como
essa segunda chamada agora não acontece e o timeout seguro é de dois segundos,
o resultado é legitimamente incerto. Não se aumentou o prazo para forçar aprovação,
não se alterou a barreira e não se mascarou o resultado. Os testes próprios com
barreiras libertadas explicitamente comprovam também o percurso positivo: uma
chamada, uma aprovação e um evento, com replay sem nova cobrança. O evento incerto
da sonda foi entregue uma vez pelo publicador/Notification existentes.

### Ambiente preservado e pendências

Apenas o Payment paralelo existente foi usado para novos processos de teste.
O launcher fornece o JavaScript compilado por stdin e carrega os dois módulos
alterados em memória; a imagem e o servidor HTTP em execução não foram substituídos.
A reexecução é de componente com MongoDB real, tal como o caso original, não uma
validação do novo código já implantado através de todo o gateway.

Não foram criados ou apagados recursos Docker, alterados os 14 principais,
modificados Agenda/Notification, executadas migrações ou ativados bancos reais.
Os dados são fictícios, em coleções de teste próprias e num novo pagamento da base
paralela; o resultado local fica em `payment-confirmation-validation.json` dentro
do diretório `.integration/<instância>/` ignorado. Os dois validadores E2E e o
JSON original da validação global permanecem inalterados.

Ficheiros desta correção:

- `backend/services/payment-service/src/models/payment.model.ts`
- `backend/services/payment-service/src/services/payment.service.ts`
- `backend/services/payment-service/src/services/bank-provider.ts`
- `backend/services/payment-service/tests/confirmation-concurrency.test.cjs`
- `scripts/integration/payment-confirmation.cjs`
- `documentation/api/payment-service.md`
- Este relatório, apenas com a presente adenda.

Permanecem os dez bloqueios originais. A implantação coordenada do Payment corrigido
e a repetição HTTP sobre a imagem atualizada não foram executadas; escritores
antigos devem ser drenados antes de qualquer implantação, pois ignoram o novo
claim. Reconciliação financeira operacional exige contrato de consulta do recibo
no fornecedor, autorização e auditoria; não há endpoint para libertar claims ou
repetir cobranças incertas. Não se pode inferir sucesso ou ausência de cobrança
de um timeout. A idempotência de um fornecedor real e o respetivo processo de
reconciliação não foram testados nem ativados. Sem commit, push ou merge.
Esta correção não constitui declaração de prontidão para produção.

## Preparação da validação HTTP na imagem Docker corrigida

Verificação de leitura em 2026-11-02, antes de qualquer reconstrução ou reinício:

- Projeto paralelo: `goleve-integration-v1-ad8ea9a1719b5a21`.
- Contentor Payment: `bf9a19a07226f27dbab3330fab19c09181d1f5e296cd86ddaf14d7ff931d29b4`.
- Imagem em execução: `sha256:ec6eae5b2a4b4825892adb832b82a1f7011b5afba5e6af9368a9d92bc1975e1a`.
- Hash do `dist/services/payment.service.js` nessa imagem:
  `c47079f5b333001c74755a38bef0082f0418278e2402f5f6699aa3e1d636f085`.
- Hash do compilado corrigido no workspace:
  `16e36c9edc618f591d92639ccc35ec846d38244736c0cdb7867ac30ddf7a0351`.
- O compilado em execução não contém `bankAttempt` nem
  `PAYMENT_RECONCILIATION_REQUIRED`: continua a versão anterior.
- 14 principais e 14 paralelos saudáveis. Os 14 principais coincidem com o inventário
  histórico em IDs, imagens, mounts, redes e instantes de arranque.

Plano sujeito a autorização explícita: revalidar recursos e inventário; construir
apenas a imagem Payment do projeto paralelo; drenar e recriar somente esse
contentor com `--no-deps` e sem executar `mongo-init`; aguardar health/readiness;
confirmar o código instalado; executar HTTP concorrente de aprovação/replay;
executar a sonda original sem preload; consultar por HTTP o resultado incerto,
recusar repetições e verificar a notificação única; comparar os restantes recursos.
Não haverá rollback automático para um escritor antigo que desconheça os claims.

A memória livre observada foi 1,17 GiB e o disco livre 12,79 GiB. Antes do build,
reverificar o limiar de memória de 1,2 GiB e os restantes recursos. Se forem
insuficientes, interromper antes de alterar contentores; não parar outros serviços
para obter recursos sem autorização.

O cenário de timeout usa a barreira existente da sonda, sem alterar MockBankProvider
ou validadores. A sonda mede chamadas no processo de componente com os módulos da
imagem; as leituras, rejeições de repetição e aprovação normal serão verificadas
por HTTP no gateway real. Não se apresentará a injeção do timeout na sonda como um
timeout originado pelo `POST` do servidor HTTP, cujo MockBankProvider responde
imediatamente. Não se introduzirá uma flag de falha no servidor para simular esse caso.

Foi acrescentado ao [contrato Payment](payment-service.md#procedimento-seguro-para-resultados-incertos)
o procedimento de contenção e reconciliação, distinguindo passos executáveis dos
contratos de consulta/decisão ainda ausentes. Até autorização e conclusão dos testes,
**a correção continua sem validação HTTP sobre a imagem Docker atualizada**.

## Tentativa autorizada de reconstrução — interrompida no preflight

Em 2026-11-02, o utilizador autorizou explicitamente construir, drenar e recriar
somente o Payment paralelo, com `--no-deps`, condicionando a execução à verificação
prévia de recursos e exigindo interrupção caso essa verificação falhasse.

A leitura preliminar confirmou o projeto/contentor autorizados, 1,2095 GiB de memória
livre, 12,787 GiB de disco e 7,711 GiB atribuídos ao Docker. Na verificação repetida
imediatamente antes de construir, a asserção de memória livre mínima de 1,2 GiB
falhou: `Insufficient free memory: no build started`. O comando terminou antes
da gravação do snapshot de implantação e antes da chamada a `docker compose build`.
O valor exato nessa asserção não foi registado; não se atribui a falha a disco,
identidade, Docker ou ao código do Payment.

Respeitando a condição de interrupção, não se repetiu o build nem se pararam outros
serviços para obter memória. Uma leitura final, exclusivamente de diagnóstico,
mostrou 1,2442 GiB livres, evidenciando oscilação; essa leitura não foi usada para
reiniciar automaticamente a operação interrompida.

| Verificação desta tentativa | Resultado |
|---|---|
| Identidade do projeto e do Payment paralelo | Aprovada |
| Memória imediatamente anterior ao build | Falhou o limiar de 1,2 GiB; operação interrompida |
| Build, drenagem e recriação | Não executados |
| Aprovação normal e confirmações concorrentes HTTP na nova imagem | Bloqueadas; imagem não construída |
| Sonda original e cenário incerto sobre a nova imagem | Não repetidos nesta tentativa |
| 14 componentes principais | Saudáveis e coincidentes com o inventário histórico |
| 14 componentes paralelos | Saudáveis |
| Gateway `/ready` | HTTP 200 |
| Contentor/imagem/arranque do Payment | Inalterados, ainda a versão anterior |
| Recursos Docker existentes | 40 contentores; nenhum criado, parado, recriado ou removido |

A verificação final ocorreu às 06:48:56 UTC/Europe/Lisbon. O Payment manteve o ID
`bf9a19a07226f27dbab3330fab19c09181d1f5e296cd86ddaf14d7ff931d29b4`,
a imagem `sha256:ec6eae5b2a4b4825892adb832b82a1f7011b5afba5e6af9368a9d92bc1975e1a`
e o arranque original `2026-11-02T01:02:08.406827379Z`.
Não foi criado `payment-http-baseline.json`. Os 19 testes anteriormente aprovados
não foram executados novamente nem reclassificados. O resultado histórico global
81/1/10 permanece intacto. Sem migrações, commit, push ou merge.

Para retomar, é necessária uma nova execução do preflight que passe no instante
anterior ao build, mantendo o âmbito já autorizado e preservando os restantes
recursos. Até concluir a reconstrução e os testes HTTP, a correção continua sem
validação Docker/HTTP na imagem atualizada e sem declaração de prontidão para produção.

## Validação HTTP após reconstrução autorizada — concluída

Execução de 2026-11-02, 07:32:13–07:32:45 UTC/Europe/Lisbon, na branch
`feat/backend-e2e-v1`. Esta secção sucede às tentativas e limitações históricas acima;
nenhum registo anterior foi apagado nem o resultado global 81/1/10 reescrito.

### Preflight, âmbito e reconstrução

O utilizador autorizou explicitamente construir e recriar apenas o Payment de
`goleve-integration-v1-ad8ea9a1719b5a21`. Antes do build, o Windows tinha cerca de
2,00 GiB livres, disco 12,73 GiB e o Docker/WSL cerca de 3,57 GiB disponíveis.
A pressão PSI de memória `some/full avg10` era 0,00. Não existiam claims ativos,
claims expirados em processamento ou pagamentos integrados em `processing`.
Antes da drenagem, a memória Windows era 1,81 GiB e WSL 3,52 GiB; os limites
preventivos continuavam cumpridos e a pressão permanecia 0,00.

Foi guardado um novo snapshot, sem substituir os inventários históricos, incluindo
os seis contentores antigos já parados na operação anterior autorizada.
Apenas os seguintes comandos Compose foram executados, sempre com o ficheiro,
projeto e variáveis da stack paralela:

```text
build payment-service
stop --timeout 45 payment-service
up -d --no-deps --no-build --force-recreate payment-service
```

O build compilou TypeScript; as instalações de dependências vieram da cache Docker.
A drenagem usou o encerramento do servidor/publisher existente. O contentor antigo
terminou com código 0, sem OOM ou kill forçado. Nenhuma dependência, inicializador
MongoDB ou outro serviço foi iniciado, reconstruído ou reiniciado.

| Identificador | Antes | Depois |
|---|---|---|
| Contentor Payment | `bf9a19a07226f27dbab3330fab19c09181d1f5e296cd86ddaf14d7ff931d29b4` | `5bd4f8aa74897d7dbfdd3a3083bc7d060742f6dc60ec5def371f87134316eaa8` |
| Imagem Payment | `sha256:ec6eae5b2a4b4825892adb832b82a1f7011b5afba5e6af9368a9d92bc1975e1a` | `sha256:6223c1526ac2703998c48cd499b4c55d61f65cf6b977265d175c2524684f6450` |
| Hash do serviço compilado | `c47079f5b333001c74755a38bef0082f0418278e2402f5f6699aa3e1d636f085` | `16e36c9edc618f591d92639ccc35ec846d38244736c0cdb7867ac30ddf7a0351` |

O hash instalado coincide exatamente com o compilado corrigido no workspace.
`bankAttempt` e `PAYMENT_RECONCILIATION_REQUIRED` estão presentes na nova imagem.
Os testes usaram os módulos instalados, sem preload, substituição de `require`
ou alteração do banco/servidor para injetar falhas.

### Resultados reais: 10 verificações aprovadas, 0 falhadas

| Verificação | Método e resultado |
|---|---|
| Código instalado, health, readiness, dados e sessão | Payment saudável; gateway `/ready` 200; sessão fictícia anterior ao restart válida; pagamento de controlo preservado. |
| Duas confirmações com chaves distintas | POSTs concorrentes pelo gateway: 200/409; um claim, uma transição `approved` e um evento. |
| Replay da chave vencedora | HTTP 200 com a mesma referência persistida; outra chave recusada com 409. |
| Duas confirmações com a mesma chave | POSTs concorrentes: 200/409; um claim e uma aprovação; replay posterior 200. |
| Sonda E2E original inalterada | Execução direta na nova imagem: **1 chamada bancária**, 0 aprovações, `pending`, sem preload. |
| Consulta do resultado incerto | GET pelo gateway: 200, `confirmationStatus=reconciliation_required`, sem referência ou aprovação inventada. |
| Replay, chave nova e cancelamento do incerto | HTTP 503 `PAYMENT_RECONCILIATION_REQUIRED`; claim/histórico/evento mantidos únicos. |
| Outra identidade | Consulta e confirmação recusadas com 404. |
| Publicação e Notification reais | Duas notificações de aprovação e uma de resultado incerto, uma por pagamento; três eventos publicados, zero duplicações observadas. |
| Preservação dos dados e validadores | Hashes financeiros anteriores iguais; dois validadores E2E e MockBankProvider com hashes inalterados. |

A contagem de invocações bancárias foi medida pela sonda instrumentada original,
executada como processo de componente dentro da imagem reconstruída. Os POSTs HTTP
normais não têm instrumentação de chamadas bancárias: neles verificaram-se o claim
persistente, o recibo, a aprovação única e os eventos. Não se confundem essas duas
formas de evidência.

O timeout é provocado exclusivamente pela barreira já existente na sonda: espera
uma segunda chamada ou cinco segundos, enquanto o serviço limita a chamada a dois
segundos. A sonda passa agora com uma chamada e resultado incerto. O servidor
HTTP real foi usado para consultar esse resultado e recusar novos dispatches.
O MockBankProvider normal responde imediatamente; **não foi injetado um timeout
num POST iniciado pelo servidor HTTP**, nem implementada uma flag para o provocar.
Os cenários de aprovação normal e resultado incerto foram separados.

### Dados, infraestrutura e estado final

Antes da drenagem foram registados hashes dos campos financeiros de 12 pagamentos,
incluindo um pagamento fictício de controlo, e da coleção integrada vazia. Os mesmos
documentos mantiveram os hashes após recriação e após os testes. A comparação inclui
estado, referências, claims e histórico; exclui apenas metadados assíncronos da outbox,
versão de notificação e `updatedAt`. Os novos pagamentos são fixtures separadas.
Não se acedeu diretamente a bases de outros microserviços nem à base principal.

- **14 componentes principais saudáveis e inalterados.** Gateway `/health` 200;
  `/ready` 404, limitação já observada antes da operação.
- **14 componentes paralelos saudáveis.** Gateway `/health` e `/ready` 200,
  incluindo o Payment como dependência pronta.
- Os **39 restantes contentores** mantiveram IDs, imagens, mounts, redes, estados
  e instantes de arranque. O inventário continua com 40 contentores no total.
- Volumes e redes mantiveram nomes/IDs; mounts do Payment foram preservados.
  MongoDB, RabbitMQ, credenciais e serviços com tmpfs não foram alterados.
- Os seis contentores antigos previamente parados permaneceram parados.
- No final: zero claims ativos/expirados em processamento e zero pagamentos
  integrados em `processing`. Os resultados incertos continuam bloqueados.

Artefactos privados: `.integration/<instância>/payment-http-baseline.json` e
`payment-http-validation.json`. Contêm inventário, hashes e resultados mínimos;
não guardam passwords, JWT ou conteúdo de conversas. Os ficheiros são ignorados
pelo Git. Roteiro acrescentado: [payment-http.cjs](../../scripts/integration/payment-http.cjs).
Esse roteiro exige `--deploy` e um baseline autorizado; recusa sobrescrever a
validação existente. Não o executar novamente sem preparar e rever uma nova operação.

### Limites e conclusão desta adenda

A correção foi validada por HTTP na imagem Docker corrigida **no âmbito descrito**,
com a contagem de chamadas confirmada separadamente pela sonda original. Não foi
executada novamente a suite global; os 19 testes anteriores não foram somados a
estas dez verificações como se constituíssem nova regressão global.
Os dez bloqueios históricos dos restantes processos continuam por resolver.

A reconciliação financeira operacional e a idempotência de um fornecedor real
continuam dependentes de contratos, autorização e validação próprios. Mantém-se o
[procedimento seguro](payment-service.md#procedimento-seguro-para-resultados-incertos):
sem repetir cobranças incertas, sem libertar claims manualmente e sem inventar recibos.
Não houve migração, provisionamento administrativo, commit, push ou merge.
Esta validação local não demonstra prontidão para produção.

### Verificação complementar após os testes

Às 07:38:17 UTC, uma consulta adicional ao ID da imagem anterior do Payment
falhou com `No such image: sha256:ec6eae5b2a4b4825892adb832b82a1f7011b5afba5e6af9368a9d92bc1975e1a`.
Esse ID também não apareceu em `docker image ls --all --no-trunc`. A nova tag e
digest apontam para `sha256:6223c1526ac2703998c48cd499b4c55d61f65cf6b977265d175c2524684f6450`.

O inventário prévio guardou a referência da imagem no contentor antigo, mas não
verificou a disponibilidade dessa imagem por `image inspect` antes da operação;
portanto não permite datar a indisponibilidade nem concluir a sua causa. Não foram
executados `image rm`, `prune` ou comandos de limpeza. Não se atribui o resultado
a uma intervenção externa ou a garbage collection sem evidência adicional.

Respeitando a condição do utilizador, não se realizaram novos testes funcionais,
builds ou alterações de infraestrutura após esta falha complementar. As consultas
de diagnóstico confirmaram os 39 outros contentores preservados, 14 principais e
14 paralelos saudáveis e readiness paralelo 200. A memória era 1,93 GiB livre no
Windows e 3,65 GiB disponível no Linux; PSI `some/full avg10=0,00` e zero OOM no
novo Payment. A disponibilidade dos volumes/dados não foi afetada.

As dez verificações funcionais continuam aprovadas, mas esta verificação extra de
disponibilidade do artefacto anterior falhou e deve ser considerada separadamente.
Não há imagem anterior confirmada disponível para recuperação local pelo ID; não
se tentou restaurá-la. Independentemente disso, voltar a executar o escritor
antigo sobre claims novos seria inseguro e não constitui procedimento de recuperação.

## Encerramento técnico e segunda regressão global

Em 2026-11-02, às 08:50:49–08:51:41 UTC/Europe/Lisbon, foi repetido o roteiro
original com `node scripts/integration/e2e.cjs`, sem `--recovery`, sem modificar
validadores e sem alterações de código de negócio ou infraestrutura.
Resultado: **80 aprovados, zero falhas, 12 bloqueados**. A corrida Payment passou
com uma chamada ao banco; os dez bloqueios históricos continuam classificados
individualmente no [relatório consolidado](backend-e2e-v1-closeout.md).
Os dois bloqueios adicionais são os ensaios disruptivos MongoDB/RabbitMQ, que
não foram autorizados ou repetidos nesta etapa. Os 12 testes internos do Auth
passaram e continuam incluídos num só caso do roteiro.

Antes da execução, o estado original e seis artefactos históricos foram arquivados
com hashes em `.integration/<instância>/closeout-history-1793609436786/`.
O baseline operacional foi reconciliado exclusivamente com os estados/endpoints
das seis paragens antigas autorizadas, após validar IDs, imagens, mounts, redes,
datas e o registo da operação. O original está no arquivo; as cinco ausências
externas mantêm-se e a preservação histórica integral continua bloqueada.
Nenhuma comparação ou asserção dos validadores foi alterada para obter aprovação.

O resultado final foi também copiado para
`e2e-validation-closeout-2026-11-02T08-51-41-176Z.json`, no diretório ignorado da
instância. O arquivo anterior preserva 81/1/10 e as falhas intermédias; não se
somam as duas execuções nem se reclassifica retroativamente o passado.

Foi formalizado o [procedimento operacional de reconciliação](../operations/payment-reconciliation.md),
com contenção, evidência mínima, permissões, consulta futura e decisão ainda
pendente. O MockBankProvider não tem recibo persistente consultável; não existe
endpoint de decisão ou desbloqueio manual de claims.

A investigação não destrutiva da imagem anterior tentou as duas referências
registadas e consultou eventos Docker: ambas as referências antigas continuam
indisponíveis e a consulta não devolveu eventos históricos de imagens. A causa e
o instante não puderam ser determinados. Não foi feita qualquer recuperação ou
alteração de imagem. Este facto é separado dos testes funcionais aprovados.

No final, os **40 contentores** mantiveram IDs, imagens, mounts, redes, estados e
datas desta nova execução. Permanecem saudáveis os 14 principais e os 14 paralelos.
Gateway principal: `/health` 200 e `/ready` 404 pré-existente. Gateway paralelo:
`/health` e `/ready` 200. Nenhum contentor foi criado, parado, reiniciado ou reconstruído.

Foram observados avisos de depreciação Mongoose sobre `new` na suite administrativa
existente, sem falhas. O log de desconexão Auth pertence ao encerramento do processo
de testes isolado, não a uma paragem do Auth de desenvolvimento. Não foram efetuadas
correções de negócio nesta etapa. Sem migrações, commit, push ou merge.
Os bloqueios e requisitos de produção continuam explícitos no relatório consolidado.
