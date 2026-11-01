import mongoose,{Connection,ClientSession} from 'mongoose';
import { ApiError } from './errors';
export async function openDatabase(uri:string){if(!uri)throw new Error('MONGO_URI required');const connection=await mongoose.createConnection(uri,{serverSelectionTimeoutMS:5000}).asPromise();const hello=await connection.db!.admin().command({hello:1});if(!hello.setName){await connection.close();throw new Error('Management requires replica set for atomic mutations and audit');}return connection;}
export async function transaction<T>(connection:Connection,work:(session:ClientSession)=>Promise<T>):Promise<T>{
  for(let attempt=0;attempt<5;attempt++){
    const session=await connection.startSession();try{
      session.startTransaction({readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary',maxCommitTimeMS:5000});
      const result=await work(session);
      for(let commit=0;;commit++){try{await session.commitTransaction();break;}catch(e){const x=e as {hasErrorLabel?:(s:string)=>boolean};if(x.hasErrorLabel?.('UnknownTransactionCommitResult')){if(commit<2)continue;throw new ApiError(503,'COMMIT_OUTCOME_UNKNOWN','Read the resource before repeating the operation');}throw e;}}
      return result;
    }catch(e){if(session.inTransaction())await session.abortTransaction().catch(()=>undefined);const x=e as {hasErrorLabel?:(s:string)=>boolean;code?:number};if(attempt<4&&x.hasErrorLabel?.('TransientTransactionError'))continue;if(x.code===11000)throw new ApiError(409,'DUPLICATE_RESOURCE','Resource already exists');throw e;}finally{await session.endSession();}
  }throw new ApiError(409,'CONCURRENT_UPDATE','Concurrent operation; retry with current version');
}
