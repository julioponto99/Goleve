# Management / Gestor — V1, Fase 5.10

Implementação permanente, sem modo de demonstração no Management. Dados
fictícios só nos testes. Não constitui declaração de prontidão para produção.
Os proprietários atuais Professional/Agenda/Payment continuam a ter limites
de elegibilidade e simulação que esta fase não remove.

## Identidade e governação

Auth é dono das credenciais e do papel global. O registo público continua a
criar exclusivamente `utilizador`. Administrador atual pode emitir convite
para **nova** conta Gestor: token aleatório de 256 bits, só hash SHA-256 na
base, validade de 24 horas, consumo/revogação condicionais e transacionais.
O convidado define nome e password; bcrypt 12, validações anteriores, limite
de 72 bytes UTF-8. Aceitação tem rate limit local ao processo. O token só é
revelado uma vez ao emissor, para entrega por canal seguro; não há email
automático. Reutilização, expiração e concorrência não criam outra conta.
Uma falha na criação da identidade reverte o consumo do convite.

Não há criação automática de administradores, promoção de contas existentes,
password fixa ou segredo JWT partilhado com outros serviços. O provisionamento
inicial e o reforço da identidade administrativa continuam dependências da
Fase 5.11. Nos testes, administradores são fixtures numa base isolada.

O papel `gestor` não concede operações. Management liga `authUserId` a perfil
operacional e atribuições próprias; não duplica credenciais ou dados User.
Administração governa atribuições, mas não herda acesso aos dados operacionais
dos gestores por hierarquia de papel.

## Modelos próprios

| Coleção | Dados e invariantes |
|---|---|
| `management_operator_profiles` | `authUserId` único, nome operacional, estado, aprovação de onboarding, versão |
| `management_operational_scopes` | Nome, tipo fixo `service`, 1–50 IDs únicos canónicos, estado, autor, versão; composição imutável |
| `management_assignments` | Operador, âmbito, permissões de catálogo, prazo finito, estado, requerente/aprovador distintos, revogação, versão |
| `management_operational_cases` | Serviço e âmbito, tipo de caso, proprietário/referência, responsável inicial, estado, motivo estruturado, versão |
| `management_security_audit` | Ator, ação, referência, âmbito quando aplicável, resultado, versão, request ID e data; sem corpo, Bearer ou notas clínicas |

Auth guarda `auth_manager_invitations` e `auth_manager_invitation_audit` na sua
própria base. Nonces de chamadas internas ficam em cada destinatário, com
expiração técnica; nunca contêm o Bearer.

Management exige replica set para gravar mutações e auditoria na mesma
transação, com majority e retries limitados. Não se migrou o MongoDB principal.
Professional grava suspensão e histórico mínimo atomicamente no documento do
serviço. O histórico local tem limite seguro de 128 operações, sem truncagem;
ao atingir o limite, bloqueia até existir política de arquivo aprovada.

## Atribuição e revogação

1. Administrador confirma identidade Gestor no Auth e aprova onboarding.
2. Cria âmbito com serviços cuja existência o Professional confirma.
3. Pede atribuição com permissões explícitas e `validFrom/validUntil`.
4. Outro Administrador atual aprova. Revalida operador, serviços e validade.
5. Pedir revogação coloca `revocation_pending` e bloqueia novos acessos logo
   nesse momento. A conclusão requer outro Administrador e fica auditada.

Estados: `pending → active → revocation_pending → revoked`. Prazo expirado
torna a atribuição ineficaz sem exigir job ou atualização física para
`expired`. Só `active`, dentro do prazo, com operador e âmbito ativos, concede
acesso. IDs de âmbito enviados pelo frontend não substituem esta resolução.
Alterar o portfólio exige um novo âmbito/atribuição; não se amplia um grant
existente silenciosamente. `If-Match` e versão protegem ações concorrentes.
Consultas operacionais suportam até 500 serviços distintos na união das
atribuições (cada âmbito mantém o limite de 50). Acima disso devolvem
`PORTFOLIO_LIMIT`, sem truncagem silenciosa do conjunto autorizado.

