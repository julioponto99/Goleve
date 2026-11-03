# Autenticação Web e base dos dashboards

Continuação Web/Mobile e painéis em 2026-11-02: consultar o
[relatório atual](navigation-auth-dashboards.md). Este guia preserva a entrega
da Etapa A. A recuperação permanece indisponível e MFA administrativo continua
obrigatório; o planeamento da revisão futura não alterou o Auth.

Âmbito: Etapa A da Fase 6.3 e dependência Web da Fase 6.2, na branch
`integration/frontend-v1`. A sequência aprovada é concluir esta base e apresentar
os resultados antes das etapas B–E. Este guia descreve os contratos e o alcance;
os resultados finais estão no
[relatório de validação](phase-6.3-stage-a-auth-validation.md).

Referências: [plano da Fase 6.3](phase-6.3-plan.md),
[contratos públicos](../api/backend-release-v1.openapi.json),
[administração Auth](../api/administration-v1.md),
[integração frontend](../release-v1/frontend.md) e
[bloqueios backend](../release-v1/readiness.md).

## Rotas da aplicação

Estas são rotas Web, não novos endpoints do Gateway.

| Rota | Acesso e comportamento |
|---|---|
| `/entrar` | Login; uma identidade já confirmada pode regressar ao seu painel |
| `/criar-conta` | Registo público de utilizador normal; sem escolha de papel |
| `/autenticacao/mfa` | Exige desafio MFA válido em memória para configurar ou concluir o segundo fator; abrir a URL não concede acesso |
| `/conta/seguranca` | Sessão autenticada; consulta das sessões próprias e logout atual |
| `/painel` | Sessão autenticada; estrutura correspondente ao papel atual confirmado pelo Auth |
| `/painel/utilizador` | Apenas o papel atual `utilizador` |
| `/painel/profissional` | Apenas o papel atual `profissional` |
| `/painel/gestor` | Apenas o papel atual `gestor` |
| `/painel/administrador` | Apenas o papel atual `administrador`; as operações posteriores continuam sujeitas a MFA, quórum e step-up no servidor |

Os quatro painéis são estruturas com módulos identificados como ainda não
disponíveis. Não apresentam indicadores inventados nem executam operações de
domínio. O papel não implica elegibilidade profissional, âmbito de gestão ou
permissão administrativa sobre qualquer recurso. Não há seletor público de
identidade ou de papel. Alterar o caminho não altera a identidade autenticada.

As rotas pessoais anteriores permanecem preservadas. A navegação do cliente é uma
indicação de acesso; Auth e os microserviços proprietários autorizam cada pedido.
Breadcrumbs, cartões, estados e menus reutilizam os componentes atuais, Light
inicial, Dark persistente, Inter, paleta aprovada e os PNG oficiais GoLeve.

## Contratos de autenticação utilizados

Base URL configurada por ambiente, através do Gateway, sem prefixo `/api`.
Não usar MongoDB, RabbitMQ, portas internas ou credenciais de serviço no cliente.

| Método e endpoint | Pedido | Resposta e condições |
|---|---|---|
| `POST /auth/register` | `{name,email,password}` | Sessão na raiz; o servidor cria apenas `utilizador` |
| `POST /auth/login` | `{email,password}` | Sessão na raiz ou desafio `{challenge,mfaRequired,enrollmentRequired,expiresIn}` |
| `GET /auth/me` | Bearer da sessão | `{user}` atual, usado para confirmar identidade e papel |
| `POST /auth/mfa/enroll` | `{challenge,password}` | `{data:{secret,otpauthUri}}`; exclusivamente primeiro enrolment autorizado |
| `POST /auth/mfa/complete` | `{challenge,otp}` ou `{challenge,recoveryCode}` | Sessão na raiz; primeiro enrolment pode incluir os dez `recoveryCodes` de apresentação única |
| `GET /auth/sessions` | Bearer da sessão | `{data:{items}}`, até 100 sessões próprias com datas, `current` e `mfa`; sem JWT |
| `POST /auth/logout` | Bearer e corpo `{}` | `204`, revogação da sessão atual |
| `POST /auth/admin/step-up` | Bearer MFA, password, um segundo fator, ação, alvo e parâmetros exatos | `201 {data:{stepUpToken,expiresIn:300}}`; não executa por si só a operação de domínio |

