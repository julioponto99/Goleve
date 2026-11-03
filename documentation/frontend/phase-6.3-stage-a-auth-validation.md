# Fase 6.3 — Entrega da Etapa A e dependência Web 6.2

Data: 2026-11-02. Branch `integration/frontend-v1`.
Entrega posterior de navegação, autenticação Native e painéis documentada no
[relatório atual](navigation-auth-dashboards.md); os resultados históricos abaixo
não foram substituídos.
Este documento preserva a entrega inicial. Os resultados posteriores estão na
[retoma da Fase 6.2 Web](#retoma-da-fase-62-web), no final.
O estado inicial estava limpo, um commit à frente da origem; não foram criados
commits, nem executados push/merge nesta tarefa.

## Alcance efetivamente entregue

Foi seguida a sequência aprovada pelo titular:
**auditoria → Etapa A → autenticação Web 6.2 → apresentação dos resultados**.
As etapas B–E de operações dos quatro perfis **não foram iniciadas**.
Não se declara que os quatro dashboards estejam funcionalmente integrados.

- Quatro estruturas de painel com papel exato confirmado no Auth, navegação,
  breadcrumbs, cartões, estado de indisponibilidade e disposição responsiva.
- Login, registo normal, MFA com enrolment manual TOTP, recuperação de uso único,
  consulta de sessões próprias, expiração, logout e revalidação explícita.
- Diálogo/adaptador de step-up com seis vínculos Auth fechados, validado num
  harness de testes. A ligação às páginas administrativas da Etapa E está pendente.
- Mantidos a paleta, Light inicial, Dark persistente, fontes Inter, ícones Web e
  PNG oficiais. Nenhum dashboard mostra métricas fictícias como dados reais.

O [plano e auditoria](phase-6.3-plan.md) documenta os métodos, DTOs, permissões e
dependências por perfil. O [guia de autenticação](web-authentication.md) descreve
os contratos e limites. O histórico das Fases 6.1/6.1.1 foi preservado.

## Ecrãs e contratos usados nesta entrega

| Ecrã / componente | Endpoints efetivamente ligados | Controlo |
|---|---|---|
| `/entrar` | `POST /auth/login`, depois `GET /auth/me` | Sem papel vindo de URL/estado local; challenge MFA não abre painel |
| `/criar-conta` | `POST /auth/register`, depois `GET /auth/me` | Apenas name/email/password; registo público sempre utilizador; confirmação só local |
| `/autenticacao/mfa` | `POST /auth/mfa/enroll`, `POST /auth/mfa/complete`, depois `/auth/me` | Desafio em memória, password para enrolment, fator validado no Auth; dez códigos de apresentação única |
| `/conta/seguranca` | `GET /auth/sessions`, `GET /auth/me`, `POST /auth/logout` | Sessões próprias, JWT em memória; nenhuma rota de revogação individual inventada |
| Diálogo step-up, somente teste isolado nesta etapa | `POST /auth/admin/step-up` e uma das seis mutações Auth tipadas | Ação/alvo/versão/motivo exatos, prova transitória e uso único; sem seletor público de comandos |
| `/painel`, `/painel/<papel>` | Nenhum endpoint de dados de domínio nesta etapa; identidade obtida em Auth | Rotas por papel, módulos assinalados em preparação, sem métricas ou mutações simuladas no produto |

Foram reutilizados `Card`, `Badge`, `Button`, `TextField`, `Dialog`, `LoadingState`,
`MessageState`, cliente HTTP, controlador de sessão, armazenamento em memória,
navegação e tokens. `TextField` recebeu um espaço para controlo lateral, mantendo
a ligação acessível do erro; o botão Mostrar/Ocultar não se desloca para a mensagem
de validação. Não foi acrescentada dependência npm.

O OpenAPI genérico de `parameters` gerava `Record<string,never>` no step-up.
O SDK tem agora um DTO local **restrito às seis ações Auth verificadas no código**,
sem casts para pedidos arbitrários, alteração do OpenAPI ou dos gerados. Os
vínculos específicos de Management/Professional continuam para a Etapa E.

## Segurança e revisão

- Identidade e papel atuais são confirmados no Auth; o servidor continua a
  autorizar cada operação. Menu e guard não concedem elegibilidade, âmbito ou papel.
- Administrador não é aceite a partir de uma resposta de login normal sem o
  percurso MFA. O Auth também rejeita sessões administrativas sem MFA no restauro.
- Passwords, desafio, segredo TOTP, fatores, códigos e provas não são persistidos
  em localStorage/sessionStorage, URLs HTTP, histórico ou logs. A Web mantém JWT
  só em memória. Reload pede novo login; não se inventou refresh token.
- A tentativa pendente é invalidada por epoch ao abandonar login/MFA. Respostas
  tardias não redirecionam nem reabrem acesso. Expiração MFA também limpa qualquer
  credencial provisória, incluindo com `/auth/me` ainda pendente.
- Step-up revalida identidade, fixa intenção imutável e verifica sessão/prazo;
  `run()` não pode ser usado duas vezes, nem sob concorrência local. A validação e
  consumo atómico no servidor continuam obrigatórios. Falhas incertas não têm retry.
- Uma revisão independente de código verificou vínculos e guards. Os problemas
  encontrados de callback tardio, projeção do DTO e apresentação dos menus foram
  corrigidos. Isto não é uma auditoria de produção nem validação do servidor real.
- Não houve acesso a credenciais privadas, provisionamento ou registo de contas
  na base existente. Não há identidades simuladas no runtime do produto.

## Testes e resultados

| Verificação | Resultado | Natureza |
|---|---|---|
| `npm.cmd run typecheck` | Web, Mobile, shared e testes aprovados | Estática, incluindo contratos negativos de step-up |
| `npm.cmd run build:web` | TypeScript + Vite aprovados | Build local, sem Docker |
| `npm.cmd test` | **69 aprovados, 0 falhados** | Unitários/contratos com HTTP e storage simulados; inclui regressão anterior |
| `npm.cmd run test:web -- --output=.cache/phase-6.3/playwright` | **72 aprovados, 0 falhados**, 36 cenários × 2 layouts | Browser real; respostas Auth/domínio de teste isoladas |
| `npm.cmd run contracts:check` | **215 operações / 170 caminhos** preservados | Confronto estático com contratos e rotas existentes |
| `GET http://127.0.0.1:64344/health` | **200** | HTTP real, público, apenas leitura |
| `GET http://127.0.0.1:64344/ready` | **200** | HTTP real, público, apenas leitura |
| `OPTIONS /auth/login` com Origin `http://127.0.0.1:5173` | **204**, origem e headers necessários autorizados | Preflight CORS real, sem login ou credenciais |
| Fecho Git/documental | **35 ficheiros** revistos; **82 ligações locais válidas**; sem whitespace indevido ou padrões de segredos; diff checks limpos | Tokens, ícones existentes e PNG oficiais confirmados iguais ao HEAD; envs e caches ignorados |

Os testes abrangem os quatro perfis, negação entre perfis, URLs privadas, payload
de registo, password UTF-8, 401/403/409/429, resposta de rede perdida, falha de
dependência e revalidação, challenge e sessão expirados, MFA inválido/recuperação,
enrolment/códigos únicos, logout/reload, cancelamento de login e MFA pendentes,
confirmação step-up, replay, concorrência e resultado incerto. Incluem Light/Dark,
teclado, validação acessível, layout entre 320 e 1440 px e regressão das fundações.

**Não houve login/registo/MFA/step-up autenticados contra a API real.** O teste de
browser executa a interface e o cliente reais com respostas HTTP interceptadas.
Não prova a integração autenticada do frontend com o Auth implantado, MFA real
numa aplicação autenticadora ou governação administrativa da stack.

### Falhas encontradas durante o desenvolvimento

- A primeira compilação expôs o tipo genérico de `parameters` e a ausência das
  definições Vite no tsconfig dos novos testes. Foram corrigidos apenas os tipos
  frontend e a configuração dos testes, sem mudar contratos backend.
- Um teste novo de registo detetou que um campo extra `confirmation` influenciava
  a validação do SDK. O método passou a validar só o DTO apropriado e a projetar
  explicitamente os campos públicos. O teste passou sem relaxar validações Auth.
- Uma execução intermédia Playwright terminou **67/68**, porque o Chrome não
  carregou `src/main.tsx`: `net::ERR_NO_BUFFER_SPACE`. O trace indicava documento
  vazio, não uma falha funcional de tema. A origem interna do esgotamento de
  buffers não foi comprovada. Depois de terminar as compilações paralelas,
  mediram-se 2,63 GiB de memória Windows livre e a execução final passou 72/72,
  sem aumentar timeouts/retries ou alterar o teste para ocultar a falha.
- Warnings `MockTimers` experimental e NO_COLOR/FORCE_COLOR não foram falhas da UI.

## Matriz consolidada dos quatro perfis

| Perfil | Ecrãs/base entregues | Auth/navegação testadas | Operações de domínio | Validação com API autenticada real / bloqueios |
|---|---|---|---|---|
| Utilizador | Painel próprio, cartões de áreas, sessão e segurança | Login/registo, isolamento, logout e expiração em testes isolados | Hidratação/treinos/medições/agenda ainda não ligados; Etapa B | Pendente; serviços profissionais B02–B07 e IA desativada |
| Profissional | Painel próprio e módulos perfil/serviços/disponibilidade/reservas em preparação | Login e guard de papel em testes isolados | Nenhuma publicação, disponibilidade ou reserva executada; Etapa C | Pendente; elegibilidade não inferida, B02–B06 abertos |
| Gestor | Painel próprio e módulos âmbitos/serviços/indicadores/casos em preparação | Login e guard de papel em testes isolados | Nenhuma atribuição ou operação de âmbito executada; Etapa D | Pendente; B08/B09, sem permissões globais |
| Administrador | Painel próprio, MFA/enrolment e componente step-up | Percurso MFA e isolamento testados com respostas fictícias | Nenhum utilizador/papel/atribuição alterado; Etapa E | Pendente; provisionamento legítimo/quórum, B08–B10 e MFA integrado real |

## Capturas reais da interface

São renders reais de browser, usando **identidades e respostas fictícias de teste**.
Os cartões não contêm métricas de exemplo; não são evidência de integração com a
API real. Não foram capturados segredos/fatores/códigos no relatório.
Ficheiros em `.cache`, ignorados pelo Git.

| Ecrã | Light | Dark |
|---|---|---|
| Login Web | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-login-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-login-dark.png) |
| Utilizador desktop | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-utilizador-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-utilizador-dark.png) |
| Profissional desktop | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-profissional-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-profissional-dark.png) |
| Gestor desktop | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-gestor-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-gestor-dark.png) |
| Administrador desktop | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-administrador-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/desktop-administrador-dark.png) |
| Utilizador Web responsiva | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-utilizador-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-utilizador-dark.png) |
| Profissional Web responsiva | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-profissional-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-profissional-dark.png) |
| Gestor Web responsiva | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-gestor-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-gestor-dark.png) |
| Administrador Web responsiva | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-administrador-light.png) | [PNG](../../frontend/.cache/phase-6.3/screenshots/responsive-administrador-dark.png) |

