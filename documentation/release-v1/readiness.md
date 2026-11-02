# Matriz de prontidão do backend de desenvolvimento

Base de código `000cc43`; consolidação documental Fase 5.14. Os resultados funcionais
abaixo provêm do [encerramento da Fase 5.13](../api/backend-e2e-v1-closeout.md), não de
uma nova regressão nesta entrega. Preservam-se o histórico inicial 81/1/10 e o último
resultado **80 aprovados / 0 falhados / 12 bloqueados**, em 92 casos.

| Área | Implementado | Validação disponível | Limite/dependência |
|---|---|---|---|
| Gateway e infraestrutura | 11 proxies, CORS, limites, fronteira pública, replica set e identidades por base | HTTP, isolamento Mongo, readiness dos 11 destinos na stack paralela | Nova instalação noutro host ainda não ensaiada; HA/TLS/rotação/recuperação pendentes |
| Auth | Registo normal, login, sessões revogáveis, MFA real, step-up, bootstrap CLI/quórum | Fluxos normais HTTP; 12 testes administrativos em base isolada, incluídos num caso E2E | Sem provisionamento administrativo na base normal; teste privilegiado global não concluído |
| User | Perfil, preferências, hábitos, medições cifradas e objetivos próprios | HTTP, ETag, isolamento e histórico | Recolha apenas fictícia nesta configuração; privacidade para dados reais pendente |
| Training | Exercícios, planos, sessões, histórico e eventos | HTTP, concorrência de estados, outbox/notificação | Não equivale a validação clínica ou prescrição profissional |
| Hydration | Metas, ingestões, totais, configuração de lembretes e eventos | HTTP, idempotência, eventos e persistência de lembretes | Disparo automático de lembretes não demonstrado |
| Performance | Medições, passos, frequência cardíaca, objetivos e evolução | HTTP e isolamento | Convergência com medições User não definida: kg/cm versus g/mm |
| Agenda pessoal | Atividades, sobreposição informativa, edição, conclusão/cancelamento e retroativos | HTTP e concorrência negativa/positiva conforme relatório | Tipos reais `personal/workout`; aviso só considera `planned`; retroativo não tem flag própria/`completedAt` no create. Diferenças históricas não corrigidas nesta fase |
| Professional/relações | Candidaturas PT/nutricionista, qualificações declaradas, serviços, relações e controlos | Candidatura própria HTTP; recusa segura de elegibilidade ausente | Autoridade real e fluxos positivos de acompanhamento pendentes |
| Agenda profissional | Disponibilidade, reservas, reagendamento, expiração, calendário transacional e outbox | Testes isolados anteriores; E2E normal recusa inelegibilidade | B02–B06: não há profissional real elegível no ambiente normal |
| Payment | MockBank, claim persistente, idempotência, resultado incerto e outbox | Testes direcionados e HTTP corrigido; sonda original com uma chamada | Integração de reservas bloqueada B07; reconciliação financeira efetiva sem contrato |
| Notification/RabbitMQ | Consumo, templates, preferências, deduplicação, retry/DLQ, health/ready | Training/Hydration/Payment HTTP/eventos e reentrega | Sem email/SMS/push externo; positivos de reserva dependem de elegibilidade |
| Management | Convites, âmbitos, serviços, casos, indicadores mínimos e auditoria | Testes isolados anteriores e acessos indevidos E2E | Percurso positivo interserviços B08/B09 |
| Administração | MFA/step-up, governação independente, proteção do último Admin e supervisão mínima | Suite Auth isolada; acessos indevidos no gateway | B08–B10; autoridade profissional real não implementada |
| Coach IA | Conversação cifrada e ações confirmadas no módulo existente | Testes isolados históricos; 503 explícito na stack | Desativado; fornecedor/contexto real/consentimentos legais não ativados |

As contagens dos testes direcionados Payment (16 novos + 3 existentes), das dez
verificações HTTP e dos 80 casos globais têm âmbitos diferentes e não são somadas.
A sonda concorrente original termina com uma chamada bancária e resultado incerto
porque a sua barreira excede o timeout; a aprovação normal foi testada separadamente.

