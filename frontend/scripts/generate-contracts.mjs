import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import openapiTS, { astToString } from 'openapi-typescript';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
// Reads owner code and public OpenAPI only; does not regenerate backend artefacts.
const { bundle } = require('../../scripts/gateway-swagger.cjs');
const { routes } = require('../../scripts/release-contracts.cjs');
const spec = bundle().document;
const typed = '// Generated from the verified public Gateway document. Do not edit.\n'
  + '// Some owner responses are deliberately generic; decode them at the boundary.\n'
  + astToString(await openapiTS(spec));
const metadata = routes().map(({method,path: route,service}) => ({ method, path: route, service }));
const runtime = '// Generated public operations, no internal URLs or credentials.\n'
  + 'export const publicOperations = ' + JSON.stringify(metadata,null,2) + ' as const;\n';
const outputs = new Map([
 ['frontend/shared/src/contracts/openapi.generated.ts',typed],
 ['frontend/shared/src/contracts/operations.generated.ts',runtime]
]);
const write = process.argv.slice(2);
assert(write.length === 0 || write.length === 1 && write[0] === '--write', 'Use [--write]');
for (const [file,content] of outputs) {
 const target=path.join(root,file);
 if(write.length) {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
 else assert.equal(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n'),content,'Frontend contract drift: '+file);
}
console.log(JSON.stringify({mode:write.length?'generate':'check',operations:metadata.length,paths:Object.keys(spec.paths).length}));
