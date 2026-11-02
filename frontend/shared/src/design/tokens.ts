export type Theme='light'|'dark';
export type ThemePreference=Theme|'system';
export const colors={
 dark:{background:'#0B1220',surface:'#162235',raised:'#1E293B',text:'#F3F6FB',muted:'#A6B2C2',border:'#2A394D',accent:'#A3D65C',accentText:'#1F2937',selectedText:'#A3D65C',hydration:'#06B6D4',danger:'#F87171',selection:'#283B2A'},
 light:{background:'#F7F9F6',surface:'#FFFFFF',raised:'#F0F4ED',text:'#1F2937',muted:'#596457',border:'#E8EEE6',accent:'#A3D65C',accentText:'#1F2937',selectedText:'#42651B',hydration:'#087A93',danger:'#BB1E1E',selection:'#EAF2E1'}
} as const;
export const spacing={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32,page:38} as const;
export const radius={input:10,card:16,pill:999} as const;
export const typography={family:'Inter',body:14,bodyLarge:16,label:12,title:24,hero:32} as const;
export function resolveTheme(preference:ThemePreference,system:Theme):Theme{return preference==='system'?system:preference;}