## Os doze bloqueios continuam abertos

IDs B01–B10 são os mesmos do relatório histórico. R01/R02 são rótulos documentais
para os dois casos disruptivos adicionais; não representam testes novos.

| ID | Caso | Condição segura de desbloqueio |
|---|---|---|
| B01 | Inventário histórico completo da Fase 5.12 | Aceitação auditada das cinco remoções externas confirmadas e novo baseline operacional; nunca declarar o passado preservado ou recriar recursos para simular evidência |
| B02 | Aceitação de reserva elegível | Fonte/política de verificação real e profissional legitimamente elegível; testes sintéticos isolados não substituem o adaptador normal `authority=real` |
| B03 | Reagendamento de reserva aceite | Resolver B02 e testar manualmente preservação da original, prazo, nova aceitação, rollback e expiração |
| B04 | Cancelamento de reserva aceite | Resolver B02; validar política, histórico/outbox e sinalização financeira sem reembolso real |
| B05 | Concorrência entre capacidades PT/nutricionista | Duas capacidades elegíveis do mesmo profissional e transações no calendário comum, incluindo buffers |
| B06 | Expiração e notificação positiva | Pedido elegível legítimo; relógio controlado apenas num processo de teste isolado aprovado |
| B07 | Reserva → cotação → Payment; cancelamento/reagendamento financeiros | Ambiente autorizado que cumpra guardas loopback, namespaces `goleve_payagenda_<instância>_<serviço>`, chaves próprias por par e elegibilidade. Docker DNS atual continua incompatível; não mudar validadores |
| B08 | Convite Gestor/atribuição canónica via gateway | Namespace de teste separado autorizado, dois Administradores fictícios com MFA pelo processo legítimo, Gestor convidado e serviços canónicos |
| B09 | Aprovação independente, revogação, expiração e dashboard | B08, decisores distintos, step-up atual, âmbitos válidos e dados suficientes para testar supressão de indicadores |
| B10 | Supervisão profissional administrativa integrada | Autorizações/MFA/step-up para consulta e suspensão; aprovação real exige ainda autoridade e política explícitas, sem substituir por prova sintética |
| R01 | RabbitMQ stop/start nesta última regressão | Nova autorização específica, IDs confirmados, persistência/inventário prévios e recuperação sem perda/duplicação |
| R02 | MongoDB stop/start nesta última regressão | Nova autorização específica e recuperação isolada, nunca em simultâneo com RabbitMQ; validar sessões/dados |

Os testes de recuperação autorizados de fases anteriores continuam como evidência
histórica; não foram repetidos na Fase 5.14. A indisponibilidade da imagem Payment
antiga também permanece uma limitação de rastreabilidade, com causa não comprovada;
não é uma nova falha funcional. Ver o diagnóstico histórico completo.

## Dependências antes de produção

- Validação integrada dos percursos bloqueados, revisão de segurança/privacidade,
  políticas para dados reais, retenção e autorização de contexto IA.
- Fornecedor financeiro real, idempotência e consulta de recibos/reconciliação;
  o [runbook atual](../operations/payment-reconciliation.md) contém resultados incertos
  sem os repetir ou presumir sucesso. Não existe reembolso real.
- Autoridade de verificação profissional, política de credenciais e recuperação
  administrativa com controlos equivalentes a MFA/quórum.
- TLS, gestão/rotação de segredos, MFA/chaves, observabilidade, limites distribuídos,
  artefactos de imagem retidos/versionados e ensaios de backup/restore aprovados.
- Replica set de desenvolvimento tem um membro, sem alta disponibilidade; migração
  do MongoDB principal e readiness ausente no seu gateway exigem tarefas autorizadas.
- Política de convergência entre preferências User/Notification e medições User/Performance.
- Instalação limpa noutro host, DTOs restantes para SDK estrito e acesso de dispositivos
  físicos com TLS/rede aprovados. Escolha da stack frontend permanece pendente.

A entrega permite iniciar a integração dos percursos autónomos dos frontends com
limites explícitos. Não é autorização de produção nem afirma que todos os fluxos V1
tenham sido validados ponta a ponta.
