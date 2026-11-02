import { createThemeStore, parseTheme, themeStorageKey } from '@goleve/shared';
import type { ThemePreference } from '@goleve/shared';
export function createWebThemeStore(){
 let initial:ThemePreference='light';
 try{initial=parseTheme(window.localStorage.getItem(themeStorageKey))??'light';}catch{/* Local preference may be unavailable. */}
 return createThemeStore({
  async read(){return window.localStorage.getItem(themeStorageKey);},
  async write(value){window.localStorage.setItem(themeStorageKey,value);}
 },initial);
}
