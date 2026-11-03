import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authError, colors, credentialErrors, errorMessage, factorValid, passwordRecovery } from '@goleve/shared';
import type { MfaFactor, Runtime, SessionSnapshot, Theme } from '@goleve/shared';
import { brandIcons } from './assets';
import { Button, LoadingState, MessageState, TextField } from './ui';
interface Props{mode:string;runtime:Runtime|null;session:SessionSnapshot;theme:Theme;onNavigate:(path:string)=>void;onAuthenticated:()=>void;toggleTheme:()=>void;notice?:string}
export function AuthScreen(props:Props){
 const {theme}=props,c=colors[theme],insets=useSafeAreaInsets();
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,24)+24}]}>
   <View style={styles.toolbar}><View style={styles.brand}><Image source={brandIcons[theme]} style={{width:58,height:58}}/><Text style={[styles.name,{color:c.text}]}>GoLeve</Text></View><Button theme={theme} secondary onPress={props.toggleTheme}>{theme==='dark'?'Claro':'Escuro'}</Button></View>
   {!!props.notice&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>{props.notice}</Text>}
   {props.session.status==='unavailable'&&<MessageState theme={theme} title="Sessão por verificar" error>{errorMessage(props.session.error)}</MessageState>}
   {['recovery','reset-password','recovery-result'].includes(props.mode)?<Recovery {...props}/>:!props.runtime?<MessageState theme={theme} title="Ligação não configurada" error>Configura a origem pública do Gateway para autenticar.</MessageState>:props.mode==='mfa'?<Mfa {...props} runtime={props.runtime}/>:<Credentials {...props} runtime={props.runtime}/>}
  </ScrollView>
 </KeyboardAvoidingView>;
}
function Password({theme,label,value,onChange,disabled=false,error}:{theme:Theme;label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;error?:string|undefined}){
 const [visible,setVisible]=useState(false);
 return <View style={styles.field}><TextField theme={theme} label={label} value={value} onChangeText={onChange} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} editable={!disabled} {...(error?{error}:{})}/><Button theme={theme} secondary disabled={disabled} onPress={()=>setVisible(!visible)}>{(visible?'Ocultar ':'Mostrar ')+label.toLowerCase()}</Button></View>;
}
function Heading({theme,title,children}:{theme:Theme;title:string;children:string}){return <View style={styles.field}><Text accessibilityRole="header" style={[styles.heading,{color:colors[theme].text}]}>{title}</Text><Text style={[styles.body,{color:colors[theme].muted}]}>{children}</Text></View>;}
function Credentials({runtime,session,mode,theme,onNavigate,onAuthenticated}:Props&{runtime:Runtime}){
 const register=mode==='register',guard=useRef(false),mounted=useRef(true);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [errors,setErrors]=useState<Record<string,string>>({}),[failure,setFailure]=useState(''),[pending,setPending]=useState(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(guard.current)runtime.session.cancelAuthentication();};},[runtime]);
 const submit=async()=>{
  if(guard.current)return;const invalid=credentialErrors({email,password,...(register?{name,confirmation}:{})});setErrors(invalid);setFailure('');if(Object.keys(invalid).length)return;
  guard.current=true;setPending(true);const input={email,password};setPassword('');setConfirmation('');
  try{if(register)await runtime.session.register({name:name.trim(),...input});else await runtime.session.signIn(input);
   if(!mounted.current)return;const state=runtime.session.getSnapshot();if(state.status==='mfa-required')onNavigate('/autenticacao/mfa');else if(state.status==='authenticated')onAuthenticated();
  }catch(error){if(mounted.current)setFailure(authError(error,register?'register':'login'));}finally{guard.current=false;if(mounted.current)setPending(false);}
 };
 if(session.status==='authenticated')return <Button theme={theme} onPress={onAuthenticated}>Abrir o meu painel</Button>;
 if(session.status==='mfa-required')return <Button theme={theme} onPress={()=>onNavigate('/autenticacao/mfa')}>Continuar verificação</Button>;
 return <>
  <Heading theme={theme} title={register?'Vamos começar!':'Olá, bem-vindo de volta!'}>{register?'Cria a tua conta e acompanha a tua evolução.':'Entra na tua conta para continuares.'}</Heading>
  {register&&<TextField theme={theme} label="Nome completo" value={name} onChangeText={setName} autoComplete="name" editable={!pending} {...(errors.name?{error:errors.name}:{})}/>}
  <TextField theme={theme} label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} editable={!pending} {...(errors.email?{error:errors.email}:{})}/>
  <Password theme={theme} label="Palavra-passe" value={password} onChange={setPassword} disabled={pending} error={errors.password}/>
  {register&&<Password theme={theme} label="Confirmar palavra-passe" value={confirmation} onChange={setConfirmation} disabled={pending} error={errors.confirmation}/>}
  {!!failure&&<MessageState theme={theme} title="Não foi possível autenticar" error>{failure}</MessageState>}{pending&&<LoadingState theme={theme} label="A verificar a identidade…"/>}
  <Button theme={theme} disabled={pending} onPress={()=>void submit()}>{register?'Criar conta':'Iniciar sessão'}</Button>
  <Button theme={theme} secondary disabled={pending} onPress={()=>onNavigate(register?'/entrar':'/criar-conta')}>{register?'Já tens conta? Entrar':'Criar conta'}</Button>
  {!register&&<Button theme={theme} secondary disabled={pending} onPress={()=>onNavigate('/recuperar-acesso')}>Esqueceste-te da palavra-passe?</Button>}
  {register&&<Text style={[styles.body,{color:colors[theme].muted}]}>O registo público cria apenas uma conta de utilizador.</Text>}
 </>;
}
function Recovery({mode,theme,onNavigate}:Props){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const reset=mode==='reset-password',result=mode==='recovery-result';
 return <><Heading theme={theme} title={reset?'Definir nova palavra-passe':result?'Estado da recuperação':'Recuperar acesso'}>A recuperação ainda não está disponível neste ambiente.</Heading>
  {!result&&(reset?<><Password theme={theme} label="Nova palavra-passe" value={password} onChange={setPassword}/><Password theme={theme} label="Confirmar palavra-passe" value={confirmation} onChange={setConfirmation}/></>:<TextField theme={theme} label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"/>)}
  {!result&&<Button theme={theme} disabled onPress={()=>{}}>{reset?'Alterar palavra-passe':'Enviar instruções'}</Button>}
  <MessageState theme={theme} title="Recuperação indisponível">{passwordRecovery.message}</MessageState><Button theme={theme} secondary onPress={()=>onNavigate('/entrar')}>Voltar ao Login</Button>
 </>;
}
function Mfa({runtime,session,theme,onNavigate,onAuthenticated}:Props&{runtime:Runtime}){
 const [password,setPassword]=useState(''),[secret,setSecret]=useState(''),[code,setCode]=useState(''),[recovery,setRecovery]=useState(false),[codes,setCodes]=useState<readonly string[]>([]),[ack,setAck]=useState(false);
 const [pending,setPending]=useState(false),[failure,setFailure]=useState(''),guard=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(guard.current)runtime.session.cancelAuthentication();};},[runtime]);
 const run=async(enrolling:boolean)=>{
  if(guard.current)return;const factor:MfaFactor=recovery?{recoveryCode:code.trim()}:{otp:code.trim()};
  if(enrolling?!password:!factorValid(factor)){setFailure(enrolling?'Confirma a palavra-passe.':recovery?'Indica um código de recuperação de 32 caracteres.':'Indica o código de seis dígitos.');return;}
  guard.current=true;setPending(true);setFailure('');const input=password;setPassword('');setCode('');
  try{if(enrolling){const data=await runtime.session.enrollMfa(input);if(mounted.current)setSecret(data.secret);}else{
   const received=await runtime.session.completeMfa(factor);if(!mounted.current)return;setSecret('');if(received.length)setCodes(received);else if(runtime.session.getSnapshot().status==='authenticated')onAuthenticated();
  }}catch(error){if(mounted.current)setFailure(authError(error,'mfa'));}finally{guard.current=false;if(mounted.current)setPending(false);}
 };
 const cancel=()=>{setSecret('');setCodes([]);setPassword('');setCode('');void runtime.session.signOut().catch(()=>{});onNavigate('/entrar');};
 if(codes.length&&session.status==='authenticated')return <><Heading theme={theme} title="Guarda os códigos de recuperação">Cada código é de uso único. Guarda-os num local seguro antes de continuar. Não voltam a ser apresentados.</Heading>{codes.map(value=><Text selectable key={value} style={[styles.code,{color:colors[theme].text}]}>{value}</Text>)}<Button theme={theme} secondary onPress={()=>setAck(!ack)}>{ack?'Códigos guardados em segurança':'Confirmar que guardei os códigos'}</Button><Button theme={theme} disabled={!ack} onPress={()=>{setCodes([]);onAuthenticated();}}>Continuar para o painel</Button></>;
 if(session.status!=='mfa-required')return <><MessageState theme={theme} title="Verificação indisponível">O desafio terminou ou expirou. Nenhum acesso é concedido por abrir este ecrã.</MessageState><Button theme={theme} onPress={()=>onNavigate('/entrar')}>Voltar ao Login</Button></>;
 const enrollment=session.enrollmentRequired;
 return <><Heading theme={theme} title={enrollment?'Configurar dois fatores':'Verificação de segurança'}>Conclui a verificação exigida pelo Auth antes de aceder à conta.</Heading>
  {enrollment&&!secret?<><Password theme={theme} label="Confirma a palavra-passe" value={password} onChange={setPassword} disabled={pending}/><Button theme={theme} disabled={pending||!password} onPress={()=>void run(true)}>Preparar TOTP</Button></>:<>
   {enrollment&&<><Text style={[styles.body,{color:colors[theme].muted}]}>Configuração manual na aplicação autenticadora: TOTP, seis dígitos, 30 segundos. Não partilhes esta chave.</Text><Text selectable style={[styles.code,{color:colors[theme].text}]}>{secret}</Text></>}
   <TextField theme={theme} label={recovery?'Código de recuperação':'Código da aplicação'} value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} autoComplete={recovery?'off':'one-time-code'} keyboardType={recovery?'default':'number-pad'} editable={!pending}/>
   <Button theme={theme} disabled={pending} onPress={()=>void run(false)}>Confirmar segundo fator</Button>
   {!enrollment&&<Button theme={theme} secondary disabled={pending} onPress={()=>{setRecovery(!recovery);setCode('');setFailure('');}}>{recovery?'Usar aplicação autenticadora':'Usar código de recuperação'}</Button>}
  </>}
  {pending&&<LoadingState theme={theme} label="A validar a segurança…"/>}{!!failure&&<MessageState theme={theme} title="Verificação recusada" error>{failure}</MessageState>}
  <Button theme={theme} secondary disabled={pending} onPress={cancel}>Cancelar e voltar ao login</Button>
 </>;
}
const styles=StyleSheet.create({content:{padding:27,gap:20,flexGrow:1},toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:32},brand:{flexDirection:'row',alignItems:'center',gap:10},name:{fontFamily:'Inter_700Bold',fontSize:24},heading:{fontFamily:'Inter_700Bold',fontSize:27,lineHeight:35},body:{fontFamily:'Inter_400Regular',fontSize:14,lineHeight:23},field:{gap:8},code:{fontFamily:'Inter_600SemiBold',fontSize:14,lineHeight:24}});