Não fazer unwrap global de `data`: os envelopes Auth são distintos. Não existe
refresh token, renovação silenciosa, recuperação de palavra-passe ou DELETE de
uma sessão arbitrária neste contrato. A interface indica estas limitações em vez
de apresentar operações fictícias.

O formulário valida email, nome e password segundo o contrato Auth: nome 2–100
caracteres sem controlos; email normalizado; password com pelo menos oito
caracteres e no máximo 72 bytes UTF-8, sem NUL. A confirmação da password pertence
apenas à UI. O SDK projeta os campos públicos permitidos; não envia papel,
identificador de titular ou a confirmação ao registo. O servidor volta a validar.

## Sessões e revogação

O JWT Web permanece apenas em memória. Não entra em localStorage, sessionStorage,
URLs, logs ou preferências de tema. Recarregar a página exige novo login. O estado
de uma sessão só fica autenticado após confirmação em `GET /auth/me`; claims
decodificados no browser não são usados para conceder permissões.

O controlador gere expiração local, invalidação em 401 e respostas tardias de
sessões anteriores. O retorno ao foco e a ação de verificação de sessão consultam
o Auth novamente. A identidade corrente do servidor pode ter perdido o papel ou
o acesso; a UI não restaura permissões antigas com base em informação guardada.
Uma identidade suspensa, não verificada ou apenas em desafio MFA não abre o painel.

Logout remove o acesso local e tenta revogar a sessão atual. Se a resposta remota
falhar, a mensagem distingue a remoção local da revogação no servidor, que não
pode ser afirmada como concluída. Não há logout global automático entre tabs nem
revogação individual de outras sessões nesta entrega.

## MFA administrativo

Um desafio MFA não é um JWT nem uma sessão administrativa. Fica em memória durante
o prazo devolvido pelo servidor, normalmente dez minutos. A expiração e o
cancelamento invalidam a tentativa; uma resposta tardia não deve reabrir o acesso
ou redirecionar depois de abandonar o fluxo.

O cancelamento também é revalidado depois de esperar pelo armazenamento, antes de
enviar login/registo. A limpeza de uma tentativa antiga não publica estado sobre
uma tentativa mais recente. Se a confirmação de identidade falhar depois de
concluir MFA, são descartados a credencial provisória, o desafio e o temporizador;
não se reutiliza um desafio que o Auth pode já ter consumido.

No primeiro enrolment é pedida novamente a password. A chave TOTP devolvida pelo
Auth é apresentada para configuração manual na aplicação autenticadora: TOTP,
seis dígitos, período de 30 segundos. Não é enviado o segredo a um gerador QR
externo nem colocado num endereço HTTP. A conclusão exige código validado pelo
Auth; não é simulada uma validação MFA no cliente.

O primeiro enrolment apresenta os dez códigos de recuperação uma única vez,
apenas após confirmação do servidor. A UI pede confirmação de que foram guardados;
não os persiste ou volta a obter através de um endpoint inexistente. Cada código
é de uso único, e o consumo atómico pertence ao Auth. Login MFA posterior aceita
OTP ou um código de recuperação de 32 caracteres hexadecimais, nunca ambos.

Segredo, códigos, factores e password são transitórios no formulário. Não os
incluir em capturas, relatórios, analytics ou artefactos partilhados. Os testes
podem usar valores exclusivamente fictícios e identificados como tal.

## Step-up vinculado à operação

O [componente StepUpDialog](../../frontend/web/src/auth/StepUpDialog.tsx) é uma
fundação reutilizável; não existe um ecrã público para introduzir comandos, URLs,
headers ou JSON arbitrários. A ligação aos formulários administrativos da
**Etapa E ainda está pendente**. A página de segurança não concede uma autorização
administrativa global.

O [adaptador Auth](../../frontend/web/src/auth/security.ts) prepara apenas os seis
vínculos seguintes, confrontados com os métodos reais do Auth:

| Ação | Método e caminho da operação | `targetId` | `parameters` exatos |
|---|---|---|---|
| `user.suspend` | `POST /auth/administration/users/{id}/suspend` | ID do utilizador | `{version,reasonCode}` |
| `user.reactivate` | `POST /auth/administration/users/{id}/reactivate` | ID do utilizador | `{version,reasonCode}` |
| `user.revoke` | `POST /auth/administration/users/{id}/revoke` | ID do utilizador | `{version,reasonCode}` |
| `role.request` | `POST /auth/administration/users/{id}/role-requests` | ID do utilizador | `{version,reasonCode,newRole}` |
| `role.approve` | `POST /auth/administration/role-requests/{id}/approve` | ID do pedido | `{version,reasonCode}` |
| `role.reject` | `POST /auth/administration/role-requests/{id}/reject` | ID do pedido | `{version,reasonCode}` |

