# GoLeve — fundações frontend V1

## Ambiente oficial local-demo — 2026-11-03

Gateway atual: `http://127.0.0.1:3000`. Usar os ficheiros operacionais
`web/.env` e `mobile/.env`, preservados e ignorados pelo Git; referências antigas
a `64344` correspondem à stack paralela histórica. Não copiar segredos para o
frontend: `VITE_*` e `EXPO_PUBLIC_*` são configuração pública.
Consultar o [relatório de consolidação](../documentation/consolidation-v1.md)
para as cinco contas fictícias e consulta interativa das passwords.

```powershell
cd frontend
npm run dev:web
```

Os cinco perfis foram testados por Chrome com APIs reais, sem alterar o design.
O token Web continua apenas em memória, pelo que recarregar toda a página pode
exigir novo login. A indicação `local-demo` vem do Auth, nunca de uma opção da
interface; administradores reais continuam sujeitos a MFA. O step-up por password
isolada só é utilizado quando explicitamente autorizado pelo backend para a
sessão de demonstração e a operação exata. Recuperação de password continua
indisponível enquanto não existir o contrato real aprovado.

Expo gerou bundles Android/iOS. Ainda não se validou execução em dispositivos
físicos: Android Emulator usa `10.0.2.2:3000`; em dispositivos físicos é necessário
encaminhamento de desenvolvimento autorizado, pois o Gateway oficial só publica
em loopback. Não expor MongoDB/RabbitMQ para resolver conectividade Mobile.

Validações: 107 testes unitários, 98 testes Playwright com API simulada e cinco
percursos Chrome com API real. A configuração `playwright.local-demo.config.ts`
exige ACK explícito e não grava traces com credenciais; a regressão simulada
interceta uma origem distinta para não enviar credenciais fictícias de teste
ao backend real. Os 12 bloqueios históricos não foram declarados resolvidos.

[UI-1 — redesign Web, validação e capturas antes/depois](../documentation/frontend/ui-1-web-redesign.md).
A Web usa agora header/sidebar fixos, rail recolhido e scroll central, mantendo
os temas, os contratos e os fluxos de autenticação existentes. O redesign não
modifica o Mobile nem ativa funcionalidades bloqueadas do backend.

Branch de trabalho: `integration/frontend-v1`. Fundações 6.1/6.1.1, autenticação
Web/Mobile e painéis ligados aos contratos existentes.
[Entrega atual e limitações](../documentation/frontend/navigation-auth-dashboards.md) ·
[Recuperação futura aprovada](../documentation/frontend/password-recovery-proposal.md) ·
[Política MFA atual/futura](../documentation/frontend/mfa-policy-review.md) ·
[Acesso administrativo](../documentation/frontend/administrator-access.md).
[Estado e validação](../documentation/frontend/phase-6.1-foundations.md) ·
[Refinamento e testes 6.1.1](../documentation/frontend/phase-6.1.1-refinement.md) ·
[Etapa A e autenticação Web](../documentation/frontend/phase-6.3-stage-a-auth-validation.md) ·
[92 frames Figma](../documentation/frontend/figma-inventory.md) ·
[42 interações e contratos](../documentation/frontend/figma-backend-matrix.md).

## Estrutura e alcance

```text
frontend/
  branding/                  originais oficiais do titular, preservados
  web/                       React 19.3.0, Vite 8.3.5, TypeScript 5.9.3
  mobile/                    React Native 0.88.1, Expo 58.0.22, TypeScript 6.0.3
  shared/                    contratos públicos, cliente, sessão, tokens, navegação
  scripts/                   geração de tipos e auditoria offline
  tests/                     mocks, tipos, integridade dos ícones e browser
```

Workspaces e lockfile próprios, sem alterar os workspaces em backend/.
O TypeScript 5.9.3 do tooling satisfaz o peer do openapi-typescript; Mobile mantém
a versão 6.0.3 do template Expo. Não substituir as versões por latest.

A shell tem Light/Dark, navegação, estados de carregamento/erro/indisponibilidade
e consulta de conectividade ao Gateway por ação explícita. A Web acrescenta
login/registo/MFA, sessões próprias e quatro painéis por perfil. Mobile usa agora
a mesma sessão e os mesmos contratos, com SecureStore e formulários nativos.
Os painéis consultam dados de domínio; registos pessoais, operações de Gestor e
as seis operações Auth administrativas têm comandos fechados. O relatório atual
distingue leituras, escritas, capacidades ainda sem interface e bloqueios reais.
Não há estatísticas de exemplo ou operações administrativas fictícias.
Consultar o [guia de autenticação Web](../documentation/frontend/web-authentication.md)
e o [plano por perfil](../documentation/frontend/phase-6.3-plan.md).
As verificações HTTP automatizadas usam mocks. Não comprovam operações com contas
reais, nem substituem testes num iPhone/Android. Não foi alterado o backend.

