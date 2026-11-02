# Swagger UI de desenvolvimento

Branch `feat/backend-release-v1`; base desta alteração `3b1298a`.
Estado atual: Swagger ativo, apenas em leitura, no Gateway paralelo em
`127.0.0.1:64344`, mediante autorização de 2026-11-02. O registo no final distingue
essa ativação do histórico de implementação e testes locais abaixo.
Não existia Swagger UI no Gateway. Foram acrescentados:

| Método | Caminho | Conteúdo |
|---|---|---|
| GET | `/api-docs` e `/api-docs/` | Interface Swagger UI |
| GET | `/api-docs/openapi.json` | OpenAPI 3.1 autocontido, sem referências a outros ficheiros/servidores |
| GET | `/api-docs/init.js` | Inicialização e política de execução da UI |
| GET | `/api-docs/swagger-ui-bundle.js`, `/api-docs/swagger-ui.css` | Assets locais da versão fixa `swagger-ui-dist@5.34.1` |

As operações continuam agrupadas pelos onze microserviços, mais o grupo Gateway:
**215 operações / 170 caminhos de negócio e health**. Os endpoints da própria
documentação não são proxies de domínio e não alteram esta contagem.
O contrato vem de [backend-release-v1.openapi.json](backend-release-v1.openapi.json),
mantendo os limites dos schemas e os doze bloqueios documentados na
[entrega](../release-v1/README.md).

## Ativação explícita

| Configuração | Documentação | Try it out |
|---|---|---|
| Variáveis ausentes | 404 | Desativado |
| `NODE_ENV=production`, `test`, desconhecido ou ausente | 404, mesmo com flags verdadeiras | Desativado |
| `NODE_ENV=development`, `GATEWAY_API_DOCS_ENABLED=true` | Disponível | Desativado por defeito |
| Desenvolvimento, ambas as flags verdadeiras, origem loopback explícita e autorizada no CORS | Disponível nessa origem | Disponível nas operações do contrato público |

`GATEWAY_API_DOCS_TRY_IT_OUT=true` exige documentação ativada e
`GATEWAY_API_DOCS_ORIGIN`, sem credenciais, caminho, query ou fragmento. O hostname
deve ser `localhost`, `127.0.0.1` ou `[::1]`. A origem normalizada tem de constar de
`CORS_ALLOWED_ORIGINS`; Host/protocolo devem coincidir ao consultar a documentação.
Configuração insegura/incompleta em desenvolvimento recusa o arranque. Em produção,
o router permanece desativado sem carregar o documento nem os assets.

Estas opções controlam a UI, não concedem permissões nas APIs. A autenticação JWT,
sessões, MFA/step-up, âmbitos, idempotência e elegibilidade continuam a ser verificadas
pelos proprietários. Não se introduziu qualquer identidade, credencial técnica ou bypass.

## Utilização local no host

Não foi iniciado um Gateway permanente nesta tarefa. O exemplo seguinte destina-se
a uma execução explícita pelo programador, numa porta livre, e não reinicia Docker.
As dependências de desenvolvimento do Gateway devem estar instaladas. Numa cópia nova,
pode usar `npm ci --include=dev --workspace=@goleve/api-gateway --include-workspace-root`
a partir de `backend/`; não copiar `node_modules` ou envs de outra máquina.

A partir da raiz:

```powershell
cd backend
npm run docs:check --workspace=@goleve/api-gateway
npm run build --workspace=@goleve/api-gateway
cd api-gateway
$env:NODE_ENV = 'development'
$env:GATEWAY_API_DOCS_ENABLED = 'true'
$env:GATEWAY_API_DOCS_TRY_IT_OUT = 'false'
$env:PORT = '64345'
node -e "require('./dist/app').createApp().listen(Number(process.env.PORT), '127.0.0.1')"
```

Abrir `http://127.0.0.1:64345/api-docs`. O comando fixa o listener no loopback,
sem alterar `server.ts` ou publicar portas internas. Terminar com Ctrl+C.
O [.env.example do Gateway](../../backend/api-gateway/.env.example) documenta as opções;
o exemplo acima usa variáveis do processo, sem ler/copiar o `.env` principal.