O adaptador confirma a identidade atual, valida uma lista fechada de ações e
parâmetros e conserva um snapshot imutável do pedido. A prova fica numa closure em
memória, sem ser apresentada, persistida ou reutilizada. A execução envia
`X-Admin-Step-Up` apenas para o caminho associado à intenção confirmada. Verifica
prazo, sessão e cancelamento, e impede um segundo `run()` sobre a mesma autorização.

Estes controlos do cliente não substituem a validação transacional do Auth:
MFA/quórum, prova vinculada à sessão, ação/alvo/parâmetros, versão do recurso,
decisão independente, ausência de autoalteração e proteção do último Admin.
Permissões revogadas pelo servidor continuam revogadas, mesmo que o menu ainda
não tenha sido atualizado.

O OpenAPI deixa `parameters` genérico. O
[DTO local restrito](../../frontend/shared/src/contracts/auth-security.ts) descreve
apenas estes vínculos Auth verificados, sem alterar o OpenAPI ou os artefactos
gerados. Outros vínculos Management/Professional exigirão os respetivos DTOs
exatos nas etapas seguintes; não são habilitados por este componente.

Se uma escrita tiver resultado incerto, a prova local fica consumida e não há
retry automático. A confirmação fica bloqueada para a mesma ação, alvo e versão,
incluindo ao fechar e reabrir o diálogo na mesma instância. O futuro ecrã
proprietário deverá consultar estado/histórico antes de propor uma nova intenção.
Este bloqueio transitório de interface não substitui idempotência no proprietário
nem persiste após recarregar a aplicação. Fechar um diálogo não prova que uma
operação já enviada ao servidor foi cancelada.

## Erros e recuperação de estado

| Situação | Comportamento esperado |
|---|---|
| 400 / 422 | Indicar validação, manter navegação segura e permitir correção dos campos |
| 401 no login | Mensagem genérica de credenciais inválidas, sem revelar existência da conta |
| 401 em pedido protegido | Invalidar a sessão correspondente e pedir nova autenticação |
| MFA inválido ou expirado | Não conceder acesso; verificar o código ou reiniciar o login |
| 403 | Mostrar operação não autorizada; não alterar papel, âmbito, MFA ou quórum para contornar a recusa |
| 409 / 412 / 428 | Conflito ou precondição; reler os dados antes de uma nova decisão |
| 429 | Indicar limite de tentativas e aguardar; sem repetição automática |
| Rede / timeout / 5xx | Distinguir indisponibilidade de resultado incerto; nunca afirmar sucesso sem resposta confirmada |

Enquanto um pedido é submetido, os controlos de submissão impedem duplicação da
mesma intenção. A saída/cancelamento do fluxo invalida a tentativa e suprime
callbacks tardios de navegação. Mensagens não reproduzem corpos de erro brutos,
tokens ou dados sensíveis devolvidos por uma origem.

## Alcance da validação e bloqueios

Não houve validação autenticada contra uma API real, registo na base existente,
provisionamento administrativo ou alteração dos serviços principais nesta etapa.
Os testes de autenticação e permissões utilizam respostas simuladas isoladas e
contas fictícias apenas dentro dos testes. A existência de um formulário ligado
ao contrato não constitui prova de integração operacional com a stack real.

Os resultados, testes efetivamente executados, capturas seguras e ficheiros
alterados constarão do relatório `phase-6.3-stage-a-auth-validation.md`. Este guia
não fixa contagens antes da conclusão dessa validação.

Mantêm-se os **12 bloqueios B01–B10 e R01–R02** da
[matriz de prontidão](../release-v1/readiness.md), incluindo elegibilidade real,
reservas/pagamentos, percursos privilegiados e recuperação de dependências. Os
dashboards de domínio, as aprovações e os âmbitos operacionais das etapas B–E não
são declarados concluídos. Não foram criados Administradores públicos, bypasses,
pagamentos reais, recuperação de password ou permissões globais.

Esta entrega não é uma declaração de prontidão para produção.
