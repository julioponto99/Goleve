import { navigationDecision, routeForPath, routes } from './routes';
import type { AppRoute } from './routes';
import type { Role } from '../contracts/domain';
import type { SessionSnapshot } from '../auth/session';
export const roleLabels:Record<Role,string>={utilizador:'Utilizador',profissional:'Profissional',gestor:'Gestor',administrador:'Administrador'};
export const dashboardRoutes=(['utilizador','profissional','gestor','administrador'] as const).map(role=>({
 id:'dashboard-'+role,path:'/painel/'+role,label:'Painel do '+roleLabels[role],icon:'home' as const,
 private:true as const,roles:[role] as readonly Role[],availability:'foundation' as const,dashboardRole:role
}));
const commonRoutes=[
 {id:'dashboard',path:'/painel',label:'O meu painel',icon:'home',private:true,availability:'foundation'},
 {id:'security',path:'/conta/seguranca',label:'Sessões e segurança',icon:'profile',private:true,availability:'foundation'},
 {id:'login',path:'/entrar',label:'Iniciar sessão',icon:'profile',private:false,availability:'foundation'},
 {id:'register',path:'/criar-conta',label:'Criar conta',icon:'profile',private:false,availability:'foundation'},
 {id:'mfa',path:'/autenticacao/mfa',label:'Verificação de segurança',icon:'profile',private:false,availability:'foundation'}
 ,{id:'recovery',path:'/recuperar-acesso',label:'Recuperar acesso',icon:'profile',private:false,availability:'blocked'}
 ,{id:'reset-password',path:'/recuperar-acesso/nova-palavra-passe',label:'Nova palavra-passe',icon:'profile',private:false,availability:'blocked'}
 ,{id:'recovery-result',path:'/recuperar-acesso/resultado',label:'Resultado da recuperação',icon:'profile',private:false,availability:'blocked'}
] as const;
export const operationalRoutes=[
 {id:'catalog',path:'/servicos',label:'Serviços profissionais',icon:'profile',private:true,roles:['utilizador'],availability:'foundation'},
 {id:'bookings',path:'/reservas',label:'As minhas reservas',icon:'agenda',private:true,roles:['utilizador'],availability:'foundation'},
 {id:'professional-profile',path:'/profissional/perfil',label:'Perfil profissional',icon:'profile',private:true,roles:['profissional'],availability:'foundation'},
 {id:'professional-services',path:'/profissional/servicos',label:'Serviços e ofertas',icon:'training',private:true,roles:['profissional'],availability:'foundation'},
 {id:'professional-agenda',path:'/profissional/agenda',label:'Agenda profissional',icon:'agenda',private:true,roles:['profissional'],availability:'foundation'},
 {id:'professional-availability',path:'/profissional/disponibilidade',label:'Disponibilidade',icon:'agenda',private:true,roles:['profissional'],availability:'foundation'},
 {id:'manager-scopes',path:'/gestao/ambitos',label:'Âmbitos atribuídos',icon:'profile',private:true,roles:['gestor'],availability:'foundation'},
 {id:'manager-services',path:'/gestao/servicos',label:'Serviços sob gestão',icon:'training',private:true,roles:['gestor'],availability:'foundation'},
 {id:'manager-bookings',path:'/gestao/reservas',label:'Reservas autorizadas',icon:'agenda',private:true,roles:['gestor'],availability:'foundation'},
 {id:'manager-cases',path:'/gestao/casos',label:'Casos de gestão',icon:'history',private:true,roles:['gestor'],availability:'foundation'},
 {id:'admin-users',path:'/administracao/utilizadores',label:'Utilizadores e papéis',icon:'profile',private:true,roles:['administrador'],availability:'foundation'},
 {id:'admin-approvals',path:'/administracao/aprovacoes',label:'Aprovações',icon:'history',private:true,roles:['administrador'],availability:'foundation'},
 {id:'admin-managers',path:'/administracao/gestores',label:'Gestores e âmbitos',icon:'profile',private:true,roles:['administrador'],availability:'foundation'},
 {id:'admin-professionals',path:'/administracao/profissionais',label:'Supervisão profissional',icon:'profile',private:true,roles:['administrador'],availability:'foundation'},
 {id:'admin-audit',path:'/administracao/auditoria',label:'Auditoria',icon:'history',private:true,roles:['administrador'],availability:'foundation'},
 {id:'notifications',path:'/notificacoes',label:'Notificações',icon:'history',private:true,availability:'foundation'}
] as const;
export type WebRoute=AppRoute|typeof dashboardRoutes[number]|typeof commonRoutes[number]|typeof operationalRoutes[number];
export function webRouteForPath(path:string):WebRoute|undefined{return dashboardRoutes.find(route=>route.path===path)||commonRoutes.find(route=>route.path===path)||operationalRoutes.find(route=>route.path===path)||routeForPath(path);}
export function navigationFor(role:Role):readonly WebRoute[]{return [dashboardFor(role),...(role==='utilizador'?routes.filter(route=>route.id!=='home'&&route.id!=='profile'):[]),...operationalRoutes.filter(route=>!('roles' in route)||route.roles.some(allowed=>allowed===role)),routes[6],commonRoutes[1]];}
export function dashboardFor(role:Role){return dashboardRoutes.find(route=>route.dashboardRole===role)!;}
export function dashboardAccess(route:WebRoute,session:SessionSnapshot){return navigationDecision(route,session);}
export const isAuthRoute=(route:WebRoute|undefined)=>!!route&&['login','register','mfa','recovery','reset-password','recovery-result'].includes(route.id);
export const isDashboardRoute=(route:WebRoute)=>route.id==='dashboard'||'dashboardRole' in route;
export interface DashboardModule{title:string;description:string;stage:string;blocker?:string}
export const dashboardModules:Record<Role,readonly DashboardModule[]>={
 utilizador:[
  {title:'Hidratação',description:'Acompanha a tua meta diária, os consumos e o histórico.',stage:'Etapa B'},
  {title:'Treinos',description:'Consulta os teus planos, exercícios e sessões.',stage:'Etapa B'},
  {title:'Medições e evolução',description:'Acompanha as tuas medições e a evolução física.',stage:'Etapa B'},
  {title:'Agenda pessoal',description:'Atividades próprias, independentes das reservas profissionais.',stage:'Etapa B'},
  {title:'Serviços profissionais',description:'Catálogo, disponibilidade, reservas e pagamentos simulados.',stage:'Etapa B',blocker:'O fluxo de reservas e pagamentos associados ainda não está disponível neste ambiente.'},
  {title:'Coach IA',description:'A utilização autónoma continua disponível sem IA.',stage:'Indisponível',blocker:'O Coach IA permanece desativado neste ambiente.'}
 ],
 profissional:[
  {title:'Perfil profissional',description:'Perfil, capacidades, qualificações e estado da candidatura.',stage:'Etapa C'},
  {title:'Serviços e ofertas',description:'Operações próprias sujeitas à elegibilidade e ativação verificadas no servidor.',stage:'Etapa C'},
  {title:'Disponibilidade',description:'Regras e exceções operacionais da Agenda, distintas da declaração de candidatura.',stage:'Etapa C'},
  {title:'Reservas profissionais',description:'Pedidos e transições autorizadas, sem confirmar reservas no cliente.',stage:'Etapa C',blocker:'As reservas exigem elegibilidade profissional validada pelo serviço. Este fluxo ainda não está disponível nesta interface.'}
 ],
 gestor:[
  {title:'Âmbitos atribuídos',description:'Atribuições atuais, aprovadas e não expiradas; o papel não concede um âmbito.',stage:'Etapa D'},
  {title:'Serviços sob gestão',description:'Consulta e operações apenas sobre os serviços autorizados.',stage:'Etapa D'},
  {title:'Indicadores operacionais',description:'Indicadores com proteção de privacidade e indicação de origens indisponíveis.',stage:'Etapa D',blocker:'A consulta dependerá de atribuições atuais, aprovadas e não expiradas.'},
  {title:'Casos de gestão',description:'Acompanha os casos, os responsáveis e o histórico de decisões.',stage:'Etapa D'}
 ],
 administrador:[
  {title:'Utilizadores e papéis',description:'Consulta mínima, pedidos de alteração e decisões independentes.',stage:'Etapa E'},
  {title:'Gestores e âmbitos',description:'Convites e atribuições com aprovação independente e validade.',stage:'Etapa E'},
  {title:'Supervisão profissional',description:'Consulta e suspensão auditadas; sem aprovação real de credenciais ou reativação indevida.',stage:'Etapa E',blocker:'A supervisão não inclui validação real de credenciais profissionais neste ambiente.'},
  {title:'Auditoria administrativa',description:'Histórico relevante, MFA, step-up por operação e proteção do último Administrador.',stage:'Etapa E'}
 ]
};
