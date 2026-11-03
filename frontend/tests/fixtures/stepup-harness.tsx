import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createRuntime, memorySessionStorage } from '@goleve/shared';
import { Button } from '../../web/src/components/ui';
import { StepUpDialog } from '../../web/src/auth/StepUpDialog';
import { authAdminIntent } from '../../web/src/auth/security';
import '../../web/src/styles.css';
const runtime=createRuntime({origin:'http://127.0.0.1:64344',development:true},memorySessionStorage());
function Harness(){
 const snapshot=useSyncExternalStore(runtime.session.subscribe,runtime.session.getSnapshot),[open,setOpen]=useState(false),[result,setResult]=useState('');
 useEffect(()=>{void runtime.session.signIn({email:'web@example.invalid',password:'not-a-real-password'}).then(()=>runtime.session.completeMfa({otp:'123456'}));return()=>runtime.session.dispose();},[]);
 return <main><h1>Teste isolado do componente step-up</h1><p>Usa exclusivamente respostas de teste.</p><Button disabled={snapshot.status!=='authenticated'} onClick={()=>setOpen(true)}>Preparar operação de teste</Button><p role="status">{result}</p><StepUpDialog runtime={runtime} intent={open?authAdminIntent('user.revoke','b'.repeat(24),{version:3,reasonCode:'security_review'}):null} label="Revogar acessos da conta fictícia selecionada" onClose={()=>setOpen(false)} onSuccess={()=>setResult('Resposta de teste recebida')} onFailure={()=>setResult('Operação não confirmada')}/></main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
