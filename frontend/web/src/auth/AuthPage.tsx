import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { authError, credentialErrors, errorMessage, factorValid } from '@goleve/shared';
import type { MfaFactor, SessionSnapshot, Theme } from '@goleve/shared';
import { Button, LoadingState, MessageState, TextField } from '../components/ui';
import { brandIcons, themeIcons } from '../assets';
import type { Runtime } from '../runtime';
import { authMotif } from './assets';
import { RecoveryPage } from './RecoveryPage';
export { authError } from '@goleve/shared';
export function PasswordField({id,label,value,onChange,error,disabled=false,autoComplete='current-password'}:{id:string;label:string;value:string;onChange:(value:string)=>void;error?:string|undefined;disabled?:boolean;autoComplete?:string}){
 const [shown,setShown]=useState(false);
 return <div className="password-field"><TextField id={id} label={label} type={shown?'text':'password'} value={value} onChange={event=>onChange(event.target.value)} {...(error?{error}:{})} disabled={disabled} autoComplete={autoComplete} required trailing={<Button kind="quiet" disabled={disabled} aria-label={(shown?'Ocultar ':'Mostrar ')+label.toLowerCase()} aria-pressed={shown} onClick={()=>setShown(!shown)}>{shown?'Ocultar':'Mostrar'}</Button>}/></div>;
}
function Layout({theme,toggleTheme,children,onHome}:{theme:Theme;toggleTheme:()=>void;children:ReactNode;onHome:()=>void}){
 const motif=authMotif[theme];
 return <div className="auth-layout"><a className="skip-link" href="#auth-main">Saltar para o formulário</a>
  <aside className="auth-brand-panel" aria-label="GoLeve"><a className="auth-brand" href="/" onClick={event=>{event.preventDefault();onHome();}}><img src={brandIcons[theme]} alt="" width="64" height="64"/><span>GoLeve</span></a>
   <div className="auth-promise"><h2>O teu ritmo.<br/>O teu bem-estar.</h2><p>O teu progresso, ao teu ritmo.</p></div>
   <div className="auth-motif" aria-hidden="true"><img className="motif-activity" src={motif.activity} width="56" height="56" alt=""/><img className="motif-progress" src={motif.progress} width="140" height="260" alt=""/><img className="motif-ring" src={motif.ring} width="240" height="240" alt=""/></div>
   <p className="brand-footnote">Fitness · Bem-estar · Hábitos</p>
  </aside>
  <main id="auth-main" className="auth-main"><div className="auth-toolbar"><Button kind="quiet" onClick={onHome}>Voltar ao início</Button><Button kind="secondary" aria-label="Alterar tema" aria-pressed={theme==='dark'} onClick={toggleTheme}><img src={themeIcons[theme]} alt="" width="20" height="20"/>{theme==='dark'?'Claro':'Escuro'}</Button></div><div className="auth-form-panel">{children}</div></main>
 </div>;
}
interface Props{mode:'login'|'register'|'mfa'|'recovery'|'reset-password'|'recovery-result';runtime:Runtime|null;session:SessionSnapshot;theme:Theme;toggleTheme:()=>void;onNavigate:(path:string)=>void;onAuthenticated:()=>void;themeWarning?:boolean}
export function AuthPage(props:Props){
 return <Layout theme={props.theme} toggleTheme={props.toggleTheme} onHome={()=>{props.runtime?.session.cancelAuthentication();props.onNavigate('/entrar');}}>
  {props.themeWarning&&<p role="status" className="notice">O tema foi aplicado, mas não foi possível guardar a preferência neste navegador.</p>}
  {props.session.status==='unavailable'&&<MessageState title="Sessão por verificar" error>{errorMessage(props.session.error)}</MessageState>}
  {['recovery','reset-password','recovery-result'].includes(props.mode)?<RecoveryPage mode={props.mode} theme={props.theme} onNavigate={props.onNavigate}/>:!props.runtime?<MessageState title="Ligação não configurada" error>Configura a origem pública do Gateway para utilizar a autenticação.</MessageState>:props.mode==='mfa'?<MfaPage {...props} runtime={props.runtime}/>:<CredentialPage key={props.mode} {...props} runtime={props.runtime}/>}
 </Layout>;
}
function CredentialPage({mode,runtime,session,onNavigate,onAuthenticated}:Props&{runtime:Runtime}){
 const register=mode==='register',guard=useRef(false),form=useRef<HTMLFormElement>(null);
 const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(guard.current)runtime.session.cancelAuthentication();};},[runtime]);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [errors,setErrors]=useState<Record<string,string>>({}),[failure,setFailure]=useState(''),[pending,setPending]=useState(false);
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(guard.current)return;
  const found=credentialErrors({email,password,...(register?{name,confirmation}:{})});setErrors(found);setFailure('');
  if(Object.keys(found).length){requestAnimationFrame(()=>form.current?.querySelector<HTMLInputElement>('[aria-invalid=true]')?.focus());return;}
  guard.current=true;setPending(true);const input={email,password};setPassword('');setConfirmation('');
  try{
   if(register)await runtime.session.register({name:name.trim(),...input});else await runtime.session.signIn(input);
   if(!mounted.current)return;
   const state=runtime.session.getSnapshot();if(state.status==='mfa-required')onNavigate('/autenticacao/mfa');else if(state.status==='authenticated')onAuthenticated();
  }catch(error){if(mounted.current)setFailure(authError(error,register?'register':'login'));}finally{guard.current=false;if(mounted.current)setPending(false);}
 };
 if(session.status==='authenticated')return <><MessageState title="Sessão já iniciada">A tua identidade foi confirmada pelo Auth.</MessageState><Button onClick={onAuthenticated}>Abrir o meu painel</Button></>;
 if(session.status==='mfa-required')return <><MessageState title="Verificação de segurança pendente">Conclui o segundo fator antes de aceder à conta.</MessageState><Button onClick={()=>onNavigate('/autenticacao/mfa')}>Continuar verificação</Button><Button kind="quiet" onClick={()=>void runtime.session.signOut()}>Cancelar autenticação</Button></>;
 return <>
  <h1>{register?'Vamos começar!':'Olá, bem-vindo de volta!'}</h1><p className="muted">{register?'Cria a tua conta e acompanha a tua evolução.':'Entra na tua conta para continuares.'}</p>
  <form ref={form} onSubmit={event=>void submit(event)} className="auth-form" noValidate aria-busy={pending}>
   {register&&<TextField id="register-name" label="Nome completo" value={name} onChange={event=>setName(event.target.value)} autoComplete="name" disabled={pending} required {...(errors.name?{error:errors.name}:{})}/>}
   <TextField id="auth-email" label="E-mail" type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={pending} {...(errors.email?{error:errors.email}:{})}/>
   <PasswordField id="auth-password" label="Palavra-passe" value={password} onChange={setPassword} error={errors.password} autoComplete={register?'new-password':'current-password'} disabled={pending}/>
   {register&&<PasswordField id="register-confirm" label="Confirmar palavra-passe" value={confirmation} onChange={setConfirmation} error={errors.confirmation} autoComplete="new-password" disabled={pending}/>}
   {!!failure&&<p role="alert" className="auth-error">{failure}</p>}
   {pending&&<LoadingState label={register?'A criar a conta…':'A verificar a identidade…'}/>}
   <Button type="submit" disabled={pending}>{register?'Criar conta':'Iniciar sessão'}</Button>
  </form>
  <p className="auth-switch">{register?'Já tens conta?':'Ainda não tens conta?'} <a href={register?'/entrar':'/criar-conta'} onClick={event=>{event.preventDefault();onNavigate(register?'/entrar':'/criar-conta');}}>{register?'Iniciar sessão':'Criar conta'}</a></p>
  {!register&&<p className="auth-switch"><a href="/recuperar-acesso" onClick={event=>{event.preventDefault();onNavigate('/recuperar-acesso');}}>Esqueceste-te da palavra-passe?</a></p>}
  <p className="auth-limit">{register?'A tua conta pessoal permite utilizar o GoLeve de forma autónoma.':'A recuperação de palavra-passe ainda não está disponível.'}</p>
 </>;
}
function MfaPage({runtime,session,onNavigate,onAuthenticated}:Props&{runtime:Runtime}){
 const [password,setPassword]=useState(''),[secret,setSecret]=useState(''),[code,setCode]=useState(''),[recovery,setRecovery]=useState(false),[codes,setCodes]=useState<readonly string[]>([]),[ack,setAck]=useState(false);
 const [pending,setPending]=useState(false),[failure,setFailure]=useState(''),guard=useRef(false);
 const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(guard.current)runtime.session.cancelAuthentication();};},[runtime]);
 const enroll=async(event:FormEvent)=>{
  event.preventDefault();if(guard.current||!password)return;guard.current=true;setPending(true);setFailure('');const input=password;setPassword('');
  try{const result=await runtime.session.enrollMfa(input);if(mounted.current)setSecret(result.secret);}catch(error){if(mounted.current)setFailure(authError(error,'mfa'));}finally{if(mounted.current)setPending(false);guard.current=false;}
 };
 const complete=async(event:FormEvent)=>{
  event.preventDefault();if(guard.current)return;const factor:MfaFactor=recovery?{recoveryCode:code.trim()}:{otp:code.trim()};
  if(!factorValid(factor)){setFailure(recovery?'Indica o código de recuperação de 32 caracteres.':'Indica o código de seis dígitos da aplicação autenticadora.');return;}
  guard.current=true;setPending(true);setFailure('');setCode('');
  try{const result=await runtime.session.completeMfa(factor);if(!mounted.current)return;setSecret('');if(result.length)setCodes(result);else if(runtime.session.getSnapshot().status==='authenticated')onAuthenticated();}
  catch(error){if(mounted.current)setFailure(authError(error,'mfa'));}finally{if(mounted.current)setPending(false);guard.current=false;}
 };
 const cancel=()=>{setSecret('');setCodes([]);setCode('');setPassword('');void runtime.session.signOut().catch(()=>{}).finally(()=>onNavigate('/entrar'));};
 if(codes.length&&session.status==='authenticated')return <><h1>Guarda os códigos de recuperação</h1><p className="muted">Cada código só pode ser usado uma vez. Guarda-os num local seguro. Depois de saíres deste ecrã não voltam a ser apresentados.</p><ul className="recovery-codes">{codes.map(value=><li key={value}><code>{value}</code></li>)}</ul><label className="checkbox-field"><input type="checkbox" checked={ack} onChange={event=>setAck(event.target.checked)}/>Guardei os códigos em segurança</label><Button disabled={!ack} onClick={()=>{setCodes([]);onAuthenticated();}}>Continuar para o painel</Button></>;
 if(session.status!=='mfa-required')return <><MessageState title="Verificação indisponível">O desafio terminou, expirou ou ainda não foi iniciado. Nenhum acesso é concedido por abrir esta página.</MessageState><Button onClick={()=>onNavigate('/entrar')}>Voltar ao login</Button></>;
 const enrollment=session.enrollmentRequired;
 return <><h1>{enrollment?'Configurar autenticação de dois fatores':'Verificação de segurança'}</h1><p className="muted">{enrollment?'A conta administrativa exige uma aplicação autenticadora TOTP.':'Introduz o código da tua aplicação autenticadora para concluir o login.'}</p>
  {enrollment&&!secret?<form className="auth-form" onSubmit={event=>void enroll(event)}><PasswordField id="mfa-password" label="Confirma a palavra-passe" value={password} onChange={setPassword} disabled={pending}/><Button type="submit" disabled={pending||!password}>Preparar TOTP</Button></form>:<>
   {enrollment&&<section className="totp-setup"><h2>Configuração manual</h2><p>Na tua aplicação, adiciona GoLeve com esta chave. Usa TOTP, seis dígitos e período de 30 segundos.</p><code>{secret}</code><p>Não partilhes esta chave nem a incluas em capturas de ecrã.</p></section>}
   <form className="auth-form" onSubmit={event=>void complete(event)}><TextField id="mfa-code" label={recovery?'Código de recuperação':'Código da aplicação'} value={code} onChange={event=>setCode(event.target.value)} autoComplete={recovery?'off':'one-time-code'} inputMode={recovery?'text':'numeric'} spellCheck={false} autoCapitalize="none" disabled={pending} required/><Button type="submit" disabled={pending}>Confirmar segundo fator</Button></form>
   {!enrollment&&<Button kind="quiet" aria-pressed={recovery} disabled={pending} onClick={()=>{setRecovery(!recovery);setCode('');setFailure('');}}>{recovery?'Usar aplicação autenticadora':'Usar código de recuperação'}</Button>}
  </>}
  {pending&&<LoadingState label="A validar a segurança…"/>}{!!failure&&<p role="alert" className="auth-error">{failure}</p>}
  <Button kind="quiet" disabled={pending} onClick={cancel}>Cancelar e voltar ao login</Button>
 </>;
}
