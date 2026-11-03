import { ApiError, errorMessage } from '../api/errors';
export function authError(error:unknown,kind:'login'|'register'|'mfa'|'step-up'){
 if(error instanceof ApiError){
  if(error.status===401)return kind==='login'?'Email ou palavra-passe inválidos.':kind==='mfa'?'O código é inválido ou o desafio expirou. Verifica o código ou inicia sessão novamente.':'Não foi possível confirmar a identidade. Inicia sessão novamente.';
  if(error.status===409&&kind==='register')return 'Não foi possível criar a conta com este email. Se já tens conta, inicia sessão.';
  if(error.status===403&&error.code==='ADMIN_QUORUM_REQUIRED')return 'O quórum administrativo ainda não está disponível. Esta operação permanece bloqueada.';
  if(error.status===429)return 'Demasiadas tentativas. Aguarda antes de tentar novamente.';
 }
 return errorMessage(error);
}
