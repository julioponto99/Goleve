# Demonstração local isolada

Esta etapa integra cinco componentes reais: API Gateway, Auth, User, Professional e MongoDB. Utiliza exclusivamente identidades fictícias e temporárias. O ambiente principal e os seus 14 contentores não são recriados nem reconfigurados.

## Âmbito e limite de aprovação

A confirmação do papel `profissional` pelo Auth não constitui aprovação de qualificações. A revisão administrativa permanece desativada, sem administradores, lista de revisores ou mecanismo alternativo de aprovação. Não são criadas candidaturas aprovadas, capacidades verificadas ou registos de aprovação de fixtures no servidor.

No Compose real é possível preparar identidades, fazer login, consultar e editar os próprios perfis fictícios e confirmar o contrato interno. O catálogo e a lista de capacidades elegíveis permanecem vazios; os pedidos de acompanhamento são recusados. A aprovação depende de provisionamento administrativo seguro e das restantes regras de credenciais/validade ainda pendentes. O fluxo positivo completo é executado apenas por testes automatizados, com a dependência de elegibilidade simulada no processo de teste. Não existe adaptador positivo de demonstração no arranque do servidor.

## Estrutura e isolamento

`compose.demo.yaml` é um ficheiro independente, não um override do Compose principal. A CLI seleciona um projeto `goleve-demo-<identificador aleatório>`, imagens próprias e nomes de base de dados `goleve_demo_<identificador>_{auth,user,professional}`.

Os cinco componentes partilham uma rede `demo` com `internal: true`. Apenas o gateway possui também uma rede `gateway` exclusiva do projeto para permitir a publicação da porta no Docker. Só o gateway publica uma porta em `127.0.0.1`, escolhida localmente pela CLI e diferente de 3000. Auth, User, Professional e MongoDB não publicam portas. Nenhuma rede ou volume do projeto principal é reutilizado.

O MongoDB usa tmpfs em `/data/db` e `/data/configdb`. Não tem volumes persistentes nem índices TTL destrutivos. **Parar ou recriar o MongoDB elimina o conteúdo temporário da demonstração.** Não afeta os volumes normais. A CLI não implementa comandos de remoção de volumes.

Os segredos são gerados em `.demo/<identificador>/`, diretório ignorado pelo Git. A chave JWT fica apenas no Auth; a credencial interna é montada apenas no Auth e Professional; a chave de cifragem de dados User é independente. O manifesto de quatro fixtures, com passwords aleatórias, é montado somente no Auth para a preparação explícita. A CLI nunca imprime passwords, JWT ou chaves. A proteção de ficheiros no Windows segue também as permissões da conta local; não partilhar este diretório.

## Arranque, preparação e paragem

Na raiz, com Node 22 e Docker Compose disponíveis:

```powershell
node scripts/demo.cjs init
node scripts/demo.cjs up
node scripts/demo.cjs prepare
node scripts/demo.cjs check
node scripts/demo.cjs status
node scripts/demo.cjs stop
```

`init` gera uma instância, segredos, uma porta livre e quatro especificações fictícias: dois utilizadores, um PT e um nutricionista. Não escreve na base de dados. `up` constrói os workspaces com os Dockerfiles existentes e espera pelos cinco health checks; não prepara contas no arranque. A instalação continua a utilizar `npm ci` no build existente.

`prepare` executa explicitamente a CLI compilada `auth-service/dist/demo/prepare.js`, com confirmação de âmbito. Valida o identificador, base exclusiva, quatro contas, nomes fictícios, emails `@example.invalid`, papéis permitidos e validade máxima de 24 horas (a CLI gera 23 horas). Insere apenas novas identidades; nunca altera passwords, papéis ou contas existentes. Uma repetição valida as quatro identidades existentes e não as modifica. Divergências recusam a preparação. Depois cria os perfis próprios e capacidades em rascunho através do gateway, sem aprovar ou publicar profissionais. Nenhum acesso direto à base de outro serviço é usado para criar perfis.

`check` valida isolamento, saúde, portos, tmpfs, distribuição de segredos, login real, JWT inválido, ausência de elegibilidade, recusa de pedidos, proteção de perfis e bloqueio do contrato interno no gateway. Confirma ainda o contrato Auth a partir do Professional, sem imprimir a credencial. Compara os identificadores e estados dos contentores do projeto normal `goleve` com a fotografia recolhida antes de `up`.

`status` mostra a porta atual. `stop` atua exclusivamente no projeto de demonstração selecionado. Após parar, usar `up` e novamente `prepare` para reconstruir as fixtures no tmpfs, enquanto forem válidas. Quando expiram, parar a instância antes de executar um novo `init`. Um novo `init` não elimina ficheiros nem contentores anteriores; apenas seleciona outra instância em `.demo/current.json`.

Também é possível executar a CLI a partir de `backend`: `npm run demo -- status`. A porta escolhida é verificada pelo Docker no arranque; se outro processo a ocupar entretanto, o arranque falha sem alterar o ambiente principal.

## Contrato Auth → Professional

Destino interno: `POST http://auth-service:3001/internal/demo/identity`.

- Autenticação de serviço por `x-goleve-demo-service`, chave aleatória de 32 bytes em hexadecimal, comparada em tempo constante. Não aceita JWT como credencial de serviço.
- Entrada estrita: `{ "id": "<ObjectId da fixture>" }`.
- Resposta permitida: `{ "identity": { "id": "<id>", "userType": "utilizador|profissional" } }`.
- Exige marcador de preparação não expirado, ID explicitamente incluído no manifesto preparado, etiqueta da instância e papel atual permitido no Auth.
- Não permite criação, alteração de papéis, consulta de identidades externas, emails, passwords, hashes ou tokens.
- Credencial ausente/incorreta: 401; entrada inválida: 400; identidade fora do âmbito: 404; preparação ausente/expirada ou contexto indisponível: 503.
- `Cache-Control: no-store`; não existe encaminhamento de `/internal` pelo gateway. `/auth/internal/...` também não corresponde ao contrato.

