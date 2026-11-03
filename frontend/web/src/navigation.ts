import { navigationFor, webRouteForPath as sharedRouteForPath } from '@goleve/shared';
import type { Role, WebRoute as SharedRoute } from '@goleve/shared';
export { roleLabels, dashboardRoutes, dashboardFor, dashboardAccess, dashboardModules } from '@goleve/shared';
export type { DashboardModule } from '@goleve/shared';
export const settingsRoute={id:'settings',path:'/conta/definicoes',label:'Definições',icon:'profile',private:true,availability:'foundation'} as const;
export type WebRoute=SharedRoute|typeof settingsRoute;
export const webRouteForPath=(path:string):WebRoute|undefined=>path===settingsRoute.path?settingsRoute:sharedRouteForPath(path);
export const isAuthRoute=(route:WebRoute|undefined)=>!!route&&['login','register','mfa','recovery','reset-password','recovery-result'].includes(route.id);
export const isDashboardRoute=(route:WebRoute)=>route.id==='dashboard'||'dashboardRole' in route;
export const sidebarStorageKey='goleve.ui.sidebar.v1';
export function readSidebarPreference(storage:Pick<Storage,'getItem'>):boolean{try{return storage.getItem(sidebarStorageKey)==='collapsed';}catch{return false;}}
export function saveSidebarPreference(storage:Pick<Storage,'setItem'>,collapsed:boolean):boolean{try{storage.setItem(sidebarStorageKey,collapsed?'collapsed':'expanded');return true;}catch{return false;}}
export interface NavigationGroup{label:string;routes:readonly WebRoute[]}
export function webNavigation(role:Role):NavigationGroup[]{
 const allowed:readonly SharedRoute[]=navigationFor(role).filter(route=>route.availability!=='blocked');
 const personal=['training','hydration','measurements','agenda','history'];
 const services=['catalog','bookings','coach','professional-services','professional-agenda','professional-availability','manager-services','manager-bookings','admin-professionals'];
 const account=['profile','settings','security'];
 const route=(id:string)=>allowed.find(item=>item.id===id);
 const main=role==='utilizador'?[allowed[0]!,...personal.map(route).filter((item):item is SharedRoute=>!!item)]:allowed.filter(item=>!services.includes(item.id)&&!account.includes(item.id)&&item.id!=='notifications');
 return [{label:'Principal',routes:main},{label:'Serviços',routes:allowed.filter(item=>services.includes(item.id))},{label:'Conta',routes:[...allowed.filter(item=>item.id==='profile'),settingsRoute,...allowed.filter(item=>item.id==='security')]}].filter(group=>group.routes.length);
}
export function navigationLabel(route:WebRoute){
 if(isDashboardRoute(route))return 'Painel principal';
 return ({measurements:'Medições',agenda:'Agenda',catalog:'Profissionais',bookings:'Reservas',profile:'Perfil',security:'Segurança'} as Record<string,string>)[route.id]??route.label;
}
