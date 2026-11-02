const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const shared=require('../shared/src/index.ts');
// Render the real stateless component with native primitives/safe-area mocked.
// This does not emulate the native font rasterizer, gestures or an actual device.
function render(props,bottom=34){
 const filename=path.resolve(__dirname,'../mobile/src/BottomNavigation.tsx');
 const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const unit=new Module(filename,module);unit.filename=filename;unit.paths=Module._nodeModulePaths(path.dirname(filename));
 const real=unit.require.bind(unit);
 unit.require=name=>name==='react-native'?{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:value=>value}}
  :name==='react-native-safe-area-context'?{useSafeAreaInsets:()=>({top:0,bottom,left:0,right:0})}
  :name==='@goleve/shared'?shared:name.endsWith('.ttf')?'test-font-resource':real(name);
 unit._compile(compiled,filename);
 return unit.exports.BottomNavigation({iconsLoaded:true,...props});
}
const flatten=value=>Array.isArray(value)?Object.assign({},...value.filter(Boolean).map(flatten)):value;
test('each tab renders exactly one original vector glyph, with fixed geometry across states/themes',()=>{
 const expected=['\uf015','\uf44b','\ue473','\uf544'];
 for(const theme of ['light','dark'])for(const selected of shared.mobileTabs){
  const tree=render({theme,selected,onNavigate(){},onHeightChange(){}});
  assert.equal(tree.props.children.length,4);
  tree.props.children.forEach((tab,index)=>{
   const [slot,label]=tab.props.children,icon=slot.props.children;
   assert.equal(tab.props.accessibilityState.selected,shared.mobileTabs[index]===selected);
   assert.deepEqual([slot.props.style.width,slot.props.style.height],[24,24]);
   assert.equal(icon.props.children,expected[index]);
   const style=flatten(icon.props.style);assert.equal(style.fontFamily,'GoLeveNavigation');assert.equal(style.fontSize,18);
   assert.equal(style.color,shared.colors[theme][shared.mobileTabs[index]===selected?'selectedText':'muted']);
   assert.equal(label.props.style[0].fontSize,11);
   for(const item of [style,flatten(tab.props.style),flatten(tree.props.style)]){
    assert.equal(item.textShadowRadius,undefined);assert.equal(item.shadowRadius,undefined);assert.equal(item.elevation,undefined);assert.equal(item.transform,undefined);
   }
  });
 }
});
test('tabs invoke real routes and preserve safe-area clearance in both device configurations',()=>{
 for(const bottom of [0,34]){
  const visited=[],heights=[];
  const tree=render({theme:'light',selected:'home',onNavigate:route=>visited.push(route.path),onHeightChange:height=>heights.push(height)},bottom);
  assert.equal(flatten(tree.props.style).bottom,Math.max(bottom,12));
  for(const tab of tree.props.children)tab.props.onPress();
  assert.deepEqual(visited,['/','/treinos','/medidas','/coach']);
  tree.props.onLayout({nativeEvent:{layout:{height:112}}});assert.deepEqual(heights,[112]);
 }
});
test('the pinned original font maps all four Figma glyphs without a bitmap dependency',()=>{
 const css=fs.readFileSync(require.resolve('@fortawesome/fontawesome-free/css/all.css'),'utf8');
 for(const [name,code] of [['house','f015'],['dumbbell','f44b'],['chart-simple','e473'],['robot','f544']]){
  assert.ok(new RegExp('\\.fa-'+name+'[\\s\\S]{0,120}'+code).test(css),name);
 }
 assert.ok(fs.statSync(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf')).size>100000);
});
test('a font load failure leaves usable labelled tabs without fallback/tofu icon text',()=>{
 const tree=render({theme:'light',selected:'home',iconsLoaded:false,onNavigate(){},onHeightChange(){}});
 for(const tab of tree.props.children){assert.equal(tab.props.children[0].props.children,false);assert.ok(tab.props.children[1].props.children);}
});
test('the real device preference adapter uses a separate SecureStore key and preserves the session',async()=>{
 const filename=path.resolve(__dirname,'../mobile/src/theme.ts'),stored=new Map([['goleve.auth.session.v1','session-fixture-kept-private']]),calls=[];
 const unit=new Module(filename,module);unit.filename=filename;unit.paths=Module._nodeModulePaths(path.dirname(filename));
 unit.require=name=>name==='@goleve/shared'?shared:name==='expo-secure-store'?{
  WHEN_UNLOCKED_THIS_DEVICE_ONLY:'device-only',
  async getItemAsync(key,options){calls.push({key,options});return stored.get(key)??null;},
  async setItemAsync(key,value,options){calls.push({key,options});stored.set(key,value);}
 }:require(name);
 unit._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,filename);
 const first=unit.exports.createDeviceThemeStore();await first.restore();assert.equal(await first.set('dark'),true);
 const second=unit.exports.createDeviceThemeStore();await second.restore();assert.equal(second.getSnapshot(),'dark');
 assert.equal(stored.get('goleve.auth.session.v1'),'session-fixture-kept-private');
 for(const call of calls){assert.equal(call.key,shared.themeStorageKey);assert.equal(call.options.keychainAccessible,'device-only');}
});
