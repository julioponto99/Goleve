# Diagnóstico dos verificadores estritos — Fase 6.1

Investigação offline, branch integration/frontend-v1, base 0426760.
Não foram modificados contratos, geradores existentes, hash guardado ou runtime.
O [script novo de auditoria](../../frontend/scripts/audit-backend-contracts.cjs)
lê apenas código/documentos públicos e verifica a proposta em memória.

## Causa exata

core.autocrlf=true converteu para CRLF os ficheiros que o índice Git contém em LF.

1. scripts/release-contracts.cjs compara strings exatas com saídas geradas em LF.
   Além disso, lê TypeScript com CRLF antes de truncar snippets handler a 180
   caracteres: os CR adicionais alteram o ponto de corte. Normalizar apenas o
   JSON final não resolve estes quatro snippets.
2. scripts/gateway-swagger.cjs calcula SHA-256 sobre nomes dos quatro documentos
   e os bytes originais, incluindo CR. O artefacto versionado foi criado com LF;
   o checkout Windows produz outro hash. O TypeScript gerado também é comparado
   por bytes/fins de linha.

Snippets afetados: POST /agenda/professional-appointments/{id}/service,
POST /auth/manager-invitations, POST /auth/manager-invitations/accept e
GET /management/dashboard.

| Origem dos bytes | SHA-256 |
|---|---|
| Artefacto versionado / documentos LF do Git | 8d503121f44a3a869c3d6fb0b2b48822c9fa6ea8c2535996319a1580eea0f88a |
| Documentos CRLF no working tree | c8c6fb2fb85321cc5ab86ed3b719cbbba055a53fd9875bd332e0bff580bdb518 |
| Os mesmos documentos após normalização CRLF→LF | 8d503121f44a3a869c3d6fb0b2b48822c9fa6ea8c2535996319a1580eea0f88a |

Os hashes referem esta base de código; não são valores a fixar em assertions de
runtime. O primeiro coincide também com o cálculo a partir de git show HEAD:ficheiro.
A comparação semântica do OpenAPI, dos 215 contratos e do documento Swagger passou.

## Correção mínima proposta, ainda não aplicada

Normalizar exclusivamente CRLF para LF na leitura de texto do gerador, antes do
parsing/truncagem; na leitura do artefacto comparado; e nos bytes textuais que entram
no hash. Não remover espaços, campos, operações ou diferenças de conteúdo.

No scripts/release-contracts.cjs, a função read passa a:

```js
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
```

No scripts/gateway-swagger.cjs, o input textual do hash passa a:

```js
hash.update(path.basename(file))
  .update(Buffer.from(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')));
```

A comparação do artefacto passa a:

```js
assert.equal(
  fs.readFileSync(output,'utf8').replace(/\r\n/g,'\n'),
  generated.content,
  'Bundled Swagger document drift; run docs:generate'
);
```

Não é necessário mudar o hash guardado: a proposta preserva-o exatamente.
As verificações de igualdade, schemas, referências, rotas e fronteira pública
mantêm-se. Uma política Git eol=lf pode complementar a correção, mas não foi
introduzida nem alterada qualquer configuração existente nesta fase.

## Prova executável

A partir de frontend/:

```powershell
node scripts/audit-backend-contracts.cjs
npm.cmd test
```

O script carrega versões candidatas dos dois módulos **apenas em memória**, com
leituras LF e CRLF, e verifica:

- 215 operações / 170 caminhos / 11 serviços e 1289 referências.
- Igualdade dos três artefactos de contrato e do artefacto Swagger completo.
- Mesmo SHA-256 já guardado em ambas as variantes.
- Rejeição de alteração real no contrato OpenAPI, testada sem gravar o ficheiro.

Não se executa --write nem se geram artefactos backend. Os scripts originais
continuam a falhar o check estrito neste checkout até ser autorizada/aplicada a
correção proposta. O teste da versão candidata não é apresentado como aprovação
dos comandos originais.