O Professional consulta este contrato ao avaliar uma capacidade fictícia existente. Uma falha de confirmação devolve indisponibilidade; um papel incompatível é inelegível. Mesmo com confirmação válida, continua a exigir as regras de aprovação existentes e não concede acesso. Não recebe nem verifica localmente a chave JWT.

O modo é desligado por defeito. Auth e Professional exigem explicitamente `GOLEVE_DEMO_MODE=isolated`, `DEMO_INSTANCE_ID`, base própria e `DEMO_SERVICE_KEY_FILE`; rejeitam `NODE_ENV=production`. O Professional exige ainda dados `synthetic`, revisão `disabled`, lista de revisores vazia e Auth local. Estas variáveis são definidas apenas no Compose de demonstração; não ativar este modo no `.env` principal.

## Testes automatizados

Em `backend`, definir `TEST_MONGO_URI` para um MongoDB temporário de testes, com portas locais e dados descartáveis; executar:

```powershell
npm.cmd run test:demo
npm.cmd test --workspace=@goleve/auth-service
npm.cmd test --workspace=@goleve/user-service
npm.cmd test --workspace=@goleve/professional-service
```

Cada suite cria bases com nomes novos; não elimina bases existentes. Sem `TEST_MONGO_URI`, os testes de integração são explicitamente ignorados, pelo que essa execução não valida a integração.

O teste novo usa Auth real, passwords bcrypt, JWT, User, Professional, gateway e MongoDB temporário. O cliente interno real confirma os papéis das fixtures. Somente a autoridade de elegibilidade é simulada em memória, com aprovação/suspensão válida apenas no processo de teste. Cobre descoberta de capacidades, pedidos PT e nutrição, aceitação, consulta ativa, terminação, duplicações, suspensão, JWT inválido, acesso de terceiros e ausência de acesso sensível. Testa ainda credenciais internas, âmbito, validade, configuração, recusa em produção, resposta mínima, bloqueio pelo gateway e preparação idempotente.

Não há consultas, reservas, pagamentos, integração Agenda, consentimentos de IA ou concessão de acesso a dados sensíveis nesta etapa.

## Relatório da execução

Validação local em 2026-11-01:

| Verificação | Resultado |
| --- | --- |
| Regressão Auth | 85 aprovados |
| Regressão User | 90 aprovados |
| Regressão Professional | 122 aprovados |
| Nova integração isolada | 14 aprovados |
| Execução conjunta final | **311 aprovados, 0 falhas, 0 ignorados** |
| TypeScript Auth, User, Professional e gateway | Compilação aprovada |
| Dockerfiles existentes | Quatro imagens de aplicação construídas com sucesso |
| Compose de demonstração | 5 contentores saudáveis |
| Compose principal | 14 contentores saudáveis, com os mesmos identificadores iniciais |
| Dois contentores legados adicionais | Preservados, sem recriação |
| Paragem e novo arranque | Aprovados; tmpfs vazio, preparação explícita recriou 4 fixtures |
| Preparação repetida | 0 identidades modificadas ou criadas na repetição |
| Isolamento | Redes exclusivas, MongoDB tmpfs sem volumes, só gateway em loopback |
| Segredos e ficheiros protegidos | `.env`, chave User e 123 ficheiros protegidos inalterados |
| Git | Sem commit/push; `.env`, `.secrets/` e `.demo/` ignorados |
| Segredos nos 18 ficheiros candidatos | Nenhuma correspondência com chaves/passwords locais nem padrões de chave privada/token |
| Whitespace | `git diff --check` aprovado; novos ficheiros também verificados |

Foram encontrados e resolvidos dois problemas durante a validação: a publicação da porta não funcionou com uma única rede `internal`, resolvida pela segunda rede exclusiva do gateway; e um teste novo esperava 403 na suspensão, corrigido para o 404 que a API já usa para não revelar relações/capacidades não autorizadas. Não foi necessário alterar essa regra da API. Foi observado o aviso de depreciação `DEP0060` de `util._extend` na dependência de proxy existente; não causou falhas. No PowerShell local foi usado `npm.cmd`, pois a política de execução impede `npm.ps1`.

### Ficheiros desta etapa

Criados (9):

- `compose.demo.yaml`
- `scripts/demo.cjs`
- `backend/tests/demo-integration.test.cjs`
- `backend/services/auth-service/src/demo/config.ts`
- `backend/services/auth-service/src/demo/models.ts`
- `backend/services/auth-service/src/demo/prepare.ts`
- `backend/services/auth-service/src/demo/routes.ts`
- `backend/services/professional-service/src/demo/identity-client.ts`
- `documentation/api/isolated-demo.md`

Alterados (9):

- `.gitignore`
- `.env.example`
- `README.md`
- `backend/package.json`
- `backend/services/auth-service/src/app.ts`
- `backend/services/auth-service/src/models/auth-user.model.ts`
- `backend/services/professional-service/src/app.ts`
- `backend/services/professional-service/src/config/settings.ts`
- `backend/services/professional-service/src/services/care-eligibility.service.ts`

Os ficheiros gerados em `.demo/` são apenas artefactos locais ignorados. O código do User Service e do API Gateway não precisou de alterações; os contratos existentes foram reutilizados. Nenhuma dependência ou Dockerfile foi alterado.