Para permitir Try it out nessa execução, terminar esse processo e, antes de o
iniciar novamente, definir explicitamente:

```powershell
$env:GATEWAY_API_DOCS_TRY_IT_OUT = 'true'
$env:GATEWAY_API_DOCS_ORIGIN = 'http://127.0.0.1:64345'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:64345'
```

`GET /health` funciona nesse Gateway local. As operações de domínio exigem os
respetivos `*_SERVICE_URL` alcançáveis e autorizados. Serviços disponíveis apenas
na rede privada Docker não ficam automaticamente acessíveis a este processo no host:
sem upstream válido haverá 502/503. Não abrir portas, copiar credenciais ou mudar
validadores para ultrapassar essa limitação.

Para usar Swagger dentro da stack paralela será necessária uma reconstrução autorizada
apenas do Gateway e configuração explícita das flags/origem. **Não se alteraram
Dockerfiles, Compose, flags dos contentores nem se executou essa operação.** O artefacto
gerado é compilado dentro de `src/`, já copiado pelo Dockerfile existente; não requer
novos mounts, acesso a `documentation/` no runtime ou mudança do build context.
Confirmado por GET no Gateway paralelo atual: `/api-docs` e
`/api-docs/openapi.json` continuam a devolver 404. Os testes aprovados abaixo usam
o código novo compilado em processos locais isolados, não essa imagem Docker anterior.

## Segurança do documento e da interface

- Assets servidos localmente, sem CDN, validador remoto ou configuração por query string.
- Documento servido com `servers: [{url:"/"}]`, sempre no Gateway atual; componentes
  externos são incorporados como referências locais. Não se publicam os documentos
  completos auxiliares, o diretório do repositório, `.env` ou source maps.
- A geração verifica operações contra as rotas Express/Gateway reais e resolve todas
  as referências. Rejeita referências a ficheiros não autorizados e caminhos internos.
  Metadados de ficheiros fonte são retirados da cópia servida; o original é preservado.
- CSP limita scripts/conexões à mesma origem; não há scripts inline. O interceptor
  recusa destinos externos, URLs com credenciais, caminhos técnicos e métodos/caminhos
  fora do contrato. Em modo de leitura recusa também a execução de operações.
- A UI não persiste autorizações e omite cookies dos pedidos. Não existe token ou
  password predefinido. Se necessário, introduzir apenas o JWT de uma conta fictícia
  em Authorize; o bearer permanece na memória e segue apenas para a API autorizada.
  A UI pode mostrar o pedido/resposta/curl introduzidos pelo programador: não os copiar
  para logs, issues ou documentação com fatores/passwords/tokens.
- `/internal/*` e credenciais de serviço mantêm a proteção existente do Gateway.
  Desativar Try it out não desativa a API de negócio nem substitui a sua autorização.

