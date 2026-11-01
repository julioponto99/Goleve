const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes,createHmac}=require('node:crypto');
const auth=require('../dist/professional/service-auth');
const remoteAuth=require('../../professional-service/dist/internal/agenda-service-auth');
const {localInstant,instant,intersects}=require('../dist/professional/time');
const {ruleInput,bookingInput,exceptionInput,versionHeader}=require('../dist/professional/validation');
const {ProfessionalEligibilityClient}=require('../dist/professional/eligibility');
const keys={activeId:'test-current',keys:{'test-current':randomBytes(32),'test-previous':randomBytes(32)}};
const id='507f1f77bcf86cd799439011',other='507f1f77bcf86cd799439012';
const rule=()=>({capabilityId:id,weekday:1,localStartTime:'09:00',localEndTime:'18:00',timezone:'Europe/Lisbon',sessionModes:['online'],environments:[],slotDurationMinutes:60,bufferBeforeMinutes:5,bufferAfterMinutes:5,validFrom:'2027-01-01',validUntil:'2027-02-01'});
const booking=()=>({professionalId:other,capabilityId:id,appointmentType:'initial_session',mode:'online',startAtUtc:'2027-01-01T10:00:00Z',endAtUtc:'2027-01-01T11:00:00Z',timezone:'Europe/Lisbon'});
test('dedicated service credentials bind audience, body, lifetime and rotating key; implementations interoperate',()=>{
 const body={capabilityId:id},token=auth.signServiceRequest(body,keys);
 assert.ok(remoteAuth.verifyServiceRequest(token,body,keys).nonce);
 const old={activeId:'test-previous',keys:keys.keys};assert.ok(remoteAuth.verifyServiceRequest(auth.signServiceRequest(body,old),body,keys).nonce);
 assert.throws(()=>remoteAuth.verifyServiceRequest(token,{capabilityId:other},keys));
 assert.throws(()=>remoteAuth.verifyServiceRequest(token,body,{activeId:'unknown',keys:{unknown:randomBytes(32)}}));
 assert.throws(()=>remoteAuth.verifyServiceRequest(auth.signServiceRequest(body,keys,Date.now()-20000),body,keys));
 assert.throws(()=>remoteAuth.verifyServiceRequest(auth.signServiceRequest(body,keys,Date.now()+10000),body,keys));
 assert.throws(()=>remoteAuth.verifyServiceRequest('Bearer invalid.jwt',body,keys));
 const encoded=token.slice(14).split('.')[0],claims=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));claims.aud='unapproved-service';
 const wrongAudience=Buffer.from(JSON.stringify(claims)).toString('base64url'),signature=createHmac('sha256',keys.keys[keys.activeId]).update(wrongAudience).digest('base64url');
 assert.throws(()=>remoteAuth.verifyServiceRequest('AgendaService '+wrongAudience+'.'+signature,body,keys));
});
test('DST Lisbon rejects nonexistent spring time and requires disambiguation in autumn',()=>{
 assert.throws(()=>localInstant('2026-03-29','01:30','Europe/Lisbon'),/Nonexistent/);
 assert.throws(()=>localInstant('2026-10-25','01:30','Europe/Lisbon'),/Ambiguous/);
 const early=localInstant('2026-10-25','01:30','Europe/Lisbon','earlier'),late=localInstant('2026-10-25','01:30','Europe/Lisbon','later');
 assert.equal(late-early,3600000);assert.equal(early.toISOString(),'2026-10-25T00:30:00.000Z');assert.equal(late.toISOString(),'2026-10-25T01:30:00.000Z');
});
test('strict recurring rules validate bounded validity, duration, buffers, unknown fields and DST',()=>{
 assert.equal(ruleInput(rule()).slotDurationMinutes,60);
 for(const patch of [{slotDurationMinutes:40},{bufferBeforeMinutes:-1},{weekday:7},{timezone:'Invalid/Zone'},{admin:true},{localEndTime:'08:00'},{professionalAuthUserId:id}])assert.throws(()=>ruleInput({...rule(),...patch}));
 const fall={...rule(),weekday:0,localStartTime:'01:30',localEndTime:'03:30',validFrom:'2026-10-25',validUntil:'2026-10-25'};assert.throws(()=>ruleInput(fall),/Ambiguous/);assert.ok(ruleInput({...fall,dstDisambiguation:'later'}));
});
test('booking variants forbid identity injection, follow-up downgrade and unapproved durations',()=>{
 assert.equal(bookingInput(booking()).appointmentType,'initial_session');
 assert.throws(()=>bookingInput({...booking(),relationshipId:other}));
 assert.throws(()=>bookingInput({...booking(),appointmentType:'follow_up'}));
 assert.equal(bookingInput({...booking(),appointmentType:'follow_up',relationshipId:other}).relationshipId,other);
 for(const patch of [{subjectAuthUserId:id},{status:'accepted'},{environment:'home'},{endAtUtc:'2027-01-01T10:40:00Z'},{startAtUtc:'2027-01-01T10:00:01Z'},{timezone:'unknown'}])assert.throws(()=>bookingInput({...booking(),...patch}));
 assert.throws(()=>bookingInput({...booking(),mode:'in_person'}));assert.equal(bookingInput({...booking(),mode:'in_person',environment:'outdoor'}).environment,'outdoor');
});
test('strict dates reject missing offsets, invalid calendar dates and overflowing times',()=>{
 for(const value of ['2027-02-30T10:00:00Z','2027-01-01T25:00:00Z','2027-01-01T10:00:00','not-a-date',null])assert.throws(()=>instant(value));
 assert.equal(instant('2027-07-01T11:00:00+01:00').toISOString(),'2027-07-01T10:00:00.000Z');
 const a=new Date(0),b=new Date(60000),c=new Date(120000);assert.equal(intersects(a,b,b,c),false);assert.equal(intersects(a,c,b,c),true);
});
test('exceptions and preconditions are strict and do not silently relax ownership',()=>{
 assert.throws(()=>exceptionInput({capabilityId:id,type:'block',startAtUtc:'2027-01-01T10:00:00Z',endAtUtc:'2027-01-01T11:00:00Z',timezone:'UTC',reasonCode:'unavailable',sessionModes:['online']}));
 assert.throws(()=>versionHeader(undefined,id),{statusCode:428});assert.throws(()=>versionHeader('"'+other+':1"',id),{statusCode:412});assert.equal(versionHeader('"'+id+':2"',id),2);
});
test('normal adapter rejects synthetic positive decisions and outages; feature defaults disabled',async()=>{
 const original=global.fetch,env={...process.env};
 try{
  const now=new Date(),proof={capabilityId:id,professionalId:other,professionalAuthUserId:id,relationshipKind:'nutrition',eligible:true,canOfferAppointment:true,authority:'synthetic',checkedAtUtc:now.toISOString(),validUntilUtc:new Date(now.getTime()+10000).toISOString(),serviceModes:['online'],relationshipAccepted:true};
  global.fetch=async()=>({ok:true,status:200,headers:new Headers(),json:async()=>({data:proof})});
  await assert.rejects(new ProfessionalEligibilityClient('http://professional.test',keys).check({capabilityId:id}),{code:'PROFESSIONAL_INELIGIBLE'});
  global.fetch=async()=>{throw new Error('private transport failure')};await assert.rejects(new ProfessionalEligibilityClient('http://professional.test',keys).check({capabilityId:id}),{code:'PROFESSIONAL_UNAVAILABLE'});
  delete process.env.AGENDA_PROFESSIONAL_ENABLED;assert.equal(require('../dist/professional/settings').loadProfessionalAgendaSettings().enabled,false);
  process.env.AGENDA_PROFESSIONAL_ENABLED='true';process.env.NODE_ENV='production';assert.throws(()=>require('../dist/professional/settings').loadProfessionalAgendaSettings());
  await assert.rejects(require('../dist/professional/settings').requireReplicaSet({db:{admin:()=>({command:async()=>({isWritablePrimary:true})})}}),/replica set/);
 }finally{global.fetch=original;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);}
});
