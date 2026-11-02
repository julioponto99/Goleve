# Fase 6.1 — Matriz Figma ↔ backend

> As decisões funcionais desta análise foram aprovadas para as fundações:
> medições/histórico exclusivamente em Performance, perfil/preferências em User,
> agenda pessoal independente, formulários conformes aos contratos e funcionalidades
> sem suporte explicitamente indisponíveis. A identidade oficial foi confirmada
> pelos dois PNG fornecidos pelo titular. Ver a [implementação](phase-6.1-foundations.md).
> Isto não altera a classificação dos contratos nem resolve os bloqueios backend.

Análise em 2026-11-02, branch `integration/frontend-v1`, código `0426760`.
Fonte visual exclusiva: [Figma oficial](https://www.figma.com/design/dseqmbo4hzK6sFcOQl5hld/GoLeve?node-id=0-1).
[Inventário com os 92 IDs](figma-inventory.md) · [plano](phase-6.1-plan.md).

## Critérios

Prioridade: segurança/regras backend → rotas, DTOs e permissões reais → Figma →
adaptação técnica. A análise estática não substitui testes HTTP.

- **S — suportado:** existe contrato no código para a operação indicada, ou a
  interação é exclusivamente de apresentação. Não significa frontend implementado.
- **P — parcial:** há suporte para parte da intenção, mas faltam campos/integrações,
  existe divergência de regra ou o fluxo está bloqueado nesta instalação.
- **N — não implementado:** não existe contrato backend que realize a intenção.
  Uma mensagem de sucesso, número ou navegação do protótipo não comprova suporte.

E01–E24 referem as famílias do inventário, incluindo todos os seus IDs Light/Dark.
“Ambas” significa os frames Web e Mobile dessa família; E23/E24 são só Mobile.
T = titular com Bearer e sessão persistida válida, confirmado pelo Auth em pedidos
protegidos. G = Gestor com âmbito efetivo; A = Administrador com MFA e step-up
quando requerido. Papel no cliente nunca é autorização.

Cada linha abaixo herda os estados L/S/E/B definidos na secção seguinte. Os DTOs
D01–D16 são projeções documentais dos contratos reais, não novos tipos de servidor.

## Matriz das interações encontradas

| ID | Ecrã / plataforma | Intenção visual | Responsável / contrato real | Perfil / DTO | Estado e adaptação necessária |
|---|---|---|---|---|---|
| F01 | E01, ambas | Entrada/splash → login | UI; restaurar sessão com `GET /auth/me` apenas se existir token | Público / T, D01 | S para entrada. Timeout Figma não autentica; Mobile mostra logo placeholder por resolver |
| F02 | E02, ambas | Iniciar sessão | Auth: `POST /auth/login` | Público, D01 | S para login normal; resposta MFA exige fluxo adicional ausente no Figma |
| F03 | E03, ambas | Criar conta | Auth: `POST /auth/register` | Público, D01 | S. Enviar só nome/email/password; papel sempre utilizador; só navegar após sessão válida |
| F04 | E02/E03, ambas | Mostrar password; confirmação | UI e validação Auth D01 | Público | S. Confirmação é local e não segue no payload; não guardar password |
| F05 | E04, ambas | Enviar recuperação por email | Sem endpoint de recuperação / envio correspondente | Público | N. Desativar envio e explicar indisponibilidade; nunca simular email enviado |
| F06 | E03, ambas | Aceitação de Termos/Privacidade | Texto visual; Auth não recebe versão de política nem consentimento | Público | P. Destinos/documentos legais precisam de aprovação; não inventar consentimento persistido |
| F07 | E05/E23, ambas/Mobile | Navegar por áreas e regressar | Router frontend; dados das áreas mantêm autenticação | T | S (UI). Substituir destinos fixos por rotas lógicas/IDs reais; conservar tema |
| F08 | E21/E23 e sidebar Web | Terminar sessão | Auth: `POST /auth/logout` | T, D01 | S. Revogar sessão e limpar estado; não limitar logout a trocar de ecrã |
| F09 | E05 e shell, ambas | Alternar tema | User: `GET /users/me/preferences`, `PUT /users/me/preferences`, `PATCH /users/me/preferences` | T, D02 | S. `theme=system|light|dark`, ETag/precondições. Tema pré-login pode ser preferência local sem dados sensíveis |
| F10 | E05/E21/E23, ambas | Nome/email/avatar por inicial | Auth `GET /auth/me`; User `GET /users/me` | T, D01/D02 | S para identidade textual. Diferenciar email Auth de contacto User; upload de foto não foi encontrado |
| F11 | E05/E21, ambas | Resumo corporal | User `GET /users/me/physical-data` ou Performance `GET /performance/summary` | T, D02/D10 | P. Proprietário a escolher; g/mm e kg/cm não se sincronizam. Não misturar silenciosamente fontes |
| F12 | E22, ambas | “Editar perfil” altera peso/altura/cintura | Não são campos de `PATCH /users/me`; são registos User ou Performance (D10/D11) | T | P. O modal é de medições, não de credenciais/perfil. Preservar histórico; várias escritas não são atómicas |
| F13 | E05/E19/E21, ambas | Consumo/meta/percentagem diária | Hydration: `GET /hydration/goal`, `GET /hydration/intakes/daily` | T, D03/D04 | S. Data local e timezone; meta inexistente é estado próprio, não valor do Figma |
| F14 | E05/E19, ambas | +150/+250/+500 ml | Hydration: `POST /hydration/intakes` | T, D04 | S. `idempotencyKey` no corpo; uma intenção por clique, sem retry cego |
| F15 | E19, ambas | Sugerir meta por género/peso/altura/idade/atividade | Hydration: `POST /hydration/goal/suggest` e `PUT /hydration/goal` | T, D03 | P. Backend usa género homem/mulher, peso inteiro, idade, `active` booleano; não recebe altura nem três níveis de atividade |
| F16 | E05/E19, ambas | “35 ml/kg” aplicado a todos e meta automática | Sugestão calculada pelo Hydration, não pelo frontend | T, D03 | P. Fórmula varia com género, idade e atividade. Não recalcular/guardar meta automaticamente ao editar peso |
| F17 | E05/E19, ambas | Consumo semanal / média | Hydration: `GET /hydration/intakes/daily` por data; `GET /hydration/intakes` paginado | T, D04 | P. Não há endpoint semanal dedicado. Agregar apenas período completo confirmado; ausência/falha não é zero |
| F18 | E19 e dashboard Web | Lembretes, frequência e janela | Hydration: `GET /hydration/reminders`, `PUT /hydration/reminders` | T, D05 | S para configuração persistida e versionada; P para entrega automática, ainda não demonstrada |
| F19 | E19, ambas | Notificação no telemóvel / pré-visualização | Notification tem notificações internas; não existe push externo | T, D05/D13 | P. Pré-visualização deve estar identificada; ativar configuração não comprova envio real |
| F20 | E06, ambas | Planos ativos / rotina / plano semanal | Training: `GET /training/plans`, `GET /training/plans/{planId}` | T, D06 | S para planos/dias persistidos; P para “treino de hoje” automático sem ligação tipada Agenda–Training |
| F21 | E10–E16, ambas | Detalhes, séries, repetições, descanso | Training: `GET /training/plans/{planId}`, `GET /training/exercises/{exerciseId}` | T, D06 | S para campos existentes; P para intervalos “8–10” e duração prevista que não são campos equivalentes no plano |
| F22 | E24 e E11–E16, Mobile | Adicionar exercício por nome/séries/repetições/descanso | Training: `GET /training/exercises`, `POST /training/exercises`, `POST /training/plans/{planId}/exercises` | T, D06 | P. Associação exige exerciseId; criar catálogo exige metadados/instruções que o modal não recolhe |
| F23 | E11–E16, Mobile | Remover exercício (✕) | Training: `DELETE /training/plans/{planId}/exercises/{exerciseId}` | T, D06 | S em plano próprio ativo; P para gravação ausente no protótipo. Confirmar resposta antes de remover da lista |
| F24 | E05/E06/E10–E16, ambas | Começar treino | Training: `POST /training/sessions`, depois `POST /training/sessions/{sessionId}/start` | T, D07 | S. Guardar ID real; não confundir planId com sessionId. Não há transação cliente entre os dois pedidos |
| F25 | E08, ambas | Pausar / retomar / temporizador | Training: `POST /training/sessions/{sessionId}/pause`, `POST /training/sessions/{sessionId}/resume`, `GET /training/sessions/{sessionId}` | T, D07 | P. Estados persistem; índice de série, contagem regressiva e tempo ativo sem pausas não têm contrato próprio |
| F26 | E08 Mobile, detalhe A | “Acabar exercício”, cargas e repetições | Training: `POST /training/sessions/{sessionId}/exercises` | T, D07 | P. Registar sets reais; não há comando dedicado “próximo exercício”, nem chave universal para repetir esta escrita |
| F27 | E08 / E10 Web | Concluir treino e guardar histórico | Training: `POST /training/sessions/{sessionId}/complete` | T, D07 | S para sessão running/paused; não concluir diretamente um plano ou sessão planned |
| F28 | E09, ambas | Histórico, detalhe e filtro por mês | Training: `GET /training/sessions`, `GET /training/sessions/{sessionId}` | T, D07 | P. Lista filtra status e pagina; não aceita filtro mensal documentado. Não somar só a página visível |
| F29 | E05/E06/E09, ambas | Pontos, streak, percentagem de consistência | Não há contrato de gamificação/consistência no Training/Performance | T | N. Não persistir nem inventar “+100 pts”, “5 dias” ou “86%” |
| F30 | E05/E09/E10, ambas | Calorias estimadas / energia | Não há kcal ou algoritmo correspondente no contrato Training | T | N. Não apresentar números ilustrativos como cálculo real |
| F31 | E05/E06/E07, ambas | Semana/dias e atividades próprias | Agenda: `GET /agenda/activities` | T, D08 | S para agenda pessoal, sem exigir ginásio/profissional. Filtrar por instantes, timezone e paginação reais |
| F32 | E07, ambas | Marcar treino escolhendo plano/dia/hora | Agenda: `POST /agenda/activities` | T, D08 | P. Faltam fim/duração e ambiente no modal; não existe planId no modelo Agenda. Não afirmar sincronização de sessões |
| F33 | E07, ambas | Conflitos de horário | Resultado Agenda inclui `overlapWarning` e IDs `overlaps` | T, D08 | S para aviso informativo atual: planned, até 20 IDs. Não impor exclusividade nem prometer cobertura maior |
| F34 | E17, ambas | Medidas atuais / evolução / variação mensal | Performance: `GET /performance/measurements`, `GET /performance/measurements/evolution` | T, D10 | S para registos/resumo; P para curva mensal: carregar séries completas, pois evolution só devolve first/latest/change/records |
| F35 | E18/E22, ambas | Guardar várias medidas | `POST /performance/measurements` ou `POST /users/me/measurements` | T, D10/D11 | P. Selecionar proprietário antes de implementar; guardar por campo, tratar êxito parcial e preservar histórico |
| F36 | E05, ambas | Passos e botão + | Performance: `GET /performance/steps/daily`, `POST /performance/steps`; metas `GET /performance/goals`, `PUT /performance/goals/{kind}` | T, D09 | S para registo manual/totais/metas. O desenho não define formulário completo do +; não inventar quantidade automática |
| F37 | E05, ambas | BPM médio | Performance: `GET /performance/heart-rate/summary` | T, D09 | S para média no intervalo consultado. “Ritmo cardíaco estável” é N: não existe diagnóstico/classificação backend |
| F38 | E05, ambas | Sincronização automática com sensores/relógio | Sem integração efetiva HealthKit/Health Connect/pedómetro | T | N. Apenas registos próprios manuais; enum/source não comprova integração com dispositivo |
| F39 | E20, ambas | Chat, recomendações e sugestões | Coach: `GET /ai-coach/capabilities`, `POST /ai-coach/conversations`, `POST /ai-coach/conversations/{id}/messages` | T, D12 | P. Código existe; desativado, 503 esperado. Não mostrar conversa de exemplo como resposta real |
| F40 | E20, ambas | Ação sugerida pelo Coach | `GET /ai-coach/conversations/{id}/proposals`, `POST /ai-coach/proposals/{id}/confirm`, `POST /ai-coach/proposals/{id}/reject` | T, D12 | P. Confirmação específica/contexto autorizado faltam no desenho; manter indisponível nesta instalação |
| F41 | E05/E23 e shell | “Ativo agora / Sincronizado agora” | Estado local de pedidos; não existe presença/realtime público | T | P. Mostrar última consulta/sincronização comprovada e erros parciais; não apresentar presença como facto |
| F42 | E01–E24 | Layout, modais, botões, scroll, tema | Apresentação; contratos das ações mantêm-se | Público/T | S como base visual, com adaptação responsiva, safe areas, foco, acessibilidade e estados abaixo |

As famílias E10–E16 partilham contratos de plano/sessão, mas os sete conteúdos e IDs
estão inventariados individualmente. E24 não possui equivalente Web e E23 é um
padrão de navegação exclusivo Mobile. Não transformar variantes de conteúdo em
novos endpoints ou planos fixos guardados sem ação do titular.

## Estados obrigatórios por interação

| Estado | Comportamento |
|---|---|
| L — carregamento | Indicador limitado à área/pedido; impedir submissão dupla da mesma intenção, permitir cancelamento de leitura. Não preencher com estatísticas ilustrativas |
| S — sucesso | Usar DTO/ID/versão devolvidos; formulário só fecha após sucesso confirmado. Estado vazio sem registos é diferente de erro |
| E — erro | 400/422: campos/regras; 401: descartar sessão e pedir login; 403: permissão/âmbito/MFA; 404: indisponível/inexistente/terceiro; 409/412/428: reler versão; 429: Retry-After; 502/503: dependência ou funcionalidade indisponível |
| B — bloqueio | Exibir motivo verificável e impedir ação: funcionalidade desligada, autoridade ausente, dados reais não autorizados, resultado financeiro incerto, falta de âmbito/MFA. Nunca contornar flags ou preencher sucesso fictício |
| Parcial/incerto | Em várias escritas, distinguir campos guardados dos que falharam. Após timeout, consultar antes de repetir; sem contrato de idempotência, não repetir automaticamente mutações |

JWT, password, fatores MFA e step-up não entram em logs, URLs, analytics ou fixtures.
Ler headers expostos ETag/Retry-After e preservar a string ETag completa.
Não existe refresh token nem renovação silenciosa. A aplicação continua utilizável
sem IA e sem relação profissional.

## DTOs e validações que condicionam a UI

| DTO | Contrato de pedido / resposta efetivo | Regras relevantes |
|---|---|---|
| D01 Auth | Registo `{name,email,password}`; login `{email,password}`. Sessão na raiz: `{user,accessToken,tokenType,expiresIn}`; me: `{user}`. Logout 204 | Nome 2–100; email normalizado; password ≥8 caracteres e ≤72 bytes UTF-8. Campos extra recusados. MFA devolve challenge sem accessToken; sid/sv obrigatórios |
| D02 User | Perfil `{displayName,birthDate?,gender?,contactEmail?,phoneE164?,countryCode?,approximateLocation?}`. Preferências `{locale?,timeZone,theme?,units?,notifications?,quietHours?}` | PUT inicial If-None-Match:*; PATCH If-Match. Medidas não são campos de perfil. Autoridade de identidade/credenciais permanece no Auth |
| D03 Meta Hydration | Sugestão `{gender,weightKg,ageYears,active}` → `{targetMl,liters,cups,assumptions}`; guardar `{targetMl,timezone,source,version?}` | Gender homem/mulher; peso inteiro 1–500; idade inteira 1–130. Fórmula 35/30 ml/kg, redução >55 e +500 ml quando active. Meta guardada 250–20000 ml; sugestão não é prescrição |
| D04 Ingestão/diário | POST `{amountMl,timezone,consumedAt?,idempotencyKey}`; diário query `date,timezone` → `{date,timezone,items,totalMl,targetMl,percentage}` dentro de data | amountMl inteiro 1–10000; ml no contrato, L só apresentação. Replay 200 / criação 201. Sem meta, targetMl/percentage nulos |
| D05 Lembrete | `{enabled,frequency,intervalMinutes?,startTime,endTime,timezone,version?}` | frequency hourly/two_hourly/custom. Configuração não equivale a push/notificação entregue. Não sincroniza preferências User/Notification automaticamente |
| D06 Exercício/plano | Criar exercício `{name,description?,muscleGroup,equipment,environments,difficulty,type,instructions}`. Plano `{title,exercises,description?,goals?,days?,environment?}`; item `{exerciseId,sets?,repetitions?,load?,durationSeconds?,restSeconds?,day?}` | Plano próprio active/archived; ambiente home/gym/outdoor opcional; equipamentos podem estar vazios. Repetições inteiras, não intervalos. Exercício referenciado tem de ser acessível. Duração/energia previstas não são campos de plano |
| D07 Sessão | Criar `{planId?}`; comandos start/pause/resume/complete/cancel. Registo `{exerciseId,sets:[{repetitions?,load?,durationSeconds?}],notes?}`. DTO com status/timestamps/exercises/version | planned/running/paused/completed/cancelled; não concluir planned. Registro de exercício exige running/paused. durationSeconds atual é diferença desde startedAt, inclui pausas; não alegar tempo ativo líquido |
| D08 Agenda pessoal | `{title,description?,kind,environment?,startAt,endAt,timezone,status?}` → criação/edição `data:{activity,overlapWarning,overlaps}`; leitura individual `data:activity` | kind personal/workout; workout exige ambiente, personal não o aceita. UTC + fuso IANA; fim>início; futuro planned, passado completed e já terminado. Sem planId, sem transação automática com Training |
| D09 Passos/BPM/metas | Passos `{count,recordedAt?,timezone,idempotencyKey?}`; BPM `{bpm,measuredAt?,timezone,context?,idempotencyKey?}`; meta `{target,timezone,version?}` | Registos manuais; diário date/timezone. BPM summary contém count/average/minimum/maximum/trend, sem classificação médica. kind de meta weight/steps/waist/heart_rate |
| D10 Medida Performance | `{kind,value,unit?,measuredAt?,timezone,idempotencyKey?}` → item com id/unit/source e timestamps | kind weight/height/waist/hip/chest/arm/thigh/other; kg para peso e cm para restantes; valor 0,01–1000. Evolution é resumo por kind, não todos os pontos do gráfico |
| D11 Medida User | `{kind,value,unit,measuredAt}`, header Idempotency-Key | Inteiros g/mm, UTC Z; conteúdo protegido, modo fictício. Usa upper_arm onde Performance usa arm; não converter enums só pela unidade. Nova medição preserva histórico. Não duplicar nas duas bases para dar ilusão de sincronização |
| D12 Coach | Conversa `{purpose,timezone,categories,allowedTools,selectedGoalIds?}`; mensagem `{content}`; proposta/confirm/reject versionados pelo contrato proprietário | Idempotency-Key para criar conversa/enviar mensagem/confirmar ou rejeitar; contexto fechado autorizado por conversa; ações explícitas, expiradas em 10 min; retenção/cifragem locais. Desativado/bloqueado em produção; sem fornecedor operacional confirmado |
| D13 Notification | `data.items`: id/title/body/source/eventType/readAt/refs; preferências `{enabled,hydrationReminders,trainingEvents,agendaReminders,paymentEvents,version}` | Não lida = readAt ausente, não isRead. Polling; sem websocket/SSE/email/SMS/push. Respeitar preferências do serviço responsável |
| D14 Professional/Agenda profissional | DTOs de candidatura/capacidade/serviço/disponibilidade/reserva nos contratos dos proprietários | Reservas requested/accepted/declined/cancelled/expired/completed; accepted só por confirmação profissional. Provas sintéticas não são autoridade real |
| D15 Payment | Payment autónomo com referências e amountCents validado no backend; confirmação por Idempotency-Key. DTO state e confirmationStatus | MockBank, não banco real. processing/reconciliation_required não são approved. Não repetir cobrança incerta nem oferecer “tentar novamente” com chave nova |
| D16 Management/Admin | DTOs tipados próprios; filtros limit/before, If-Match e X-Admin-Step-Up quando requeridos | Âmbito canónico aprovado/válido; MFA; aprovações independentes. Dashboard UTC≤31 dias, suprime 1–4 e derivados; origem indisponível nunca vira zero |

As validações são as do servidor; a UI pode repeti-las para feedback sem as
substituir ou restringir por valores ilustrativos do Figma. O limite visual de peso
30–250 kg/altura 1,00–2,50 m não é o mesmo contrato de Performance/User.
O perfil User aceita mais opções de género que o calculador Hydration; não mapear
opções nem atividade “Moderado” para um booleano sem decisão explícita.

## Paginação e precisão dos gráficos

- Training: page/pageSize/status; exercícios acrescentam filtros de ambiente/tipo/
  dificuldade/grupo muscular. A lista de sessões não implementa from/to mensal.
  Para totais mensais, seria preciso ler a coleção paginada completa autorizada e
  filtrar pelos timestamps definidos, ou aprovar um contrato futuro. Não inventar
  um filtro nem calcular “12 treinos” a partir de uma única página.
- Performance: page/pageSize/from/to para listas; evolution devolve apenas resumo.
  Usar registos para séries e summary para resumos do intervalo, sem trocar o
  período pretendido por um resumo global silenciosamente.
- Hydration: page/pageSize/from/to/timezone; consulta diária exige date/timezone.
  Sete consultas diárias são possíveis, sujeitas a limites e falhas parciais.
- Agenda pessoal: page/pageSize/from/to/status/kind/environment, por startAt.
  Uma atividade que começou antes do intervalo não é incluída por uma simples
  consulta startAt≥from; não prometer filtro de interseção que a API não implementa.
- User: limit/cursor opaco vinculado a titular/filtros; não usar cursor de outro
  utilizador ou kind. Professional/Management/Payment: limit/before conforme rota.

## Backend sem desenho correspondente

Esta tabela cobre os onze serviços sem inventar ecrãs. São candidatos a fases
posteriores e dependem de aprovação visual/funcional, além dos bloqueios existentes.

| Funcionalidade | Endpoint real de referência | Perfil | Compatibilidade / dependência |
|---|---|---|---|
| Sessões próprias | `GET /auth/sessions`, `POST /auth/logout` | T | S; não existe DELETE de sessão arbitrária nem refresh |
| MFA e step-up | `POST /auth/mfa/enroll`, `POST /auth/mfa/complete`, `POST /auth/admin/step-up` | Challenge / A | S no código; faltam ecrãs e Administradores legitimamente provisionados no ambiente normal |
| Hábitos/objetivos pessoais | `GET /users/me/habits`, `PATCH /users/me/habits`, `GET /users/me/goals`, `POST /users/me/goals` | T | S com configuração de privacidade; não estão desenhados |
| Candidatura/serviços | `GET /professionals/me`, `PUT /professionals/me`, `POST /professionals/me/submit`, `GET /professionals/me/services` | T / profissional conforme operação | P: candidatura não promove papel nem aprova qualificações |
| Catálogo/acompanhamento | `GET /professionals/catalog`, `GET /professionals/services`, `POST /care-relationships`, `GET /care-relationships/me` | Público / T | P: catálogo elegível pode estar vazio; B02 e autoridade real. Relação não concede dados de saúde |
| Disponibilidade/reserva profissional | `GET /agenda/professionals/{professionalId}/availability`, `POST /agenda/professional-appointments`, `GET /agenda/professional-appointments` | T / profissional elegível | P: B02–B06; disponibilidade privada preferida Professional não substitui agenda operacional |
| Pagamento autónomo | `POST /payments`, `GET /payments/{paymentId}`, `POST /payments/{paymentId}/confirm` | T | S como simulação, com limitações de reconciliação; sem ecrãs oficiais |
| Pagamento de reserva | `POST /payments/appointments/{appointmentId}`, `POST /payments/appointment-payments/{id}/confirm` | T titular | P: B07, integração desativada/guardas Docker. Cotação é interna; não existe /quotes público |
| Notificações internas | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/{notificationId}/read`, `PUT /notifications/preferences` | T | S; faltam ecrãs. Preservar deduplicação/readAt e preferências reais |
| Operação Gestor | `GET /management/me`, `GET /management/dashboard`, `GET /management/services`, `GET /management/appointments`, `GET /management/payments` | G + âmbito | P: B08/B09; filtros não concedem âmbito; sem ecrãs |
| Administração | `GET /auth/administration/users`, `GET /management/administration/professionals` | A + MFA/política | P: B08–B10; bootstrap é CLI, não registo frontend; sem aprovação real de credenciais |

## Conflitos e decisões antes dos componentes

1. **Medições:** propor Performance para os gráficos kg/cm do Figma e User para
   identidade/preferências; esta escolha para a UI precisa de aprovação, pois a
   convergência dos dois domínios continua pendente. Não escrever em ambos.
2. **Agenda:** propor marcar atividade pessoal independente, recolhendo fim e
   ambiente; o nome do plano pode servir de título escolhido, mas não de FK ou
   promessa de sincronização. Uma integração tipada futura exige outro âmbito.
3. **Hidratação:** usar o calculador existente, explicar limitações e pedir os campos
   reais; retirar altura do cálculo e não inventar a equivalência dos três níveis.
4. **Exercício:** escolher exercício real acessível ou ampliar campos para os
   metadados obrigatórios. Repetições simples/duração em segundos, sem inventar
   suporte para intervalos ou prescrições.
5. **Indisponíveis:** recuperação, gamificação, kcal, diagnóstico, push e sensores
   sem operação real. Coach permanece bloqueado. Não exibir sucesso ilustrativo.
6. **Privilégios:** novos desenhos de MFA/step-up/profissional/Gestor/Admin são
   necessários antes dessas entregas; o Figma atual só evidencia o percurso pessoal.
7. **Identidade gráfica:** decidir logo Mobile final, variações de cores, tipografia
   mínima/alvos de toque e preservar o tema ao navegar.
8. **Transporte Mobile:** dispositivos físicos precisam de acesso TLS/rede aprovado
   separadamente. Não expor bases de dados nem abrir a stack nesta fase.

Não é necessário modificar regras backend para implementar as partes suportadas.
Mudanças de domínio, novos endpoints ou relaxamento de segurança ficam fora desta análise.

## Fontes de verdade verificadas

[OpenAPI central](../api/backend-release-v1.openapi.json),
[índice de rotas](../api/backend-release-v1-endpoints.md),
[inventário verificável](../api/backend-release-v1.routes.json),
[contrato central](../api/backend-release-v1.md),
[guia frontend](../release-v1/frontend.md),
[prontidão / 12 bloqueios](../release-v1/readiness.md) e
[Swagger](../api/swagger-ui.md).

Código confrontado: [Gateway](../../backend/api-gateway/src/app.ts),
[Auth validação](../../backend/services/auth-service/src/config/validation.ts),
[Auth serviço](../../backend/services/auth-service/src/services/auth.service.ts),
[User validação](../../backend/services/user-service/src/config/validation.ts),
[User rotas](../../backend/services/user-service/src/routes/user.routes.ts),
[Training serviço](../../backend/services/training-service/src/services/training.service.ts),
[Training rotas](../../backend/services/training-service/src/routes/training.routes.ts),
[Hydration serviço](../../backend/services/hydration-service/src/services/hydration.service.ts),
[Performance serviço](../../backend/services/performance-service/src/services/performance.service.ts),
[Agenda pessoal](../../backend/services/agenda-service/src/services/agenda.service.ts) e
[Coach rotas](../../backend/services/ai-coach-service/src/routes/coach.routes.ts).
A existência de contratos privilegiados mantém as condições dos proprietários;
não foram exercidos nem ativados nesta análise.
