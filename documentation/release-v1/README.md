# GoLeve V1 — entrega de desenvolvimento, Fase 5.14

Ponto de partida: `000cc43ee2a47af9de5b0f8ace7fb09e8a5d5dd6`.
Branch de preparação: `feat/backend-release-v1`. Esta entrega não é produção,
não publica imagens e não contém dados/segredos do ambiente do autor.

Percurso recomendado para outro programador:

1. Ler a [instalação local independente](local-setup.md) e gerar a própria instância.
2. Consultar a [referência central](../api/backend-release-v1.md), o
   [índice de endpoints](../api/backend-release-v1-endpoints.md) e o
   [OpenAPI 3.1](../api/backend-release-v1.openapi.json).
3. Seguir o [guia web/Android/iPhone](frontend.md).
4. Rever a [matriz de prontidão e os 12 bloqueios](readiness.md).
5. Consultar a [validação desta entrega](validation.md) e o
   [histórico E2E](../api/backend-e2e-v1-validation.md) antes de afirmar cobertura.

São onze microserviços, um Gateway, MongoDB e RabbitMQ: 14 componentes em execução,
mais um inicializador MongoDB transitório. A aplicação autónoma não depende de PT,
nutricionista, ginásio ou Coach. Não há administradores ou profissionais elegíveis
criados automaticamente, pagamentos reais, email/SMS/push ou IA ativa.

## O que partilhar

Partilhar apenas o código revisto, lockfile, Compose, scripts, contratos e documentação
da branch, depois de um commit/publicação explicitamente autorizados. Não enviar
`.env`, `.secrets`, `.integration`, `.demo`, backups, dumps, volumes, chaves,
ficheiros de estado Docker ou JWT. O destinatário gera tudo localmente com `init`.
Nunca copiar a instância `ad8ea9a1719b5a21` do autor para outra máquina.

Os exemplos são fictícios e não existem utilizadores pré-carregados no Git. Não há
credenciais de demonstração fixas. O fixture mínimo é uma conta normal criada pela
API e recursos próprios, conforme o guia; o seu registo não concede papéis adicionais.

## Estratégia Git proposta, ainda não executada

Depois da revisão e autorização de um checkpoint, usar `integration/frontend-v1`
como branch partilhada de integração, baseada no checkpoint aprovado de
`feat/backend-release-v1`. O commit `000cc43` é a base do backend; não inclui por si
só os documentos novos desta fase enquanto estiverem sem commit.

Criar trabalho de UI em branches curtas `feat/web-*`, `feat/android-*` ou
`feat/mobile-*`, sempre referenciando a versão do contrato. Integrar por PR revisto
na branch partilhada, com verificações offline dos contratos. A main não é destino
automático. Não rebasear/forçar uma branch já partilhada nem alterar contratos apenas
para acomodar suposições do frontend. Uma alteração de contrato precisa de decisão,
atualização do proprietário, documentação e validação correspondente.

Esta proposta não criou branches remotas, commits, push, merge ou alterações na main.

## Lacunas relevantes detetadas

- O OpenAPI anterior era um subconjunto; os documentos históricos foram mantidos.
  O novo índice cobre as rotas públicas declaradas, incluindo condicionais e bloqueadas.
  Schemas de resposta genéricos continuam explicitamente não adequados a um SDK
  estrito completo; confirmar DTOs nos contratos proprietários.
- A CLI histórica `integration.cjs up/status/start` exige encontrar 14 componentes
  principais no baseline; isso não é verdade numa máquina nova. O guia usa `init`
  e comandos Compose explicitamente vinculados ao estado gerado, sem esse pressuposto.
- `integration.cjs test` é disruptivo: pode parar MongoDB/RabbitMQ. Não é um teste
  inicial de conectividade. O roteiro E2E histórico também exige a branch E2E e
  fixtures próprias; não foi alterado nem executado nesta fase.
- Agenda pessoal usa efetivamente `personal|workout`, e não os seis tipos previstos
  nos requisitos anteriores. O contrato documenta o código, sem alterar o domínio.
- A publicação é em loopback. Dispositivos físicos e desenvolvimento iOS remoto
  exigem planeamento de rede/TLS/autorização separado; não foi aberto acesso LAN.

Não houve alterações de código de negócio ou configuração Docker nesta fase.
