import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ApiError, colors, errorMessage, executePersonalCommand, readResource, resources, resourcesForPage, rowActions } from '@goleve/shared';
import type { PersonalCommand, PublicUser, ResourceId, ResourceQuery, ResourceView, Runtime, Theme } from '@goleve/shared';
import { Button, Card, LoadingState, MessageState, TextField } from './ui';
import { OperationalActions } from './OperationalActions';
export function DomainScreen({runtime,user,page,theme}:{runtime:Runtime;user:PublicUser;page:string;theme:Theme}){
 const modules=resourcesForPage(user.userType,page),[revision,setRevision]=useState(0);
 return <>
  {['hydration','measurements','agenda','training','profile'].includes(page)&&<PersonalForm runtime={runtime} page={page} theme={theme} onSaved={()=>setRevision(value=>value+1)}/>}
  {modules.length?modules.map(id=><ResourceSection key={id} id={id} runtime={runtime} theme={theme} revision={revision}/>):<Card theme={theme}><MessageState theme={theme} title={page==='coach'?'Coach IA indisponível':'Área indisponível'}>{page==='coach'?'O Coach IA permanece desativado. Podes utilizar o GoLeve sem IA.':'Esta funcionalidade ainda não está disponível nesta interface.'}</MessageState></Card>}
 </>;
}
function ResourceSection({id,runtime,theme,revision}:{id:ResourceId;runtime:Runtime;theme:Theme;revision:number}){
 const [query,setQuery]=useState<ResourceQuery>({}),[search,setSearch]=useState(''),[view,setView]=useState<ResourceView|null>(null),[failure,setFailure]=useState(''),[refresh,setRefresh]=useState(0),def=resources[id],c=colors[theme];
 const writeLock=useRef(false),[writing,setWriting]=useState(false),[uncertain,setUncertain]=useState(false),[notice,setNotice]=useState('');
 const perform=async(command:PersonalCommand)=>{if(writeLock.current||uncertain)return;writeLock.current=true;setWriting(true);setNotice('');try{await executePersonalCommand(runtime,command);setRefresh(value=>value+1);}catch(error){if(error instanceof ApiError&&error.outcome==='unknown')setUncertain(true);setNotice(errorMessage(error));}finally{writeLock.current=false;setWriting(false);}};
 useEffect(()=>{const controller=new AbortController();setView(null);setFailure('');void readResource(runtime,id,query,controller.signal).then(result=>{if(!controller.signal.aborted)setView(result);}).catch(error=>{if(!controller.signal.aborted)setFailure(errorMessage(error));});return()=>controller.abort();},[id,runtime,query,refresh,revision]);
 return <Card theme={theme}><Text accessibilityRole="header" style={[styles.title,{color:c.text}]}>{def.title}</Text>
  {'search'in def&&<><TextField theme={theme} label="Pesquisar" value={search} onChangeText={setSearch} maxLength={100}/><Button theme={theme} secondary onPress={()=>setQuery({q:search})}>Pesquisar</Button></>}
  {failure?<MessageState theme={theme} title="Consulta indisponível" error>{failure}</MessageState>:view===null?<LoadingState theme={theme}/>:view.rows.length?view.rows.map((row,n)=><View key={row.id??n} style={[styles.row,{borderColor:c.border}]}><Text style={[styles.rowTitle,{color:c.text}]}>{row.title}</Text>{row.lines.map((line,index)=><Text key={index} style={[styles.body,{color:c.muted}]}>{line}</Text>)}{rowActions(id,row).map(action=><Button key={action.label} theme={theme} secondary disabled={writing||uncertain} onPress={()=>void perform(action.command)}>{action.label}</Button>)}<OperationalActions runtime={runtime} resource={id} row={row} theme={theme} onSaved={()=>setRefresh(value=>value+1)}/></View>):<MessageState theme={theme} title="Sem registos">O serviço não devolveu registos para esta consulta.</MessageState>}
  {!!notice&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>{notice}</Text>}
  <Button theme={theme} secondary disabled={!view&&!failure} onPress={()=>setRefresh(value=>value+1)}>Atualizar</Button>
  {view?.page!==undefined&&view.rows.length>0&&<><Text style={[styles.body,{color:c.muted}]}>Página {view.page}</Text><Button theme={theme} secondary disabled={view.page<=1} onPress={()=>setQuery({...query,page:Math.max(1,(view.page??1)-1)})}>Anterior</Button><Button theme={theme} secondary disabled={view.totalPages===undefined||view.page>=view.totalPages} onPress={()=>setQuery({...query,page:(view.page??1)+1})}>Seguinte</Button></>}
  {view?.nextBefore&&<Button theme={theme} secondary onPress={()=>setQuery({...query,before:view.nextBefore!})}>Carregar página seguinte</Button>}{query.before&&<Button theme={theme} secondary onPress={()=>{const {before,...first}=query;setQuery(first);}}>Voltar à primeira página</Button>}
 </Card>;
}
function PersonalForm({runtime,page,theme,onSaved}:{runtime:Runtime;page:string;theme:Theme;onSaved:()=>void}){
 const [value,setValue]=useState(''),[title,setTitle]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[environment,setEnvironment]=useState<'home'|'gym'|'outdoor'>('home'),[measurementKind,setKind]=useState<'weight'|'height'|'waist'>('weight');
 const [busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[notice,setNotice]=useState(''),guard=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const submit=async(kind:'intake'|'hydration-goal'|'measurement'|'plan'|'session'|'activity'|'profile')=>{
  if(guard.current||uncertain)return;const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;let command:PersonalCommand;
  if(kind==='intake')command={kind,amountMl:Number(value),timezone,idempotencyKey:randomUUID()};
  else if(kind==='hydration-goal')command={kind,targetMl:Number(value),timezone};
  else if(kind==='measurement')command={kind,measurementKind,value:Number(value),timezone,idempotencyKey:randomUUID()};
  else if(kind==='plan')command={kind,title,environment};
  else if(kind==='session')command={kind};
  else if(kind==='profile')command={kind,displayName:title};
  else{const a=Date.parse(start),z=Date.parse(end);if(!Number.isFinite(a)||!Number.isFinite(z)){setNotice('Indica datas ISO válidas, incluindo o fuso horário.');return;}command={kind,title,activityKind:'personal',startAt:new Date(a).toISOString(),endAt:new Date(z).toISOString(),timezone,status:z<=Date.now()?'completed':'planned'};}
  guard.current=true;setBusy(true);setNotice('');
  try{const result=await executePersonalCommand(runtime,command);if(mounted.current){setNotice(result.overlapWarning?'Atividade guardada com aviso de sobreposição.':'Operação confirmada pelo serviço.');setValue('');setTitle('');onSaved();}}catch(error){if(mounted.current){if(error instanceof ApiError&&error.outcome==='unknown')setUncertain(true);setNotice(errorMessage(error));}}finally{guard.current=false;if(mounted.current)setBusy(false);}
 };
 const locked=busy||uncertain;
 return <Card theme={theme}><Text accessibilityRole="header" style={[styles.title,{color:colors[theme].text}]}>{page==='profile'?'Dados pessoais':'Registar na minha conta'}</Text>
  {['hydration','measurements'].includes(page)&&<TextField theme={theme} label={page==='hydration'?'Quantidade (ml)':'Valor medido'} value={value} onChangeText={setValue} keyboardType="decimal-pad" editable={!locked}/>}
  {page==='hydration'&&<><Button theme={theme} disabled={locked} onPress={()=>void submit('intake')}>Registar consumo</Button><Button theme={theme} secondary disabled={locked} onPress={()=>void submit('hydration-goal')}>Guardar como meta diária</Button></>}
  {page==='measurements'&&<>{(['weight','height','waist'] as const).map((kind,n)=><Button key={kind} theme={theme} secondary={measurementKind!==kind} disabled={locked} onPress={()=>setKind(kind)}>{['Peso (kg)','Altura (cm)','Cintura (cm)'][n]!}</Button>)}<Button theme={theme} disabled={locked} onPress={()=>void submit('measurement')}>Guardar medição</Button></>}
  {['training','agenda','profile'].includes(page)&&<TextField theme={theme} label={page==='profile'?'Nome de apresentação':'Título'} value={title} onChangeText={setTitle} maxLength={page==='profile'?100:160} editable={!locked}/>}
  {page==='training'&&<>{(['home','gym','outdoor'] as const).map((place,n)=><Button key={place} theme={theme} secondary={place!==environment} disabled={locked} onPress={()=>setEnvironment(place)}>{['Casa','Ginásio','Exterior'][n]!}</Button>)}<Button theme={theme} disabled={locked} onPress={()=>void submit('plan')}>Criar plano vazio</Button><Button theme={theme} secondary disabled={locked} onPress={()=>void submit('session')}>Criar sessão pessoal</Button></>}
  {page==='agenda'&&<><TextField theme={theme} label="Início (ISO com fuso horário)" value={start} onChangeText={setStart} editable={!locked} autoCapitalize="none" autoCorrect={false}/><TextField theme={theme} label="Fim (ISO com fuso horário)" value={end} onChangeText={setEnd} editable={!locked} autoCapitalize="none" autoCorrect={false}/><Text style={[styles.body,{color:colors[theme].muted}]}>Atividade pessoal independente de reservas. Datas passadas são registadas como concluídas; as regras são verificadas no servidor.</Text><Button theme={theme} disabled={locked} onPress={()=>void submit('activity')}>Criar atividade pessoal</Button></>}
  {page==='profile'&&<Button theme={theme} disabled={locked} onPress={()=>void submit('profile')}>Guardar perfil</Button>}
  {!!notice&&<Text accessibilityRole="alert" style={[styles.body,{color:colors[theme].muted}]}>{notice}</Text>}{uncertain&&<MessageState theme={theme} title="Resultado por confirmar" error>Não repitas a operação. Consulta o histórico e reconcilia o resultado antes de outra tentativa.</MessageState>}
 </Card>;
}
const styles=StyleSheet.create({title:{fontFamily:'Inter_700Bold',fontSize:21,lineHeight:28},rowTitle:{fontFamily:'Inter_600SemiBold',fontSize:16,lineHeight:24},body:{fontFamily:'Inter_400Regular',fontSize:13,lineHeight:22},row:{borderTopWidth:1,paddingTop:16,gap:8}});
