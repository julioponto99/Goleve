# Requisitos funcionais do GoLeve

O GoLeve permite utilização autónoma, sem inscrição num ginásio, Personal Trainer ou nutricionista. O acompanhamento profissional é opcional e pode coexistir com atividades geridas pelo próprio utilizador.

- [Utilização autónoma, serviços opcionais e percursos](autonomous-use.md): regras de negócio, ambientes de treino, critérios de aceitação e diagramas.
- [Implicações arquiteturais e Fase 4](../architecture/autonomous-use.md): propriedade dos dados, dependências e decisões pendentes.
- [Índice de arquitetura](../architecture/README.md): perfis, relações e permissões.

Os papéis Auth continuam `utilizador`, `profissional`, `gestor` e `administrador`. Um percurso autónomo, acompanhado ou misto não cria um papel nem concede permissões. Acompanhamento adaptativo, notificações, contratação e pagamentos são requisitos a desenvolver, não funcionalidades comprovadas pela existência dos respetivos serviços. Contratação, preços e pagamentos ficam para decisão futura; o princípio anterior de pagamentos apenas simulados continua a excluir operações financeiras reais.

O estado implementado está identificado nos documentos de [API](../api/user-service.md) e na matriz de [estado atual](../architecture/autonomous-use.md#2-estado-implementado-e-funcionalidades-previstas). As novas regras não autorizam recolha de dados reais, ativação de revisão profissional ou implementação de consentimentos de IA.
