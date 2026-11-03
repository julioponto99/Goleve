import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ApiResponse } from '@goleve/shared';
import { ApiError, factorValid } from '@goleve/shared';
import { Button, Dialog, LoadingState, TextField } from '../components/ui';
import type { Runtime } from '../runtime';
import { authError, PasswordField } from './AuthPage';
import { authorizeAuthMutation } from './security';
import type { AuthAdminIntent, StepUpCredentials } from './security';
interface Props{runtime:Runtime;intent:AuthAdminIntent|null;label:string;onSuccess:(result:ApiResponse)=>void;onFailure:(error:unknown)=>void;onClose:()=>void}
export function StepUpDialog(props:Props){
 const uncertain=useRef(new Set<string>());
 const key=props.intent?props.intent.action+':'+props.intent.targetId+':'+props.intent.parameters.version:null;
 return props.intent&&key?<StepUpForm key={JSON.stringify(props.intent)} {...props} intent={props.intent} blocked={uncertain.current.has(key)} onUncertain={()=>uncertain.current.add(key)}/>:null;
}
function StepUpForm({runtime,intent,label,onSuccess,onFailure,onClose,blocked,onUncertain}:Props&{intent:AuthAdminIntent;blocked:boolean;onUncertain:()=>void}){
 const [password,setPassword]=useState(''),[factor,setFactor]=useState(''),[recovery,setRecovery]=useState(false),[pending,setPending]=useState(false),[uncertain,setUncertain]=useState(blocked),[failure,setFailure]=useState(blocked?'Não foi possível confirmar o resultado. Consulta o estado e o histórico antes de preparar uma nova operação.':'');
 const snapshot=runtime.session.getSnapshot(),isDemo=snapshot.status==='authenticated'&&snapshot.authority==='local-demo';
 const locked=pending||uncertain;
 const controller=useRef<AbortController|null>(null),busy=useRef(false);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const close=()=>{controller.current?.abort();setPassword('');setFactor('');onClose();};
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(busy.current||uncertain)return;
  const credentials:StepUpCredentials=isDemo?{password}:recovery?{password,recoveryCode:factor.trim()}:{password,otp:factor.trim()};
  if(!password||!isDemo&&!factorValid(credentials)){setFailure('Indica a palavra-passe e um segundo fator válido.');return;}
  busy.current=true;setPending(true);setFailure('');setPassword('');setFactor('');controller.current=new AbortController();
  try{const authorized=await authorizeAuthMutation(runtime,intent,credentials,controller.current.signal);const result=await authorized.run();onSuccess(result);onClose();}
  catch(error){if(error instanceof ApiError&&error.outcome==='unknown'){onUncertain();setUncertain(true);}onFailure(error);if(!controller.current.signal.aborted)setFailure(authError(error,'step-up'));}finally{busy.current=false;setPending(false);}
 };
 return <Dialog open title="Confirmar operação sensível" onClose={close}>
  <p>{label}</p><p className="muted">A autorização é de uso único, dura no máximo cinco minutos e aplica-se apenas a esta operação e recurso.</p>
  <form className="auth-form" onSubmit={event=>void submit(event)}><PasswordField id="stepup-password" label="Palavra-passe" value={password} onChange={setPassword} disabled={locked}/>{isDemo?<p className="muted">Demonstração local: reautenticação por palavra-passe, sem MFA validado.</p>:<><TextField id="stepup-factor" label={recovery?'Código de recuperação':'Código da aplicação'} value={factor} onChange={event=>setFactor(event.target.value)} autoComplete={recovery?'off':'one-time-code'} inputMode={recovery?'text':'numeric'} spellCheck={false} disabled={locked} required/><Button kind="quiet" aria-pressed={recovery} disabled={locked} onClick={()=>{setRecovery(!recovery);setFactor('');}}>{recovery?'Usar aplicação autenticadora':'Usar código de recuperação'}</Button></>}{failure&&<p className="auth-error" role="alert">{failure}</p>}{pending&&<LoadingState label="A validar e executar a operação autorizada…"/>}<Button type="submit" disabled={locked}>Confirmar esta operação</Button></form>
 </Dialog>;
}
