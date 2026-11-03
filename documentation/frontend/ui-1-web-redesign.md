# UI-1 — Redesign Web GoLeve

Data: 2026-11-02. Branch `integration/frontend-v1`. O trabalho local das fases
anteriores foi preservado; não foi executado commit, push ou merge.

## Referência e decisões visuais

Figma oficial `dseqmbo4hzK6sFcOQl5hld`, página Web `0:1`, dashboards Light
`2031:3174` e Dark `193:2`, consultados por MCP nesta entrega. Sessão de análise
`13c9692b-f3e0-4e26-9868-dea0550e9104`. Foram obtidos contexto e screenshots.

Reutilizada a composição: boas-vindas, indicadores compactos, agenda, hidratação,
evolução e ações. Os frames contêm cores e números ilustrativos diferentes dos
aprovados no projeto. Prevalecem `#F7F9F6`, superfície branca, `#A3D65C`, Dark e
Inter existentes. Logótipos PNG e SVG Figma já guardados continuam inalterados.
Não são copiados nome, peso, calorias, pontos, passos ou estado “sincronizado” do
protótipo. O rodapé mostra a identidade/papel confirmados pelo Auth.

## Layout e navegação

- Header fixo de 80 px; sidebar fixa de 240 px no desktop e rail de 80 px quando
  recolhida. Apenas o conteúdo central rola no dashboard; sem scroll da página
  exterior ou barra horizontal. O fundo preenche a viewport, sem moldura branca.
- Sidebar dividida em marca, área de navegação e rodapé. Avatar, nome, papel e
  logout permanecem fora do scroll de navegação. Em viewports de pouca altura,
  só o menu pode ter scroll adicional, necessário para alcançar todos os destinos.
- Principal, Serviços e Conta são derivados das rotas autorizadas por papel.
  Medições, agenda e histórico ficam no grupo pessoal; outros perfis conservam
  apenas os módulos que já possuem. Coach desativado não aparece como destino
  ativo. A URL existente continua a apresentar indisponibilidade se for aberta.
- Desktop a partir de 1024 px: hamburger expande/recolhe, ícones mantêm rótulos
  acessíveis e tooltips de hover/foco. Preferência visual em
  `goleve.ui.sidebar.v1` (`collapsed`/`expanded`), sem identidade ou tokens.
  Falha de storage não bloqueia o menu e é comunicada.
- Tablet/telemóvel: overlay com backdrop, foco contido, Escape, botão fechar e
  fecho ao selecionar rota. Resize restaura interação com o conteúdo.
- Header inclui contexto/breadcrumb, consulta de ligação existente, notificações,
  tema e conta no desktop. Os botões têm destinos reais; não há contagem de
  notificações inventada. Há apenas um botão de abrir/alternar o menu.
- `/conta/definicoes` é uma rota **frontend** privada que consulta as preferências
  User existentes. Não cria contrato backend nem simula gravações de definições.

## Dashboard pessoal e limites dos dados

| Área | Fonte existente | Apresentação |
|---|---|---|
| Hidratação | GET `/hydration/intakes/daily` | Litros, meta, percentagem e anel/barra; progresso visual limitado a 100%, texto preserva o valor real; meta ausente é indicada |
| Plano | GET `/training/plans` | Plano ativo disponível, ambiente/detalhes quando fornecidos; não inventa data de treino |
| Sessão | GET `/training/sessions` | Apenas estado atual running/paused confirmado; sem estimativas de calorias |
| Agenda pessoal | GET `/agenda/activities` | Pedidos próprios de atividades planeadas nos próximos sete dias; calendário e três entradas recentes da lista carregada |
| Peso/evolução | GET `/performance/measurements` | Até 100 registos recentes consultados, só peso em kg; gráfico dos últimos 12 válidos e tabela acessível |

Todas as leituras passam pelo cliente HTTP existente, Bearer atual e autorização
dos proprietários. Dados descartados em cancelamento/logout/troca de identidade.
Não são guardados em localStorage. Falhas parciais são explicitadas por origem,
sem zeros artificiais. O gráfico exige duas medições; com menos dados há um
estado vazio. O total da agenda só é mostrado se vier da resposta do serviço.
Os pontos nos dias correspondem à lista carregada, não a uma previsão ou reservas.

As ações rápidas navegam para os formulários existentes de hidratação, treinos,
medições e agenda. Não escrevem ao clicar num indicador. Treino pessoal continua
independente de reserva profissional. Coach, elegibilidade, pagamentos simulados,
MFA e step-up conservam as limitações anteriores. Gestor/Admin/Profissional usam
a nova shell e cartões/listas compactos, preservando operações e supressão de
indicadores; não recebem contagens derivadas para aparentar novos dashboards.

