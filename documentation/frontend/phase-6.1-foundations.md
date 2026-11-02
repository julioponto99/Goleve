# Fase 6.1 — Fundações implementadas e validação

Data: 2026-11-02. Branch confirmada: integration/frontend-v1; base 0426760.
Entrega de desenvolvimento, exclusivamente Fase 6.1. Sem commit, push ou merge.

Este relatório preserva os resultados da entrega 6.1. As alterações posteriores
de paleta, persistência de tema, ícones e navegação estão no
[relatório da Fase 6.1.1](phase-6.1.1-refinement.md), sem substituir este histórico.

[Arranque e configuração](../../frontend/README.md) ·
[Inventário Figma](figma-inventory.md) · [Matriz de 42 interações](figma-backend-matrix.md) ·
[Lista de ficheiros](phase-6.1-files.md) · [Diagnóstico LF/CRLF](strict-checks-diagnosis.md).

## Estado recuperado e preservado

Na retoma existiam 102 ficheiros novos, todos em documentation/frontend/ ou
frontend/, e nenhum ficheiro versionado modificado. Já estavam presentes os três
workspaces, tipos gerados, cliente/sessão, shell, ícones Figma e testes anteriores.
Não se recomeçou a implementação.

Foram resolvidas duas falhas de TypeScript nos testes: tipagem de HTMLImageElement
e teste intencional de método HTTP proibido. Foram concluídos branding, feedback
de conectividade em viewport estreita, validação de falhas de armazenamento,
testes finais e documentação. As alterações anteriores foram preservadas.

O único Figma de referência continua a ser dseqmbo4hzK6sFcOQl5hld, páginas Web 0:1 e
Mobile 16:42. Mantêm-se os 92 frames, 24 famílias e a matriz das 42 interações.
Não se alterou o Figma nem se configurou Code Connect.

## Concluído nesta entrega

| Área | Implementação |
|---|---|
| Workspaces | frontend/web, frontend/mobile e frontend/shared, com package-lock próprio e versões fixas; backend intacto |
| Web | React 19.3.0, Vite 8.3.5, TypeScript 5.9.3; shell responsiva, sidebar/drawer, history do browser, foco/teclado |
| Mobile | Expo 58.0.22, React Native 0.88.1, TypeScript 6.0.3; tabs, menu, regresso Android, safe areas e status bar do sistema |
| Shared | Tipos gerados das 215 operações públicas; projeções/decoders explícitos para Auth; utilitários de formato e tokens de design |
| Cliente HTTP | Origin por ambiente, HTTPS fora do desenvolvimento local explícito, operações fechadas, Bearer, ETags, idempotência por contrato, timeout/cancelamento e tratamento de 204/erros |
| Segurança HTTP | Não aceita URLs arbitrárias, rotas internas, traversal nos parâmetros ou headers técnicos; não repete escritas após resultado incerto |
| Sessão | Login/MFA como adaptadores, restauro e validação atual em Auth/me, expiração/401/logout; respostas antigas não reabrem nem apagam sessões novas |
| Armazenamento | Web em memória; adaptador Mobile SecureStore com WHEN_UNLOCKED_THIS_DEVICE_ONLY; apenas token/prazo persistidos, nunca MFA/password/step-up |
| Autorização | Estados de acesso privado e indicação de perfil; autoridade final permanece no backend, sem grants ou papéis atribuídos no frontend |
| Design system | Inter, cores, spacing, raios, botões, cards, campos e estados Light/Dark baseados no Figma; sem métricas fictícias |
| Identidade | Originais oficiais PNG 512 × 512, cópias byte a byte, marca Web/Mobile por tema e favicon; fontes reduzidas às três usadas |
| Disponibilidade | Áreas de negócio ainda indisponíveis; Coach desativado; nenhum dashboard completo ou sucesso simulado no runtime |

Performance é o proprietário das medições/histórico; User é o proprietário de
perfil/preferências. Não se duplicaram dados ou escritas. Agenda pessoal continua
independente de reserva profissional e de uma associação planId inexistente.
Não foram implementados os formulários de negócio das próximas fases.

A consulta “Verificar ligação” é manual e usa apenas GET /health do Gateway.
Indica conectividade HTTP, não readiness do backend inteiro. Os testes intercetam
esse pedido e não contactam a stack principal ou paralela.

## Identidade visual oficial

Os ficheiros foram encontrados em frontend/branding/ (sem assets/ no caminho),
validados por assinatura/dimensões PNG e visualmente inspecionados:

| Original preservado | Uso | SHA-256 |
|---|---|---|
| icone-dark-512.png | Dark Mode | f323043a49c674be4389ccd5dceb47d3a5d71449a5447e7efeabb3de129d7121 |
| icone-lime-512.png | Light Mode | f9379ba85ee9e5f1c47240f6fc8997b3dcd122d8bd3fc3adeeefb00fc9032aab |

Não houve redesenho, recoloração, recorte ou regravação dos PNG.
Cópias para shared/assets/branding/ e web/public/branding/ têm os mesmos bytes.

Web usa a marca na sidebar/cabeçalho responsivo, favicon e apple-touch-icon,
incluindo troca explícita de tema. Mobile usa-a na shell e no carregamento inicial;
o placeholder COLOCAR LOGO não aparece na aplicação. O nome GoLeve mantém Inter.
Expo referencia ícone Android padrão Lime e variantes iOS Light/Dark. Isto configura
as fontes dos recursos nativos; não foi executado prebuild, criado APK/IPA ou
validado o launcher num dispositivo/loja. O launcher Android não troca de ícone
automaticamente com o tema; a marca dentro da aplicação troca.

