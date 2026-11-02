# Validação não disruptiva da entrega — Fase 5.14

Data: 2026-11-02. Branch `feat/backend-release-v1`, HEAD
`000cc43ee2a47af9de5b0f8ace7fb09e8a5d5dd6`. A árvore estava limpa no início.
O trabalho desta fase acrescenta documentação e um gerador/verificador offline;
não altera código de negócio, validadores E2E, Compose, modelos ou dependências.

## Verificações desta fase

| Verificação | Resultado |
|---|---|
| Branch e commit de base | Correspondem aos pedidos |
| Inventário Express → Gateway → OpenAPI | 215 operações, 170 caminhos, onze microserviços e dois endpoints de Gateway |
| Drift da documentação gerada | Verificador offline aprovado após geração |
| Referências JSON, parâmetros e IDs de operação | 1 289 referências resolvidas, incluindo referências transitivas; sem IDs duplicados, parâmetros de caminho em falta ou caminhos internos no índice público |
| Documentos OpenAPI existentes | Quatro ficheiros JSON e respetivas referências locais transitivas resolvidos |
| Sintaxe Node | `node --check` no novo gerador, CLI de integração e inicializador MongoDB aprovado |
| Exemplos de comandos/entrypoint | Oito comandos Node do guia analisados sem execução; `bash -n` do entrypoint aprovado no MongoDB paralelo, sem executar o script |
| Compose paralelo | `config --quiet` aprovado; nenhuma operação de arranque/recriação |
| Gateway paralelo GET | `/health` 200; `/ready` 200, onze destinos prontos; `/auth/me` sem JWT 401; `/internal/v1/management` 404 |
| Gateway principal GET | `/health` 200 e `/ready` 404, limitação histórica preservada |
| Estado Docker | Catorze componentes essenciais saudáveis em cada stack, sem alterações pelo trabalho desta fase |
| Ligações locais, whitespace e segredos | 321 ligações locais válidas nos catorze candidatos; sem ocorrências suspeitas nos padrões verificados; ignores confirmados |

O projeto principal tem ainda dois auxiliares com a mesma label Compose,
`mongo-express` e `mongo-goleve`, fora dos catorze componentes essenciais.
Foram apenas observados e permaneceram intactos. Não confundir o total de contentores
com o número de componentes da arquitetura. O snapshot de leitura regista IDs,
imagens, arranques, mounts e redes sem copiar envs/credenciais para a documentação.
Uma segunda leitura confirmou os mesmos IDs, imagens, instantes de arranque,
mounts, redes e estados observados no início, sem diferenças.

## O que a verificação de contratos demonstra

`node scripts/release-contracts.cjs` não carrega aplicações, abre ligações MongoDB
ou invoca Docker. Usa o parser TypeScript já existente no workspace para ler rotas,
expandir as ações reais de loops/regex, cruzar o inventário e comparar os artefactos
com a geração esperada. A nova referência reutiliza schemas administrativos existentes
e aponta para ficheiro/linha dos proprietários.

É uma verificação estrutural e de coerência com o código, não uma certificação
externa completa de OpenAPI nem teste HTTP de todas as 215 operações. Alguns schemas
de resposta continuam genéricos e há regras relacionais/temporais no proprietário.
Este limite está assinalado no contrato; completar esses DTOs é necessário antes
de prometer geração de SDK estrito. Não foram inventadas rotas de refresh, bootstrap
HTTP, cotação pública, SSE/push ou reconciliação do Payment autónomo.

Os exemplos foram cruzados com os campos/validações dos proprietários. As diferenças
entre a Agenda Pessoal implementada e os requisitos históricos, unidades de medições
e preferências separadas foram documentadas, sem alterações funcionais para as ocultar.

## Instalação e configurações

A inspeção de `compose.integration.yaml` confirma replica set de um membro, três volumes próprios
por projeto, identidades MongoDB por base, credenciais geradas, rede backend interna
e apenas Gateway publicado em loopback. Coach continua desativado, bootstrap
administrativo desativado, revisão sintética desativada, Payment+Agenda desativado
e elegibilidade sintética rejeitada pelo adaptador normal.

O `compose.yaml` principal continua legado: MongoDB standalone, ambiente declarado
como produção e fallbacks de desenvolvimento em configurações partilhadas. Não é
o procedimento de entrega desta fase nem foi reconstruído. A stack paralela usa
segredos novos gerados e não herda esses fallbacks. Imagens base continuam por tags
de versão, não por digest; lockfile/`npm ci` fixam dependências npm, mas não prometem
reprodução binária de futuros pulls/builds. Fixar/reter artefactos é trabalho posterior.

A documentação não manda usar `integration.cjs test` como sonda: inclui paragens.
Também assinala que `up/status` históricos pressupõem catorze componentes principais
e que `start` usa `up` internamente. O guia novo usa os argumentos de projeto/instância
validados para uma instalação própria e operações stop/start explícitas, sem mudar
esses scripts ou os validadores. Não se iniciou uma instalação limpa noutro host;
esse ensaio, os builds e quaisquer mudanças de infraestrutura exigem autorização.

## Proteção da entrega

São candidatos apenas Markdown, OpenAPI/inventário JSON e o script offline.
Verificam-se `git diff --check`, `git diff --cached --check`, whitespace dos ficheiros
novos, ligações relativas e ausência de material sensível nos candidatos. Confirmam-se
os ignores de `.env`, `.secrets/` e `.integration/`, sem os adicionar ao índice.
Não se copiam volumes, imagens, envs, históricos de conversa, dumps, backups ou
fixtures persistentes. Exemplos usam placeholders e nomes fictícios.

Os documentos/resultados das Fases 5.9–5.13 e os SHA-256 dos dois validadores E2E
permanecem preservados. Só o guia histórico da Fase 5.12 recebe uma nota de navegação
para impedir utilização inadequada da CLI numa máquina nova. O plano recebe a
secção 5.14; não reclassifica casos passados.

## Ficheiros desta fase

Novos:

- `documentation/api/backend-release-v1.md`
- `documentation/api/backend-release-v1-endpoints.md`
- `documentation/api/backend-release-v1.openapi.json`
- `documentation/api/backend-release-v1.routes.json`
- `documentation/release-v1/README.md`
- `documentation/release-v1/local-setup.md`
- `documentation/release-v1/frontend.md`
- `documentation/release-v1/readiness.md`
- `documentation/release-v1/validation.md`
- `scripts/release-contracts.cjs`

Atualizados:

- `README.md`
- `documentation/api/backend-integration-v1.md`
- `documentation/architecture/README.md`
- `documentation/backend-completion-plan.md`

## Testes não executados e pendências

Não houve builds, regressão global/direcionada de negócio, stop/start de dependências,
provisionamento, migrações ou escrita de fixtures nesta fase. O último E2E continua
a ser o resultado histórico **80/0/12**, com os [doze casos individualizados](readiness.md).
As sondas GET desta entrega não desbloqueiam esses casos nem validam novamente MFA,
pagamentos, reservas ou recuperação de falhas.

Permanecem pendentes o primeiro arranque noutra máquina, percursos privilegiados e
profissionais reais, integração financeira em ambiente compatível, reconciliação
efetiva, acesso mobile físico e revisão integrada de segurança/privacidade/produção.
Não se executaram commit, push, merge ou alterações na main. A entrega é de desenvolvimento.
