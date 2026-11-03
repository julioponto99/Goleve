import { localDemo } from './local-demo';
import 'dotenv/config';
localDemo.policy();
import { createApp } from './app';
import { openDatabase } from './config/database';
import { createManagementModels,initializeManagementModels } from './models';
import { loadContract,ContractClient } from './management-contract';
import { ManagementService } from './services/management.service';
import { OwnerClient } from './services/owner-client.service';
void(async()=>{
  const config=loadContract('management');if(!config)throw new Error('Permanent Management service contracts must be configured');
  const connection=await openDatabase(process.env.MONGO_URI||'');
  try{const models=createManagementModels(connection);await initializeManagementModels(models);const service=new ManagementService(connection,models,new OwnerClient(new ContractClient(config)));
  const server=createApp({service,config,authOrigin:config.origins.auth!}).listen(Number(process.env.PORT||3008),()=>console.log('management-service running'));
  const close=()=>server.close(()=>{void connection.close();});process.once('SIGTERM',close);process.once('SIGINT',close);
  }catch(e){await connection.close();throw e;}
})().catch(()=>{console.error('management-service startup unavailable; check required persistent runtime and service identities');process.exitCode=1;});