A Web inicia em Light, independentemente do tema do sistema. A escolha explícita
Light/Dark persiste entre navegações e reloads em `goleve.ui.theme.v1` (apenas o
valor do tema em localStorage; tokens continuam exclusivamente em memória).
Mobile segue inicialmente o sistema e guarda a escolha em SecureStore numa chave
separada da sessão. Falhas ao guardar são indicadas sem bloquear a interface.
Não há sincronização de preferências User nesta fase pré-login.

A barra inferior é exclusiva do Mobile nativo; a Web responsiva usa o menu lateral.
Os ícones Mobile usam os quatro glifos Font Awesome 6 Free Solid do Figma, carregados
com Expo Font. A dependência fixa `@fortawesome/fontawesome-free@6.7.2` fornece a
fonte e licença, sem novo módulo nativo. Os antigos PNGs 1× permanecem preservados
como referência, mas já não são carregados pela aplicação. O logótipo GoLeve
continua a usar exclusivamente os PNGs oficiais do titular.

## Instalação e arranque

Usar Node 22.14.x (mínimo declarado 22.13) e npm. No Windows, usar npm.cmd para
evitar alterar a política de execução do PowerShell. A partir da raiz:

```powershell
cd frontend
npm.cmd ci --ignore-scripts
npm.cmd run dev:web
```

Web em http://127.0.0.1:5173. A porta é estrita: se estiver ocupada, o comando falha;
não interrompe outro processo. Terminar com Ctrl+C.
Não arranca, reconstrói nem reinicia Docker.

Para testar a autenticação Web, abre http://127.0.0.1:5173/entrar. O registo está
em `/criar-conta`, recuperação indisponível em `/recuperar-acesso`, MFA em `/autenticacao/mfa` e sessões próprias em
`/conta/seguranca`. O MFA exige um desafio válido; abrir a URL não concede acesso.
Usa apenas contas autorizadas. Não cries contas na base existente só para testar.
O JWT Web permanece em memória: navegar mantém a sessão, recarregar exige novo login.
O arranque verifica a sessão e abre o login ou o painel do papel validado. Logout
regressa imediatamente ao login, mesmo enquanto a revogação remota está pendente.
Administradores continuam obrigados a MFA; o planeamento futuro não o desativa.

Para validar sem criar contas ou alterar dados, executa a partir de `frontend/`:

```powershell
npm.cmd run typecheck
npm.cmd run build:web
npm.cmd test
npm.cmd run test:web -- --output=.cache/phase-6.2-resume/final
```

Playwright usa um servidor de teste em 127.0.0.1:5174, um browser isolado e respostas
HTTP simuladas. Não usa contas ou bases existentes. Termina o servidor de teste
automaticamente; não interrompe um servidor Web já aberto em 5173.

Mobile:

```powershell
cd frontend
npm.cmd run dev:mobile
```

Este comando abre o servidor de desenvolvimento Expo em modo localhost.
Requer Expo Go/development build compatível ou emulador configurado separadamente.
Não foi iniciado um emulador, simulador ou build nativo nesta entrega.
iOS Simulator/build local requer Mac/Xcode; no Windows foi validado o bundle iOS,
não uma execução iPhone. Terminar com Ctrl+C.

## Configuração pública

Consultar [Web .env.example](web/.env.example) e
[Mobile .env.example](mobile/.env.example). Se necessário, criar um .env **no
workspace respetivo**, sem copiar o .env do backend.

| Plataforma | Configuração local |
|---|---|
| Web no mesmo host | VITE_API_BASE_URL=http://127.0.0.1:64344 |
| Android Emulator padrão | EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:64344 |
| iOS Simulator | Loopback do Mac que executa o backend, não o Windows remoto |
| Dispositivos físicos | Origin HTTPS/rede de desenvolvimento aprovada separadamente |

Sem configuração explícita em desenvolvimento, a Web usa 127.0.0.1 e Mobile usa
10.0.2.2 no Android / 127.0.0.1 no iOS. Estes defaults não garantem conectividade
num dispositivo físico. Fora de desenvolvimento, falta de origin HTTPS deixa a
ligação indisponível; não há fallback HTTP de produção.

O cliente recusa credenciais, caminho, query ou fragmento na base URL, URLs
arbitrárias por operação, headers técnicos e operações fora do OpenAPI público.
Não existe prefixo /api. Não abrir MongoDB/RabbitMQ/serviços internos para o frontend.
JWT_SECRET, chaves MFA, credenciais de serviço e fornecedor IA nunca pertencem a
VITE_* ou EXPO_PUBLIC_*.

O botão “Verificar ligação” consulta apenas GET /health do Gateway. Um 200 confirma
conectividade HTTP, não readiness dos onze serviços nem elegibilidade funcional.
A aplicação não faz escritas de domínio automaticamente.

## Sessão e permissões

- Web guarda token apenas em memória; reload exige nova autenticação.
- Mobile usa Expo SecureStore, com WHEN_UNLOCKED_THIS_DEVICE_ONLY. Só token e
  prazo local são persistidos; identidade é confirmada no Auth após restauro.
