import { passwordFormatValid } from '../validation/input';
export const emailFormatValid=(value:string)=>value.trim().length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())&&!/[\u0000-\u001f\u007f]/.test(value);
export const nameFormatValid=(value:string)=>value.trim().length>=2&&value.trim().length<=100&&!/[\u0000-\u001f\u007f]/.test(value);
export function credentialErrors(input:{email:string;password:string;name?:string;confirmation?:string}){
 const errors:Record<string,string>={};
 if(!emailFormatValid(input.email))errors.email='Indica um endereço de email válido, até 254 caracteres.';
 if(!passwordFormatValid(input.password))errors.password='Usa pelo menos 8 caracteres e no máximo 72 bytes UTF-8.';
 if(input.name!==undefined&&!nameFormatValid(input.name))errors.name='Indica um nome entre 2 e 100 caracteres, sem caracteres de controlo.';
 if(input.confirmation!==undefined&&input.confirmation!==input.password)errors.confirmation='As palavras-passe não coincidem.';
 return errors;
}
export type MfaFactor={otp:string;recoveryCode?:never}|{recoveryCode:string;otp?:never};
export function factorValid(value:{otp?:string;recoveryCode?:string}){return typeof value.otp==='string'&&/^\d{6}$/.test(value.otp)&&value.recoveryCode===undefined||typeof value.recoveryCode==='string'&&/^[a-f0-9]{32}$/.test(value.recoveryCode)&&value.otp===undefined;}
