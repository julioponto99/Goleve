# Navegação, autenticação e painéis Web/Mobile

Entrega de 2026-11-02 em `integration/frontend-v1`. Preserva o trabalho anterior,
PNG oficiais, Inter, paleta Light/Dark e os relatórios históricos. Não modifica
Auth, outros microserviços, OpenAPI, Docker, contas, bases ou credenciais.

## Entrada e segurança

Splash → verificar sessão → login/registo → MFA quando exigido → transição breve
após identidade confirmada → painel do papel atual. Logout remove acesso local e
regressa imediatamente ao login; falha de revogação remota é indicada. Tokens Web
só em memória; Mobile usa SecureStore. Nenhum dado de domínio fica em storage.
Retorno a rota privada é permitido apenas para o papel confirmado pelo Auth.

Web e Native partilham validação, sessão, rotas, cliente, decoders e comandos de
domínio. Os quatro menus derivam de catálogo fechado. A apresentação não concede
âmbitos, elegibilidade ou privilégios; cada proprietário valida a autorização.
401 remove acesso; 403 permanece recusa explícita; falhas não se tornam listas
vazias ou indicadores zero. Abort/cancelamento e trocas de sessão descartam
respostas antigas. Não há refresh nem suporte para JWT legados sem sessão.

MFA pendente não dá acesso administrativo. TOTP real, enrolamento com password,
segredo temporário, verificação e códigos de recuperação uma única vez, com
confirmação de que foram guardados. Step-up exige password+fator, dura no máximo
cinco minutos e vincula sessão/ação/alvo/versão/motivo. Apenas as seis ações Auth
revistas são executáveis por estes componentes. Resultados incertos bloqueiam
repetição do mesmo intento no runtime; é necessária reconciliação no proprietário.
Este bloqueio de UX não substitui transações e controlo de concorrência backend.

## Recuperação e MFA futura

Web: `/recuperar-acesso`, `/recuperar-acesso/nova-palavra-passe`,
`/recuperar-acesso/resultado`; Native tem os mesmos estados. Pedido/reset têm
botões desativados e mensagem explícita. Abrir resultado não apresenta sucesso.
Nenhum endpoint inexistente é chamado, não há email enviado nem password alterada.
A Web remove fragmento/query acidentais do ecrã de reset, sem guardar o token.
Não estão configurados Universal/App Links: dependem de domínio HTTPS verificado
e contrato real. Não foi criado um esquema arbitrário para aceitar tokens.

A proposta de recuperação foi aprovada para uma etapa backend própria, sem
autorização para alterar Auth nesta entrega. Ver
[proposta](password-recovery-proposal.md). A futura revisão de MFA também é só
planeamento: [política atual e riscos](mfa-policy-review.md). Hoje o login normal
de utilizadores é password; MFA administrativo continua obrigatório. Não existe
ativação voluntária de MFA para utilizadores comuns no contrato atual.

## Funcionamento por perfil

| Perfil | Leituras ligadas ao backend (Web e Mobile) | Escritas ligadas | Limites ainda existentes |
|---|---|---|---|
| Utilizador | Hidratação diária/meta/histórico; planos/exercícios/sessões; medições Performance; agenda; perfil/preferências; catálogo; reservas/pagamentos simulados; notificações | Consumo/meta; medições exclusivamente Performance; plano vazio/sessão pessoal; iniciar/pausar/retomar/concluir/cancelar treino; criar/concluir/cancelar atividade; criar/editar nome de perfil; marcar notificação lida na Web | Edição detalhada de planos/exercícios e atividades, gráficos, outras preferências e fluxo completo de reserva/pagamento ainda não têm interface completa |
| Profissional | Perfil, candidatura, capacidades/qualificações, serviços, disponibilidade/regras/exceções e reservas recebidas | Não publica nem confirma reservas artificialmente | Gestão de ofertas/horários e transições de reservas ainda sem formulários; elegibilidade real e reservas positivas continuam condicionadas pelos bloqueios backend |
| Gestor | Âmbitos atuais; serviços/profissionais/reservas/estados financeiros do âmbito; indicadores UTC; casos | Suspender/solicitar reativação de serviço; abrir caso operacional de serviço; transitar caso com motivo/versão | Ausência/revogação/expiração de âmbito é recusa. Reativação depende do proprietário e da elegibilidade; sem cancelamento/reembolso automático |
| Administrador | Utilizadores/papéis; pedidos; Gestores/âmbitos/atribuições; supervisão profissional; auditoria; sessões próprias | Suspender/reativar conta, revogar acessos, solicitar papel e aprovar/rejeitar pedido, todos com step-up; sem auto-operação | Convites e decisões de âmbito/supervisão sensível ainda sem UI de escrita. Quórum, independência e último Admin são verificados no Auth; não existe provisionamento real nesta entrega |

