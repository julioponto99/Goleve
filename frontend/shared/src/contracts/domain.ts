import type { components } from './openapi.generated';
export type ProfileInput=components['schemas']['Profile'];
export type PreferencesInput=components['schemas']['Preferences'];
export type IntakeInput=components['schemas']['Intake'];
export type PerformanceMeasurementInput=components['schemas']['PerformanceMeasurement'];
export type RegisterInput=components['schemas']['Register'];
export type Role='utilizador'|'profissional'|'gestor'|'administrador';
export type LoginInput={email:string;password:string};
export interface PublicUser {
 id:string;name:string;email:string;userType:Role;
 accountStatus:'active'|'suspended';roleVersion:number;
 createdAt:string;updatedAt:string;
}
export interface AuthSession {user:PublicUser;accessToken:string;tokenType:'Bearer';expiresIn:number}
export interface MfaChallenge {challenge:string;mfaRequired:true;enrollmentRequired:boolean;expiresIn:number}
export type AuthResponse=AuthSession|MfaChallenge;
