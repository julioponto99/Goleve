import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SessionSnapshot, Theme } from '@goleve/shared';
import { brandIcons, icons, activeIcons, logoutIcons, themeIcons } from '../assets';
import { dashboardFor, navigationLabel, readSidebarPreference, roleLabels, saveSidebarPreference, webNavigation, webRouteForPath } from '../navigation';
import type { WebRoute } from '../navigation';
import { Button } from './ui';
import { Breadcrumbs } from './dashboard';
import { Symbol } from './Symbol';
interface Props{route:WebRoute|undefined;path:string;theme:Theme;session:SessionSnapshot;connection:string;onNavigate:(route:WebRoute)=>void;onLogout:()=>void;onLogin:()=>void;onCheck:()=>void;onTheme:()=>void;children:ReactNode}
function storedSidebar(){try{return readSidebarPreference(window.localStorage);}catch{return false;}}
export function WebShell({route,path,theme,session,connection,onNavigate,onLogout,onLogin,onCheck,onTheme,children}:Props){
 const [wide,setWide]=useState(()=>window.matchMedia('(min-width:1024px)').matches),[menu,setMenu]=useState(false),[collapsed,setCollapsed]=useState(storedSidebar),[warning,setWarning]=useState(false);
 const [tooltip,setTooltip]=useState<{label:string;top:number}|null>(null);
 const sidebar=useRef<HTMLElement>(null),content=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const user=session.status==='authenticated'?session.user:null,groups=user?webNavigation(user.userType):[],compact=wide&&collapsed;
 useEffect(()=>{const query=window.matchMedia('(min-width:1024px)'),update=()=>{setWide(query.matches);setMenu(false);setTooltip(null);};query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{setMenu(false);setTooltip(null);content.current?.scrollTo({top:0});},[path]);
 useEffect(()=>{
  if(!menu||wide)return;
  const previous=document.activeElement as HTMLElement|null;
  const elements=()=>Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')??[]).filter(item=>item.getClientRects().length>0);
  elements()[0]?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setMenu(false);}if(event.key==='Tab'){const list=elements(),first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
  window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
 },[menu,wide]);
 const go=(next:WebRoute)=>{setTooltip(null);setMenu(false);onNavigate(next);};
 const toggle=()=>{setTooltip(null);if(wide){const value=!collapsed;setCollapsed(value);try{setWarning(!saveSidebarPreference(window.localStorage,value));}catch{setWarning(true);}}else setMenu(value=>!value);};
 const tip=(element:HTMLElement,label:string)=>{if(compact)setTooltip({label,top:Math.min(window.innerHeight-32,element.getBoundingClientRect().top+22)});};
 const mainRoute=user?dashboardFor(user.userType):webRouteForPath('/')!;
 return <div className={'app-shell '+(compact?'sidebar-collapsed':'')} data-sidebar={compact?'collapsed':'expanded'}>
  <a className="skip-link" href="#main" onClick={()=>content.current?.focus()}>Saltar para o conteúdo</a>
  {menu&&!wide&&<button type="button" className="menu-backdrop" onClick={()=>setMenu(false)} aria-label="Fechar menu" tabIndex={-1}/>}
  <aside id="primary-navigation" ref={sidebar} className={'sidebar '+(menu?'is-open':'')} aria-label="Navegação principal" {...(!wide&&menu?{role:'dialog','aria-modal':true}:{})}>
   <div className="sidebar-brand"><a href={mainRoute.path} className="brand" aria-label="GoLeve" onClick={event=>{event.preventDefault();go(mainRoute);}}><img src={brandIcons[theme]} alt="" width="42" height="42"/><span>GoLeve</span></a><p className="brand-signature">O teu progresso, ao teu ritmo.</p><Button kind="quiet" className="drawer-close" aria-label="Fechar menu lateral" onClick={()=>setMenu(false)}><Symbol name="close"/></Button></div>
   <div className="sidebar-scroll">{groups.map(group=><nav className="navigation-group" aria-label={group.label} key={group.label}><h2 className="nav-heading">{group.label}</h2>{group.routes.map(item=>{
    const selected=route?.id===item.id,label=navigationLabel(item);
    return <a key={item.id} href={item.path} aria-label={label} className={'nav-link '+(selected?'selected':'')} aria-current={selected?'page':undefined} onMouseEnter={event=>tip(event.currentTarget,label)} onMouseLeave={()=>setTooltip(null)} onFocus={event=>tip(event.currentTarget,label)} onBlur={()=>setTooltip(null)} onClick={event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();go(item);}}}>
     {item.id==='settings'?<Symbol name="settings"/>:item.icon==='agenda'?<Symbol name="agenda"/>:<img className="nav-icon" src={(selected?activeIcons:icons)[theme][item.icon]} alt="" width="20" height="20"/>}<span className="nav-label">{label}</span>{selected&&<span className="active-marker" aria-hidden="true"/>}
    </a>;
   })}</nav>)}</div>
   <footer className="sidebar-footer">{user?<><button className="identity" aria-label="Abrir perfil pessoal" onClick={()=>go(webRouteForPath('/perfil')!)} onMouseEnter={event=>tip(event.currentTarget,'Perfil de '+user.name)} onMouseLeave={()=>setTooltip(null)}><span className="avatar" aria-hidden="true">{user.name.slice(0,1)}</span><span className="identity-text"><strong title={user.name}>{user.name}</strong><small>{roleLabels[user.userType]}</small></span><Symbol name="chevron"/></button><Button kind="quiet" className="logout" aria-label="Terminar sessão" onFocus={event=>tip(event.currentTarget,'Terminar sessão')} onBlur={()=>setTooltip(null)} onMouseEnter={event=>tip(event.currentTarget,'Terminar sessão')} onMouseLeave={()=>setTooltip(null)} onClick={onLogout}><img src={logoutIcons[theme]} alt="" width="20" height="20"/><span>Terminar sessão</span></Button></>:<Button kind="secondary" onClick={onLogin}>Iniciar sessão</Button>}</footer>
  </aside>
  {compact&&tooltip&&<span className="navigation-tooltip" role="tooltip" style={{top:tooltip.top}}>{tooltip.label}</span>}
  <div className="main-shell" inert={menu&&!wide}>
   <header className="page-header"><button ref={trigger} type="button" className="button quiet menu-toggle" aria-label="Abrir menu" aria-controls="primary-navigation" aria-expanded={wide?!collapsed:menu} onClick={toggle}><span className="hamburger" aria-hidden="true"><span/><span/><span/></span></button>
    <div className="header-title"><img className="header-brand-icon" src={brandIcons[theme]} alt="" width="32" height="32"/><div><h1>{route?.label??'Página não encontrada'}</h1><Breadcrumbs current={route?.label??'Página não encontrada'} onHome={()=>go(mainRoute)}/></div></div>
    <div className="header-actions"><span className="connection">{connection==='connected'?'Ligação verificada':connection==='loading'?'A verificar…':connection==='unavailable'?'Ligação indisponível':''}</span><Button kind="quiet" className="header-icon-button" aria-label="Verificar ligação" disabled={connection==='loading'} onClick={onCheck}><img src={icons[theme].history} alt="" width="20" height="20"/></Button>{user&&<Button kind="quiet" className="header-icon-button" aria-label="Notificações" onClick={()=>go(webRouteForPath('/notificacoes')!)}><Symbol name="bell"/></Button>}<Button kind="secondary" className="header-icon-button" aria-label="Alterar tema" aria-pressed={theme==='dark'} onClick={onTheme}><img src={themeIcons[theme]} alt="" width="20" height="20"/></Button>{user&&<Button kind="quiet" className="header-account" aria-label="Abrir a minha conta" onClick={()=>go(webRouteForPath('/perfil')!)}><span className="avatar" aria-hidden="true">{user.name.slice(0,1)}</span></Button>}</div>
   </header>
   <main id="main" ref={content} tabIndex={-1} className="page-content">{warning&&<p role="status" className="notice">O menu foi atualizado, mas não foi possível guardar a preferência neste navegador.</p>}{children}</main>
  </div>
 </div>;
}
