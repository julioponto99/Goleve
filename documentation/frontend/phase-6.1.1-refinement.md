# Fase 6.1.1 — Refinamento das fundações Web e Mobile

Data: 2026-11-02. Branch `integration/frontend-v1`. Desenvolvimento local;
sem commit, push, merge ou alterações ao backend/infraestrutura.

## Auditoria e âmbito

Foram revistos Web, Mobile, shared, [matriz de 42 interações](figma-backend-matrix.md),
[inventário de 92 frames](figma-inventory.md),
[OpenAPI público](../api/backend-release-v1.openapi.json),
[guia frontend](../release-v1/frontend.md) e [prontidão](../release-v1/readiness.md).
Os ficheiros anteriores, incluindo os não versionados, foram preservados.
O [relatório 6.1](phase-6.1-foundations.md) mantém os resultados históricos.

O Figma consultado foi exclusivamente
[dseqmbo4hzK6sFcOQl5hld](https://www.figma.com/design/dseqmbo4hzK6sFcOQl5hld/GoLeve?node-id=16-42).
Sessão MCP `7ea12840-0a29-4d84-85a6-f534969db422`: contexto e screenshot da barra
Mobile `178:42` e sidebar Light `2031:641`; leitura de efeitos, fonte e dimensões
de `178:42/43/44/46/56/83/85/95`. Não se alterou o ficheiro Figma.
Os 92 frames não foram implementados nesta fase.

### Defeitos identificados e correções

| Evidência anterior | Correção |
|---|---|
| Ícones Mobile exportados a 1×: 16–23 px, insuficientes para manter resolução em ecrãs 2×/3× | Mesmos quatro glifos Font Awesome 6 Free Solid do Figma, fonte local e um único glifo por tab; slot fixo 24 × 24, tamanho 18 e cor/fundo de seleção |
| Light/Dark perdia-se ao recarregar/reabrir; Web seguia o sistema | Web começa em Light; preferência explícita persistida localmente. Mobile começa no sistema e restaura a escolha protegida |
| Paleta Light azul/cinzenta e destaque muito saturado | Paleta aprovada mais suave, sidebar branca, cartões com sombra discreta apenas em Light |
| Rota `/agenda` existia, mas não havia ligação no menu Web | Entrada Agenda pessoal, conservando a proteção de sessão e indisponibilidade do formulário |
| Abrir menu estreito e alargar para desktop deixava `inert` ativo | Fecho ao atravessar o breakpoint, libertação do scroll e do conteúdo; foco/ciclo Tab/Escape preservados |
| Diálogo genérico podia notificar o fecho duas vezes: `cancel` e `close` | Uma notificação pelo evento `close`; botão e Escape usam o fecho nativo e restituem o foco |
| Reserva fixa de espaço sob a barra Mobile não acompanhava aumento da sua altura | Medição `onLayout`, padding de scroll calculado com a altura real e safe area; cabeçalho permite redução do espaço da marca |
| Páginas privadas anónimas só indicavam necessidade de sessão | Acrescentada indicação explícita das funcionalidades ainda não disponíveis |

**Limite do diagnóstico dos ícones:** não foram encontradas sombras, filtros,
elevation, transforms ou ícones duplicados na barra Native anterior. Os SVG Web
também não contêm filtros. Os glifos Figma inspecionados têm `effects=[]`;
o componente Light tem uma sombra do conjunto, não dos glifos. A baixa resolução
dos PNG é um defeito comprovado e foi removida do percurso de renderização.
O relato de sombra/duplicação num dispositivo não foi reproduzido aqui; não se
atribui uma causa nativa definitiva nem se declara validação visual Android/iPhone.
Não se removeram sombras globalmente. Não existe barra inferior Web nesta shell.

## Cores, temas e recursos

| Token | Light | Dark |
|---|---|---|
| Fundo | `#F7F9F6` | `#0B1220` |
| Cartão/sidebar | `#FFFFFF` | `#162235` |
| Texto | `#1F2937` | `#F3F6FB` |
| Destaque | `#A3D65C` | `#A3D65C` |
| Borda | `#E8EEE6` | `#2A394D` |
| Texto selecionado | `#42651B` | `#A3D65C` |
| Fundo selecionado | `#EAF2E1` | `#283B2A` |

O verde mais escuro no texto Light preserva contraste. Testes calculam WCAG AA
≥ 4,5:1 para texto normal, secundário, selecionado, erro e botões nas superfícies
testadas; não equivalem a uma auditoria de acessibilidade completa. A tipografia
Inter e os SVG Web originais do Figma foram preservados. Sem gradientes/glow novos.

Web guarda só `light|dark|system` em `goleve.ui.theme.v1`, nunca o token.
Mobile usa SecureStore com chave distinta da sessão e `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
Escritas são serializadas; restauro lento não substitui uma escolha recente.
Falha de armazenamento é indicada e não bloqueia a alternância. Não há escrita
automática no User Service nem sincronização de preferências entre dispositivos.

Os PNG oficiais 512 × 512 de `frontend/branding/` e todas as cópias continuam
byte a byte iguais, confirmados pelo teste de integridade. Dark usa a variante
escura; Light usa a variante lima. O placeholder Mobile já estava resolvido na 6.1.

A única dependência acrescentada foi `@fortawesome/fontawesome-free@6.7.2`,
para a fonte Solid original usada no Figma (`f015`, `f44b`, `e473`, `f544`).
Não acrescenta módulo nativo ou biblioteca de navegação.
Ver [release oficial](https://github.com/FortAwesome/Font-Awesome/releases/tag/6.7.2),
[carregamento Expo Font](https://docs.expo.dev/versions/latest/sdk/font/) e
[licença preservada](../../frontend/shared/assets/licenses/fontawesome-free-6.7.2.txt).
Os 16 PNG Figma antigos não foram apagados; deixaram de ser importados no bundle.
Os bundles finais contêm seis recursos: três fontes Inter, uma fonte de ícones e
os dois PNG GoLeve. A fonte acrescenta aproximadamente 426 KB antes de compressão.

## Auditoria das interações existentes

Todas as verificações HTTP da interface usam dependências simuladas; não foram
usadas contas reais nem feitas escritas em serviços de domínio.

| Interação / expectativa Figma | Implementação e comportamento real | Backend / autorização | Estado e limite |
|---|---|---|---|
| Marca e início; voltar ao início | Web `App.tsx`, Mobile `App.tsx`; marca oficial, rotas e botão de regresso | Nenhuma API | Funciona; não autentica por timeout de splash |
| Sidebar/menu, navegar pelas áreas | Web links e histórico do browser; Native drawer, tabs e BackHandler | Navegação local; áreas privadas exigem sessão confirmada | Web testada; Native estrutura/handlers com mocks, BackHandler/gestos no dispositivo pendentes |
| Barra inferior e estados ativos | Native `BottomNavigation.tsx`; quatro tabs, um glifo por tab, safe area | Não concede permissões nem faz chamadas privadas | Estrutura, estados, destinos e inset 0/34 testados com mocks; visual nativa pendente. Web usa drawer |
| Alternância Light/Dark | Web `theme.ts`, Mobile `theme.ts`, shared `theme-store.ts`; persistência e aviso se falhar | Preferência local pré-login; API User futura é `GET/PATCH/PUT /users/me/preferences` | Funciona na Web; adapter Native testado com SecureStore simulado |
| Abrir/fechar menu | Bloqueia scroll e conteúdo de fundo na Web; Tab/Escape/foco; fecha ao alargar | Sem endpoint | Web testada; drawer/Modal nativo ainda exige dispositivo |
| Verificar ligação | Botão desativado enquanto carrega; sucesso só após HTTP; erro explícito e retry manual | `GET /health`, público | Testado com 200, 503 e rede recusada; não significa readiness dos microserviços |
| Explorar áreas | Web navega para `/treinos` | Sem escrita; dados Training exigem Auth | Funciona como navegação; não cria treino ou marcação |
| Diálogo, botões e campo genéricos | Web `ui.tsx`; fecho único, retorno de foco, erro ligado ao campo | Sem API; fixture de teste fora do produto | Testados num harness isolado. Não existem formulários de negócio expostos |
| Sessão, conta e logout | UI só mostra identidade/logout quando Auth validou sessão; SDK revalida e limpa credenciais | `GET /auth/me`, `POST /auth/logout`; Bearer com sessão atual | SDK testado com mocks, incluindo revogação incerta; login/registo/MFA visuais continuam 6.2 |
| Perfil, hidratação, treinos, medidas, histórico, agenda | Páginas de estado, sessão necessária e indicação de indisponibilidade | Contratos reais na matriz; Performance é dono das medições; User do perfil/preferências | Parcial: navegação, sem dashboards, dados pessoais fabricados ou escritas duplicadas |
| Coach IA, reservas, pagamentos e áreas privilegiadas | Sem novas operações; Coach explicitamente desativado | Regras e permissões dos proprietários inalteradas | Indisponíveis nesta interface; não há aprovações simuladas ou pagamentos reais |
| URL inexistente e falhas de API | Página não encontrada, erro seguro, regresso ao início | Cliente mantém lista pública fechada e rejeita endpoints técnicos | Testado; não expõe `/internal/*` nem confunde rota UI com endpoint |

## Validação executada

| Verificação | Resultado final |
|---|---|
| `npm.cmd run typecheck` | Web, Mobile, shared e testes passam |
| `npm.cmd run build:web` | TypeScript e Vite passam |
| `npm.cmd test` | **52 aprovados, 0 falhados**; incluem 11 casos novos face aos 41 anteriores |
| `npm.cmd run test:web` | **36 execuções aprovadas, 0 falhadas**: 18 cenários em desktop e Web responsiva |
| Reexecuções direcionadas finais | 2 de navegação após aviso de indisponibilidade e 2 de screenshots/consola; não somadas como casos distintos |
| `npm.cmd run check:mobile` | Bundles Hermes Android e iOS passam, seis assets finais; um worker, offline |
| `npm.cmd run contracts:check` | 215 operações, 170 caminhos; contratos/gerados sem alterações |
| Integridade da marca | Originais e cópias PNG 512 × 512 preservados |
| Estático/Git | `git diff --check` e cached check limpos; 123 ficheiros locais não versionados inspecionados, sem whitespace indevido ou padrões de segredos; 190 ligações locais válidas; nenhum ficheiro previamente versionado alterado |

Os testes cobrem: preferência persistente/reload/corridas de restauro, storage
indisponível, contraste, glifos/estados/ausência de duplicação, safe areas simuladas,
todos os destinos da shell, 320/375/402/768/1024/1440 px, dois temas, ciclo de foco,
redimensionamento do drawer, diálogo, 404, carregamento, submissão repetida e retry
manual. Consola e exceções verificadas no percurso nominal Light/Dark: sem erros.
Erros de transporte dos cenários negativos são intencionais.

A primeira compilação dos novos testes detetou acesso a `inert` sem narrowing
HTMLElement; corrigido no teste e compilação final aprovada. Warnings NO_COLOR /
FORCE_COLOR do runner não foram falhas da aplicação.

### Capturas reais Web

Antes: capturas locais da entrega 6.1, preservadas antes de alterar o código.
Depois: capturas Playwright da implementação final, ambas sem resultados pessoais
fictícios. Os artefactos estão em `.cache`, ignorados pelo Git; podem ser regenerados
com o cenário `responsive layout works` e não são capturas Android/iPhone.

| Layout | Antes | Depois |
|---|---|---|
| Desktop Light | [PNG](../../frontend/.cache/phase-6.1.1/before/desktop-shell-light.png) | [PNG](../../frontend/.cache/phase-6.1.1/after/desktop-shell-light.png) |
| Desktop Dark | [PNG](../../frontend/.cache/phase-6.1.1/before/desktop-shell-dark.png) | [PNG](../../frontend/.cache/phase-6.1.1/after/desktop-shell-dark.png) |
| Web responsiva Light | [PNG](../../frontend/.cache/phase-6.1.1/before/responsive-shell-light.png) | [PNG](../../frontend/.cache/phase-6.1.1/after/responsive-shell-light.png) |
| Web responsiva Dark | [PNG](../../frontend/.cache/phase-6.1.1/before/responsive-shell-dark.png) | [PNG](../../frontend/.cache/phase-6.1.1/after/responsive-shell-dark.png) |

## Ficheiros desta fase

- Web: `frontend/web/index.html`, `src/App.tsx`, `src/styles.css`,
  `src/components/ui.tsx`; novo `src/theme.ts`.
- Mobile: `frontend/mobile/App.tsx`, `package.json`, `src/assets.ts`;
  novos `src/BottomNavigation.tsx` e `src/theme.ts`.
- Shared: `frontend/shared/src/index.ts`, `src/design/tokens.ts`;
  novo `src/design/theme-store.ts` e licença em `assets/licenses/`.
- Tooling: `frontend/package-lock.json`, `frontend/tests/tsconfig.json`,
  `frontend/tests/browser/foundations.spec.ts`; novos `theme.test.ts`,
  `mobile-navigation.test.cjs`, `browser/refinement.spec.ts`,
  `fixtures/ui-harness.tsx`.
- Documentação: `frontend/README.md`, `documentation/frontend/phase-6.1-foundations.md`,
  `phase-6.1-files.md`, este relatório e proveniência dos recursos.
- Artefactos temporários ignorados: bundles/build, resultados Playwright e capturas
  antes/depois em `frontend/.cache/phase-6.1.1/`; não são candidatos a commit.

## Pendências

- Android/iPhone: execução real, inspeção visual de glifos, acessibilidade, fontes
  ampliadas, teclado/scroll, orientação, BackHandler e Keychain/Keystore. Os mocks
  e bundles **não validam estes comportamentos nativos**.
- Para dispositivos físicos, usar origin HTTPS e rede de desenvolvimento aprovados.
  `127.0.0.1` no iPhone refere-se ao iPhone, não ao Windows. Não se alteraram os
  validadores de origin nem se expuseram serviços internos.
- Fase 6.2: UI de autenticação, registo, expiração, MFA/step-up; após autenticação,
  sincronização de preferências User só através dos contratos e precondições reais.
- Fases 6.3–6.7: dashboards/consultas/formulários de domínio e percursos profissionais,
  financeiros e privilegiados segundo a matriz, sem inventar DTOs ou elegibilidade.
- Os **12 bloqueios B01–B10/R01–R02** continuam abertos. O diagnóstico LF/CRLF e hash
  Swagger da 6.1 permanece documentado, sem alterar verificadores do backend.

Não foram usados Docker, bases, credenciais privadas ou serviços principais.
Não se declara prontidão para produção.
