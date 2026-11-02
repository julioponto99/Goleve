# Arquitetura do GoLeve

[Entrega de desenvolvimento V1 — Fase 5.14](../release-v1/README.md),
[contratos públicos centrais](../api/backend-release-v1.md) e
[matriz atual de prontidão](../release-v1/readiness.md).
Os parágrafos históricos seguintes preservam as decisões das fases anteriores.

[Integra??o global de desenvolvimento ? Fase 5.12](backend-integration-v1.md), [arranque/frontend](../api/backend-integration-v1.md) e [valida??o](../api/backend-integration-v1-validation.md).

Microserviços com base lógica por domínio e integração através de contratos dos proprietários. Não aceder diretamente às bases de outros serviços. O gateway encaminha pedidos; os proprietários validam identidade, titularidade e permissões. RabbitMQ integra as outboxes e o Notification no ambiente isolado; publica??o, consumo e recupera??o foram validados na Fase 5.12. Isso n?o ativa automaticamente os eventos do ambiente principal nem elimina os bloqueios de demonstra??o. Multi-tenancy continua futura.

O núcleo pessoal é independente de ginásio, profissionais, contratação, pagamentos e IA. Uma dependência necessária a acompanhamento não deve ser uma condição global para operações próprias. Autenticação e políticas de dados continuam obrigatórias.

| Documento | Conteúdo |
| --- | --- |
| [Utilização autónoma e serviços opcionais](autonomous-use.md) | Decisões atuais, estado implementado, fronteiras por serviço, conflitos e implicações para a Fase 4 |
| [Requisitos e percursos](../requirements/autonomous-use.md) | Regras funcionais, critérios de aceitação e diagramas Mermaid |
| [Perfis pessoais](user-profiles.md) | Desenho de perfil, preferências e dados pessoais; distinguir subconjunto implementado de extensões futuras |
| [Perfis profissionais](professional-profiles.md) | Capacidades, verificação e registos profissionais, sem obrigatoriedade de acompanhamento |
| [Relações e integração](profile-relationships.md) | Relações opcionais, dados próprios, grants futuros, treino e Agenda |
| [Permissões](profile-permissions.md) | Titularidade, delegação limitada e privacidade; relação não concede acesso sensível |
| [Demonstração isolada](../api/isolated-demo.md) | Limites da integração local e dos testes com elegibilidade simulada |

Esta revisão é exclusivamente documental, baseada no código do commit `954afa7`. Não altera contratos executáveis, modelos, endpoints, Docker ou bases de dados. Os diagramas de funcionalidades previstas não comprovam a sua implementação.
