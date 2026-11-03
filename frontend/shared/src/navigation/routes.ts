import type { SessionSnapshot } from '../auth/session';
import type { Role } from '../contracts/domain';
export const routes=[
 {id:'home',path:'/',label:'Início',icon:'home',private:false,availability:'foundation'},
 {id:'training',path:'/treinos',label:'Treinos',icon:'training',private:true,availability:'foundation'},
 {id:'measurements',path:'/medidas',label:'Medidas',icon:'measurements',private:true,availability:'foundation'},
 {id:'hydration',path:'/hidratacao',label:'Hidratação',icon:'hydration',private:true,availability:'foundation'},
 {id:'coach',path:'/coach',label:'Coach IA',icon:'coach',private:true,availability:'blocked'},
 {id:'history',path:'/historico',label:'Histórico',icon:'history',private:true,availability:'foundation'},
 {id:'profile',path:'/perfil',label:'Perfil pessoal',icon:'profile',private:true,availability:'foundation'},
 {id:'agenda',path:'/agenda',label:'Agenda pessoal',icon:'agenda',private:true,availability:'foundation'}
] as const;
export type RouteId=typeof routes[number]['id'];
export type AppRoute=typeof routes[number];
export const mobileTabs:readonly RouteId[]=['home','training','measurements','coach'];
export function routeForPath(path:string):AppRoute|undefined{return routes.find(route=>route.path===path);}
export type NavigationDecision='allowed'|'authentication-required'|'identity-unavailable'|'forbidden';
export function navigationDecision(route:{private:boolean;roles?:readonly Role[]},session:SessionSnapshot):NavigationDecision{
 if(!route.private)return 'allowed';
 if(session.status==='unavailable'||session.status==='restoring')return 'identity-unavailable';
 if(session.status!=='authenticated')return 'authentication-required';
 if(route.roles&&!route.roles.includes(session.user.userType))return 'forbidden';
 return 'allowed'; // Presentation only; never a grant or scope assertion.
}