## Implementação

- `frontend/web/src/components/WebShell.tsx`: layout, grupos, foco, tooltips e
  persistência da sidebar.
- `frontend/web/src/components/Symbol.tsx`: controlos vetoriais novos, combinados
  com os SVG existentes; sem modificar os recursos Figma ou a marca.
- `frontend/web/src/dashboard/UserDashboard.tsx` e `data.ts`: apresentação e
  projeções mínimas das respostas existentes.
- `frontend/web/src/navigation.ts`: adaptação de rótulos/grupos Web e definições.
- `frontend/web/src/ui1.css`, `main.tsx`, `App.tsx`: composição Web, scroll central
  e ligação da shell; os tokens partilhados e a autenticação permanecem intactos.
- `frontend/web/src/components/DomainPage.tsx`: ligação ao resumo pessoal,
  preferências e remoção de títulos duplicados, sem alterar os comandos.
- `frontend/tests/ui1.test.ts`, `browser/ui1-fixture.ts`,
  `browser/ui1-layout.check.ts`, `playwright.ui1.config.ts`: testes/fixtures
  exclusivamente locais e fictícios.
- Testes de autenticação/navegação existentes adaptados aos rótulos novos e ao
  rail em vez de esconder toda a sidebar: `auth.spec.ts`, `domain.spec.ts`,
  `entry-recovery.spec.ts`, `refinement.spec.ts`; configuração TS dos testes.

## Validação e capturas

Antes de editar a UI, foram guardadas oito capturas Light/Dark nas larguras
1920, 1440, 768 e 390. As capturas são do Chrome real com respostas HTTP fictícias
intercetadas; nenhum tráfego chega às bases ou contas existentes. Web responsiva
não é teste nativo de Android/iPhone nem teste Safari.

Comandos em `frontend/`:

```powershell
npm.cmd run typecheck
npm.cmd run build:web
npm.cmd test
npm.cmd run test:web -- --output=.cache/ui1/regression-first
npm.cmd run test:web -- --config=playwright.ui1.config.ts --output=.cache/ui1/after-final
```

Um worker, sem retries, servidor Playwright próprio em 5174. Compilações e Chrome
executados em sequência. Não é interrompida uma Web do utilizador em 5173.
Resultados finais:

| Verificação | Resultado |
|---|---|
| TypeScript Web, Mobile, shared e testes | Aprovado |
| Build Web/Vite | Aprovado |
| Testes unitários frontend | 103 aprovados, zero falhas |
| Regressão Playwright existente | 98 aprovados, zero falhas |
| Playwright UI-1, quatro resoluções | 24 aprovados, zero falhas |
| Repetição dos estados vazios após ajuste do texto | 4 aprovados, zero falhas |
| Captura da versão anterior | 4 execuções, oito imagens |
| `git diff --check` | Sem erros; avisos da política LF/CRLF existente |

Os 24 casos UI-1 verificam geometria e scroll, header/rodapé fixos, rail e sua
persistência, tooltips, overlay, foco/Escape, navegação, isolamento dos quatro
perfis, logout, Light/Dark, indisponibilidade e estados vazios. A repetição de
quatro casos não representa quatro testes distintos adicionais.

A [galeria local antes/depois](../../frontend/.cache/ui1/gallery.html) contém
oito pares Light/Dark nas quatro resoluções, mais capturas de scroll, rail,
overlay e dos outros perfis. Foram guardadas **oito imagens antes e 40 depois**.
Os PNG e a galeria ficam em `.cache/`, ignorados pelo Git; são evidência local,
não recursos distribuídos com a aplicação. Todos usam HTTP simulado e dados
fictícios. Não foi executado E2E autenticado contra a API real nesta fase.

A primeira verificação visual passou 20/24 casos: quatro falhas identificaram o
título duplicado de Preferências no componente de listas; duplicação removida.
Uma segunda execução passou 23/24: a medição do rodapé num teste ocorria durante
a animação de abertura do overlay. O teste passou a aguardar o fim da transição
antes de comparar posições; a execução final passou 24/24, sem retries.
Não foram mudados contratos nem dados de backend para fazer passar os testes.

Não foram instaladas bibliotecas nesta fase. Foram registados hashes de 484
ficheiros de backend, Mobile, shared, OpenAPI e Compose: nenhuma alteração foi
detetada durante a validação. Os 12 bloqueios E2E anteriores permanecem abertos.
Esta entrega é visual/funcional Web; não declara prontidão para produção.