Catálogo: `professionals.read`, `services.read`, `services.suspend`,
`services.reactivate`, `appointments.read`, `payments.read`, `dashboard.read`,
`cases.read`, `cases.write`, `audit.read`. Sem papéis globais, administração,
verificação de credenciais, saúde ou wildcard. Administração não se pode
autoatribuir um perfil Gestor; o papel escalar continua no Auth.

## Execução e isolamento

Management valida o Bearer no `Auth /auth/me` em cada pedido e descarta
campos desnecessários da identidade. Calcula o conjunto de serviços permitido
na sua base, sem aceitar âmbito livre. O proprietário recebe identidade
técnica autenticada e consulta a autorização atual no Management antes de
ler/escrever; este volta a confirmar papel, permissão e atribuições no Auth e
MongoDB. Falha de confirmação nega acesso, sem usar autorização em cache.

As bases dos outros serviços nunca são consultadas diretamente. Recursos sem
`serviceId` canónico não são incluídos por inferência. Nenhuma vista expõe IDs
de clientes, contactos, saúde, preços ou recibos bancários. DTOs são mínimos e
as respostas dos proprietários são filtradas/validadas no Management.

Não existe transação distribuída. Revogação bloqueia novas admissões;
operações já admitidas no proprietário podem terminar. A versão local protege
a escrita concorrente. Casos e revogação serializam alterações sobre a
atribuição no Management. Não se afirma revogação retroativa de respostas já
entregues ou atomicidade global entre serviços.

## Serviços e casos

Suspensão exige permissão, serviço do âmbito, motivo estruturado e versão.
Desativa o serviço e grava autor/data/motivo/versão no proprietário. Não
altera a identidade ou elegibilidade global do profissional, nem cancela
reservas, pagamentos ou reembolsos. Operações do próprio profissional não
aceitam `managementSuspended` no corpo nem possuem reativação que o ignore.
Guarda também se o serviço já estava inativo antes da suspensão; nesse caso
o Gestor não o pode ressuscitar ao levantar a sua suspensão.

Reativação só pode levantar suspensão Management. Exige prova atual
`authority=real`, profissional ativo, capacidade verificada e versão atual.
**Bloqueador real:** o Professional atual só conhece requisitos legais por
avaliar e não fornece autoridade real. O adaptador normal nega com
`REAL_ELIGIBILITY_UNAVAILABLE`; aprovação sintética nunca a satisfaz. O ramo
positivo foi implementado/testado com dependência isolada, que o servidor
normal não injeta. Ligar autoridade real exige fase própria de verificação;
esta etapa não resolve ou contorna essa dependência.

Casos são metadados, sem notas clínicas: `open → in_progress → resolved →
closed`, permitindo fecho antecipado. `closed` é final. Responsável inicial
é o operador autenticado; não há reatribuição nesta entrega. Histórico fica
na auditoria transacional e pode ser consultado com cursor. Referência ao
recurso é confirmada no proprietário dentro do serviço autorizado.

## Indicadores e limites

Contagens de documentos persistidos por dia UTC, no máximo 31 dias. Não são
estimativas ou fixtures inseridas pelo servidor. Célula entre 1 e 4 suprime
todo o período dessa origem; não se devolvem totais complementares. Valores
maiores são apresentados apenas em intervalos de cinco, sem valor exato.
Portfólio é o conjunto autorizado, sem filtros arbitrários de serviço no
dashboard. Resposta inclui origem, política, data de cálculo e indicação
explícita de simulação nos dados atuais Professional/Payment.
Os códigos são `services.created`, `appointments.created` e
`payments.created`; a Agenda atual também identifica o âmbito sintético.

São indicadores de **registos criados**, não receita, saldo, taxa clínica ou
garantia de anonimização. Ausência de observações dá série vazia numa origem
disponível; falha dá `status=unavailable`, sem zero substituto. Fontes não
formam um snapshot transacional global. Privacidade quantitativa formal,
rate limit distribuído, MFA administrativa, retenção operacional/legal,
rotação/TLS/ACLs e revisão de segurança integrada continuam necessários antes
de qualquer declaração produtiva.