Configuração baseada na [documentação oficial do Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).
A dependência traz `@scarf/scarf@1.4.0`; foi instalada com `--ignore-scripts`.
`scarfSettings.enabled=false` no package raiz desativa a telemetria nas instalações
futuras, conforme a [configuração oficial do Scarf](https://github.com/scarf-sh/scarf-js#as-a-user-of-a-package-using-scarf-js-how-can-i-opt-out-of-analytics).
Não foram atualizadas outras bibliotecas.

## Atualização do contrato

```powershell
cd backend
npm run docs:generate --workspace=@goleve/api-gateway
npm run docs:check --workspace=@goleve/api-gateway
npm run build --workspace=@goleve/api-gateway
```

O primeiro comando regenera o contrato central e o artefacto
`backend/api-gateway/src/generated/api-docs-document.ts`. Rever e incluir ambos numa
futura entrega; não editar manualmente o artefacto. `docs:check` deteta drift de
rotas/documento/artefacto. O build continua a usar `tsc` no workspace e não gera
documentação a partir de ficheiros fora do contexto Docker.

## Testes executados

- Build TypeScript do Gateway aprovado.
- Verificadores offline: 215 operações / 170 caminhos; bundle sem referências externas.
- **20 testes HTTP/segurança aprovados, zero falhas/ignorados:** doze novos de
  documentação e oito existentes de fronteira/CORS/rate limiting/readiness.
- **Um teste Chrome headless real aprovado, zero falhas/ignorados:** perfil temporário
  próprio, renderização dos doze grupos, carregamento do OpenAPI, leitura sem execução
  e Try it out autorizado a executar `GET /health` com resposta 200. Nenhum pedido
  HTTP externo observado na página; nenhum microserviço real foi contactado.
- Servidores de teste e browser terminaram; o perfil temporário criado pelo teste
  foi removido após identificação. Não se criaram recursos Docker ou dados persistentes.
- `git diff --check`, verificação dos ficheiros novos e ligações locais aprovados;
  sem segredos reais detetados. A geração do índice foi ajustada para terminar com
  uma única quebra de linha, evitando uma linha vazia extra detetada na revisão.
  Foram revistas 238 ligações locais nos dezoito ficheiros candidatos; `.env`,
  `.secrets/` e `.integration/` permanecem ignorados e o índice Git não foi preparado.

Comandos dos testes, na pasta `backend/`:

```powershell
npm run test:docs --workspace=@goleve/api-gateway
# Opcional: apontar para um Chrome/Chromium já instalado, não para um perfil pessoal.
$env:GOLEVE_SWAGGER_TEST_BROWSER = '<caminho absoluto do executavel>'
npm run test:docs:browser --workspace=@goleve/api-gateway
```

Sem a variável do browser, o teste opcional é assinalado como ignorado, não aprovado.
Nesta execução foi configurado e executado. As primeiras execuções corrigiram o
próprio teste: o fetch Node normalizava Host, o botão renderiza de forma assíncrona
e o seletor HTTP precisava da célula do corpo, não do cabeçalho «Code». O resultado
final valida Host por HTTP bruto e lê o 200 efetivo; não enfraquece os controlos.
O aviso preexistente `util._extend` do proxy não provocou falhas nem motivou atualização.

Não houve regressão global, execução de validadores E2E, teste de operações financeiras,
provisionamento ou validação numa imagem Docker nova. Os doze bloqueios V1 e os DTOs
ainda genéricos permanecem. Sem commit, push, merge ou alterações de infraestrutura.

## Ativação autorizada no Gateway paralelo — 2026-11-02

Esta secção regista a operação posterior aos testes locais acima. Os resultados
anteriores e o estado então observado de 404 foram preservados como histórico.

Projeto: `goleve-integration-v1-ad8ea9a1719b5a21`.
URL ativa: `http://127.0.0.1:64344/api-docs`.
OpenAPI: `http://127.0.0.1:64344/api-docs/openapi.json`.

Foi criado exclusivamente o override local
`.integration/ad8ea9a1719b5a21/swagger-ui.override.yaml`, ignorado pelo Git:

```yaml
services:
  api-gateway:
    image: goleve-integration-v1-ad8ea9a1719b5a21-gateway:swagger-readonly-20261102
    environment:
      NODE_ENV: development
      GATEWAY_API_DOCS_ENABLED: "true"
      GATEWAY_API_DOCS_TRY_IT_OUT: "false"
```

O Compose combinado passou `config --quiet`. A comparação estrutural com a base
confirmou apenas a mudança de imagem e as duas flags do Gateway, conservando
`NODE_ENV=development`, portas, CORS, limites, redes, mounts e todos os outros serviços.
A construção selecionou exclusivamente `api-gateway`; a recriação usou:

```text
up -d --no-deps --no-build --force-recreate --wait --wait-timeout 180 api-gateway
```

Ambos os comandos usaram `load()`/`compose()` de `scripts/integration.cjs`, com o
projeto explícito, o `compose.env` da instância e `-f` adicional para esse override.
Não foi executado `up` genérico sobre o projeto inteiro.

| Identificação | Antes | Depois |
|---|---|---|
| Contentor Gateway | `c3722880b0236638f9918087930128e596890a2eca3b1a37d1377061f5bf532d` | `c93ffaa5361e2bc48bf03d0e1a386105041fdc88a21244a27044aa937ea520e9` |
| Imagem | `sha256:b4fc85a397bdaf82ed627f1ed89be897554502f49a05a2d4415d256102d73f3e` | `sha256:b0e1c2dcdb31d5da9114784fd6d237b5f01fe6449c2bec74a3fc00751dcbc0a7` |

A imagem anterior permanece na tag própria `goleve-integration-v1-ad8ea9a1719b5a21-gateway:local`.
O novo Gateway arrancou às **12:12:03 UTC**, ficando healthy. A indisponibilidade
HTTP durante a troca não foi cronometrada; nenhum outro serviço foi reiniciado.

Preflight antes do build: Windows **2,32 GiB** físicos e **3,51 GiB** virtuais livres,
disco **12,55 GiB**, Docker/WSL `MemAvailable` **3,69 GiB**, pressão PSI some/full zero.
Antes da recriação: Windows **2,29 GiB**, virtual **3,43 GiB**, disco **12,39 GiB**,
Docker/WSL **3,72 GiB**, PSI zero. Não havia ligações HTTP de entrada ativas nas
quatro amostras antes da preparação e nas três antes da recriação.
O Gateway conserva o limite de **128 MiB**, rootfs de leitura e apenas tmpfs próprio.

Validação HTTP real, às 12:15 UTC:

| Verificação | Resultado |
|---|---|
| `/api-docs`, `/api-docs/` | 200, HTML Swagger com indicação de modo de leitura |
| `/api-docs/openapi.json` | 200; igual ao bundle verificado; 215 operações, 170 caminhos, 1 287 referências locais resolvidas |
| JS/CSS e inicializador | 200; hashes JS/CSS iguais aos assets da versão fixa já testada no Chrome |
| `/health`, `/ready` | 200; onze destinos prontos |
| Try it out | Métodos de execução vazios; interceptor recusa execução; sem persistência de autorizações/validador remoto |
| Rotas internas, variantes codificadas, ficheiros não autorizados e credencial técnica | 404 antes de chegar aos proprietários |
| `/auth/me` sem Bearer | 401 |
| Gateway principal | `/health` 200 e `/api-docs` 404; permaneceu inalterado |

Foi ainda executado um processo Node efémero, com heap limitado, **dentro do mesmo
Gateway novo**, usando a aplicação dessa imagem com `NODE_ENV=production` e ambas
as flags de documentação verdadeiras. Os cinco endpoints de UI/documento/assets
devolveram 404 e `/health` 200. Esse processo terminou; não criou contentor ou
publicação de porta e não alterou as variáveis do processo principal, que permanece
em desenvolvimento com Try it out falso. Não contactou microserviços de domínio.

Comparação do inventário: **40 contentores antes/depois, apenas um substituído**;
os outros **39** preservam IDs, imagens, arranques, mounts, redes, estados e contadores
de reinício. As **14 redes** e os **35 volumes** existentes mantêm identidades/listagem.
Os 14 componentes essenciais principais e os 14 paralelos continuam saudáveis.
Não foram alterados MongoDB, RabbitMQ, credenciais, dados, volumes persistentes ou
os restantes serviços. Não houve migração, provisionamento, commit, push ou merge.

**Operação futura:** incluir sempre este override numa reconstrução/recriação que
deva conservar Swagger. O `up/start` da CLI histórica, sem override, seleciona a
imagem/tag e configuração base e pode repor a versão anterior sem documentação.
Stop/start do contentor existente não substitui os seus parâmetros. Uma eventual
reposição da imagem anterior é outra operação limitada ao Gateway e exige autorização;
não executar automaticamente comandos de stack completa. Os doze bloqueios V1
continuam abertos; esta ativação não representa prontidão para produção.