- A resposta Auth mantém o envelope da raiz. Challenge MFA não produz sessão.
- Expiração/401/revogação invalidam o acesso local. Respostas antigas não apagam
  uma sessão mais recente. Logout distingue falha remota de falha do armazenamento.
- Não há refresh token, renovação silenciosa ou autenticação simulada no runtime.
- Papel vem de Auth/me; navegação é uma indicação visual, sem conceder âmbitos,
  elegibilidade ou privilégios. O servidor autoriza cada pedido.
- Não há retry automático de escritas. Resultado incerto fica explícito; pagamentos
  com reconciliação necessária não são repetidos.
- ETag, versões e idempotência continuam específicos de cada proprietário.
  Não se duplicam dados User/Performance: medições são de Performance; perfil/
  preferências são de User.

Web: `/entrar`, `/criar-conta`, `/autenticacao/mfa`, `/conta/seguranca` e
`/painel/<papel>`. O registo público continua exclusivamente `utilizador`.
MFA usa o desafio em memória, enrolment TOTP manual e recuperação de uso único;
não existe recuperação de palavra-passe. Sair de um pedido de autenticação
pendente invalida a tentativa local e impede redirecionamentos tardios.

O adaptador e o diálogo step-up têm seis vínculos Auth fechados, sem formulário
genérico de comandos. A ligação às operações das páginas administrativas fica
para a Etapa E. Não foi criado Administrador nem executado bootstrap.
Os testes autenticados usam respostas simuladas isoladas, não contas existentes
nem a base de desenvolvimento. Não equivalem a validação autenticada com API real.

## Identidade visual

[Originais](branding/) fornecidos pelo titular:
icone-dark-512.png no Dark Mode e icone-lime-512.png no Light Mode.
São PNG 512 × 512, copiados sem edição para shared/assets/branding/ e
web/public/branding/. O nome GoLeve usa Inter conforme o Figma.

A Web aplica a variante na shell, favicon e apple-touch-icon. Mobile aplica-a na
shell e no carregamento inicial. A configuração Expo indica ícone Android padrão
e variantes iOS Light/Dark; a geração final dos recursos nativos pertence ao build
da plataforma, ainda não executado. Não se criaram APK/IPA nem se certificou a
adequação dos ícones às lojas (incluindo resolução/alpha).

Ícones de navegação foram exportados do Figma oficial e usados localmente, sem
URLs temporárias. A proveniência e os SHA-256 estão em
[provenance.json](shared/assets/provenance.json). Testes confirmam originais intactos
e cópias byte a byte. Não há redesenho do símbolo nem alteração do Figma.

## Verificação

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:web
npm.cmd run check:mobile
npm.cmd run contracts:check
npm.cmd run test:web
node scripts/audit-backend-contracts.cjs
```

- typecheck inclui os três workspaces e os testes/contratos TypeScript.
- test usa mocks, dados fictícios e auditoria offline; não usa bases nem filas.
- build:web gera web/dist/. Para uso de desenvolvimento local, preferir dev:web;
  uma pré-visualização de build exige origin HTTPS corretamente configurada.
- check:mobile exporta bundles Hermes Android/iOS com um worker, não compila
  binários nativos. Para execução offline: EXPO_OFFLINE=1, EXPO_NO_TELEMETRY=1.
- test:web usa a porta de teste 5174, separada da aplicação em 5173; pode ser alterada
  por GOLEVE_WEB_TEST_PORT. Não reutiliza nem interrompe um servidor existente.
  Usa um Chrome instalado no caminho configurado, ou um Chromium
  previamente instalado pelo Playwright. Usa perfil temporário, sem o perfil
  pessoal do browser. O servidor Vite temporário é encerrado pelo runner.
- Os pedidos Gateway dos testes de browser são intercetados; nenhum contacta a
  stack. Viewport móvel no Chrome não é teste nativo Android/iPhone.
- contracts:check lê as rotas/OpenAPI existentes e compara os tipos do frontend.
  Requer as dependências de desenvolvimento backend usadas pelo extrator existente,
  especialmente TypeScript. Para apenas arrancar as apps, os tipos já estão gerados.
- audit-backend-contracts é diagnóstico/prova em memória. **Não modifica nem faz
  passar os verificadores originais**; ver o [diagnóstico](../documentation/frontend/strict-checks-diagnosis.md).

node_modules/, dist/, .expo/, test-results/, envs locais e caches estão ignorados.
Não guardar tokens ou dados pessoais em screenshots/traces; os testes atuais só
usam dados fictícios. Não ativar tracing de sessões reais.

## Pendências

Fases 6.2–6.7, integração autorizada com contas fictícias, execução real em Android/
iPhone, rede TLS para dispositivos físicos, fontes de elegibilidade e os
[12 bloqueios E2E](../documentation/release-v1/readiness.md) continuam pendentes.
A recolha de dados reais, pagamentos reais e Coach IA não foram ativados.
A entrega é de desenvolvimento, sem declaração de prontidão para produção.
