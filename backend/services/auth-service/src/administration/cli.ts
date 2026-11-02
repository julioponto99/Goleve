import { readFileSync } from 'node:fs';
import { connectDatabase } from '../config/database';
import { AuthUser } from '../models/auth-user.model';
import { SecurityService } from './security.service';
import { initializeSecurityModels } from './models';
// Intentionally no dotenv import: an installation operator supplies explicit runtime configuration.
async function main(){
 const operation=process.argv[2];if(!['bootstrap','quorum-invite'].includes(operation)||process.argv.length!==3)throw Error('Explicit bootstrap or quorum-invite operation required');
 if(process.env.AUTH_BOOTSTRAP_ENABLED!=='true')throw Error('Installation provisioning is disabled');
 const file=process.env.AUTH_INSTALLATION_CREDENTIAL_FILE;if(!file)throw Error('Protected installation credential file required');const raw=readFileSync(file,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(raw))throw Error('Invalid installation credential');
 const buffer=readFileSync(0);if(buffer.length>16384)throw Error('Installation input too large');const input=JSON.parse(buffer.toString('utf8'));
 await connectDatabase();try{await AuthUser.init();await initializeSecurityModels();const service=new SecurityService(),secret=Buffer.from(raw,'hex');
 if(operation==='bootstrap'){const result=await service.bootstrap(input,secret);process.stdout.write(JSON.stringify(result)+'\n');}
 else {const {authorization,...parameters}=input;if(typeof authorization!=='string')throw Error('Authenticated first administrator required');const result=await service.inviteSecond(await service.context(authorization),parameters,secret);process.stdout.write(JSON.stringify(result)+'\n');}
 }finally{await AuthUser.db.close();}
}
if(require.main===module)void main().catch(()=>{console.error('Administrative installation operation refused; inspect protected audit and configuration');process.exitCode=1;});