Os SVG Web preservam os atributos originais e são usados a 20 × 20; os PNG de
navegação Mobile preservam os tamanhos dos glifos dentro da área de toque.
A variante Home Light mantém o SVG azul do design estruturado, com estado
selecionado no fundo/texto, evitando substituir o asset por outro glifo do
dashboard de referência. Ver [proveniência](../../frontend/shared/assets/provenance.json).

## Resultados finais

| Verificação | Resultado |
|---|---|
| npm run typecheck | Passou nos três workspaces e testes TypeScript, incluindo rejeições estáticas de rotas/payloads indevidos |
| npm test | 41 aprovados, 0 falhados: HTTP, sessão/MFA, concorrência, navegação, integridade PNG e prova LF/CRLF |
| npm run test:web | 20 aprovados, 0 falhados: dez cenários em desktop 1440 × 1000 e Web responsiva 402 × 874 |
| npm run build:web | Passou; bundle e assets locais, com ambos os PNG e três fontes Inter |
| npm run check:mobile | Passou; bundles Hermes Android e iOS, 21 assets: três fontes, dois PNG de marca e 16 ícones de navegação |
| npm run contracts:check | Passou; 215 operações / 170 caminhos; nenhuma rota interna publicada |
| Prova candidata LF/CRLF | Passou em memória, preservando o hash Swagger original e rejeitando alteração real de contrato |
| Verificadores originais backend | Continuam a falhar por CRLF/hash; não foram alterados nem declarados aprovados |
| PNG originais e cópias | Assinatura PNG, 512 × 512, hashes e igualdade byte a byte confirmados |
| Git, documentos e ficheiros novos | Passou: 113 ficheiros novos, nenhum versionado alterado; 162 ligações locais válidas, sem whitespace ou padrões de segredos encontrados; git diff --check passou |

Os 20 testes de browser são execuções em duas configurações Web, não testes
nativos Android/iPhone. As suites usam apenas mocks/dados fictícios, sem base de
dados, RabbitMQ, contas administrativas, provisionamento ou fornecedores reais.
Não se somam estes números aos relatórios históricos do backend.

A inspeção de screenshots Web Light/Dark faz parte da verificação visual.
Hermes/Metro comprovam compilação e empacotamento; não comprovam execução num
emulador, armazenamento seguro real do dispositivo ou fluxos HTTP com contas reais.

## Ocorrências e resolução

- As falhas de tipagem herdadas ficaram corrigidas e a compilação final passou.
- Execuções iniciais ficaram limitadas por permissões do sandbox (Hermes e
  os.userInfo do tsx). Os mesmos builds/testes passaram com execução autorizada;
  não se alteraram políticas globais do sistema.
- Uma execução inicial Playwright precisou de encerrar apenas o Vite criado pelo
  próprio teste. As últimas execuções terminaram pelo runner.
- Uma tentativa encontrou 5173 em uso e interrompeu antes de iniciar o servidor.
  Não se encerrou esse serviço; os testes usam agora 5174, configurável por
  GOLEVE_WEB_TEST_PORT, com reuseExistingServer=false.
- O caminho inicialmente indicado para os PNG não existia; os originais foram
  localizados em frontend/branding/ e preservados.
- Não foi necessária instalação adicional na retoma; as dependências existentes
  do frontend foram reutilizadas.

## Causa dos dois verificadores

O checkout Windows usa CRLF e o Git guarda LF. O gerador compara texto exato e
trunca snippets antes de normalizar; o bundler faz hash dos bytes com CR.
A [correção mínima proposta](strict-checks-diagnosis.md) normaliza somente CRLF→LF
em três pontos de leitura/comparação/hash. Não altera o hash guardado:
8d503121f44a3a869c3d6fb0b2b48822c9fa6ea8c2535996319a1580eea0f88a.
A prova foi feita em memória e não gravou contratos, geradores ou configurações
existentes. A aplicação dessa correção fica separada para autorização/revisão.

## Parcial e por fazer

- Fase 6.2: interfaces de registo/login, sessões, enrolment MFA e step-up.
  Os adaptadores foram testados com mocks; não existe ainda esse percurso completo
  na interface.
- Fases seguintes: dashboards, formulários e consultas de domínio com respostas
  reais; áreas profissional/Gestor/Admin exigem desenho e dependências legítimas.
- Execução Android/iPhone, testes de Keychain/Keystore/SecureStore, acessibilidade
  nativa e validação dos recursos de launcher em builds próprios.
- Origin HTTPS/rede aprovada para dispositivos físicos; nenhum serviço interno
  foi exposto para resolver conectividade.
- Respostas OpenAPI ainda genéricas exigem revisão do proprietário antes de
  expandir o SDK estrito; não se inventaram DTOs.
- Os 12 bloqueios B01–B10/R01–R02 da [prontidão](../release-v1/readiness.md) permanecem.
  Não se ativaram pagamentos reais, IA, recolha real ou elegibilidade sintética
  no ambiente principal.
- Aplicar a correção dos verificadores existentes apenas com autorização para esse
  ajuste de tooling. Os comandos originais mantêm o resultado descrito.

Não se alteraram microserviços, Docker/volumes/redes, bases, backups ou chaves.
Nenhuma migração, commit, push ou merge foi executada.
Esta entrega não declara prontidão da V1 para produção.
