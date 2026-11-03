import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { colors, decodeSessions, errorMessage } from '@goleve/shared';
import type { CurrentSession, Runtime, Theme } from '@goleve/shared';
import { Button, Card, LoadingState, MessageState } from './ui';
export function SecurityScreen({runtime,theme,onLogout}:{runtime:Runtime;theme:Theme;onLogout:()=>void}){
 const [sessions,setSessions]=useState<CurrentSession[]|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();setSessions(null);setError('');void runtime.api.request('get','/auth/sessions',{signal:controller.signal}).then(result=>{if(!controller.signal.aborted)setSessions(decodeSessions(result.body));}).catch(failure=>{if(!controller.signal.aborted)setError(errorMessage(failure));});return()=>controller.abort();},[runtime,revision]);
 return <Card theme={theme}>{error?<MessageState theme={theme} title="Sessões indisponíveis" error>{error}</MessageState>:sessions===null?<LoadingState theme={theme}/>:sessions.length?sessions.map(item=><Text key={item.id} style={{color:colors[theme].text,fontFamily:'Inter_400Regular',lineHeight:24}}>{item.current?'Sessão atual':'Outra sessão'}{'\n'}{item.mfa?'MFA verificado':'Autenticação normal'}{'\n'}Expira em {new Date(item.expiresAt).toLocaleString('pt-PT')}</Text>):<MessageState theme={theme} title="Sem sessões disponíveis">O serviço não devolveu sessões para esta conta.</MessageState>}
  <Button theme={theme} secondary onPress={()=>setRevision(value=>value+1)}>Atualizar sessões</Button><Button theme={theme} onPress={onLogout}>Terminar sessão</Button>
 </Card>;
}
