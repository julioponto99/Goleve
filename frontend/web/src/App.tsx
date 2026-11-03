import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError, colors, entryDestination, errorMessage, navigationDecision, resolveTheme, routes } from '@goleve/shared';
import type { SessionSnapshot, Theme } from '@goleve/shared';
import { Button, Card, Badge, LoadingState, MessageState } from './components/ui';
import { brandIcons } from './assets';
import { webRuntime } from './runtime';
import { createWebThemeStore } from './theme';
import { dashboardFor, isAuthRoute, isDashboardRoute, webRouteForPath } from './navigation';
import type { WebRoute } from './navigation';
import { WebShell } from './components/WebShell';
import { DomainPage } from './components/DomainPage';
import { AuthPage } from './auth/AuthPage';
import { SecurityPage } from './auth/SecurityPage';
const runtime=webRuntime();
const themeStore=createWebThemeStore();
const anonymous:SessionSnapshot={status:'anonymous'};
const noSubscribe=()=>()=>{};
function useSession(){return useSyncExternalStore(runtime?.session.subscribe??noSubscribe,runtime?.session.getSnapshot??(()=>anonymous));}
function currentPath(){return window.location.pathname.replace(/\/$/,'')||'/';}
function useRoute(){
 const [path,setPath]=useState(currentPath);
 useEffect(()=>{const change=()=>setPath(currentPath());window.addEventListener('popstate',change);return()=>window.removeEventListener('popstate',change);},[]);
 return {path,route:webRouteForPath(path),navigate:(next:string,replace=false)=>{window.history[replace?'replaceState':'pushState'](null,'',next);setPath(currentPath());window.scrollTo(0,0);}};
}
function systemTheme():Theme{return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
export function App(){
 const session=useSession(),{path,route,navigate}=useRoute();
 const afterAuthentication=useRef<string|undefined>(undefined);
 const preference=useSyncExternalStore(themeStore.subscribe,themeStore.getSnapshot);
 const [system,setSystem]=useState(systemTheme),[themeWarning,setThemeWarning]=useState(false);
 const [connection,setConnection]=useState<'idle'|'loading'|'connected'|'unavailable'>('idle');
 const [notice,setNotice]=useState('');
 const [booting,setBooting]=useState(true),[transition,setTransition]=useState(false);
 const transitionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const theme=resolveTheme(preference,system),palette=colors[theme];
 useEffect(()=>{void themeStore.restore().then(saved=>setThemeWarning(!saved));},[]);
 const toggleTheme=()=>{void themeStore.set(theme==='dark'?'light':'dark').then(saved=>setThemeWarning(!saved));};
 useEffect(()=>{const query=window.matchMedia('(prefers-color-scheme: dark)'),listener=()=>setSystem(systemTheme());query.addEventListener('change',listener);return()=>query.removeEventListener('change',listener);},[]);
 useEffect(()=>{
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  for(const [key,value]of Object.entries(palette))document.documentElement.style.setProperty('--'+key,value);
  for(const id of ['app-favicon','app-touch-icon']){const link=document.getElementById(id);if(link instanceof HTMLLinkElement)link.href=brandIcons[theme];}
 },[theme,palette]);
 useEffect(()=>{void (runtime?.session.restore()??Promise.resolve()).finally(()=>setBooting(false));return()=>clearTimeout(transitionTimer.current);},[]);
 useEffect(()=>{
  if(booting)return;
  const destination=entryDestination(session,path,route?.private??false);
  if(destination){if(route?.private)afterAuthentication.current=route.path;navigate(destination,true);}
 },[session,path,booting]);
 useEffect(()=>{const update=()=>{if(runtime?.session.getSnapshot().status==='authenticated')void runtime.session.restore();};window.addEventListener('focus',update);return()=>window.removeEventListener('focus',update);},[]);
 const go=(next:WebRoute)=>{setNotice('');navigate(next.path);};
 const check=async()=>{
  if(!runtime){setConnection('unavailable');return;}
  setConnection('loading');
  try{await runtime.api.request('get','/health',{authenticated:false});setConnection('connected');}
  catch{setConnection('unavailable');}
 };
 const signOut=async()=>{const request=runtime?.session.signOut();afterAuthentication.current=undefined;navigate('/entrar',true);try{await request;setNotice('Sessão terminada.');}catch(error){setNotice(error instanceof ApiError&&error.code==='SECURE_STORAGE_UNAVAILABLE'?'O acesso foi bloqueado neste dispositivo, mas não foi possível confirmar a remoção da sessão guardada.':'A sessão foi removida deste dispositivo. Não foi possível confirmar a revogação no servidor.');}};
 const gate=route?navigationDecision(route,session):'allowed';
 const startLogin=()=>{if(route?.private)afterAuthentication.current=route.path;go(webRouteForPath(session.status==='mfa-required'?'/autenticacao/mfa':'/entrar')!);};
 const authenticated=()=>{
  const current=runtime?.session.getSnapshot();if(current?.status!=='authenticated')return;
  const requested=webRouteForPath(afterAuthentication.current??'');afterAuthentication.current=undefined;
  setTransition(true);go(requested?.private&&navigationDecision(requested,current)==='allowed'?requested:dashboardFor(current.user.userType));
  transitionTimer.current=setTimeout(()=>setTransition(false),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180);
 };
 if(booting||transition)return <div className="launch-screen" role="status"><img src={brandIcons[theme]} alt="" width="88" height="88"/><strong>GoLeve</strong><p>{transition?'A abrir o teu espaço…':'A verificar a sessão…'}</p></div>;
 if(isAuthRoute(route))return <><AuthPage key={route!.id} mode={route!.id==='register'?'register':route!.id==='mfa'?'mfa':route!.id==='recovery'?'recovery':route!.id==='reset-password'?'reset-password':route!.id==='recovery-result'?'recovery-result':'login'} runtime={runtime} session={session} theme={theme} themeWarning={themeWarning} toggleTheme={toggleTheme} onNavigate={next=>{const target=webRouteForPath(next);if(target)go(target);}} onAuthenticated={authenticated}/>{notice&&<p role="status" className="auth-notice">{notice}</p>}</>;
 return <WebShell route={route} path={path} theme={theme} session={session} connection={connection} onNavigate={go} onLogout={()=>void signOut()} onLogin={startLogin} onCheck={()=>void check()} onTheme={toggleTheme}>
    {themeWarning&&<p role="status" className="notice">O tema foi aplicado, mas não foi possível guardar a preferência neste navegador.</p>}
    {notice&&<p role="status" className="notice">{notice}</p>}
    {connection==='loading'&&<LoadingState label="A verificar a ligação…"/>}{connection==='connected'&&<p role="status" className="notice">Ligação verificada.</p>}{connection==='unavailable'&&<Card><MessageState title="Ligação indisponível" error>Não foi possível contactar o GoLeve. Tenta verificar a ligação mais tarde.</MessageState></Card>}
    {!route?<Card><MessageState title="Página não encontrada">Escolhe uma área no menu para continuar.</MessageState><Button onClick={()=>go(routes[0])}>Voltar ao início</Button></Card>
     :route.id==='home'?<><section className="welcome"><p className="eyebrow">O teu progresso, ao teu ritmo.</p><h2>O teu ritmo.<br/><span>O teu bem-estar.</span></h2><p>Um espaço para cuidares de ti, com ou sem acompanhamento profissional.</p></section>
      <Card className="welcome-card"><Badge>Ao teu ritmo</Badge><h2>Há espaço para os teus objetivos.</h2><p>Em casa, no ginásio ou no exterior. Organiza as tuas atividades e acompanha o teu percurso.</p><div className="environment-tags"><span>Casa</span><span>Ginásio</span><span>Exterior</span></div><div className="card-actions"><Button onClick={()=>void check()} disabled={connection==='loading'}>Verificar ligação</Button><Button kind="secondary" onClick={()=>go(routes[1])}>Explorar áreas</Button></div>{connection==='loading'&&<LoadingState label="A verificar a ligação…"/>}{connection==='connected'&&<p role="status">Ligação verificada.</p>}{connection==='unavailable'&&<MessageState title="Ligação indisponível" error>{runtime?'Não foi possível contactar o GoLeve. Tenta verificar a ligação mais tarde.':'A ligação ao GoLeve ainda não está configurada para este ambiente.'}</MessageState>}</Card>
      <p className="release-note">As funcionalidades de cada área serão disponibilizadas progressivamente. Não são apresentados dados de exemplo como resultados pessoais.</p></>
     :isDashboardRoute(route)&&session.status==='authenticated'&&runtime&&gate==='allowed'?<><DomainPage key={session.user.id+':'+route.id} runtime={runtime} user={session.user} page={route.id} onNavigate={next=>{const target=webRouteForPath(next);if(target)go(target);}}/></>
     :route.id==='security'&&session.status==='authenticated'&&runtime&&gate==='allowed'?<><SecurityPage key={session.user.id+':'+session.expiresAt} runtime={runtime} onLogout={()=>void signOut()} onRevalidate={()=>void runtime.session.restore()}/></>
     :session.status==='authenticated'&&runtime&&gate==='allowed'?<><DomainPage key={session.user.id+':'+route.id} runtime={runtime} user={session.user} page={route.id} onNavigate={next=>{const target=webRouteForPath(next);if(target)go(target);}}/></>
     :<Card>{gate==='identity-unavailable'?session.status==='restoring'?<LoadingState label="A verificar a sessão…"/>:<MessageState title="Sessão por verificar" error>{session.status==='unavailable'?errorMessage(session.error):'Não foi possível confirmar a identidade.'}</MessageState>
      :gate==='authentication-required'?<MessageState title="Sessão necessária">Esta área é privada. O acesso exige uma sessão válida.</MessageState>
      :gate==='forbidden'?<MessageState title="Acesso não autorizado" error>O teu perfil não permite aceder a esta área.</MessageState>
      :<MessageState title={route.id==='coach'?'Coach IA indisponível':'Área ainda indisponível'}>{route.id==='coach'?'O Coach IA está desativado neste ambiente. Podes continuar a utilizar o GoLeve sem IA.':'Esta funcionalidade ainda não está disponível nesta aplicação.'}</MessageState>}
      {route.id==='coach'&&gate!=='allowed'&&<p className="muted">O Coach IA permanece desativado neste ambiente.</p>}
      {gate==='authentication-required'&&<Button onClick={startLogin}>{session.status==='mfa-required'?'Continuar verificação':'Iniciar sessão'}</Button>}
      {gate==='identity-unavailable'&&session.status==='unavailable'&&<Button onClick={()=>void runtime?.session.restore()}>Verificar sessão</Button>}
      <Button kind="secondary" onClick={()=>go(routes[0])}>Voltar ao início</Button></Card>}

 </WebShell>;
}
