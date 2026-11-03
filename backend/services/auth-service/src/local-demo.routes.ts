import { Router } from 'express';
import { Schema } from 'mongoose';
import { localDemo } from './local-demo';
import { AuthUser } from './models/auth-user.model';
import { ApiError } from './config/errors';
export function localIdentityRoutes() {
  const router=Router();
  const Replay=AuthUser.db.models.LocalDemoIdentityNonce||AuthUser.db.model('LocalDemoIdentityNonce',new Schema({_id:String,expiresAt:{type:Date,index:{expireAfterSeconds:0}}},{versionKey:false,strict:'throw',collection:'auth_local_demo_identity_nonces'}));
  router.post('/identity',async(req,res,next)=>{try{
    const p=localDemo.policy();if(!p)throw new ApiError(404,'NOT_FOUND','Contract disabled');
    if(!req.body||Object.keys(req.body).length!==1||typeof req.body.id!=='string'||!/^[a-f0-9]{24}$/.test(req.body.id))throw new ApiError(400,'VALIDATION_ERROR','Identity required');
    let nonce:string;try{nonce=localDemo.verifyIdentityAssertion(req.get('authorization'),req.body);}catch{throw new ApiError(401,'SERVICE_AUTHENTICATION_REQUIRED','Dedicated identity authentication required');}
    try{await Replay.create({_id:nonce,expiresAt:new Date(Date.now()+60000)});}catch{throw new ApiError(401,'SERVICE_REPLAY_REJECTED','Assertion already used');}
    const u=await AuthUser.findOne({_id:req.body.id,accountStatus:'active'}).select('+localDemoInstanceId');
    if(!u||!localDemo.account(u))throw new ApiError(404,'NOT_FOUND','Fixture identity unavailable');
    const data={id:String(u._id),userType:u.userType,authority:'local-demo',instance:p.instance,expiresAt:new Date(Date.now()+10000).toISOString()};
    res.set('Cache-Control','no-store').set('x-local-demo-proof',localDemo.identityProof(data,req.get('authorization')!)).json(data);
  }catch(e){next(e);}});
  return router;
}
