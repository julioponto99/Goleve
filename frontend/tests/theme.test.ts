import test from 'node:test';
import assert from 'node:assert/strict';
import { colors, createThemeStore, parseTheme, themeStorageKey } from '../shared/src/index';
import type { ThemePreference } from '../shared/src/index';
test('theme storage accepts only the three non-sensitive preference values',()=>{
 for(const value of ['dark','light','system'])assert.equal(parseTheme(value),value);
 for(const value of ['',null,{},'token','{"theme":"dark"}'])assert.equal(parseTheme(value),null);
 assert.equal(themeStorageKey,'goleve.ui.theme.v1');
});
test('saved device theme restores across store instances without changing the system default',async()=>{
 let saved:unknown=null;const storage={async read(){return saved;},async write(value:ThemePreference){saved=value;}};
 const first=createThemeStore(storage,'system');assert.equal(first.getSnapshot(),'system');
 assert.equal(await first.set('dark'),true);
 const next=createThemeStore(storage,'system');await next.restore();assert.equal(next.getSnapshot(),'dark');
});
test('a slow restore cannot overwrite a theme selected by the user meanwhile',async()=>{
 let finish!:(value:unknown)=>void;
 const store=createThemeStore({read:()=>new Promise(resolve=>{finish=resolve;}),async write(){}},'light');
 const restoring=store.restore();await store.set('dark');finish('light');await restoring;
 assert.equal(store.getSnapshot(),'dark');
});
test('rapid asynchronous selections persist in order and notify subscribers',async()=>{
 let finish!:()=>void;const saved:ThemePreference[]=[],seen:ThemePreference[]=[];
 const store=createThemeStore({async read(){return null;},async write(value){if(value==='dark')await new Promise<void>(resolve=>{finish=resolve;});saved.push(value);}},'light');
 const unsubscribe=store.subscribe(()=>seen.push(store.getSnapshot()));
 const first=store.set('dark'),second=store.set('light');await Promise.resolve();await Promise.resolve();finish();
 assert.deepEqual(await Promise.all([first,second]),[true,true]);assert.deepEqual(saved,['dark','light']);assert.deepEqual(seen,['dark','light']);unsubscribe();
});
test('unavailable preference storage keeps the interface usable and permits a subsequent write',async()=>{
 let broken=true;
 const store=createThemeStore({async read(){throw Error('unavailable');},async write(){if(broken)throw Error('unavailable');}},'light');
 assert.equal(await store.restore(),false);assert.equal(await store.set('dark'),false);assert.equal(store.getSnapshot(),'dark');
 broken=false;assert.equal(await store.set('light'),true);
});
function luminance(hex:string){
 const rgb=hex.slice(1).match(/.{2}/g)!.map(value=>{const c=parseInt(value,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 return rgb[0]!*.2126+rgb[1]!*.7152+rgb[2]!*.0722;
}
test('both palettes meet WCAG AA for normal text on their actual surfaces and selected tabs',()=>{
 for(const palette of Object.values(colors))for(const [foreground,background] of [
  [palette.text,palette.background],[palette.text,palette.surface],
  [palette.muted,palette.surface],[palette.muted,palette.background],
  [palette.selectedText,palette.selection],[palette.accentText,palette.accent],[palette.danger,palette.surface]
 ]){
  const a=luminance(foreground!),b=luminance(background!),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert.ok(contrast>=4.5,`${foreground} on ${background}: ${contrast.toFixed(2)}`);
 }
});
