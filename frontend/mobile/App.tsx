import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState, BackHandler, Image, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { ApiError, colors, createRuntime, errorMessage, navigationDecision, resolveTheme, routes } from '@goleve/shared';
import type { AppRoute, SessionSnapshot } from '@goleve/shared';
import { deviceSessionStorage } from './src/session-storage';
import { brandIcons } from './src/assets';
import { BottomNavigation, navigationFont } from './src/BottomNavigation';
import { createDeviceThemeStore } from './src/theme';
import { Button, Card, LoadingState, MessageState } from './src/ui';
const anonymous:SessionSnapshot={status:'anonymous'},noSubscribe=()=>()=>{};
function createMobileRuntime(){
 try{
  const origin=process.env.EXPO_PUBLIC_API_BASE_URL??(__DEV__?(Platform.OS==='android'?'http://10.0.2.2:64344':'http://127.0.0.1:64344'):undefined);
  return origin?createRuntime({origin,development:__DEV__},deviceSessionStorage):null;
 }catch{return null;}
}
function Shell({iconsLoaded}:{iconsLoaded:boolean}){
 const system=useColorScheme()==='dark'?'dark':'light';
 const themeStore=useMemo(createDeviceThemeStore,[]),preference=useSyncExternalStore(themeStore.subscribe,themeStore.getSnapshot);
 const [history,setHistory]=useState<readonly AppRoute[]>([routes[0]]),[themeWarning,setThemeWarning]=useState(false),[barHeight,setBarHeight]=useState(64);
 const [menu,setMenu]=useState(false),[connection,setConnection]=useState<'idle'|'loading'|'connected'|'unavailable'>('idle'),[notice,setNotice]=useState('');
 const runtime=useMemo(createMobileRuntime,[]);
 const snapshot=useSyncExternalStore(runtime?.session.subscribe??noSubscribe,runtime?.session.getSnapshot??(()=>anonymous));
 const theme=resolveTheme(preference,system),c=colors[theme],route=history[history.length-1]??routes[0],insets=useSafeAreaInsets();
 useEffect(()=>{void themeStore.restore().then(saved=>setThemeWarning(!saved));},[themeStore]);
 const toggleTheme=()=>{void themeStore.set(theme==='dark'?'light':'dark').then(saved=>setThemeWarning(!saved));};
 useEffect(()=>{void runtime?.session.restore();const subscription=AppState.addEventListener('change',state=>{if(state==='active'&&runtime?.session.getSnapshot().status==='authenticated')void runtime.session.restore();});return()=>subscription.remove();},[runtime]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(history.length<=1)return false;setHistory(value=>value.slice(0,-1));return true;});return()=>listener.remove();},[history.length]);
 const go=(next:AppRoute)=>{setMenu(false);setNotice('');setHistory(value=>value[value.length-1]?.id===next.id?value:[...value,next]);};
 const check=async()=>{if(!runtime){setConnection('unavailable');return;}setConnection('loading');try{await runtime.api.request('get','/health',{authenticated:false});setConnection('connected');}catch{setConnection('unavailable');}};
 const logout=async()=>{try{await runtime?.session.signOut();setNotice('Sessão terminada.');}catch(error){setNotice(error instanceof ApiError&&error.code==='SECURE_STORAGE_UNAVAILABLE'?'O acesso foi bloqueado neste dispositivo, mas não foi possível confirmar a remoção da sessão guardada.':'Sessão removida deste dispositivo. Não foi possível confirmar a revogação no servidor.');}};
 const gate=navigationDecision(route,snapshot);
 const name=snapshot.status==='authenticated'?snapshot.user.name:undefined;
 return <SafeAreaView style={[styles.screen,{backgroundColor:c.background}]} edges={['top','left','right']}>
  <StatusBar barStyle={theme==='dark'?'light-content':'dark-content'}/>
  <View style={styles.header}>
   <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={()=>setMenu(true)} style={styles.touch}><Text style={[styles.link,{color:c.text}]}>Menu</Text></Pressable>
   <View style={styles.brand}>{brandIcons[theme]&&<Image source={brandIcons[theme]!} style={styles.brandIcon} resizeMode="contain"/>}<Text style={[styles.brandName,{color:c.text}]}>GoLeve</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Alterar tema" accessibilityState={{selected:theme==='dark'}} onPress={toggleTheme} style={styles.touch}><Text style={[styles.link,{color:c.text}]}>{theme==='dark'?'Claro':'Escuro'}</Text></Pressable>
  </View>
  <ScrollView contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,12)+barHeight+24}]} keyboardShouldPersistTaps="handled">
   {themeWarning&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>O tema foi aplicado, mas não foi possível guardar a preferência neste dispositivo.</Text>}
   <Text style={[styles.eyebrow,{color:c.muted}]}>{name?'Olá, '+name:'O teu progresso, ao teu ritmo.'}</Text>
   <Text accessibilityRole="header" style={[styles.heading,{color:c.text}]}>{route.id==='home'?'O teu ritmo.\nO teu bem-estar.':route.label}</Text>
   {!!notice&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>{notice}</Text>}
   {route.id==='home'?<Card theme={theme}>
    <View style={[styles.badge,{backgroundColor:c.raised}]}><Text style={[styles.badgeLabel,{color:c.selectedText}]}>Ao teu ritmo</Text></View>
    <Text accessibilityRole="header" style={[styles.title,{color:c.text}]}>Há espaço para os teus objetivos.</Text>
    <Text style={[styles.body,{color:c.muted}]}>Um espaço para cuidares de ti, com ou sem acompanhamento profissional.</Text>
    <View style={styles.chips}>{['Casa','Ginásio','Exterior'].map(label=><View key={label} style={[styles.chip,{backgroundColor:c.background}]}><Text style={[styles.link,{color:c.text}]}>{label}</Text></View>)}</View>
    <Button theme={theme} disabled={connection==='loading'} onPress={()=>void check()}>Verificar ligação</Button>
    {connection==='loading'?<LoadingState theme={theme} label="A verificar a ligação…"/>:connection==='connected'?<Text accessibilityRole="text" style={[styles.body,{color:c.selectedText}]}>Ligação verificada.</Text>:connection==='unavailable'?<MessageState theme={theme} title="Ligação indisponível" error>{runtime?'Não foi possível contactar o GoLeve. Tenta verificar a ligação mais tarde.':'A ligação ao GoLeve ainda não está configurada para este ambiente.'}</MessageState>:<Text style={[styles.body,{color:c.muted}]}>Ligação por verificar</Text>}
   </Card>:<Card theme={theme}>
    {gate==='identity-unavailable'?snapshot.status==='restoring'?<LoadingState theme={theme} label="A verificar a sessão…"/>:<MessageState theme={theme} title="Sessão por verificar" error>{snapshot.status==='unavailable'?errorMessage(snapshot.error):'Não foi possível confirmar a identidade.'}</MessageState>
     :gate==='authentication-required'?<MessageState theme={theme} title="Sessão necessária">Esta área é privada. O acesso exige uma sessão válida.</MessageState>
     :gate==='forbidden'?<MessageState theme={theme} title="Acesso não autorizado" error>O teu perfil não permite aceder a esta área.</MessageState>
     :<MessageState theme={theme} title={route.id==='coach'?'Coach IA indisponível':'Área ainda indisponível'}>{route.id==='coach'?'O Coach IA está desativado neste ambiente. Podes continuar a utilizar o GoLeve sem IA.':'Esta funcionalidade ainda não está disponível nesta aplicação.'}</MessageState>}
    {route.id==='coach'&&gate!=='allowed'&&<Text style={[styles.body,{color:c.muted}]}>O Coach IA permanece desativado neste ambiente.</Text>}
    {route.availability==='planned'&&gate!=='allowed'&&<Text style={[styles.body,{color:c.muted}]}>Esta funcionalidade ainda não está disponível nesta aplicação.</Text>}
    <Button theme={theme} secondary onPress={()=>go(routes[0])}>Voltar ao início</Button>
   </Card>}
   <Text style={[styles.footnote,{color:c.muted}]}>As funcionalidades de cada área serão disponibilizadas progressivamente. Não são apresentados resultados pessoais fictícios.</Text>
  </ScrollView>
  <BottomNavigation theme={theme} selected={route.id} onNavigate={go} iconsLoaded={iconsLoaded} onHeightChange={setBarHeight}/>
  <Modal visible={menu} transparent animationType="fade" onRequestClose={()=>setMenu(false)}>
   <View style={styles.modalBackdrop}><SafeAreaView style={[styles.drawer,{backgroundColor:c.surface}]} accessibilityViewIsModal>
    <View style={styles.drawerHeading}><Text style={[styles.title,{color:c.text}]}>GoLeve</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" style={styles.touch} onPress={()=>setMenu(false)}><Text style={[styles.link,{color:c.text}]}>Fechar</Text></Pressable></View>
    <ScrollView>{routes.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:route.id===item.id}} style={[styles.menuItem,route.id===item.id&&{backgroundColor:c.selection}]} onPress={()=>go(item)}><Text style={[styles.body,{color:route.id===item.id?c.selectedText:c.text}]}>{item.label}{item.availability==='blocked'?' · Indisponível':''}</Text></Pressable>)}</ScrollView>
    {snapshot.status==='authenticated'?<Button theme={theme} secondary onPress={()=>{setMenu(false);void logout();}}>Terminar sessão</Button>:<Text style={[styles.body,{color:c.muted}]}>Sessão não iniciada</Text>}
   </SafeAreaView></View>
  </Modal>
 </SafeAreaView>;
}
export default function App(){
 const [loaded,error]=useFonts({Inter_400Regular,Inter_600SemiBold,Inter_700Bold,GoLeveNavigation:navigationFont});
 const launchTheme=useColorScheme()==='dark'?'dark':'light';
 if(!loaded&&!error)return <SafeAreaProvider><View accessibilityRole="progressbar" accessibilityLabel="A carregar GoLeve" style={[styles.fontLoading,{backgroundColor:colors[launchTheme].background}]}><Image source={brandIcons[launchTheme]} style={styles.launchIcon} resizeMode="contain"/><Text style={{fontSize:20,fontWeight:'700',color:colors[launchTheme].text}}>GoLeve</Text></View></SafeAreaProvider>;
 return <SafeAreaProvider><Shell iconsLoaded={loaded}/></SafeAreaProvider>;
}
const styles=StyleSheet.create({
 screen:{flex:1},header:{minHeight:76,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},brand:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},brandIcon:{width:36,height:36},brandName:{fontFamily:'Inter_700Bold',fontSize:20,flexShrink:1},touch:{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'},link:{fontFamily:'Inter_600SemiBold',fontSize:12},
 content:{padding:24,gap:20},eyebrow:{fontFamily:'Inter_400Regular',fontSize:12},heading:{fontFamily:'Inter_700Bold',fontSize:34,lineHeight:39,letterSpacing:-1},title:{fontFamily:'Inter_700Bold',fontSize:23,lineHeight:30},body:{fontFamily:'Inter_400Regular',fontSize:14,lineHeight:23},badge:{alignSelf:'flex-start',borderRadius:999,paddingVertical:7,paddingHorizontal:12},badgeLabel:{fontFamily:'Inter_600SemiBold',fontSize:11},
 chips:{flexDirection:'row',gap:8,flexWrap:'wrap'},chip:{padding:10,borderRadius:10},footnote:{fontFamily:'Inter_400Regular',fontSize:12,lineHeight:19},modalBackdrop:{flex:1,backgroundColor:'rgba(2,8,23,0.6)'},drawer:{width:'88%',maxWidth:380,flex:1,padding:24,gap:16},drawerHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},menuItem:{paddingHorizontal:16,paddingVertical:12,borderRadius:10,minHeight:48},fontLoading:{flex:1,alignItems:'center',justifyContent:'center',gap:20},launchIcon:{width:88,height:88}
});
