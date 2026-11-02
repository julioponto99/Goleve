'use strict';
// Load the current compiled Payment code in private test processes; no image or running server is changed.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const { createHash, randomUUID, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const replacements = ['models/payment.model.js', 'services/payment.service.js'];
const digest = text => createHash('sha256').update(text).digest('hex');
if (process.env.PAYMENT_FIX_PRELOAD === '1') {
  const Module = require('node:module'), supplied = JSON.parse(process.env.PAYMENT_FIX_MODULES);
  assert.equal(path.basename(process.cwd()), 'payment-service');
  assert.deepEqual(Object.keys(supplied).sort(), [...replacements].sort());
  const original = Module._extensions['.js'];
  Module._extensions['.js'] = (module, filename) => {
    const key = replacements.find(name => filename === path.join(process.cwd(), 'dist', name));
    if (key) module._compile(supplied[key], filename); else original(module, filename);
  };
} else if (require.main === module) {
  if (path.basename(process.cwd()) === 'payment-service') {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    assert.match(input.instance || '', /^[a-f0-9]{16}$/);
    const uri = new URL(process.env.MONGO_URI);
    assert.equal(uri.hostname, 'mongodb'); assert.equal(uri.username, 'integration_payment');
    assert.equal(uri.pathname, '/goleve_notification59_' + input.instance + '_payment');
    assert(['suite','original-probe'].includes(input.action));
    const env = { ...process.env, NODE_ENV: 'test', NODE_OPTIONS: '--max-old-space-size=48', PAYMENT_FIX_PRELOAD: '1',
      PAYMENT_FIX_INSTANCE: input.instance, PAYMENT_FIX_MODULES: JSON.stringify(input.compiled),
      PAYMENT_CONFIRMATION_TEST_MONGO_URI: process.env.MONGO_URI };
    let args, stdin;
    if (input.action === 'suite') {
      env.PAYMENT_FIX_TEST_SOURCE = input.testSource;
      args = ['--require', __filename, '-e', "const Module=require('node:module'),path=require('node:path');const name=path.join(process.cwd(),'tests/confirmation-concurrency.test.cjs'),m=new Module(name,module);m.filename=name;m.paths=Module._nodeModulePaths(path.dirname(name));m._compile(process.env.PAYMENT_FIX_TEST_SOURCE,name);"];
    } else {
      args = ['--require', __filename, '/integration/e2e-probe.cjs']; stdin = JSON.stringify(input.probe);
    }
    const result = cp.spawnSync(process.execPath, args, { env, input: stdin, encoding: 'utf8', timeout: 120000, maxBuffer: 3000000 });
    process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || ''); process.exitCode = result.status ?? 1;
  } else {
    void (async () => {
      const root = path.resolve(__dirname, '../..'), tools = require('../integration.cjs'), { inventory, compareBaseline } = require('./e2e.cjs');
      assert.equal(cp.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'feat/backend-e2e-v1');
      const s = tools.load(), before = inventory(), owner = tools.own(s,'payment-service'); assert.equal(owner.health,'healthy');
      const probePath = path.join(__dirname,'e2e-probe.cjs'), validatorPath = path.join(__dirname,'e2e.cjs');
      const originalHashes = [probePath,validatorPath].map(file => digest(fs.readFileSync(file)));
      const compiled = Object.fromEntries(replacements.map(file => [file,fs.readFileSync(path.join(root,'backend/services/payment-service/dist',file),'utf8')]));
      const testSource = fs.readFileSync(path.join(root,'backend/services/payment-service/tests/confirmation-concurrency.test.cjs'),'utf8');
      const report = { startedAt:new Date().toISOString(), paymentContainerId:owner.id, image:owner.image, validatorHashes:originalHashes,
        compiledHashes:Object.fromEntries(Object.entries(compiled).map(([k,v])=>[k,digest(v)])), method:'Private Node test processes with current compiled modules in memory; live container image and HTTP process unchanged' };
      try {
        const suite = tools.exec(s,'payment-service','payment-confirmation.cjs',{instance:s.id,action:'suite',compiled,testSource});
        process.stdout.write(suite+'\n');
        const counts = /# tests (\d+)[\s\S]*# pass (\d+)[\s\S]*# fail (\d+)/.exec(suite); assert(counts);
        report.tests = { total:Number(counts[1]),passed:Number(counts[2]),failed:Number(counts[3]) }; assert.equal(report.tests.failed,0);
        const base = 'http://127.0.0.1:'+s.port;
        const request = async (route, token, body, extra={}) => {
          const response = await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{Connection:'close',Origin:'http://localhost:5173',...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...extra},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
          const data=await response.json();return {status:response.status,data:data.data??data};
        };
        const registration=await request('/auth/register',null,{name:'Fictional payment concurrency',email:'payment-fix-'+randomUUID()+'@example.invalid',password:'Fictional-'+randomBytes(12).toString('hex')});assert.equal(registration.status,201);
        const identity=registration.data.user.id, token=registration.data.accessToken;
        const creation=await request('/payments',token,{priceReference:'integration-approve',amountCents:2500,serviceReference:'fictional-payment-fix'},{'Idempotency-Key':randomUUID()});assert.equal(creation.status,201);
        report.originalProbe=JSON.parse(tools.exec(s,'payment-service','payment-confirmation.cjs',{instance:s.id,action:'original-probe',compiled,probe:{instance:s.id,action:'payment-concurrency',owner:identity,id:creation.data.id}}));
        // The unchanged original assertion checks one bank call. Its five-second barrier also tests the shorter bank timeout.
        assert.equal(report.originalProbe.bankCalls,1);
        assert.deepEqual([probePath,validatorPath].map(file=>digest(fs.readFileSync(file))),originalHashes);
        const end=Date.now()+30000; let notified=false;
        do {const r=await request('/notifications?limit=100',token);assert.equal(r.status,200);const items=r.data.items||[];if(items.some(n=>n.eventType==='payment.simulated.unknown.v1')){assert.equal(items.filter(n=>n.eventType==='payment.simulated.unknown.v1').length,1);notified=true;break;}await new Promise(r=>setTimeout(r,1000));}while(Date.now()<end);
        assert(notified,'Existing worker must deliver one informative unknown-result notification'); report.unknownNotificationDeliveredOnce=true;
      } catch (error) { report.failed=true;throw error; }
      finally {
        report.preservation=compareBaseline(before,inventory());assert.equal(tools.own(s,'payment-service').image,owner.image);
        report.finishedAt=new Date().toISOString();
        fs.writeFileSync(path.join(s.directory,'payment-confirmation-validation.json'),JSON.stringify(report,null,2),{mode:0o600});
      }
      console.log('PAYMENT FIX '+JSON.stringify(report));
    })().catch(error=>{console.error('Payment validation stopped: '+(error.code||error.name));process.exitCode=1;});
  }
}