Os quatro painéis usam requests para contratos existentes. A validação autenticada
contra a stack real ainda está pendente: os testes desta entrega usam HTTP
simulado, nunca contas fictícias embutidas no produto. Não declarar todos os
fluxos V1 completos. Os doze bloqueios B01–B10/R01/R02 de
[readiness](../release-v1/readiness.md) continuam abertos.

## Contratos e apresentação

Leituras e projeções fechadas em `frontend/shared/src/domain/resources.ts`;
escritas em `commands.ts`, `management-commands.ts` e `auth/security.ts`.
`row-actions.ts` mostra transições conforme o estado devolvido. Não há formulários
para enviar JSON, URL, método ou cabeçalhos arbitrários. IDs de alvo vêm dos
registos recebidos. Não se enviam IDs de titular/âmbito para obter permissões.

Listas respeitam paginação page/pageSize ou cursor limit/before conforme o
proprietário. Pesquisa em catálogo/utilizadores/casos; filtro diário UTC de
indicadores até 31 dias. Nem todos os filtros backend têm ainda controlo visual.
Indicadores preservam supressão e intervalos; não somam dados para reconstruir
contagens pequenas. Payment é explicitamente simulado e não tem botão de cobrança
implementado aqui. Não há fornecedor IA configurado: Coach permanece indisponível.

O menu hambúrguer tem três linhas, estado expandido e fecha ao navegar. Web usa
focus trap/Escape no drawer responsivo e pode recolher o menu desktop. Native usa
Modal, BackHandler e safe areas. A barra inferior aparece apenas após autenticação
no percurso pessoal, sem sobrepor o drawer ou formulários. Auth Native usa
KeyboardAvoidingView e scroll; funcionamento real do teclado requer dispositivo.

Figma oficial `dseqmbo4hzK6sFcOQl5hld`, inventário anterior 92 frames/42 interações
preservado. Nova leitura MCP: login Mobile `89:42`, recuperação Mobile `118:64`,
Web Light `2031:3052` e Dark `2023:36588`. SVG de email original guardado nas duas
variantes; PNG GoLeve não redesenhados. Proveniência em
`frontend/shared/assets/provenance.json`. Não foram alterados frames Figma.

## Testar e abrir

Em `frontend/`: `npm.cmd run dev:web`, abrir `http://127.0.0.1:5173`.
Mobile: `npm.cmd run dev:mobile`, com Expo Go/development build compatível.
Configuração pública em `.env.example` por plataforma: Android Emulator usa
`10.0.2.2`; iOS Simulator em Mac usa o loopback desse Mac. Um dispositivo físico ou
outro computador exige origem HTTPS aprovada, CORS/TLS e conectividade preparada
separadamente. Não expor MongoDB, RabbitMQ ou contratos internos para este fim.

Usar só contas autorizadas. Nenhum teste desta entrega cria contas na stack.
O [procedimento administrativo](administrator-access.md) foi auditado por leitura;
qualquer execução real permanece dependente de confirmação do operador.

Validação reproduzível: `npm.cmd run typecheck`, `npm.cmd run build:web`,
`npm.cmd test`, `npm.cmd run test:web -- --output=.cache/navigation-dashboards/final`,
`npm.cmd run check:mobile`, `npm.cmd run contracts:check`.
Playwright usa porta 5174 própria e um worker; não parar a Web do utilizador em 5173.
Compilações e Chrome executados em sequência para limitar pressão de memória.
Expo Crypto 58.0.7 é a única dependência adicionada, indicada pelo SDK Expo já
instalado, para UUIDs de idempotência no Hermes.

## Resultados e evidência

Resultados finais:

| Verificação | Resultado | Âmbito |
|---|---|---|
| TypeScript | Aprovado | Web, Mobile, shared e testes |
| Build Web | Aprovado | Vite, 97 módulos |
| Unitários | 95 aprovados, zero falhas | SDK/contratos, sessões, MFA/step-up, privacidade/âmbitos, comandos, temas; seis verificações estruturais Native com primitives simuladas |
| Playwright final | 98 aprovados, zero falhas, sem retries | 49 cenários × desktop 1440×1000 e Web responsiva 402×874; testes adicionais de layout 320–1440 |
| Expo/Hermes | Android e iOS aprovados | Android 688 módulos, iOS 690; bundles, sem execução em aparelho/emulador |
| OpenAPI | 215 operações / 170 caminhos, aprovado | Documento e tipos existentes inalterados |
| Documentação/Git | Links relativos verificados; diff check sem erros | 69 ficheiros locais, sem alterações fora de frontend/documentação frontend; novos ficheiros também verificados quanto a whitespace |