As capturas Login são de 1440 px; os painéis foram capturados a 1440 e 402 px.
Após simplificar apenas textos dos cartões, foram novamente executados os oito
casos por perfil para atualizar as capturas, sem somar repetições à contagem acima.

## Pendências antes das etapas B–E

1. Validação autenticada com Auth real, contas fictícias autorizadas num ambiente
   apropriado e sem modificar dados existentes. O teste de TOTP/step-up privilegiado
   exige provisionamento legítimo e quórum; não se criaram contas para o desbloquear.
2. Implementar os módulos por perfil conforme o plano, depois da apresentação
   desta entrega. Não há dashboards completos de domínio neste estado.
3. Ligar o componente step-up aos formulários específicos e DTOs exatos das ações
   de Administração/Management/Professional, mantendo aprovação independente.
4. Os **12 bloqueios B01–B10/R01–R02** da [prontidão](../release-v1/readiness.md)
   continuam inalterados, tal como o histórico dos verificadores LF/CRLF/Swagger.
5. Conservar configuração de origin por ambiente; loopback não é o servidor remoto.
   Sem rede/TLS e instalação aprovadas, não prometer uso noutro computador.

Backend, OpenAPI/gerados, Docker, dados, volumes, credenciais e main não foram
alterados. Não se declara prontidão para produção.

