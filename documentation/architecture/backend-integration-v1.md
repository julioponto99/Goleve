# Integração global de desenvolvimento — Fase 5.12

Esta stack é paralela ao ambiente principal e contém código real dos serviços,
com dados exclusivamente fictícios. Não é uma configuração de produção.
[Arranque/frontend](../api/backend-integration-v1.md),
[OpenAPI do percurso integrado](../api/backend-integration-v1.openapi.json),
[validação e ficheiros](../api/backend-integration-v1-validation.md).

## Diagnóstico e decisões

A auditoria inicial, em 2026-11-02, encontrou os 14 componentes principais
saudáveis, mas imagens antigas/configuração insuficiente para o código atual:
MongoDB standalone; Management sem runtime persistente/contratos; URLs Auth
em loopback para vários serviços; Payment configurado em produção apesar de
ser exclusivamente simulado; flags de outbox ausentes; CORS não configurado.
O único vhost RabbitMQ principal era `/`, sem filas ou exchanges GoLeve.
Saúde desses contentores não constituía uma validação funcional da nova versão.

O projeto Compose `goleve` também reúne componentes de outro ficheiro Compose.
Por isso a integração nunca estende o Compose principal nem reutiliza o seu
nome, redes, volumes, portas ou credenciais. Os recursos antigos de testes/demo
também permanecem intactos.

O utilizador aprovou novos recursos exclusivos, mas **não aprovou mudanças nos
validadores MongoDB que exigem loopback**. Essa decisão é preservada:

- `PAYMENT_AGENDA_DEMO_ENABLED=false` nos três serviços; integração financeira
  de reservas permanece bloqueada no Docker. Não utilizar túneis, rede partilhada
  ou adaptações de prova para contornar essa restrição.
- Coach IA sem alterações, desativado e sem fornecedor; responde explicitamente
  `AI_COACH_DISABLED` após autenticação. Ativação em DNS Docker fica pendente.
- Agenda Profissional usa o contrato normal, que exige autoridade real.
  Professional não recebe revisão sintética ativa nem profissionais aprovados.
- Sem administradores na base de desenvolvimento. Testes administrativos usam
  uma identidade Mongo e uma base separadas, com dados fictícios e MFA real.

## Composição e persistência

`compose.integration.yaml` usa a sintaxe JSON válida em YAML 1.2, sem dependência
de um parser adicional. Projeto `goleve-integration-v1-<instance>`, com instância
aleatória de 16 dígitos hexadecimais, criado pela CLI.

- 14 componentes: Gateway, 11 serviços Node, MongoDB e RabbitMQ.
- Inicializador MongoDB temporário, idempotente, removido após conclusão.
- Rede `backend` interna; rede `edge` apenas no Gateway para publicação em
  `127.0.0.1:64344` por defeito. Nenhuma porta Mongo/RabbitMQ/serviço publicada.
- Volumes exclusivos `mongo_data`, `mongo_config`, `rabbit_data`, prefixados
  pelo novo projeto. Parar não elimina dados. Sem volumes `external` ou binds
  para dados principais.
- Replica set de nó único `goleveIntegrationV1`; suporta transações, sem HA.
  Autenticação Mongo ativada, keyfile de replicação e identidade `readWrite`
  por serviço, autorizada apenas para a respetiva base.
- Credencial de instalação Mongo restrita ao Mongo/inicializador; nenhuma
  aplicação usa root. Esta identidade de infraestrutura não é uma conta
  Administrador do GoLeve.
- Segredos novos em `.integration/`, ignorados pelo Git e fora do build context.
  Não imprimir `docker inspect` completo ou `docker compose config` expandido:
  Docker/administradores do host conseguem observar os ambientes dos processos.
  Produção exige gestão de segredos, ACL, TLS e rotação próprios.

| Serviço | Base exclusiva |
|---|---|
| Auth/User/Training/Performance/Professional/Management | `goleve_integration_<id>_<service>` |
| Agenda | `goleve_agenda_professional_local_<id>` |
| Payment | `goleve_notification59_<id>_payment` |
| Notification | `goleve_notification59_<id>_notification` |
| Coach desativado | `goleve_ai_local_<id>` reservada; sem conexão ativa |
| Testes administrativos | `goleve_administration511_<id>_auth`, utilizador Mongo próprio |

Os nomes especiais respeitam os validadores existentes. Não são substituídos por
um prefixo genérico nem se concede acesso direto entre bases.

## Arranque, saúde e segurança

A CLI verifica RAM/espaço/porta e colisões antes de criar recursos. Imagens
construídas sequencialmente, com os Dockerfiles e npm workspaces existentes.
Mongo inicializa a instância nova e as identidades técnicas; aplicações aguardam
a conclusão e as dependências saudáveis. Não existe bootstrap GoLeve automático.
MFA e contratos Management recebem chaves próprias por finalidade/par.

O Gateway mantém `/health` como liveness e acrescenta `/ready`, que verifica os
11 serviços. Usa `/ready` para Notification/Management e `/health` nos restantes
serviços, onde esse endpoint já verifica Mongo quando aplicável. A readiness não
significa que funções desativadas ou elegibilidade profissional estejam disponíveis.
Os health checks Docker não causam encerramento automático por indisponibilidade
de uma dependência. Testes confirmam recuperação de Mongo/RabbitMQ.

Cada API continua a confirmar a identidade atual no Auth; sessões persistidas,
revogação, MFA, quórum e step-up não são substituídos por claims locais nem JWT
antigos. Contratos técnicos preservam audiência por destino, nonce, hash do corpo,
validade curta e permissões atuais. Nenhuma chave JWT é distribuída aos serviços
de domínio. A aprovação profissional sintética não vira autoridade real.

Gateway: CORS com origens exatas, sem cookies, limite geral configurável e limite
de login/registo preservado; `trust proxy=false`; bloqueio de caminhos internos/
traversal e credenciais técnicas na entrada pública; remoção de cabeçalhos técnicos
forjados. Endpoints administrativos públicos continuam protegidos por Auth/MFA;
isso não expõe os contratos `/internal`.

## Eventos

[Contratos existentes](../events/agenda-payment-notifications.md) preservados.
Training/Hydration publicam pela outbox transacional; Payment mantém a outbox
embutida; Agenda mantém a sua outbox. Notification persiste/deduplica antes do ACK,
com retry e DLQ. Preferências são preservadas.

A revisão encontrou publicação Training/Hydration sem `mandatory`/rota durável
garantida e sem identidade no lease final. A correção pontual mantém o payload:
declara rota durável compatível, exige confirmação/roteamento, usa `messageId`,
lease próprio no CAS, timeout e limpeza em `finally`. Um worker por processo
impede sobreposição dos intervalos. Falhas retêm o evento com backoff limitado
a cinco minutos; não há limite novo de tentativas nem eliminação automática.

## Produção e migração

O MongoDB principal e os seus dados não foram migrados. Ver
[backup/restauro](mongodb-backup-restore.md) e
[migração](mongodb-replica-set-migration.md). Futuramente: autorização de janela,
inventário, backup cifrado consistente, restauro verificado num destino novo,
ensaio da topologia/ACL, validação das aplicações e rollback documentado. Nunca
montar o volume principal nesta stack ou executar `rs.initiate` sobre ele nesta fase.

Pendências: decisões de elegibilidade real, integrações locais limitadas por
loopback, recuperação/rotação administrativa, operação de DLQ e retenção das
outboxes/auditoria, HA, pinning de imagens, TLS/ACL entre serviços e broker,
gestão de segredos e auditoria de segurança/testes globais de implantação.
Não se declara prontidão para produção.
