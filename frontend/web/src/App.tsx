import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError, colors, errorMessage, navigationDecision, resolveTheme, routeForPath, routes } from '@goleve/shared';
import type { AppRoute, SessionSnapshot, Theme } from '@goleve/shared';
import { Button, Card, Badge, LoadingState, MessageState } from './components/ui';
import { brandIcons, icons, logoutIcons, themeIcons, activeIcons } from './assets';
import { webRuntime } from './runtime';
import { createWebThemeStore } from './theme';
const runtime=webRuntime();
const themeStore=createWebThemeStore();
const anonymous:SessionSnapshot={status:'anonymous'};
const noSubscribe=()=>()=>{};
function useSession(){return useSyncExternalStore(runtime?.session.subscribe??noSubscribe,runtime?.session.getSnapshot??(()=>anonymous));}
function currentPath(){return window.location.pathname.replace(/\/$/,'')||'/';}
function useRoute(){
 const [path,setPath]=useState(currentPath);
 useEffect(()=>{const change=()=>setPath(currentPath());window.addEventListener('popstate',change);return()=>window.removeEventListener('popstate',change);},[]);
 return {route:routeForPath(path),navigate:(next:string)=>{window.history.pushState(null,'',next);setPath(currentPath());window.scrollTo(0,0);}};
}
function systemTheme():Theme{return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
export function App(){
 const session=useSession(),{route,navigate}=useRoute();
 const preference=useSyncExternalStore(themeStore.subscribe,themeStore.getSnapshot);
 const [system,setSystem]=useState(systemTheme),[menu,setMenu]=useState(false),[themeWarning,setThemeWarning]=useState(false);
 const [connection,setConnection]=useState<'idle'|'loading'|'connected'|'unavailable'>('idle');
 const [notice,setNotice]=useState('');
 const sidebarRef=useRef<HTMLElement>(null);
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
 useEffect(()=>{const query=window.matchMedia('(min-width:901px)'),close=()=>{if(query.matches)setMenu(false);};query.addEventListener('change',close);return()=>query.removeEventListener('change',close);},[]);
 useEffect(()=>{
  if(!menu)return;
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const previous=document.activeElement as HTMLElement|null;
  const links=()=>Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')??[]);
  links()[0]?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setMenu(false);}if(event.key==='Tab'){const items=links(),first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
  window.addEventListener('keydown',key);
  return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=previousOverflow;previous?.focus();};
 },[menu]);
 useEffect(()=>{void runtime?.session.restore();},[]);
 useEffect(()=>{const update=()=>{if(runtime?.session.getSnapshot().status==='authenticated')void runtime.session.restore();};window.addEventListener('focus',update);return()=>window.removeEventListener('focus',update);},[]);
 const go=(next:AppRoute)=>{setMenu(false);setNotice('');navigate(next.path);};
 const links=(list:readonly AppRoute[])=>list.map(item=><a key={item.id} href={item.path} onClick={event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();go(item);}}} className={'nav-link '+(route?.id===item.id?'selected':'')} aria-current={route?.id===item.id?'page':undefined}>{item.icon!=='agenda'&&<img className="nav-icon" src={(route?.id===item.id?activeIcons:icons)[theme][item.icon]} alt="" width="20" height="20"/>}<span>{item.label}</span>{item.availability==='blocked'&&<span className="nav-status" aria-label="Indisponível">—</span>}</a>);
 const check=async()=>{
  if(!runtime){setConnection('unavailable');return;}
  setConnection('loading');
  try{await runtime.api.request('get','/health',{authenticated:false});setConnection('connected');}
  catch{setConnection('unavailable');}
 };
 const signOut=async()=>{try{await runtime?.session.signOut();setNotice('Sessão terminada.');}catch(error){setNotice(error instanceof ApiError&&error.code==='SECURE_STORAGE_UNAVAILABLE'?'O acesso foi bloqueado neste dispositivo, mas não foi possível confirmar a remoção da sessão guardada.':'A sessão foi removida deste dispositivo. Não foi possível confirmar a revogação no servidor.');}};
 const gate=route?navigationDecision(route,session):'allowed';
 return <div className="app-shell">
  <a className="skip-link" href="#main">Saltar para o conteúdo</a>
  {menu&&<button type="button" className="menu-backdrop" onClick={()=>setMenu(false)} aria-label="Fechar menu"/>}
  <aside ref={sidebarRef} className={'sidebar '+(menu?'is-open':'')} aria-label="Navegação principal">
   <a href="/" className="brand" onClick={event=>{event.preventDefault();go(routes[0]);}}>{brandIcons[theme]&&<img src={brandIcons[theme]!} alt="" width="42" height="42"/>}<span>GoLeve</span></a>
   <p className="brand-signature">O teu progresso, ao teu ritmo.</p>
   <nav aria-label="Principal">{links([...routes.slice(0,5),routes[7]])}</nav>
   <div className="sidebar-divider"/>
   <p className="nav-heading">A tua conta</p>
   <nav aria-label="Conta">{links(routes.filter(item=>['history','profile'].includes(item.id)))}</nav>
   <footer className="sidebar-footer">
    {session.status==='authenticated'?<><Button kind="quiet" className="logout" onClick={()=>void signOut()}><img src={logoutIcons[theme]} alt="" width="20" height="20"/>Terminar sessão</Button><div className="identity"><span className="avatar" aria-hidden="true">{session.user.name.slice(0,1)}</span><span><strong>{session.user.name}</strong><small>{session.user.userType}</small></span></div></>:<p className="muted">Sessão não iniciada</p>}
    <small className="brand-footnote">Fitness · Bem-estar · Hábitos</small>
   </footer>
  </aside>
  <div className="main-shell" inert={menu}>
   <header className="page-header">
    <Button kind="quiet" className="menu-toggle" aria-label="Abrir menu" aria-expanded={menu} onClick={()=>setMenu(!menu)}>Menu</Button>
    <div className="header-title"><img className="header-brand-icon" src={brandIcons[theme]} alt="" width="32" height="32"/><div><p className="eyebrow">GoLeve</p><h1>{route?.label??'Página não encontrada'}</h1></div></div>
    <div className="header-actions"><span className="connection">{connection==='connected'?'Ligação verificada':connection==='loading'?'A verificar…':connection==='unavailable'?'Ligação indisponível':'Ligação por verificar'}</span><Button kind="secondary" aria-label="Alterar tema" aria-pressed={theme==='dark'} onClick={toggleTheme}><img src={themeIcons[theme]} alt="" width="20" height="20"/><span className="theme-label">{theme==='dark'?'Claro':'Escuro'}</span></Button></div>
   </header>
   <main id="main" tabIndex={-1} className="page-content">
    {themeWarning&&<p role="status" className="notice">O tema foi aplicado, mas não foi possível guardar a preferência neste navegador.</p>}
    {notice&&<p role="status" className="notice">{notice}</p>}
    {!route?<Card><MessageState title="Página não encontrada">Escolhe uma área no menu para continuar.</MessageState><Button onClick={()=>go(routes[0])}>Voltar ao início</Button></Card>
     :route.id==='home'?<><section className="welcome"><p className="eyebrow">O teu progresso, ao teu ritmo.</p><h2>O teu ritmo.<br/><span>O teu bem-estar.</span></h2><p>Um espaço para cuidares de ti, com ou sem acompanhamento profissional.</p></section>
      <Card className="welcome-card"><Badge>Ao teu ritmo</Badge><h2>Há espaço para os teus objetivos.</h2><p>Em casa, no ginásio ou no exterior. Organiza as tuas atividades e acompanha o teu percurso.</p><div className="environment-tags"><span>Casa</span><span>Ginásio</span><span>Exterior</span></div><div className="card-actions"><Button onClick={()=>void check()} disabled={connection==='loading'}>Verificar ligação</Button><Button kind="secondary" onClick={()=>go(routes[1])}>Explorar áreas</Button></div>{connection==='loading'&&<LoadingState label="A verificar a ligação…"/>}{connection==='connected'&&<p role="status">Ligação verificada.</p>}{connection==='unavailable'&&<MessageState title="Ligação indisponível" error>{runtime?'Não foi possível contactar o GoLeve. Tenta verificar a ligação mais tarde.':'A ligação ao GoLeve ainda não está configurada para este ambiente.'}</MessageState>}</Card>
      <p className="release-note">As funcionalidades de cada área serão disponibilizadas progressivamente. Não são apresentados dados de exemplo como resultados pessoais.</p></>
     :<Card>{gate==='identity-unavailable'?session.status==='restoring'?<LoadingState label="A verificar a sessão…"/>:<MessageState title="Sessão por verificar" error>{session.status==='unavailable'?errorMessage(session.error):'Não foi possível confirmar a identidade.'}</MessageState>
      :gate==='authentication-required'?<MessageState title="Sessão necessária">Esta área é privada. O acesso exige uma sessão válida.</MessageState>
      :gate==='forbidden'?<MessageState title="Acesso não autorizado" error>O teu perfil não permite aceder a esta área.</MessageState>
      :<MessageState title={route.id==='coach'?'Coach IA indisponível':'Área ainda indisponível'}>{route.id==='coach'?'O Coach IA está desativado neste ambiente. Podes continuar a utilizar o GoLeve sem IA.':'Esta funcionalidade ainda não está disponível nesta aplicação.'}</MessageState>}
      {route.id==='coach'&&gate!=='allowed'&&<p className="muted">O Coach IA permanece desativado neste ambiente.</p>}
      {route.availability==='planned'&&gate!=='allowed'&&<p className="muted">Esta funcionalidade ainda não está disponível nesta aplicação.</p>}
      <Button kind="secondary" onClick={()=>go(routes[0])}>Voltar ao início</Button></Card>}
   </main>
  </div>
 </div>;
}