Todos os pedidos autenticados dos testes usam respostas simuladas. Não houve
teste autenticado com API real, criação de contas, alterações de bases ou
validação nativa em dispositivo. Os testes de tokens de recuperação inválidos,
expirados/reutilizados e enumeração no Auth continuam pendentes da implementação
backend; o teste atual verifica indisponibilidade e ausência de pedidos.

Histórico desta entrega:
primeira tentativa de unitários bloqueada pelo sandbox Windows (`os.userInfo`);
execução autorizada fora do sandbox passou. Testes de navegação antigos foram
adaptados ao login imediato. Foi corrigido o cancelamento ao sair de MFA em curso.
A primeira regressão dos painéis teve 88/98 aprovados: dez falhas de fixtures
(URLs com query não correspondiam ao mock e seletor de status ambíguo). Os dez
passaram na repetição direcionada. Não foram alterados contratos para os passar.

Capturas são renders reais do Chrome com respostas HTTP fictícias, não evidência
de dados pessoais/financeiros reais. Guardadas em `.cache/navigation-dashboards/`,
ignorada pelo Git. Não existem capturas de execução nativa nesta entrega.
Galeria local: `frontend/.cache/navigation-dashboards/final/screenshots.html`.
Inclui os quatro perfis em Light/Dark e ambas as resoluções, recuperação e
hidratação com dados fictícios. Os PNG originais de identidade visual continuam
byte a byte iguais, conforme o teste de integridade.

`npm audit` consultado sem executar fix: 13 dependências assinaladas moderadas,
zero altas/críticas; cadeias Expo/CLI e tooling OpenAPI (glob/minimatch). O pacote
novo expo-crypto não consta do relatório. Triagem/atualização compatível continua
pendente e não foi feita uma alteração geral de bibliotecas.

Não foi executado commit, push, merge, bootstrap, migração ou operação Docker.
Esta entrega não declara prontidão para produção.

## Endpoints de leitura utilizados

| Ecrã/consulta | Método e caminho | Perfil |
|---|---|---|
| Hidratação de hoje | GET `/hydration/intakes/daily` | Utilizador |
| Meta diária | GET `/hydration/goal` | Utilizador |
| Histórico de hidratação | GET `/hydration/intakes` | Utilizador |
| Planos de treino | GET `/training/plans` | Utilizador |
| Exercícios | GET `/training/exercises` | Utilizador |
| Sessões de treino | GET `/training/sessions` | Utilizador |
| Medições e evolução | GET `/performance/measurements` | Utilizador |
| Medições recentes | GET `/performance/summary` | Utilizador |
| Agenda pessoal | GET `/agenda/activities` | Utilizador |
| Serviços profissionais | GET `/professionals/services` | Utilizador |
| As minhas reservas | GET `/agenda/professional-appointments` | Utilizador |
| Pagamentos simulados | GET `/payments` | Utilizador |
| Perfil pessoal | GET `/users/me` | Autenticado |
| Preferências | GET `/users/me/preferences` | Autenticado |
| Perfil profissional | GET `/professionals/me` | Profissional |
| Estado da candidatura | GET `/professionals/me/application-status` | Profissional |
| Capacidades profissionais | GET `/professionals/me/capabilities` | Profissional |
| Qualificações | GET `/professionals/me/qualifications` | Profissional |
| Serviços e ofertas | GET `/professionals/me/services` | Profissional |
| Regras de disponibilidade | GET `/agenda/professional/availability-rules` | Profissional |
| Exceções de disponibilidade | GET `/agenda/professional/availability-exceptions` | Profissional |
| Reservas recebidas | GET `/agenda/professional/appointments` | Profissional |
| Âmbitos atribuídos | GET `/management/me` | Gestor |
| Serviços sob gestão | GET `/management/services` | Gestor |
| Profissionais no âmbito | GET `/management/professionals` | Gestor |
| Reservas autorizadas | GET `/management/appointments` | Gestor |
| Estados financeiros simulados | GET `/management/payments` | Gestor |
| Indicadores operacionais (UTC) | GET `/management/dashboard` | Gestor |
| Casos de gestão | GET `/management/cases` | Gestor |
| Utilizadores e papéis | GET `/auth/administration/users` | Administrador |
| Pedidos de alteração de papel | GET `/auth/administration/role-requests` | Administrador |
| Gestores | GET `/management/operators` | Administrador |
| Âmbitos operacionais | GET `/management/scopes` | Administrador |
| Atribuições e aprovações independentes | GET `/management/assignments` | Administrador |
| Supervisão profissional | GET `/management/administration/professionals` | Administrador |
| Candidaturas profissionais | GET `/management/administration/applications` | Administrador |
| Serviços publicados | GET `/management/administration/services` | Administrador |
| Auditoria administrativa | GET `/auth/administration/audit` | Administrador |
| Notificações | GET `/notifications` | Autenticado |

