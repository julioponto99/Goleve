import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, BackHandler, Image, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { colors, createRuntime, dashboardFor, dashboardModules, entryDestination, errorMessage, isAuthRoute, isDashboardRoute, navigationDecision, navigationFor, resolveTheme, roleLabels, routes, webRouteForPath } from '@goleve/shared';
import type { AppRoute, SessionSnapshot, WebRoute } from '@goleve/shared';
import { deviceSessionStorage } from './src/session-storage';
import { brandIcons } from './src/assets';
import { BottomNavigation, navigationFont } from './src/BottomNavigation';
import { createDeviceThemeStore } from './src/theme';
import { Button, Card, LoadingState, MessageState } from './src/ui';
import { AuthScreen } from './src/AuthScreen';
import { SecurityScreen } from './src/SecurityScreen';
import { DomainScreen } from './src/DomainScreen';
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
 const [history,setHistory]=useState<readonly WebRoute[]>([routes[0]]),[themeWarning,setThemeWarning]=useState(false),[barHeight,setBarHeight]=useState(64);
 const [menu,setMenu]=useState(false),[notice,setNotice]=useState(''),[booting,setBooting]=useState(true),[transition,setTransition]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const runtime=useMemo(createMobileRuntime,[]);
 const snapshot=useSyncExternalStore(runtime?.session.subscribe??noSubscribe,runtime?.session.getSnapshot??(()=>anonymous));
 const theme=resolveTheme(preference,system),c=colors[theme],route=history[history.length-1]??routes[0],insets=useSafeAreaInsets();
 useEffect(()=>{void themeStore.restore().then(saved=>setThemeWarning(!saved));},[themeStore]);
 const toggleTheme=()=>{void themeStore.set(theme==='dark'?'light':'dark').then(saved=>setThemeWarning(!saved));};
 useEffect(()=>{void (runtime?.session.restore()??Promise.resolve()).finally(()=>setBooting(false));const subscription=AppState.addEventListener('change',state=>{if(state==='active'&&runtime?.session.getSnapshot().status==='authenticated')void runtime.session.restore();});return()=>{subscription.remove();clearTimeout(timer.current);};},[runtime]);
 useEffect(()=>{if(booting)return;const destination=entryDestination(snapshot,route.path,route.private);if(destination)setHistory([webRouteForPath(destination)!]);},[snapshot,route.path,booting]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(menu){setMenu(false);return true;}if(history.length<=1)return false;setHistory(value=>value.slice(0,-1));return true;});return()=>listener.remove();},[history.length,menu]);
 const go=(next:WebRoute)=>{setMenu(false);setNotice('');setHistory(value=>value[value.length-1]?.id===next.id?value:[...value,next]);};
 const navigate=(path:string)=>{const next=webRouteForPath(path);if(next)go(next);};
 const authenticated=()=>{const current=runtime?.session.getSnapshot();if(current?.status!=='authenticated')return;setTransition(true);setHistory([dashboardFor(current.user.userType)]);timer.current=setTimeout(()=>setTransition(false),180);};
 const logout=async()=>{const pending=runtime?.session.signOut();setMenu(false);setHistory([webRouteForPath('/entrar')!]);try{await pending;setNotice('Sessão terminada.');}catch{setNotice('Acesso local bloqueado. Não foi possível confirmar a remoção da sessão guardada ou a revogação no servidor.');}};
 const gate=navigationDecision(route,snapshot);
 const name=snapshot.status==='authenticated'?snapshot.user.name:undefined;
 const navigation=snapshot.status==='authenticated'?navigationFor(snapshot.user.userType):[];
 if(booting||transition)return <View accessibilityRole="progressbar" accessibilityLabel="A verificar a sessão" style={[styles.fontLoading,{backgroundColor:c.background}]}><Image source={brandIcons[theme]} style={styles.launchIcon}/><Text style={[styles.brandName,{color:c.text}]}>GoLeve</Text><LoadingState theme={theme} label={transition?'A abrir o teu espaço…':'A verificar a sessão…'}/></View>;
 if(isAuthRoute(route))return <SafeAreaView style={[styles.screen,{backgroundColor:c.background}]} edges={['top','left','right']}><StatusBar barStyle={theme==='dark'?'light-content':'dark-content'}/><AuthScreen key={route.id} mode={route.id} runtime={runtime} session={snapshot} theme={theme} onNavigate={navigate} onAuthenticated={authenticated} toggleTheme={toggleTheme} notice={notice}/></SafeAreaView>;
 return <SafeAreaView style={[styles.screen,{backgroundColor:c.background}]} edges={['top','left','right']}>
  <StatusBar barStyle={theme==='dark'?'light-content':'dark-content'}/>
  <View style={styles.header}>
   <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" accessibilityState={{expanded:menu}} onPress={()=>setMenu(true)} style={styles.touch}><View style={{gap:4}}>{[0,1,2].map(line=><View key={line} style={{width:20,height:2,backgroundColor:c.text,borderRadius:1}}/>)}</View></Pressable>
   <View style={styles.brand}>{brandIcons[theme]&&<Image source={brandIcons[theme]!} style={styles.brandIcon} resizeMode="contain"/>}<Text style={[styles.brandName,{color:c.text}]}>GoLeve</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Alterar tema" accessibilityState={{selected:theme==='dark'}} onPress={toggleTheme} style={styles.touch}><Text style={[styles.link,{color:c.text}]}>{theme==='dark'?'Claro':'Escuro'}</Text></Pressable>
  </View>
  <ScrollView contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,12)+barHeight+24}]} keyboardShouldPersistTaps="handled">
   {themeWarning&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>O tema foi aplicado, mas não foi possível guardar a preferência neste dispositivo.</Text>}
   <Text style={[styles.eyebrow,{color:c.muted}]}>{name?'Olá, '+name:'O teu progresso, ao teu ritmo.'}</Text>
   <Text accessibilityRole="header" style={[styles.heading,{color:c.text}]}>{route.id==='home'?'O teu ritmo.\nO teu bem-estar.':route.label}</Text>
   {!!notice&&<Text accessibilityRole="alert" style={[styles.body,{color:c.muted}]}>{notice}</Text>}
   {route.id==='security'&&runtime&&gate==='allowed'?<SecurityScreen runtime={runtime} theme={theme} onLogout={()=>void logout()}/>:gate==='allowed'&&snapshot.status==='authenticated'&&runtime?<DomainScreen key={snapshot.user.id+':'+route.id} runtime={runtime} user={snapshot.user} page={route.id} theme={theme}/>:<Card theme={theme}>
    {gate==='identity-unavailable'?snapshot.status==='restoring'?<LoadingState theme={theme} label="A verificar a sessão…"/>:<MessageState theme={theme} title="Sessão por verificar" error>{snapshot.status==='unavailable'?errorMessage(snapshot.error):'Não foi possível confirmar a identidade.'}</MessageState>
     :gate==='authentication-required'?<MessageState theme={theme} title="Sessão necessária">Esta área é privada. O acesso exige uma sessão válida.</MessageState>
     :gate==='forbidden'?<MessageState theme={theme} title="Acesso não autorizado" error>O teu perfil não permite aceder a esta área.</MessageState>
     :<MessageState theme={theme} title={route.id==='coach'?'Coach IA indisponível':'Área ainda indisponível'}>{route.id==='coach'?'O Coach IA está desativado neste ambiente. Podes continuar a utilizar o GoLeve sem IA.':'Esta funcionalidade ainda não está disponível nesta aplicação.'}</MessageState>}
    {route.id==='coach'&&gate!=='allowed'&&<Text style={[styles.body,{color:c.muted}]}>O Coach IA permanece desativado neste ambiente.</Text>}
    <Button theme={theme} secondary onPress={()=>go(routes[0])}>Voltar ao início</Button>
   </Card>}
   <Text style={[styles.footnote,{color:c.muted}]}>As funcionalidades de cada área serão disponibilizadas progressivamente. Não são apresentados resultados pessoais fictícios.</Text>
  </ScrollView>
  {snapshot.status==='authenticated'&&snapshot.user.userType==='utilizador'&&<BottomNavigation theme={theme} selected={(routes.find(item=>item.id===route.id)??routes[0]).id} onNavigate={(next:AppRoute)=>go(next.id==='home'?dashboardFor(snapshot.user.userType):next)} iconsLoaded={iconsLoaded} onHeightChange={setBarHeight}/>}
  <Modal visible={menu} transparent animationType="fade" onRequestClose={()=>setMenu(false)}>
   <View style={styles.modalBackdrop}><SafeAreaView style={[styles.drawer,{backgroundColor:c.surface}]} accessibilityViewIsModal>
    <View style={styles.drawerHeading}><Text style={[styles.title,{color:c.text}]}>GoLeve</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" style={styles.touch} onPress={()=>setMenu(false)}><Text style={[styles.link,{color:c.text}]}>Fechar</Text></Pressable></View>
    <ScrollView>{navigation.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:route.id===item.id}} style={[styles.menuItem,route.id===item.id&&{backgroundColor:c.selection}]} onPress={()=>go(item)}><Text style={[styles.body,{color:route.id===item.id?c.selectedText:c.text}]}>{item.label}{item.availability==='blocked'?' · Indisponível':''}</Text></Pressable>)}</ScrollView>
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
