'use strict';
// Copied into each image: configuration/authority checks, no shared persistence.
const fs = require('node:fs');
const crypto = require('node:crypto');
const accounts = [
  ['utilizador', 'utilizador@demo.goleve.test'], ['profissional', 'pt@demo.goleve.test'],
  ['profissional', 'nutricionista@demo.goleve.test'], ['gestor', 'gestor@demo.goleve.test'], ['administrador', 'admin@demo.goleve.test'],
];
function policy(env = process.env, now = Date.now()) {
  const flag = env.GOLEVE_LOCAL_DEMO_ENABLED || 'false';
  if (!['true', 'false'].includes(flag)) throw Error('Invalid local demonstration flag');
  if (flag === 'false') return undefined;
  if (!['development', 'test'].includes(env.NODE_ENV) || env.GOLEVE_RUNTIME_MODE !== 'local-demo') throw Error('Local demonstration forbidden outside explicit local mode');
  const origin = new URL(env.LOCAL_DEMO_GATEWAY_ORIGIN || '');
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash) throw Error('Local gateway boundary required');
  const m = JSON.parse(fs.readFileSync(env.LOCAL_DEMO_IDENTITIES_FILE, 'utf8'));
  if (m.version !== 1 || !/^[a-f0-9]{16}$/.test(m.instance) || m.instance !== env.GOLEVE_LOCAL_DEMO_INSTANCE
    || !Number.isFinite(Date.parse(m.expiresAt)) || Date.parse(m.expiresAt) <= now || !Array.isArray(m.accounts) || m.accounts.length !== 5) throw Error('Invalid or expired local demonstration manifest');
  for (const [index, [role, email]] of accounts.entries()) {
    const a = m.accounts[index]; if (!a || a.role !== role || a.email !== email || !/^[a-f0-9]{24}$/.test(a.id)) throw Error('Only the five approved fictional identities are allowed');
  }
  if (new Set(m.accounts.map(a => a.id)).size !== 5) throw Error('Duplicate demonstration identity');
  if (!m.resources || Object.values(m.resources).some(v => typeof v !== 'string' || !/^[a-f0-9]{24}$/.test(v))) throw Error('Invalid fixture resources');
  return m;
}
function account(user, env = process.env) {
  if (!user?.localDemoInstanceId) return undefined;
  const p = policy(env); if (!p || user.localDemoInstanceId !== p.instance) throw Error('Demonstration identities are not accepted in this environment');
  const a = p.accounts.find(a => a.id === String(user._id || user.id));
  if (!a || a.email !== user.email || a.role !== (user.userType || user.role)) throw Error('Demonstration identity binding invalid');
  return { authority: 'local-demo', instance: p.instance, account: a, policy: p };
}
function identityEnvelope(body, env = process.env) {
  const p = policy(env);
  if (body?.authority === 'local-demo') {
    const a = p?.accounts.find(a => a.id === body.user?.id);
    if (!p || body.demoInstanceId !== p.instance || !a || a.role !== body.user?.userType || a.email !== body.user?.email) throw Error('Local demonstration authority refused');
    return { authority: 'local-demo', demoInstanceId: p.instance };
  }
  if (body?.authority !== undefined && body.authority !== 'standard' || p?.accounts.some(a => a.id === body?.user?.id)) throw Error('Authentication authority mismatch');
  return { authority: 'standard' };
}
function permitsDemoDatabase(service, database, env = process.env) {
  const p = policy(env); return !!p && database === 'goleve_' + ({ payment: 'payment', agenda: 'agenda', professional: 'professional', notification: 'notification' }[service] || service);
}
function assertAction(actor, action, target, parameters) {
  const a = account(actor); if (!a) return;
  const safe = ['user.suspend', 'user.reactivate', 'user.revoke'];
  if (!safe.includes(action) || !a.policy.accounts.some(x => x.id === target && x.role !== 'administrador')) throw Error('This operation requires real independent administrative authority');
}
function key() { const text=fs.readFileSync(process.env.LOCAL_DEMO_IDENTITY_KEY_FILE,'utf8').trim();if(!/^[a-f0-9]{64}$/.test(text))throw Error('Independent identity key required');return Buffer.from(text,'hex'); }
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mac = value => crypto.createHmac('sha256',key()).update(value).digest('hex');
const equal = (a,b) => { const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y); };
function identityAssertion(body) {
  const p=policy();if(!p)throw Error('Local identity contract disabled');
  const claims={iss:'professional',aud:'auth:local-demo:v1',instance:p.instance,method:'POST',operation:'identity',bodyHash:digest(body),iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+15,jti:crypto.randomUUID()};
  const data=Buffer.from(JSON.stringify(claims)).toString('base64url');return 'Service '+data+'.'+mac(data);
}
function verifyIdentityAssertion(authorization,body) {
  const p=policy();if(!p||typeof authorization!=='string'||authorization.length>2048||!/^Service [A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(authorization))throw Error('Identity authentication required');
  const [data,signature]=authorization.slice(8).split('.');if(!equal(signature,mac(data)))throw Error('Identity authentication invalid');
  const c=JSON.parse(Buffer.from(data,'base64url')),now=Math.floor(Date.now()/1000);
  if(Object.keys(c).length!==9||c.iss!=='professional'||c.aud!=='auth:local-demo:v1'||c.instance!==p.instance||c.method!=='POST'||c.operation!=='identity'||c.bodyHash!==digest(body)||!Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.exp)||c.iat>now+1||c.iat<now-15||c.exp<=now||c.exp-c.iat!==15||!/^[a-f0-9-]{36}$/.test(c.jti))throw Error('Identity assertion invalid');
  return c.jti;
}
function identityProof(data,authorization) { return mac(JSON.stringify(data)+':'+authorization); }
async function currentIdentity(id,role) {
  const p=policy(),a=p?.accounts.find(a=>a.id===id);if(!a||a.role!==role)throw Error('Identity outside approved fixtures');
  const origin=new URL(process.env.AUTH_SERVICE_URL||'');if(origin.protocol!=='http:'||!['auth-service','127.0.0.1','localhost'].includes(origin.hostname)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('Local Auth origin required');
  const body={id},authorization=identityAssertion(body),r=await fetch(origin.origin+'/internal/v1/local-demo/identity',{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(3000)});
  if(!r.ok)throw Error('Current fixture identity unavailable');const text=await r.text();if(text.length>2048)throw Error('Invalid identity response');const d=JSON.parse(text);
  if(!equal(r.headers.get('x-local-demo-proof')||'',identityProof(d,authorization))||d.id!==id||d.userType!==role||d.authority!=='local-demo'||d.instance!==p.instance||!Number.isFinite(Date.parse(d.expiresAt))||Date.parse(d.expiresAt)<=Date.now()||Date.parse(d.expiresAt)>Date.now()+11000)throw Error('Current fixture identity refused');return d;
}
module.exports = { policy, account, identityEnvelope, permitsDemoDatabase, assertAction, accounts, identityAssertion, verifyIdentityAssertion, identityProof, currentIdentity };
