import type { ReactNode, SVGProps } from 'react';
export type SymbolName='agenda'|'settings'|'bell'|'close'|'arrow'|'check'|'chevron';
const paths:Record<SymbolName,ReactNode>={
 agenda:<><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2"/></>,
 settings:<><path d="m9 3-1 3-3 1-2 3 2 3v3l3 2 1 3h4l1-3 3-2v-3l2-3-2-3-3-1-1-3Z"/><circle cx="11" cy="12" r="3"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
 close:<path d="m6 6 12 12M6 18 18 6"/>,arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,check:<path d="m5 12 4 4L19 6"/>,chevron:<path d="m9 5 7 7-7 7"/>
};
export function Symbol({name,...props}:SVGProps<SVGSVGElement>&{name:SymbolName}){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;}
