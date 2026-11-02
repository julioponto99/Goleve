'use strict';
// Offline documentation generator/checker. Never loads services or invokes Docker/network.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),local=createRequire(path.join(root,'backend/package.json')),ts=local('typescript');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const base='backend/services/';
const descriptors=[
 ['gateway','backend/api-gateway/src/app.ts','',null,['/health','/ready']],
 ['auth',base+'auth-service/src/routes/auth.routes.ts','/auth'],
 ['auth',base+'auth-service/src/administration/routes.ts','/auth','securityRoutes'],
 ['auth',base+'auth-service/src/administration/routes.ts','/auth/administration','administrationRoutes'],
 ['auth',base+'auth-service/src/manager-invitations.ts','/auth/manager-invitations','managerInvitationRoutes'],
 ['user',base+'user-service/src/routes/user.routes.ts','/users'],
 ['training',base+'training-service/src/routes/training.routes.ts','/training'],
 ['hydration',base+'hydration-service/src/routes/hydration.routes.ts','/hydration'],
 ['performance',base+'performance-service/src/routes/performance.routes.ts','/performance'],
 ['agenda',base+'agenda-service/src/routes/agenda.routes.ts','/agenda'],
 ['agenda',base+'agenda-service/src/routes/professional-agenda.routes.ts','/agenda'],
 ['agenda',base+'agenda-service/src/payment-demo/routes.ts','/agenda','publicBillingRoutes'],
 ['professional',base+'professional-service/src/routes/professional.routes.ts','/professionals'],
 ['professional',base+'professional-service/src/routes/care-relationship.routes.ts','/care-relationships'],
 ['professional',base+'professional-service/src/app.ts','',null,['/professionals/catalog','/professionals/services','/professionals/eligible-capabilities','/professionals/me/care-relationships']],
 ['professional',base+'professional-service/src/routes/application.routes.ts','/management/professional-applications'],
 ['management',base+'management-service/src/routes/management.routes.ts','/management','managementRoutes'],
 ['management',base+'management-service/src/routes/administration.routes.ts','/management/administration','administrationPublicRoutes'],
 ['payment',base+'payment-service/src/routes/payment.routes.ts','/payments'],
 ['payment',base+'payment-service/src/payment-demo/routes.ts','/payments','integratedPaymentRoutes'],
 ['notification',base+'notification-service/src/routes/notification.routes.ts','/notifications'],
 ['coach',base+'ai-coach-service/src/routes/coach.routes.ts','/ai-coach'],
 ['coach',base+'ai-coach-service/src/app.ts','',null,['/ai-coach/capabilities']],
];
function evaluate(n,env){
 if(ts.isAsExpression(n)||ts.isParenthesizedExpression(n)||ts.isNonNullExpression(n))return evaluate(n.expression,env);
 if(ts.isStringLiteralLike(n))return n.text;
 if(ts.isIdentifier(n)&&Object.hasOwn(env,n.text))return env[n.text];
 if(ts.isArrayLiteralExpression(n))return n.elements.flatMap(e=>ts.isSpreadElement(e)?evaluate(e.expression,env):[evaluate(e,env)]);
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken)return evaluate(n.left,env)+evaluate(n.right,env);
 throw Error('Unsupported static route expression: '+n.getText());
}
function mountedPaths(file){
 const sf=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true),mounted=new Set();
 const visit=n=>{if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.expression.getText(sf)==='app'&&n.expression.name.text==='use'){
  const first=n.arguments[0];if(first&&ts.isStringLiteralLike(first))mounted.add(first.text);else if(first&&ts.isArrayLiteralExpression(first))for(const element of first.elements)if(ts.isStringLiteralLike(element))mounted.add(element.text);
 }ts.forEachChild(n,visit);};visit(sf);return mounted;
}
function validateMounts(result){
 const gateway=mountedPaths('backend/api-gateway/src/app.ts');
 // Development documentation is served locally, not proxied to a domain service.
 gateway.delete('/api-docs');
 assert.deepEqual([...gateway].sort(),[...new Set(result.filter(r=>r.service!=='gateway').map(r=>'/'+r.path.split('/')[1]))].sort(),'Gateway prefixes changed: review public descriptors');
 for(const [service,,mount]of descriptors){if(!mount||service==='gateway')continue;
  const folder=base+(service==='coach'?'ai-coach':service)+'-service/src/',file=fs.existsSync(path.join(root,folder+'app.ts'))?folder+'app.ts':folder+'server.ts';
  if(mount==='/management/professional-applications'){
   assert(mountedPaths(base+'management-service/src/app.ts').has(mount));
   assert(mountedPaths(file).has('/professional-applications'));
   assert(read(base+'management-service/src/services/professional-review-proxy.service.ts').includes("req.originalUrl.replace(/^\\/management(?=\\/)/, '')"),'Legacy prefix rewrite changed');
  }else assert(mountedPaths(file).has(mount),'Owner mount changed: '+file+' '+mount);
 }
}
function routes(){
 const result=[];
 for(const [service,file,mount,onlyFunction,onlyPaths]of descriptors){
  const sf=ts.createSourceFile(file,read(file),ts.ScriptTarget.Latest,true);
  function visit(node,env={},fn){
   if(ts.isFunctionDeclaration(node))fn=node.name?.text;
   if(ts.isForOfStatement(node)){
    let declaresRoute=false;const scan=n=>{if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&['r','router','app'].includes(n.expression.expression.getText(sf))&&['get','post','put','patch','delete'].includes(n.expression.name.text))declaresRoute=true;ts.forEachChild(n,scan);};scan(node.statement);if(!declaresRoute)return;
    const rows=evaluate(node.expression,env),decl=node.initializer.declarations[0].name;
    for(const row of rows){const next={...env};if(ts.isIdentifier(decl))next[decl.text]=row;else decl.elements.forEach((e,i)=>next[e.name.text]=row[i]);visit(node.statement,next,fn);}return;
   }
   if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){
    const m=node.expression.name.text,receiver=node.expression.expression.getText(sf);
    if(['get','post','put','patch','delete'].includes(m)&&['r','router','app'].includes(receiver)&&(!onlyFunction||fn===onlyFunction)){
     const raw=evaluate(node.arguments[0],env);
     if(!onlyPaths||onlyPaths.includes(raw)){
      const expanded=raw.match(/:([A-Za-z]+)\(([^)]+)\)/);
      const paths=expanded?expanded[2].split('|').map(v=>raw.replace(expanded[0],v)):[raw];
      for(const p of paths){const full=(mount+(p==='/'?'':p))||'/';result.push({service,method:m,path:full.replace(/:([A-Za-z][A-Za-z0-9]*)/g,'{$1}'),file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,handler:node.arguments.at(-1).getText(sf),sourceRoute:raw});}
     }
    }
   }
   ts.forEachChild(node,n=>visit(n,env,fn));
  }
  visit(sf);
 }
 const ids=result.map(r=>r.method+' '+r.path);assert.equal(new Set(ids).size,ids.length,'Duplicate public operation');
 validateMounts(result);
 return result.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method));
}
const sourceDocs={auth:'administration-v1.md',user:'user-service.md',training:'../release-v1/frontend.md',hydration:'../release-v1/frontend.md',performance:'../release-v1/frontend.md',agenda:'professional-agenda.md',professional:'professional-service.md',management:'management-v1.md',payment:'payment-service.md',notification:'notification-service.md',coach:'ai-coach.md',gateway:'../release-v1/local-setup.md'};
function status(r){
 if(r.service==='coach')return 'disabled-by-default';
 if(r.path.startsWith('/management/professional-applications'))return 'legacy-review-disabled';
 if(r.path.startsWith('/management')||r.path.includes('/auth/administration')||r.path.includes('/manager-invitations')||r.path.includes('/initial-admin-')||r.path==='/auth/admin/step-up')return 'privileged-no-provisioned-admin';
 if(r.path.includes('/appointment-payments')||r.path.startsWith('/payments/appointments')||r.path.endsWith('/service')&&r.service==='agenda')return 'payment-agenda-demo-blocked';
 if(r.service==='agenda'&&r.path.includes('/professional'))return 'professional-eligibility-required';
 if(r.path.startsWith('/care-relationships')||r.path.includes('eligible-capabilities')||r.path.endsWith('/care-relationships'))return 'professional-eligibility-required';
 return r.service==='gateway'?'read-only-health':'local-fictional-data';
}
function authentication(r){return r.service==='gateway'||['/auth/register','/auth/login','/auth/mfa/enroll','/auth/mfa/complete','/auth/manager-invitations/accept','/auth/initial-admin-invitation/accept','/professionals/catalog','/professionals/services'].includes(r.path)?'public-or-challenge':'persisted-bearer-session';}
const str={type:'string'},num={type:'number'},integer={type:'integer'},bool={type:'boolean'},strings={type:'array',items:str};
const obj=(properties,required=[])=>({type:'object',properties,...(required.length?{required}:{}),additionalProperties:false});
const schemas={
 Empty:obj({}),Register:obj({name:str,email:{type:'string',format:'email'},password:{type:'string',minLength:8,maxLength:72,description:'8+ characters and at most 72 UTF-8 bytes; never log'}},['name','email','password']),
 Profile:obj({displayName:str,birthDate:{type:['string','null'],format:'date'},gender:{type:['string','null'],enum:['mulher','homem','nao_binario','autodescrito','prefiro_nao_indicar',null]},genderDescription:{type:['string','null']},contactEmail:{type:['string','null']},phoneE164:{type:['string','null']},countryCode:{type:['string','null']},approximateLocation:{type:['object','null'],properties:{regionCode:str,cityLabel:str}}}),
 Preferences:obj({locale:str,timeZone:str,theme:{type:'string',enum:['system','light','dark']},units:obj({system:{type:'string',enum:['metric','imperial']}},['system']),notifications:obj({channels:obj({inApp:bool,email:bool,push:bool}),categories:obj({appointments:bool,activity:bool,hydration:bool,security:bool})}),quietHours:{type:['object','null'],properties:{startMinute:integer,endMinute:integer,days:{type:'array',items:integer}}}}),
 Habits:obj({usualSleepMinutes:{type:['integer','null'],minimum:0,maximum:1440},exerciseDaysPerWeek:{type:['integer','null'],minimum:0,maximum:7},activityLevel:{type:['string','null']},hydrationHabit:{type:['string','null']},preferredTrainingWindows:{type:'array',items:obj({day:integer,startMinute:integer,endMinute:integer,timeZone:str},['day','startMinute','endMinute','timeZone'])}}),
 UserMeasurement:obj({kind:{type:'string',enum:['weight','height','waist','hip','chest','upper_arm','thigh','calf']},value:{type:'integer',minimum:1},unit:{type:'string',enum:['g','mm']},measuredAt:{type:'string',format:'date-time'}},['kind','value','unit','measuredAt']),
 UserGoal:obj({goalType:{type:'string',enum:['weight_loss','weight_maintenance','muscle_gain','fitness','hydration','daily_activity','custom']},title:str,description:{type:['string','null']},target:{type:['object','null'],properties:{metric:{type:'string',enum:['body_weight','water_volume','steps','active_minutes','training_frequency']},value:num,tolerance:num,unit:str,period:{type:'string',enum:['once','day','week']}},required:['metric','value','unit','period']},baselineMeasurementId:{type:['string','null']},startsOn:{type:['string','null'],format:'date'},targetDate:{type:['string','null'],format:'date'},status:{type:'string',enum:['proposed','active','paused','achieved','archived']}}),
 Exercise:obj({name:str,description:str,muscleGroup:str,equipment:strings,environments:{type:'array',items:{type:'string',enum:['home','gym','outdoor']}},difficulty:{type:'string',enum:['beginner','intermediate','advanced']},type:{type:'string',enum:['strength','cardio','mobility','flexibility','balance']},instructions:str},['name','muscleGroup','equipment','environments','difficulty','type','instructions']),
 PlanExercise:obj({exerciseId:str,sets:integer,repetitions:integer,load:integer,durationSeconds:integer,restSeconds:integer,day:str},['exerciseId']),
 Plan:obj({title:str,description:str,goals:strings,days:strings,environment:{type:'string',enum:['home','gym','outdoor']},exercises:{type:'array',items:{$ref:'#/components/schemas/PlanExercise'}}}),
 Session:obj({planId:str}),
 HydrationSuggestion:obj({gender:{type:'string',enum:['homem','mulher']},weightKg:{type:'integer',minimum:1,maximum:500},ageYears:{type:'integer',minimum:1,maximum:130},active:bool},['gender','weightKg','ageYears']),
 HydrationGoal:obj({targetMl:{type:'integer',minimum:250,maximum:20000},timezone:str,source:{type:'string',enum:['custom','suggested']},version:integer},['targetMl','timezone']),
 Intake:obj({amountMl:{type:'integer',minimum:1,maximum:10000},timezone:str,consumedAt:{type:'string',format:'date-time'},idempotencyKey:{type:'string',maxLength:128}}),
 Reminder:obj({enabled:bool,frequency:{type:'string',enum:['hourly','two_hourly','custom']},intervalMinutes:{type:'integer',minimum:15,maximum:1440},startTime:str,endTime:str,timezone:str,version:integer},['frequency','startTime','endTime','timezone']),
 PerformanceMeasurement:obj({kind:str,value:num,unit:str,measuredAt:{type:'string',format:'date-time'},timezone:str,idempotencyKey:str}),
 Steps:obj({count:{type:'integer',minimum:0,maximum:200000},recordedAt:{type:'string',format:'date-time'},timezone:str,idempotencyKey:str},['count','timezone']),
 HeartRate:obj({bpm:{type:'integer',minimum:20,maximum:250},measuredAt:{type:'string',format:'date-time'},timezone:str,context:str,idempotencyKey:str},['bpm','timezone']),
 PerformanceGoal:obj({target:num,timezone:str,version:integer},['target','timezone']),
 Activity:obj({title:str,description:str,kind:{type:'string',enum:['personal','workout']},environment:{type:'string',enum:['gym','home','outdoor']},startAt:{type:'string',format:'date-time'},endAt:{type:'string',format:'date-time'},timezone:str,status:{type:'string',enum:['planned','completed']}}),
 SessionExercise:obj({exerciseId:str,sets:{type:'array',maxItems:100,items:obj({repetitions:integer,load:integer,durationSeconds:integer})},notes:str},['exerciseId','sets']),
 ProfessionalProfile:obj({professionalName:str,biography:{type:['string','null']},privateContactEmail:{type:['string','null']},publicContacts:{type:['object','null'],properties:{email:str,phoneE164:str}},countryCode:str,languages:strings}),
 Capability:obj({kind:{type:'string',enum:['personal_trainer','nutritionist']},jurisdictionCountry:str,specializations:strings,experienceStartYear:{type:['integer','null']},serviceModes:strings}),
 Qualification:obj({capabilityId:str,qualificationType:str,title:str,issuerName:str,awardedOn:{type:['string','null'],format:'date'},expiresOn:{type:['string','null'],format:'date'},specializationCodes:strings}),
 AvailabilityDeclaration:obj({timeZone:str,preferredWeekdays:{type:'array',items:integer},windows:{type:'array',items:obj({weekday:integer,startMinute:integer,endMinute:integer},['weekday','startMinute','endMinute'])},serviceModes:{type:'array',items:{type:'string',enum:['online','in_person']}}}),
 ProfessionalService:obj({capabilityId:str,category:{type:'string',enum:['personal_trainer','nutritionist']},name:str,description:str,priceEur:{type:'number',minimum:0,maximum:1000},durationMinutes:{type:'integer',enum:[30,45,60,90]},bufferBeforeMinutes:integer,bufferAfterMinutes:integer}),
 ApplicationSubmit:obj({publicationRequested:bool,publicQualificationIds:strings}),Review:obj({reasonCode:str}),
 Relationship:obj({professionalId:str,capabilityId:str,relationshipKind:{type:'string',enum:['personal_training','nutrition']}},['professionalId','capabilityId','relationshipKind']),
 Booking:obj({serviceId:str,professionalId:str,capabilityId:str,appointmentType:{type:'string',enum:['initial_session','one_off_session','follow_up']},relationshipId:str,mode:{type:'string',enum:['online','in_person']},environment:{type:'string',enum:['home','gym','outdoor']},startAtUtc:{type:'string',format:'date-time'},endAtUtc:{type:'string',format:'date-time'},timezone:str},['professionalId','capabilityId','appointmentType','mode','startAtUtc','endAtUtc','timezone']),
 AvailabilityRule:obj({capabilityId:str,weekday:integer,localStartTime:str,localEndTime:str,validFrom:str,validUntil:str,dstDisambiguation:str,timezone:str,sessionModes:strings,environments:strings,slotDurationMinutes:integer,bufferBeforeMinutes:integer,bufferAfterMinutes:integer}),
 AvailabilityException:obj({capabilityId:str,type:{type:'string',enum:['block','extra_availability','replacement']},startAtUtc:{type:'string',format:'date-time'},endAtUtc:{type:'string',format:'date-time'},reasonCode:str,replacesRuleId:str,timezone:str,sessionModes:strings,environments:strings,slotDurationMinutes:integer,bufferBeforeMinutes:integer,bufferAfterMinutes:integer}),
 PaymentInput:obj({priceReference:str,serviceReference:str,amountCents:{type:'integer',minimum:1}},['priceReference','serviceReference','amountCents']),
 NotificationPreferences:obj({enabled:bool,hydrationReminders:bool,trainingEvents:bool,agendaReminders:bool,paymentEvents:bool,version:integer}),
 Message:obj({content:{type:'string',maxLength:2000}},['content']),
 CoachPermissions:obj({categories:strings,selectedGoalIds:strings,allowedTools:strings,version:integer}),
 Conversation:obj({purpose:str,timezone:str,categories:strings,selectedGoalIds:strings,allowedTools:strings}),
 Proposal:obj({version:integer,confirm:{const:true}},['version','confirm']),ProposalReconcile:obj({resourceId:str,version:integer},['resourceId','version']),
 Error:obj({error:{type:'object',properties:{code:str,message:str,requestId:str}}}),
};
function partial(name){const key=name+'Patch';schemas[key]??={...structuredClone(schemas[name]),required:[],minProperties:1};return key;}
function payload(r){
 const p=r.path;if(['get','delete'].includes(r.method))return null;
 if(p==='/auth/register')return 'Register';
 if(r.service==='user'){let n=p.endsWith('/preferences')?'Preferences':p.endsWith('/habits')?'Habits':p.includes('/measurements')?'UserMeasurement':p.includes('/goals')?'UserGoal':'Profile';return r.method==='patch'?partial(n):n;}
 if(r.service==='training'){if(p.endsWith('/sessions'))return 'Session';if(p.endsWith('/exercises'))return p.includes('/plans/')?'PlanExercise':p.includes('/sessions/')?'SessionExercise':'Exercise';if(p.endsWith('/plans')||r.method==='patch')return r.method==='patch'?partial('Plan'):'Plan';return 'Empty';}
 if(r.service==='hydration')return p.endsWith('/suggest')?'HydrationSuggestion':p.endsWith('/goal')?'HydrationGoal':p.endsWith('/reminders')?'Reminder':r.method==='patch'?partial('Intake'):'Intake';
 if(r.service==='performance')return p.includes('/goals/')?'PerformanceGoal':p.endsWith('/steps')?'Steps':p.endsWith('/heart-rate')?'HeartRate':r.method==='patch'?partial('PerformanceMeasurement'):'PerformanceMeasurement';
 if(r.service==='agenda'&&p.includes('/activities'))return p.endsWith('/complete')||p.endsWith('/cancel')?'Empty':r.method==='patch'?partial('Activity'):'Activity';
 if(r.service==='agenda')return p.endsWith('/service')?'ServiceAssociation':p.includes('/availability-rules')?'AvailabilityRule':p.endsWith('/availability-exceptions')?'AvailabilityException':p.endsWith('/professional-appointments')||p.endsWith('/reschedule')?'Booking':p.endsWith('/accept')||p.endsWith('/complete')||p.match(/professional-appointments\/[^/]+\/cancel$/)?'Empty':'Review';
 if(r.service==='professional'){
  if(p.startsWith('/care-relationships'))return p==='/care-relationships'?'Relationship':'Empty';
  if(p.startsWith('/management/professional-applications')){schemas.LegacyReviewApprove=obj({publish:bool});schemas.LegacyReviewReason=obj({reason:str},['reason']);return p.endsWith('/approve')?'LegacyReviewApprove':'LegacyReviewReason';}
  if(p.endsWith('/submit'))return 'ApplicationSubmit';if(p.endsWith('/reopen'))return 'Empty';if(p.endsWith('/deactivate'))return 'Empty';
  const n=p.includes('/capabilities')?'Capability':p.includes('/qualifications')?'Qualification':p.includes('/availability-declaration')?'AvailabilityDeclaration':p.includes('/services')?'ProfessionalService':'ProfessionalProfile';return r.method==='patch'?partial(n):n;
 }
 if(r.service==='payment')return p==='/payments'?'PaymentInput':'Empty';
 if(r.service==='notification')return p.endsWith('/preferences')?'NotificationPreferences':'Empty';
 if(r.service==='coach')return p.endsWith('/messages')?'Message':p.endsWith('/permissions')?'CoachPermissions':p.endsWith('/conversations')?'Conversation':p.endsWith('/reconcile')?'ProposalReconcile':p.endsWith('/reject')?'ProposalPatch':'Proposal';
 return null;
}
function ownerSource(r){
 const prefix=base+(r.service==='coach'?'ai-coach':r.service)+'-service/src/';
 if(r.service==='training')return [prefix+'services/training.service.ts',r.path.includes('/sessions/')&&r.path.endsWith('/exercises')?'recordExercise':r.path.includes('/plans/')&&r.path.endsWith('/exercises')?'planExerciseInput':'planInput'];
 if(r.service==='professional')return [prefix+'config/'+(r.path.includes('/services')?'service-validation.ts':r.path.startsWith('/care-relationships')?'relationship-validation.ts':'validation.ts'),null];
 if(r.service==='agenda')return [prefix+(r.path.includes('/activities')?'services/agenda.service.ts':'professional/validation.ts'),null];
 if(r.service==='coach')return [prefix+'services/coach.service.ts',null];
 return [prefix+'services/'+r.service+'.service.ts',null];
}
function fieldSchema(r){const [file]=ownerSource(r);return {type:'object',description:'Exact body is defined in the owner contract; no unsupported fields inferred.', 'x-schema-completeness':'owner-source-required','x-validation-source':file};}
function query(r){
 if(r.method!=='get')return[];const p=r.path;
 if(r.service==='user')return /measurements$|weight-history$|goals$/.test(p)?['limit','cursor',p.endsWith('goals')?'status':'kind']:[];
 if(r.service==='professional'){if(p==='/professionals/services')return ['limit','before','q','category','capabilityId'];if(p==='/care-relationships/me'||p==='/professionals/me/care-relationships'||p.startsWith('/management/professional-applications')&&!p.includes('{'))return ['limit','before','status'];return /\/(catalog|eligible-capabilities|capabilities|qualifications)$/.test(p)||p==='/professionals/me/services'?['limit','before']:[];}
 if(r.service==='training')return p==='/training/exercises'?['page','pageSize','environment','difficulty','type','muscleGroup']:p==='/training/plans'||p==='/training/sessions'?['page','pageSize','status']:[];
 if(['hydration','performance'].includes(r.service))return p.endsWith('/daily')?['date','timezone']:/goal$|goal\/history$|goals$|reminders$|summary$/.test(p)&&!p.includes('/heart-rate/')&&!p.includes('/steps/')?[]:['page','pageSize','from','to',...(r.service==='hydration'?['timezone']:[])];
 if(r.service==='agenda')return p.endsWith('/activities')?['page','pageSize','from','to','status','kind','environment']:p.endsWith('/availability')?['capabilityId','from','to','mode','environment']:p.endsWith('/availability-rules')||p.endsWith('/availability-exceptions')?['limit','before','capabilityId']:p.endsWith('/appointments')||p.endsWith('/professional-appointments')?['from','to','limit','before','status','capabilityId']:[];
 if(r.service==='payment')return p==='/payments'?['limit','before']:[];
 if(r.service==='notification')return p==='/notifications'?['page','pageSize','unread']:[];
 if(r.service==='coach')return p.endsWith('/capabilities')?[]:['limit','before'];
 return[];
}
function generate(){
 const required={Profile:['displayName'],Preferences:['timeZone'],UserGoal:['goalType','title'],Plan:['title','exercises'],Intake:['amountMl','timezone','idempotencyKey'],PerformanceMeasurement:['kind','value','timezone'],Activity:['title','kind','startAt','endAt','timezone'],ProfessionalProfile:['professionalName','countryCode','languages'],Capability:['kind','jurisdictionCountry','serviceModes'],Qualification:['qualificationType','title','issuerName'],AvailabilityDeclaration:['timeZone','preferredWeekdays','windows','serviceModes'],ProfessionalService:['capabilityId','category','name','description','priceEur','durationMinutes','bufferBeforeMinutes','bufferAfterMinutes'],Conversation:['purpose','timezone','categories','allowedTools'],CoachPermissions:['categories','allowedTools','version'],AvailabilityRule:['capabilityId','weekday','localStartTime','localEndTime','validFrom','validUntil','timezone','sessionModes','slotDurationMinutes'],AvailabilityException:['capabilityId','type','startAtUtc','endAtUtc','reasonCode','timezone']};for(const [name,fields]of Object.entries(required))schemas[name].required=fields;
 const all=routes(),sources=['administration-v1','management-v1','backend-integration-v1'].map(name=>({name,document:JSON.parse(read('documentation/api/'+name+'.openapi.json'))}));
 const spec={openapi:'3.1.0',info:{title:'GoLeve V1 — Development Gateway reference',version:'0.14.0',description:'Routes verified statically at 000cc43. Local fictional development only; operation existence is not proof of runtime eligibility. Inspect x-availability and schema completeness; see backend-release-v1.md.'},servers:[{url:'http://127.0.0.1:64344',description:'Example independent developer instance; configurable port'}],security:[{Bearer:[]}],tags:[...new Set(all.map(r=>r.service))].map(name=>({name})),paths:{},components:{securitySchemes:{Bearer:{type:'http',scheme:'bearer',bearerFormat:'JWT with persisted session'},StepUp:{type:'apiKey',in:'header',name:'X-Admin-Step-Up'},AdminStepUp:{type:'apiKey',in:'header',name:'X-Admin-Step-Up'}},schemas}};
 const metadata=[];
 for(const r of all){
  const external=sources.find(s=>s.document.paths[r.path]?.[r.method]);let operation;
  if(external){operation=structuredClone(external.document.paths[r.path][r.method]);operation.parameters=[...structuredClone(external.document.paths[r.path].parameters||[]),...(operation.parameters||[])];const rewrite=o=>{if(!o||typeof o!=='object')return;if(o.$ref?.startsWith('#'))o.$ref='./'+external.name+'.openapi.json'+o.$ref;Object.values(o).forEach(rewrite);};rewrite(operation);}
  else {operation={summary:r.handler.split('(')[0].slice(0,100),parameters:[],responses:{'2XX':{description:'Success (200/201/204 according to owner); exact envelope/DTO follows owner contract',content:{'application/json':{schema:{type:'object'}}}},default:{description:'Owner or Gateway error; see common HTTP handling',content:{'application/json':{schema:{$ref:'#/components/schemas/Error'}}}}}};for(const m of r.path.matchAll(/\{([^}]+)\}/g))operation.parameters.push({in:'path',name:m[1],required:true,schema:{type:'string'}});operation.parameters.push(...query(r).map(name=>({in:'query',name,schema:{type:'string'},description:'Validated by the owner; pagination rules in backend-release-v1.md'})));let body=payload(r);if(['post','put','patch'].includes(r.method)){if(body==='ProposalPatch'){schemas.ProposalPatch=obj({version:integer},['version']);}let schema=body?{$ref:'#/components/schemas/'+body}:fieldSchema(r);operation.requestBody={required:true,content:{'application/json':{schema}}};}operation.security=authentication(r)==='public-or-challenge'?[]:[{Bearer:[]}];}
  const bodyName=payload(r);if(bodyName&&['post','put','patch'].includes(r.method)){if(bodyName==='ServiceAssociation')schemas.ServiceAssociation=obj({serviceId:str},['serviceId']);operation.requestBody={required:bodyName!=='Empty',content:{'application/json':{schema:{$ref:'#/components/schemas/'+bodyName}}}};}
  if(bodyName?.endsWith('Patch')){const omit={CapabilityPatch:['kind','jurisdictionCountry'],QualificationPatch:['capabilityId'],ProfessionalServicePatch:['capabilityId','category'],ActivityPatch:['status'],PerformanceMeasurementPatch:['kind','unit','idempotencyKey'],IntakePatch:['idempotencyKey']};for(const field of omit[bodyName]||[])delete schemas[bodyName].properties[field];}
  const header=(name,required=true)=>{operation.parameters??=[];if(!operation.parameters.some(p=>p.name?.toLowerCase()===name.toLowerCase()))operation.parameters.push({in:'header',name,required,schema:{type:'string'}});};
  if(r.service==='user'){if(r.method==='put')header('If-None-Match');if(r.method==='patch')header('If-Match');if(r.method==='post'&&r.path.endsWith('/measurements'))header('Idempotency-Key');}
  if(r.service==='professional'){if(r.method==='put')header('If-None-Match');if(r.method==='patch'||r.path.endsWith('/deactivate')||r.path.endsWith('/submit')||r.path.endsWith('/reopen')||r.method==='post'&&r.path.startsWith('/management/professional-applications')||r.method==='post'&&r.path.startsWith('/care-relationships/'))header('If-Match');if(r.method==='post'&&(/qualifications$|submit$|reopen$/.test(r.path)||r.path.startsWith('/care-relationships')||r.path.startsWith('/management/professional-applications')))header('Idempotency-Key');}
 if(r.service==='agenda'&&!r.path.includes('/activities')&&r.method!=='get'){if(!r.path.endsWith('/service'))header('Idempotency-Key');if(r.path.includes('{id}'))header('If-Match');}
  if(r.service==='payment'&&r.method==='post'&&!r.path.endsWith('/reconcile'))header('Idempotency-Key');
  if(r.service==='coach'&&r.method==='post'&&!r.path.endsWith('/reconcile'))header('Idempotency-Key');
  operation.tags=[r.service];operation.operationId=r.service+'_'+r.method+'_'+r.path.replace(/\//g,'__').replace(/[^A-Za-z0-9_]+/g,'_').replace(/_$/,'');operation['x-source']={file:r.file,line:r.line,sourceRoute:r.sourceRoute};operation['x-availability']=status(r);operation['x-authentication']=authentication(r);operation.description=(operation.description||'')+' Repository owner documentation: documentation/api/'+sourceDocs[r.service]+'. See x-availability; route availability does not grant privileges.';
  // Local source/contract links remain in vendor fields rather than invented public API URLs.
  delete operation.externalDocs;operation['x-owner-document']='documentation/api/'+sourceDocs[r.service];
  spec.paths[r.path]??={};spec.paths[r.path][r.method]=operation;
  const parameters=(operation.parameters||[]).map(p=>p.$ref?resolveRef(path.join(root,'documentation/api/backend-release-v1.openapi.json'),p.$ref):p);
  metadata.push({...r,handler:r.handler.slice(0,160),availability:status(r),authentication:authentication(r),body:operation.requestBody?.content?.['application/json']?.schema||null,query:parameters.filter(p=>p.in==='query').map(p=>p.name),headers:parameters.filter(p=>p.in==='header').map(p=>({name:p.name,required:!!p.required})),ownerDocument:sourceDocs[r.service]});
 }
 const index=['# Referência central de operações Gateway','', 'Gerado de rotas reais em `000cc43`; não editar esta tabela à mão. [Guia](backend-release-v1.md), [OpenAPI 3.1](backend-release-v1.openapi.json).','', 'As condições indicam limites de runtime; não implicam que os fluxos bloqueados tenham sido validados. Payloads de inventário parcial estão marcados no OpenAPI e remetem para o contrato proprietário.',''];
 for(const service of [...new Set(metadata.map(r=>r.service))]){index.push('## '+service,'','| Método | Caminho | Payload / query / headers | Disponibilidade | Fonte |','|---|---|---|---|---|');for(const r of metadata.filter(x=>x.service===service)){let body=r.body?.$ref?.split('/').at(-1)|| (r.body?'contrato proprietário':'—');index.push('| '+r.method.toUpperCase()+' | `'+r.path+'` | '+body+(r.query.length?'; query: `'+r.query.join('`, `')+'`':'')+(r.headers.length?'; headers: `'+r.headers.map(h=>h.name+(h.required?'*':'')).join('`, `')+'`':'')+' | '+r.availability+' | ['+path.basename(r.file)+':'+r.line+'](../../'+r.file+') |');}index.push('');}
 return {spec,metadata,index:index.join('\n').trimEnd()+'\n'};
}
function resolveRef(file,ref){const [name,pointer]=ref.split('#');const target=name?path.resolve(path.dirname(file),name):file;assert(target.startsWith(path.join(root,'documentation')),'External/non-repository ref');let value=JSON.parse(fs.readFileSync(target,'utf8'));if(pointer)for(const token of pointer.slice(1).split('/')){value=value[token.replace(/~1/g,'/').replace(/~0/g,'~')];assert(value!==undefined,'Unresolved ref '+ref);}return value;}
function validate(spec,file){
 assert.equal(spec.openapi,'3.1.0');const ids=[],seen=new Set();let refs=0;
 function walk(o,current){if(!o||typeof o!=='object')return;if(o.$ref){const [name,pointer='']=o.$ref.split('#'),target=name?path.resolve(path.dirname(current),name):current,key=target+'#'+pointer;refs++;if(!seen.has(key)){seen.add(key);walk(resolveRef(current,o.$ref),target);}}Object.values(o).forEach(v=>walk(v,current));}walk(spec,file);
 for(const [p,item]of Object.entries(spec.paths)){assert(!p.toLowerCase().split('/').includes('internal'));for(const [m,op]of Object.entries(item)){assert(['get','post','put','patch','delete'].includes(m));assert(op.responses&&Object.keys(op.responses).length);ids.push(op.operationId);for(const x of p.matchAll(/\{([^}]+)\}/g))assert(op.parameters?.map(v=>v.$ref?resolveRef(file,v.$ref):v).some(v=>v.in==='path'&&v.name===x[1]&&v.required),'Missing path parameter '+p);}}
 assert.equal(new Set(ids).size,ids.length);return {paths:Object.keys(spec.paths).length,operations:ids.length,resolvedRefs:refs,services:new Set(Object.values(spec.paths).flatMap(p=>Object.values(p).flatMap(op=>op.tags))).size-1};
}
const outputs=['documentation/api/backend-release-v1.openapi.json','documentation/api/backend-release-v1.routes.json','documentation/api/backend-release-v1-endpoints.md'];
function main(){const args=process.argv.slice(2);assert(args.length===0||args.length===1&&args[0]==='--write','Use [--write]');const generated=generate();const values=[JSON.stringify(generated.spec,null,2)+'\n',JSON.stringify({baseCommit:'000cc43ee2a47af9de5b0f8ace7fb09e8a5d5dd6',operations:generated.metadata},null,2)+'\n',generated.index];if(args[0]==='--write')outputs.forEach((f,i)=>fs.writeFileSync(path.join(root,f),values[i]));else outputs.forEach((f,i)=>assert.equal(read(f),values[i],'Contract drift: review then regenerate '+f));console.log(JSON.stringify({mode:args[0]||'check',...validate(generated.spec,path.join(root,outputs[0]))}));}
module.exports={routes,generate,validate};if(require.main===module)main();
