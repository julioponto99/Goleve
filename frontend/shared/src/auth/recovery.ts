// No recovery endpoints exist in the current Auth/OpenAPI. Never fake delivery.
export const passwordRecovery={available:false as const,message:'A recuperação de palavra-passe ainda não está disponível neste ambiente. Não foram enviadas instruções nem alterada a palavra-passe.'};
export type RecoveryStage='request'|'reset'|'result';
export const recoveryPaths={request:'/recuperar-acesso',reset:'/recuperar-acesso/nova-palavra-passe',result:'/recuperar-acesso/resultado'} as const;
export function recoveryStage(path:string):RecoveryStage|null{
 return path===recoveryPaths.request?'request':path===recoveryPaths.reset?'reset':path===recoveryPaths.result?'result':null;
}
