const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const shared=require('../shared/src/index.ts');
// Structural rendering of the real auth component. Native primitives and safe
// areas are simulated; this is not device/emulator or keyboard execution.
function render(mode,platform='ios',session={status:'anonymous'}){
 const file=path.resolve(__dirname,'../mobile/src/AuthScreen.tsx'),unit=new Module(file,module);unit.filename=file;unit.paths=Module._nodeModulePaths(path.dirname(file));const real=unit.require.bind(unit);
 const container=({children,behavior})=>React.createElement('section',{'data-behavior':behavior},children);
 const ui={Button:({children,disabled})=>React.createElement('button',{disabled},children),TextField:({label,secureTextEntry})=>React.createElement('label',null,label,React.createElement('input',{type:secureTextEntry?'password':'text'})),MessageState:({title,children})=>React.createElement('div',null,title,children),LoadingState:()=>React.createElement('span',null,'loading')};
 unit.require=name=>name==='react-native'?{Image:()=>React.createElement('img',{alt:'brand'}),KeyboardAvoidingView:container,Platform:{OS:platform},ScrollView:container,Text:({children})=>React.createElement('span',null,children),View:container,StyleSheet:{create:value=>value}}
  :name==='react-native-safe-area-context'?{useSafeAreaInsets:()=>({top:44,bottom:34,left:0,right:0})}:name==='@goleve/shared'?shared:name==='./assets'?{brandIcons:{light:'test-brand',dark:'test-brand-dark'}}:name==='./ui'?ui:real(name);
 unit._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
 return renderToStaticMarkup(React.createElement(unit.exports.AuthScreen,{mode,runtime:{session:{getSnapshot:()=>session}},session,theme:'light',onNavigate(){},onAuthenticated(){},toggleTheme(){}}));
}
for(const platform of ['ios','android']){
 test('native login/register have required credentials and no public role selector: '+platform,()=>{
  const login=render('login',platform),register=render('register',platform);assert.match(login,/Esqueceste-te da palavra-passe/);assert.match(login,/type="password"/);assert.match(login,platform==='ios'?/data-behavior="padding"/:/data-behavior="height"/);assert.match(register,/Confirmar palavra-passe/);assert.match(register,/Nome completo/);assert.ok(!register.includes('administrador'));
 });
 test('native recovery remains disabled for every entry point: '+platform,()=>{
  for(const mode of ['recovery','reset-password','recovery-result']){const html=render(mode,platform);assert.match(html,/Recuperação indisponível/);assert.match(html,/Não foram enviadas instruções/);assert.ok(!html.includes('Recuperação concluída'));if(mode!=='recovery-result')assert.match(html,/<button disabled/);}
 });
 test('native pending MFA shows no administrative content or prematurely issued codes: '+platform,()=>{
  const html=render('mfa',platform,{status:'mfa-required',enrollmentRequired:false});assert.match(html,/Confirmar segundo fator/);assert.match(html,/Código da aplicação/);assert.ok(!html.includes('Painel do Administrador'));assert.ok(!html.includes('Guarda os códigos'));
 });
}
