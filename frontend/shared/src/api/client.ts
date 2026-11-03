import type { paths } from '../contracts/openapi.generated';
import { publicOperations } from '../contracts/operations.generated';
import { ApiError } from './errors';
import { apiOrigin } from './config';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type PublicPath = keyof paths;
type Method<P extends PublicPath> = { [M in HttpMethod]: M extends keyof paths[P] ? NonNullable<paths[P][M]> extends never ? never : M : never }[HttpMethod];
type Op<P extends PublicPath,M extends HttpMethod> = M extends keyof paths[P] ? NonNullable<paths[P][M]> : never;
type SchemaRequestBody<P extends PublicPath,M extends HttpMethod> =
  Op<P,M> extends {requestBody?: infer B}
  ? NonNullable<B> extends {content: {'application/json': infer T}} ? T : never : never;
// Source OpenAPI leaves step-up parameters generic. Keep a reviewed, closed Auth
// binding here rather than casting away its generated Record<string, never> type.
export type RequestBody<P extends PublicPath,M extends HttpMethod> = P extends '/auth/admin/step-up'
 ? M extends 'post'?import('../contracts/auth-security').AuthStepUpInput:never
 : SchemaRequestBody<P,M>;
export interface TokenSource { current(): string | undefined; invalidate(token: string): void }
export interface RequestOptions<B=unknown> {
  params?: Readonly<Record<string,string>>;
  query?: Readonly<Record<string,string|number|boolean|undefined>>;
  body?: B;
  headers?: Readonly<Partial<Record<'If-Match'|'If-None-Match'|'Idempotency-Key'|'X-Admin-Step-Up',string>>>;
  signal?: AbortSignal;
  authenticated?: boolean;
}
export interface ApiResponse { status: number; body: unknown; etag: string|null; replayed: boolean }
export interface ClientOptions {
  origin: string;
  development?: boolean;
  fetch?: typeof globalThis.fetch;
  token?: TokenSource;
  timeoutMs?: number;
}
function resourcePath(template: string, params: RequestOptions['params']): string {
  const seen=new Set<string>();
  const result=template.replace(/\{([^}]+)\}/g,(_all:string,key:string)=>{
    const value=params?.[key];
    if(!value || value==='.' || value==='..' || /[%/?#\\\u0000-\u001f\u007f]/.test(value)) throw new ApiError(0,'INVALID_PATH_PARAMETER','not-started');
    seen.add(key);return encodeURIComponent(value);
  });
  if(Object.keys(params||{}).some(key=>!seen.has(key))) throw new ApiError(0,'UNEXPECTED_PATH_PARAMETER','not-started');
  return result;
}
export function createApiClient(options: ClientOptions) {
  const origin=apiOrigin(options.origin,options.development);
  const transport=options.fetch ?? globalThis.fetch;
  if(!transport) throw new Error('Fetch is required');
  const timeout=options.timeoutMs??10000;
  if(!Number.isFinite(timeout)||timeout<1||timeout>120000) throw new Error('Invalid request timeout');
  return {
    async request<P extends PublicPath,M extends Method<P>>(
      method:M,path:P,request:RequestOptions<RequestBody<P,M>>={}
    ):Promise<ApiResponse> {
      if(!publicOperations.some(op=>op.path===path&&op.method===method)) throw new ApiError(0,'UNSUPPORTED_OPERATION','not-started');
      if(method==='get'&&request.body!==undefined)throw new ApiError(0,'UNEXPECTED_BODY','not-started');
      const url=new URL(resourcePath(path,request.params),origin);
      for(const [key,value]of Object.entries(request.query??{})) if(value!==undefined)url.searchParams.set(key,String(value));
      const headers=new Headers({Accept:'application/json'});
      for(const [key,value]of Object.entries(request.headers??{})) {
        if(!['if-match','if-none-match','idempotency-key','x-admin-step-up'].includes(key.toLowerCase())) throw new ApiError(0,'UNSUPPORTED_HEADER','not-started');
        if(typeof value==='string') headers.set(key,value);
      }
      const token=request.authenticated===false?undefined:options.token?.current();
      if(token)headers.set('Authorization','Bearer '+token);
      const body=request.body===undefined?undefined:JSON.stringify(request.body);
      if(body!==undefined)headers.set('Content-Type','application/json');
      const controller=new AbortController();
      if(request.signal?.aborted)throw new ApiError(0,'REQUEST_ABORTED','not-started');
      const abort=()=>controller.abort(); request.signal?.addEventListener('abort',abort,{once:true});
      const timer=setTimeout(abort,timeout);
      const isWrite=method!=='get';
      try {
        const response=await transport(url.toString(),{method:method.toUpperCase(),headers,...(body===undefined?{}:{body}),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      // Only invalidate the exact token used by this request, never a newer session.
      if(response.status===401&&token)options.token?.invalidate(token);
      let data:unknown;
      try {
        if(response.status!==204) {
          const contentType=response.headers.get('Content-Type')??'';
          if(!contentType.toLowerCase().includes('application/json'))throw new Error('Not JSON');
          data=await response.json();
        }
      } catch {
        throw new ApiError(response.status,controller.signal.aborted?'REQUEST_ABORTED':'INVALID_RESPONSE',isWrite?'unknown':'rejected');
      }
      if(!response.ok) {
        const error=data&&typeof data==='object'&&'error' in data?data.error:undefined;
        const rawCode=error&&typeof error==='object'&&'code' in error?error.code:undefined;
        const code=typeof rawCode==='string'&&/^[A-Z0-9_]{1,100}$/.test(rawCode)?rawCode:'HTTP_ERROR';
        const rawRequestId=error&&typeof error==='object'&&'requestId' in error?error.requestId:undefined;
        const requestId=typeof rawRequestId==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(rawRequestId)?rawRequestId:null;
        throw new ApiError(response.status,code,code==='PAYMENT_RECONCILIATION_REQUIRED'||isWrite&&response.status>=500?'unknown':'rejected',response.headers.get('Retry-After'),requestId);
      }
      return {status:response.status,body:data,etag:response.headers.get('ETag'),replayed:response.headers.get('Idempotency-Replayed')==='true'};
      } catch(error) {
        if(error instanceof ApiError)throw error;
        throw new ApiError(0,controller.signal.aborted?'REQUEST_ABORTED':'NETWORK_ERROR',isWrite?'unknown':'not-started');
      } finally {clearTimeout(timer);request.signal?.removeEventListener('abort',abort);}
    }
  };
}
export type ApiClient=ReturnType<typeof createApiClient>;
