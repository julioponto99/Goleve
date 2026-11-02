import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
export function Button({kind='primary',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{kind?:'primary'|'secondary'|'quiet'}){
 return <button type="button" {...props} className={['button',kind,props.className].filter(Boolean).join(' ')}/>;
}
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={'card '+className}>{children}</section>;}
export function Badge({children}:{children:ReactNode}){return <span className="badge">{children}</span>;}
export function TextField({label,error,id,...props}:InputHTMLAttributes<HTMLInputElement>&{id:string;label:string;error?:string}){
 return <div className="field"><label htmlFor={id}>{label}</label><input {...props} id={id} aria-invalid={!!error} aria-describedby={error?id+'-error':undefined}/>{error&&<p role="alert" className="field-error" id={id+'-error'}>{error}</p>}</div>;
}
export function LoadingState({label='A carregar…'}:{label?:string}){return <div className="state" role="status" aria-live="polite"><span className="spinner" aria-hidden="true"/><p>{label}</p></div>;}
export function MessageState({title,children,error=false}:{title:string;children:ReactNode;error?:boolean}){
 return <div className={'state '+(error?'error-state':'')} role={error?'alert':'status'}><h2>{title}</h2><p>{children}</p></div>;
}
export function Dialog({open,title,children,onClose}:{open:boolean;title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;if(open&&!el.open)el.showModal();if(!open&&el.open)el.close();},[open]);
 return <dialog ref={ref} className="dialog" aria-label={title} onClose={()=>{if(open)onClose();}}><div className="dialog-title"><h2>{title}</h2><Button kind="quiet" onClick={()=>ref.current?.close()} aria-label="Fechar">Fechar</Button></div>{children}</dialog>;
}
