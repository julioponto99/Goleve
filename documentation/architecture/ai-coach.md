# Fase 5.7 — Coach IA

## Análise inicial e limites

O processo AI Coach existente tinha apenas `/health`. A aplicação deve continuar
utilizável através das APIs de domínio quando o Coach estiver desligado ou o
fornecedor indisponível. Nenhuma integração pode ler bases de outros serviços,
atribuir papéis, aprovar profissionais ou executar texto gerado como código.

Referências: [plano do backend](../backend-completion-plan.md),
[permissões e privacidade](profile-permissions.md),
[utilização autónoma](autonomous-use.md) e
[relações e tarefas IA](profile-relationships.md#coach-ia).

## Contratos reais identificados

| Proprietário | APIs existentes relevantes | Limites para o Coach |
| --- | --- | --- |
| Auth | `GET /auth/me` | Confirmar identidade atual, descartar nome/email; não partilhar o segredo JWT |
| User | `/users/me/preferences`, `/users/me/goals` | Preferências e objetivos pessoais; não existe ainda um contrato de grants IA |
| Training | `/training/exercises`, `/training/plans`, `/training/sessions` | Catálogo acessível ao titular, planos autónomos e execução; plano não equivale a prescrição profissional |
| Hydration | `GET/PUT /hydration/goal`, `/hydration/intakes/daily` | Objetivo operacional e consumo; sem converter limites técnicos em aconselhamento clínico |
| Performance | `/performance/steps/summary`, `/performance/goals` | Resumos de atividade; medições e frequência cardíaca não são contexto implícito |
| Agenda | `/agenda/activities` | Agenda pessoal; as reservas profissionais da Fase 5.6 ficam fora das ferramentas IA |
| Professional | Perfis, capacidades, relações e contrato interno Agenda | O contrato Agenda não autoriza IA; elegibilidade real continua bloqueada, sem promoção de fixtures |

Os serviços de domínio atuais autorizam pedidos humanos com Bearer e ownership.
Não existe ainda identidade técnica delegada para jobs do Coach. Não inventar
tokens em nome de utilizadores nem converter relações em grants.

## Decisões aprovadas para a fase local

O utilizador aprovou explicitamente as decisões seguintes. Não são políticas
de produção nem autorizações legais. Contratos executados, modelos e testes:
[API do Coach IA](../api/ai-coach.md).

- Âmbito exclusivamente local, dados fictícios, funcionalidade desligada por
  defeito e ativação bloqueada em produção.
- Autorização explícita de contexto por conversa, segundo categorias fechadas;
  não criar um consentimento global nem um `sendFullProfile`.
- Conteúdo cifrado, retenção máxima de sete dias, propostas com dez
  minutos de validade e auditoria mínima sem conteúdo por trinta dias.
- Delegação síncrona limitada, após confirmação individual, com Bearer apenas
  em memória e novas verificações no Auth e no domínio. Nenhum job de fundo
  guarda ou reutiliza tokens.
- Resultado ambíguo exige reconciliação; sem repetir automaticamente criações
  que os serviços proprietários ainda não tornam idempotentes.
- Infraestrutura de testes autorizada especificamente: replica set,
  standalone para regressão antiga e RabbitMQ, todos temporários e isolados.

## Implementação e validação

Abstração de fornecedor indisponível/HTTP JSON versionado, validação estrita,
cifra AES-256-GCM com ligação autenticada ao recurso, filtragem de credenciais,
autenticação através do Auth e proxy `/ai-coach` no Gateway. O adaptador HTTP
é um contrato para uma API de modelo/adaptador configurada pelo operador;
não pressupõe compatibilidade automática com qualquer fornecedor comercial.

Foram implementadas conversas, mensagens, recomendações, autorizações técnicas
por conversa, propostas imutáveis, confirmação, rejeição, expiração, histórico,
auditoria, eliminação, retenção e reconciliação por leitura. A audiência comum
atual `goleve-api` é compatível com as APIs analisadas; não é substituída por
uma audiência sintética. Nenhum segredo JWT é partilhado com o Coach.

Os testes validaram por HTTP quatro ferramentas nos serviços proprietários:
objetivo de hidratação, plano autónomo de treino, objetivo de atividade no User
e atividade pessoal na Agenda. Confirmação concorrente só permite uma escrita;
resultados ambíguos ficam bloqueados e não são reenviados automaticamente.

42 testes do Coach, 377 de regressão dos serviços e 14 da demonstração anterior
passaram: 433 distintos, sem falhas ou testes ignorados. Todos os workspaces
compilaram. Provider positivo simulado exclusivamente nos testes; não foi
chamado um LLM externo. A aplicação autónoma mantém independência da IA.

As seleções técnicas locais não substituem preferências duráveis do User nem
os futuros ConsentRecord/AccessGrant. Identidade técnica, fornecedores, dados
reais, direitos e políticas produtivas continuam bloqueados, conforme a API.
