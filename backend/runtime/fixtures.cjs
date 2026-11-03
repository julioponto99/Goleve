'use strict';
const crypto=require('node:crypto');
const oid=(p,key)=>crypto.createHash('sha256').update(p.instance+':'+key).digest('hex').slice(0,24);
function fixtures(owner,p) {
  const rows=[],epoch=new Date(p.seedEpoch),uid=p.accounts[0].id,r=p.resources;
  const add=(model,key,data,id)=>rows.push({model,key,doc:{_id:id||oid(p,owner+':'+key),...data}});
  if(owner==='user')for(const a of p.accounts){add('Profile',a.id+':profile',{authUserId:a.id,displayName:a.name,countryCode:'PT',profileStatus:'active'});add('Preferences',a.id+':preferences',{authUserId:a.id,locale:'pt-PT',timeZone:'Europe/Lisbon',theme:'light',units:{system:'metric'},notifications:{channels:{inApp:true,email:false,push:false},categories:{appointments:true,activity:true,hydration:true,security:true}}});}
  if(owner==='training') {
    add('Exercise','squat',{ownerId:uid,name:'Agachamento — demonstração',muscleGroup:'Pernas',equipment:[],environments:['home','gym','outdoor'],difficulty:'beginner',type:'strength',instructions:'Exercício fictício para demonstração do registo de treino.'});
    add('Exercise','walk',{ownerId:uid,name:'Caminhada — demonstração',muscleGroup:'Corpo inteiro',equipment:[],environments:['outdoor'],difficulty:'beginner',type:'cardio',instructions:'Atividade fictícia; ajustar o treino às capacidades individuais.'});
    add('Plan','weekly',{ownerId:uid,title:'Plano semanal de demonstração',description:'Dados fictícios, sem prescrição profissional real.',goals:['Consistência'],days:['Segunda','Quarta','Sexta'],environment:'home',exercises:[{exerciseId:oid(p,'training:squat'),sets:3,repetitions:10,restSeconds:60,day:'Segunda'}],status:'active'});
    add('Session','next',{ownerId:uid,planId:oid(p,'training:weekly'),status:'planned',exercises:[]});
    for(let i=1;i<=3;i++)add('Session','completed-'+i,{ownerId:uid,planId:oid(p,'training:weekly'),status:'completed',startedAt:new Date(epoch.getTime()-i*86400000-1800000),completedAt:new Date(epoch.getTime()-i*86400000),durationSeconds:1800,exercises:[{exerciseId:oid(p,'training:squat'),sets:[{repetitions:10},{repetitions:10},{repetitions:10}],notes:'Registo fictício de demonstração'}]});
  }
  if(owner==='hydration') {
    add('Goal','daily',{ownerId:uid,targetMl:2000,source:'custom',timezone:'Europe/Lisbon'});
    for(let day=0;day<7;day++)for(let j=1;j<=3;j++){const consumedAt=new Date(epoch.getTime()-day*86400000-j*15*60000);add('Intake','intake-'+day+'-'+j,{ownerId:uid,amountMl:day===0?400:500,consumedAt,timezone:'Europe/Lisbon',localDate:consumedAt.toISOString().slice(0,10),idempotencyKey:'local-demo-'+p.instance+'-'+day+'-'+j});}
  }
  if(owner==='performance') {
    for(let i=0;i<7;i++)add('Measurement','weight-'+i,{ownerId:uid,kind:'weight',value:78.2-i*.1,unit:'kg',measuredAt:new Date(epoch.getTime()-(6-i)*7*86400000),timezone:'Europe/Lisbon',source:'manual',idempotencyKey:'local-demo-'+p.instance+'-weight-'+i});
    for(const [kind,value]of [['height',175],['waist',85]])add('Measurement',kind,{ownerId:uid,kind,value,unit:'cm',measuredAt:epoch,timezone:'Europe/Lisbon',source:'manual',idempotencyKey:'local-demo-'+p.instance+'-'+kind});
  }
  if(owner==='agenda')for(let i=1;i<=4;i++){const start=new Date(epoch.getTime()+(i===4?-2:i)*86400000),end=new Date(start.getTime()+1800000);add('Activity','activity-'+i,{authUserId:uid,title:i===4?'Caminhada concluída — demonstração':'Atividade pessoal — demonstração '+i,description:'Atividade fictícia, independente de reservas profissionais.',kind:'workout',environment:i%2?'outdoor':'home',startAt:start,endAt:end,timezone:'Europe/Lisbon',status:i===4?'completed':'planned',...(i===4?{completedAt:end}:{})});}
  if(owner==='professional')for(const [index,prefix,kind]of [[1,'pt','personal_trainer'],[2,'nutrition','nutritionist']]){
    const a=p.accounts[index],profile=r[prefix+'Profile'],cap=r[prefix+'Capability'],qualification=r[prefix+'Qualification'];
    add('Profile',prefix+'-profile',{authUserId:a.id,professionalName:a.name,biography:'Perfil inteiramente fictício para demonstração; sem verificação de credenciais reais.',countryCode:'PT',languages:['pt'],profileStatus:'submitted',directoryVisibility:'hidden'},profile);
    add('Capability',prefix+'-capability',{authUserId:a.id,professionalId:profile,kind,jurisdictionCountry:'PT',specializations:[],experienceStartYear:2020,serviceModes:['online'],status:'pending'},cap);
    add('Qualification',prefix+'-qualification',{authUserId:a.id,professionalId:profile,capabilityId:cap,qualificationType:'certification',title:'Qualificação FICTÍCIA — demonstração',issuerName:'Entidade fictícia, sem acreditação',awardedOn:'2020-01-01',verificationStatus:'unverified',publishSummary:false,idempotencyKey:'local-demo-'+p.instance+'-'+prefix,inputFingerprint:crypto.createHash('sha256').update(prefix+p.instance).digest('hex')},qualification);
    add('Application',prefix+'-application',{authUserId:a.id,professionalId:profile,status:'pending',publicationEnabled:false,submittedAt:epoch,snapshot:{profile:{professionalName:a.name,countryCode:'PT',languages:['pt']},capabilities:[{id:cap,kind,jurisdictionCountry:'PT',specializations:[],serviceModes:['online']}],qualifications:[{id:qualification,capabilityId:cap,qualificationType:'certification',title:'Qualificação FICTÍCIA — demonstração',issuerName:'Entidade fictícia, sem acreditação'}],publicationRequested:false,publicQualificationIds:[],submittedProfileVersion:1},history:[{eventId:crypto.randomUUID(),version:1,action:'submit',from:'draft',to:'pending',actorAuthUserId:a.id,occurredAt:epoch,reason:'Preparação explícita de demonstração',commandKeyHash:crypto.createHash('sha256').update(prefix+p.instance).digest('hex'),commandFingerprint:crypto.createHash('sha256').update(prefix+p.instance).digest('hex')}]},r[prefix+'Application']);
    add('Service',prefix+'-service',{authUserId:a.id,professionalId:profile,capabilityId:cap,category:kind,name:prefix==='pt'?'Treino pessoal — demonstração':'Nutrição — demonstração',description:'Serviço simulado, sem certificação ou pagamento real.',priceEur:prefix==='pt'?35:50,durationMinutes:60,bufferBeforeMinutes:15,bufferAfterMinutes:15,active:true},r[prefix+'Service']);
    add('Entitlement',prefix+'-entitlement',{instance:p.instance,authUserId:a.id,professionalId:profile,capabilityId:cap,serviceId:r[prefix+'Service'],authority:'synthetic',active:true,expiresAt:new Date(p.expiresAt),version:1,source:'explicit_local_demo_cli'},r[prefix+'Entitlement']);
  }
  if(owner==='management'){
    add('Operator','operator',{authUserId:p.accounts[3].id,displayName:p.accounts[3].name,operatorStatus:'active'},r.managerOperator);
    add('Scope','scope',{kind:'service',name:'Âmbito FICTÍCIO — dois serviços de demonstração',serviceIds:[r.ptService,r.nutritionService],createdBy:p.accounts[4].id,status:'active'},r.managerScope);
    add('DemoGrant','grant',{instance:p.instance,operatorProfileId:r.managerOperator,scopeId:r.managerScope,permissions:['services.read','professionals.read','appointments.read','payments.read','dashboard.read','services.suspend','services.reactivate','cases.read','cases.write','audit.read'],validFrom:epoch,validUntil:new Date(p.expiresAt),status:'active',authority:'synthetic',source:'explicit_local_demo_cli',authRoleVersion:0},r.managerGrant);
    add('Case','case',{scopeId:r.managerScope,serviceId:r.ptService,caseType:'service_operation',resourceOwnerService:'professional',resourceId:r.ptService,responsibleOperatorId:r.managerOperator,status:'open',reasonCode:'synthetic_demo_case',createdBy:p.accounts[3].id});
    add('Audit','scope-audit',{actorId:p.accounts[4].id,actionCode:'local_demo.fixture.grant',resourceType:'assignment',resourceId:r.managerGrant,scopeId:r.managerScope,requestId:crypto.randomUUID(),result:'allowed',reasonCode:'explicit_synthetic_fixture',occurredAt:epoch});
  }
  if(owner==='notification')for(const a of p.accounts)add('Preference',a.id+'-preferences',{ownerId:a.id,enabled:true,paymentEvents:true,hydrationReminders:true,trainingEvents:true,agendaReminders:true});
  return rows;
}
module.exports={fixtures,oid};
