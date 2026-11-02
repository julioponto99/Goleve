import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Dialog, TextField } from '../../web/src/components/ui';
import '../../web/src/styles.css';
function Harness(){
 const [open,setOpen]=useState(false),[closed,setClosed]=useState(0),[value,setValue]=useState('');
 return <main><Button onClick={()=>setOpen(true)}>Abrir diálogo de teste</Button><output aria-label="Fechos">{closed}</output>
  <Dialog open={open} title="Componente isolado" onClose={()=>{setOpen(false);setClosed(count=>count+1);}}>
   <form onSubmit={event=>event.preventDefault()}><TextField id="sample" label="Campo de teste" value={value} onChange={event=>setValue(event.target.value)} error={value?'':'Campo obrigatório'}/><Button type="submit">Validar</Button></form>
  </Dialog>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