## Inventário dos ficheiros locais

69 ficheiros locais, incluindo o trabalho recuperado e esta entrega. Nenhum foi preparado para commit.

- `documentation/frontend/administrator-access.md`
- `documentation/frontend/mfa-policy-review.md`
- `documentation/frontend/navigation-auth-dashboards.md`
- `documentation/frontend/password-recovery-proposal.md`
- `documentation/frontend/phase-6.3-plan.md`
- `documentation/frontend/phase-6.3-stage-a-auth-validation.md`
- `documentation/frontend/web-authentication.md`
- `frontend/README.md`
- `frontend/mobile/App.tsx`
- `frontend/mobile/package.json`
- `frontend/mobile/src/AuthScreen.tsx`
- `frontend/mobile/src/DomainScreen.tsx`
- `frontend/mobile/src/OperationalActions.tsx`
- `frontend/mobile/src/SecurityScreen.tsx`
- `frontend/package-lock.json`
- `frontend/shared/assets/figma/auth/activity-dark.svg`
- `frontend/shared/assets/figma/auth/activity-light.svg`
- `frontend/shared/assets/figma/auth/mail-dark.svg`
- `frontend/shared/assets/figma/auth/mail-light.svg`
- `frontend/shared/assets/figma/auth/progress-dark.svg`
- `frontend/shared/assets/figma/auth/progress-light.svg`
- `frontend/shared/assets/figma/auth/ring-dark.svg`
- `frontend/shared/assets/figma/auth/ring-light.svg`
- `frontend/shared/assets/provenance.json`
- `frontend/shared/src/api/client.ts`
- `frontend/shared/src/auth/decoders.ts`
- `frontend/shared/src/auth/errors.ts`
- `frontend/shared/src/auth/recovery.ts`
- `frontend/shared/src/auth/runtime.ts`
- `frontend/shared/src/auth/security.ts`
- `frontend/shared/src/auth/session.ts`
- `frontend/shared/src/auth/validation.ts`
- `frontend/shared/src/contracts/auth-security.ts`
- `frontend/shared/src/domain/commands.ts`
- `frontend/shared/src/domain/management-commands.ts`
- `frontend/shared/src/domain/resources.ts`
- `frontend/shared/src/domain/row-actions.ts`
- `frontend/shared/src/index.ts`
- `frontend/shared/src/navigation/application.ts`
- `frontend/shared/src/navigation/entry.ts`
- `frontend/shared/src/navigation/routes.ts`
- `frontend/tests/auth-web.test.ts`
- `frontend/tests/browser/auth-fixture.ts`
- `frontend/tests/browser/auth.spec.ts`
- `frontend/tests/browser/domain.spec.ts`
- `frontend/tests/browser/entry-recovery.spec.ts`
- `frontend/tests/browser/foundations.spec.ts`
- `frontend/tests/browser/refinement.spec.ts`
- `frontend/tests/contracts.typecheck.ts`
- `frontend/tests/dashboard.test.ts`
- `frontend/tests/domain.test.ts`
- `frontend/tests/entry-recovery.test.ts`
- `frontend/tests/fixtures/stepup-harness.tsx`
- `frontend/tests/mobile-auth.test.cjs`
- `frontend/tests/tsconfig.json`
- `frontend/web/src/App.tsx`
- `frontend/web/src/auth/AuthPage.tsx`
- `frontend/web/src/auth/RecoveryPage.tsx`
- `frontend/web/src/auth/SecurityPage.tsx`
- `frontend/web/src/auth/StepUpDialog.tsx`
- `frontend/web/src/auth/assets.ts`
- `frontend/web/src/auth/security.ts`
- `frontend/web/src/components/DomainPage.tsx`
- `frontend/web/src/components/ManagementActions.tsx`
- `frontend/web/src/components/PersonalActions.tsx`
- `frontend/web/src/components/dashboard.tsx`
- `frontend/web/src/components/ui.tsx`
- `frontend/web/src/navigation.ts`
- `frontend/web/src/styles.css`