## Ficheiros alterados nesta entrega

12 modificados e 23 novos (35 ficheiros), todos em frontend/ ou documentation/frontend/.

- [documentation/frontend/phase-6.3-plan.md](phase-6.3-plan.md)
- [documentation/frontend/phase-6.3-stage-a-auth-validation.md](phase-6.3-stage-a-auth-validation.md)
- [documentation/frontend/web-authentication.md](web-authentication.md)
- [frontend/README.md](../../frontend/README.md)
- [frontend/shared/assets/figma/auth/activity-dark.svg](../../frontend/shared/assets/figma/auth/activity-dark.svg)
- [frontend/shared/assets/figma/auth/activity-light.svg](../../frontend/shared/assets/figma/auth/activity-light.svg)
- [frontend/shared/assets/figma/auth/progress-dark.svg](../../frontend/shared/assets/figma/auth/progress-dark.svg)
- [frontend/shared/assets/figma/auth/progress-light.svg](../../frontend/shared/assets/figma/auth/progress-light.svg)
- [frontend/shared/assets/figma/auth/ring-dark.svg](../../frontend/shared/assets/figma/auth/ring-dark.svg)
- [frontend/shared/assets/figma/auth/ring-light.svg](../../frontend/shared/assets/figma/auth/ring-light.svg)
- [frontend/shared/assets/provenance.json](../../frontend/shared/assets/provenance.json)
- [frontend/shared/src/api/client.ts](../../frontend/shared/src/api/client.ts)
- [frontend/shared/src/auth/decoders.ts](../../frontend/shared/src/auth/decoders.ts)
- [frontend/shared/src/auth/session.ts](../../frontend/shared/src/auth/session.ts)
- [frontend/shared/src/auth/validation.ts](../../frontend/shared/src/auth/validation.ts)
- [frontend/shared/src/contracts/auth-security.ts](../../frontend/shared/src/contracts/auth-security.ts)
- [frontend/shared/src/index.ts](../../frontend/shared/src/index.ts)
- [frontend/tests/auth-web.test.ts](../../frontend/tests/auth-web.test.ts)
- [frontend/tests/browser/auth-fixture.ts](../../frontend/tests/browser/auth-fixture.ts)
- [frontend/tests/browser/auth.spec.ts](../../frontend/tests/browser/auth.spec.ts)
- [frontend/tests/browser/foundations.spec.ts](../../frontend/tests/browser/foundations.spec.ts)
- [frontend/tests/contracts.typecheck.ts](../../frontend/tests/contracts.typecheck.ts)
- [frontend/tests/dashboard.test.ts](../../frontend/tests/dashboard.test.ts)
- [frontend/tests/fixtures/stepup-harness.tsx](../../frontend/tests/fixtures/stepup-harness.tsx)
- [frontend/tests/tsconfig.json](../../frontend/tests/tsconfig.json)
- [frontend/web/src/App.tsx](../../frontend/web/src/App.tsx)
- [frontend/web/src/auth/AuthPage.tsx](../../frontend/web/src/auth/AuthPage.tsx)
- [frontend/web/src/auth/SecurityPage.tsx](../../frontend/web/src/auth/SecurityPage.tsx)
- [frontend/web/src/auth/StepUpDialog.tsx](../../frontend/web/src/auth/StepUpDialog.tsx)
- [frontend/web/src/auth/assets.ts](../../frontend/web/src/auth/assets.ts)
- [frontend/web/src/auth/security.ts](../../frontend/web/src/auth/security.ts)
- [frontend/web/src/components/dashboard.tsx](../../frontend/web/src/components/dashboard.tsx)
- [frontend/web/src/components/ui.tsx](../../frontend/web/src/components/ui.tsx)
- [frontend/web/src/navigation.ts](../../frontend/web/src/navigation.ts)
- [frontend/web/src/styles.css](../../frontend/web/src/styles.css)

