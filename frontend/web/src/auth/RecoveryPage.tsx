import { useEffect, useState } from 'react';
import { passwordRecovery } from '@goleve/shared';
import type { Theme } from '@goleve/shared';
import { Button, MessageState, TextField } from '../components/ui';
import { PasswordField } from './AuthPage';
import { recoveryIcons } from './assets';
export function RecoveryPage({mode,theme,onNavigate}:{mode:string;theme:Theme;onNavigate:(path:string)=>void}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 useEffect(()=>{if(mode==='reset-password'&&(window.location.hash||window.location.search))window.history.replaceState(null,'',window.location.pathname);},[mode]);
 const reset=mode==='reset-password',result=mode==='recovery-result';
 return <><div className="recovery-symbol" aria-hidden="true"><img src={recoveryIcons[theme]} alt="" width="24" height="24"/></div>
  <h1>{reset?'Definir nova palavra-passe':result?'Estado da recuperação':'Recuperar acesso'}</h1>
  <p className="muted">{reset?'A validação do pedido depende do serviço de autenticação.':result?'Só uma confirmação do servidor pode concluir a recuperação.':'Introduz o teu email para pedir instruções, quando o serviço estiver disponível.'}</p>
  {!result&&<form className="auth-form" onSubmit={event=>event.preventDefault()}>
   {reset?<><PasswordField id="new-password" label="Nova palavra-passe" value={password} onChange={setPassword} autoComplete="new-password"/><PasswordField id="confirm-password" label="Confirmar palavra-passe" value={confirmation} onChange={setConfirmation} autoComplete="new-password"/></>:<TextField id="recovery-email" label="E-mail" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/>}
   <Button type="submit" disabled>{reset?'Alterar palavra-passe':'Enviar instruções'}</Button>
  </form>}
  <MessageState title="Recuperação indisponível">{passwordRecovery.message}</MessageState>
  <Button kind="quiet" onClick={()=>onNavigate('/entrar')}>Voltar ao Login</Button>
 </>;
}
