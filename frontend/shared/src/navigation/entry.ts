import type { SessionSnapshot } from '../auth/session';
// Routing is presentation only; Auth and domain services authorize each request.
export function entryDestination(session:SessionSnapshot,path:string,privatePage:boolean):string|null{
 if(session.status==='authenticated')return path==='/'?'/painel/'+session.user.userType:null;
 if(session.status==='mfa-required')return path==='/'||privatePage?'/autenticacao/mfa':null;
 if(session.status==='anonymous')return path==='/'||privatePage?'/entrar':null;
 if(session.status==='unavailable'&&path==='/')return '/entrar';
 return null;
}