Artefactos de build, resultados, traces e capturas em .cache/test-results/dist estão
ignorados e não integram esta lista. Não há alterações em Mobile, microserviços,
Compose, OpenAPI/gerados ou ficheiros de credenciais. As alterações partilhadas
foram compiladas e verificadas pela regressão local existente.

## Retoma da Fase 6.2 Web

Data: 2026-11-02. Recuperados **35 ficheiros da entrega: 12 modificados e 23 novos**,
todos em frontend/ ou documentation/frontend/. O commit local anterior foi
preservado; a branch continua integration/frontend-v1, um commit à frente da origem.
Não se recomeçou a implementação. Layout, navegação, breadcrumbs, menus/guards,
estados de acesso e módulos em preparação da Etapa A foram preservados.

### Correções comprovadas nesta retoma

| Falha reproduzida antes da correção | Correção mínima |
|---|---|
| Cancelar durante `storage.clear` ainda permitia enviar login/registo | Revalidar epoch depois da espera, antes do HTTP; o teste exige zero pedidos |
| Limpeza de uma tentativa antiga substituía o estado de um login mais recente | Revalidar epoch também depois do await de limpeza |
| Falha de `/auth/me` após MFA conservava o desafio consumido e o temporizador | Descartar credencial provisória, desafio e timer; outra conclusão é recusada antes do HTTP |
| Resultado incerto no step-up reativava a confirmação | Bloquear a mesma ação/alvo/versão, incluindo fechar/reabrir o diálogo, e exigir consulta/reconciliação pelo proprietário |

