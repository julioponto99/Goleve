import { useRef, useState } from 'react';
import { ApiError, errorMessage, executePersonalCommand } from '@goleve/shared';
import type { PersonalCommand, Runtime } from '@goleve/shared';
import { Button, Card, TextField } from './ui';
export function PersonalActions({runtime,page,onSaved}:{runtime:Runtime;page:string;onSaved:()=>void}){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[uncertain,setUncertain]=useState(false),lock=useRef(false);
 const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const submit=async(form:HTMLFormElement,kind:string)=>{
  if(lock.current||uncertain)return;const data=new FormData(form),text=(key:string)=>String(data.get(key)??''),number=(key:string)=>Number(text(key));
  let command:PersonalCommand;
  if(kind==='intake')command={kind,amountMl:number('amountMl'),timezone,idempotencyKey:crypto.randomUUID()};
  else if(kind==='hydration-goal')command={kind,targetMl:number('targetMl'),timezone};
  else if(kind==='measurement')command={kind,measurementKind:text('measurementKind') as 'weight',value:number('value'),timezone,idempotencyKey:crypto.randomUUID()};
  else if(kind==='plan')command={kind,title:text('title'),environment:text('environment') as 'home'};
  else if(kind==='session')command={kind};
  else if(kind==='profile')command={kind,displayName:text('displayName')};
  else{
   const start=new Date(text('startAt')),end=new Date(text('endAt'));if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())){setNotice('Indica datas válidas.');return;}
   command={kind:'activity',title:text('title'),activityKind:text('activityKind') as 'personal',startAt:start.toISOString(),endAt:end.toISOString(),timezone,status:text('status') as 'planned',...(text('activityKind')==='workout'?{environment:text('environment') as 'home'}:{})};
  }
  lock.current=true;setBusy(true);setNotice('');
  try{const result=await executePersonalCommand(runtime,command);setNotice(result.overlapWarning?'Atividade guardada. Há sobreposição com outras atividades da tua agenda.':'Operação confirmada pelo serviço.');form.reset();onSaved();}catch(error){if(error instanceof ApiError&&error.outcome==='unknown')setUncertain(true);setNotice(errorMessage(error));}finally{lock.current=false;setBusy(false);}
 };
 const form=(kind:string,children:import('react').ReactNode,label:string)=><form className="domain-form" onSubmit={event=>{event.preventDefault();void submit(event.currentTarget,kind);}}><fieldset disabled={busy||uncertain}>{children}<Button type="submit">{label}</Button></fieldset></form>;
 return <Card className="personal-actions"><h2>{page==='profile'?'Dados pessoais':'Registar na minha conta'}</h2>{notice&&<p role="status" className="notice">{notice}</p>}{uncertain&&<p role="alert" className="auth-error">Resultado por confirmar. Não repitas esta operação. Consulta o histórico do serviço e reconcilia antes de criar outra.</p>}
  {page==='hydration'&&<>{form('intake',<TextField id="intake-amount" name="amountMl" label="Consumo (ml)" type="number" min={1} max={10000} step={1} required/>,'Registar consumo')}{form('hydration-goal',<TextField id="goal-amount" name="targetMl" label="Meta diária (ml)" type="number" min={250} max={20000} step={1} required/>,'Guardar meta')}</>}
  {page==='measurements'&&form('measurement',<><label className="select-field">Tipo de medição<select name="measurementKind">{[['weight','Peso (kg)'],['height','Altura (cm)'],['waist','Cintura (cm)'],['hip','Anca (cm)'],['chest','Peito (cm)'],['arm','Braço (cm)'],['thigh','Coxa (cm)'],['other','Outra (cm)']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><TextField id="measurement-value" name="value" label="Valor medido" type="number" min={.01} max={1000} step="any" required/></>,'Guardar medição')}
  {page==='training'&&<>{form('plan',<><TextField id="plan-title" name="title" label="Título do plano" maxLength={160} required/><label className="select-field">Ambiente<select name="environment"><option value="home">Casa</option><option value="gym">Ginásio</option><option value="outdoor">Exterior</option></select></label></>,'Criar plano vazio')}{form('session',<p className="muted">Cria uma sessão pessoal planeada, independente de reservas profissionais.</p>,'Criar sessão pessoal')}</>}
  {page==='agenda'&&form('activity',<><TextField id="activity-title" name="title" label="Título da atividade" maxLength={160} required/><label className="select-field">Tipo<select name="activityKind"><option value="personal">Atividade pessoal</option><option value="workout">Treino pessoal</option></select></label><label className="select-field">Ambiente (apenas treino)<select name="environment"><option value="home">Casa</option><option value="gym">Ginásio</option><option value="outdoor">Exterior</option></select></label><TextField id="activity-start" name="startAt" label="Início (hora local)" type="datetime-local" required/><TextField id="activity-end" name="endAt" label="Fim (hora local)" type="datetime-local" required/><label className="select-field">Estado inicial<select name="status"><option value="planned">Planeada</option><option value="completed">Concluída (registo passado)</option></select></label><p className="muted">Fuso horário: {timezone}. O servidor valida datas, transições e sobreposições.</p></>,'Criar atividade')}
  {page==='profile'&&form('profile',<TextField id="profile-name" name="displayName" label="Nome de apresentação" minLength={2} maxLength={100} required/>,'Guardar perfil')}
 </Card>;
}
