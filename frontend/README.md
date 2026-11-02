# GoLeve — fundações frontend V1

Branch de trabalho: `integration/frontend-v1`. Fundações 6.1 e refinamento 6.1.1.
[Estado e validação](../documentation/frontend/phase-6.1-foundations.md) ·
[Refinamento e testes 6.1.1](../documentation/frontend/phase-6.1.1-refinement.md) ·
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
e consulta de conectividade ao Gateway por ação explícita. Não há dashboards,
estatísticas de exemplo, formulários de negócio ou áreas administrativas operacionais.
A UI de login/registo/MFA é da Fase 6.2; a infraestrutura de sessão já está preparada.

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

O adaptador MFA está testado com mocks. Não foi criado Administrador nem executado
bootstrap. Step-up continua específico da operação; o transporte suporta o header
público autorizado, sem persistir provas ou credenciais.

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