As quatro regressões falharam antes das respetivas correções e passaram depois.
Não se alteraram contratos, controlos de autorização ou validadores backend.
O bloqueio do diálogo é transitório: não substitui idempotência no serviço nem
persiste após reload. A Etapa E terá de consultar estado/histórico antes de preparar
outra intenção; não existe um botão genérico para contornar esse processo.

### Ficheiros ajustados nesta retoma

- `frontend/shared/src/auth/session.ts`: cancelamento, epoch e descarte de desafio.
- `frontend/web/src/auth/StepUpDialog.tsx`: bloqueio após resultado incerto.
- `frontend/tests/auth-web.test.ts`: três regressões determinísticas novas.
- `frontend/tests/browser/auth.spec.ts`: resultado incerto e reabertura do diálogo.
- `frontend/README.md`: arranque e validação sem contas ou dados existentes.
- `documentation/frontend/web-authentication.md`: garantias e limites atualizados.
- Este relatório: retoma e resultados, sem apagar o histórico anterior.

### Resultados atuais

| Verificação executada nesta retoma | Resultado |
|---|---|
| TypeScript Web/Mobile/shared e testes | Aprovado |
| Build Web padrão | Aprovado |
| Build adicional com origin HTTPS fictícia | Aprovado em `.cache/phase-6.2-resume/configured-build`; runtime Auth incluído, sem fixtures ou URLs temporárias Figma |
| Testes unitários/contratos | **72 aprovados, 0 falhados**, incluindo a Etapa A |
| Playwright | **74 aprovados, 0 falhados**, 37 cenários em desktop e Web responsiva |
| OpenAPI | **215 operações / 170 caminhos** preservados |

O build adicional usou uma variável pública temporária, restaurada no fim, sem
contactar o destino fictício nem substituir dist. Todos os testes de autenticação
usaram HTTP/storage simulados; Playwright executou o browser e o cliente reais.
Os HTTP 200/200 e preflight 204 anteriores são evidência histórica, não uma nova
validação autenticada com API real. Não foram criadas contas nem usados dados reais.

### Abrir e testar

Com as dependências já instaladas, a partir da raiz:

```powershell
cd frontend
npm.cmd run dev:web
```

Abrir `http://127.0.0.1:5173/entrar`. Registo: `/criar-conta`; MFA:
`/autenticacao/mfa`; sessões próprias: `/conta/seguranca`. O Gateway local
documentado é `http://127.0.0.1:64344`; outro host exige configuração pública própria.
Não copiar o .env do backend. O JWT mantém-se em memória; reload exige novo login.
Usar só contas autorizadas, sem criar contas na base existente apenas para testar.

Para validar sem modificar dados:

```powershell
npm.cmd run test:web -- --output=.cache/phase-6.2-resume/final
```

O teste usa servidor próprio em 127.0.0.1:5174 e respostas simuladas. Não inicia
Docker nem interrompe outro servidor. A validação autenticada com API real e a
ligação do step-up às páginas administrativas continuam pendentes. Permanecem os
12 bloqueios E2E, elegibilidade profissional real indisponível, pagamentos reais
desativados, reservas condicionadas e contas administrativas não provisionadas.
**As etapas B–E não foram iniciadas.** Sem migrações, commit, push ou merge.
