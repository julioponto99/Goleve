import express, { Router } from 'express';
import { Connection, Schema } from 'mongoose';
import { ApiError } from '../config/errors';
import { ProfessionalModels } from '../models';
import { ServiceKeys, verifyServiceRequest } from './agenda-service-auth';
export function createAgendaInternalRoutes(connection: Connection, models: ProfessionalModels, keys: ServiceKeys) {
  const replaySchema = new Schema({ _id: { type: String, required: true }, expiresAt: { type: Date, required: true }, createdAt: { type: Date, required: true } },
    { strict: 'throw', versionKey: false, bufferCommands: false, collection: 'professional_agenda_service_nonces' });
  const Replay = connection.models.AgendaServiceNonce || connection.model('AgendaServiceNonce', replaySchema);
  const router = Router();
  router.post('/eligibility', express.json({ limit: '1kb' }), async (req, res, next) => {
    res.set('Cache-Control','no-store');
    try {
      let credential: { nonce: string; expiresAt: Date };
      try { credential = verifyServiceRequest(req.get('authorization'), req.body, keys); }
      catch { throw new ApiError(401,'SERVICE_AUTHENTICATION_REQUIRED','Dedicated Agenda service authentication required'); }
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k=>!['capabilityId','professionalId','subjectAuthUserId','relationshipId'].includes(k))
        || typeof body.capabilityId !== 'string' || !/^[a-f0-9]{24}$/.test(body.capabilityId)
        || ['professionalId','subjectAuthUserId','relationshipId'].some(k=>body[k] !== undefined && (typeof body[k] !== 'string' || !/^[a-f0-9]{24}$/.test(body[k])))
        || (body.relationshipId && !body.subjectAuthUserId)) throw new ApiError(400,'VALIDATION_ERROR','Invalid eligibility request');
      try { await Replay.create({ _id: credential.nonce, expiresAt: credential.expiresAt, createdAt: new Date() }); }
      catch (error) { if ((error as {code?: number}).code === 11000) throw new ApiError(401,'SERVICE_REPLAY_REJECTED','Service credential already used'); throw error; }
      const capability = await models.Capability.findOne({ _id: body.capabilityId, ...(body.professionalId ? {professionalId:body.professionalId} : {}) });
      if (!capability) throw new ApiError(404,'NOT_FOUND','Professional capability not found');
      const profile = await models.Profile.findOne({ _id: capability.professionalId, authUserId: capability.authUserId });
      if (!profile) throw new ApiError(404,'NOT_FOUND','Professional capability not found');
      let relationshipAccepted = false;
      if (body.relationshipId) relationshipAccepted = !!await models.Relationship.exists({ _id:body.relationshipId, subjectAuthUserId:body.subjectAuthUserId,
        professionalAuthUserId:profile.authUserId, professionalId:profile._id, capabilityId:capability._id, status:'accepted', relationshipKind:capability.kind === 'personal_trainer'?'personal_training':'nutrition' });
      const now = new Date();
      // Current Professional models support declarations/simulated review only. No real validity/role authority exists yet.
      // This read-only contract deliberately never promotes those declarations, catalog entries or demo fixtures.
      res.json({ data: { capabilityId:String(capability._id), professionalId:String(profile._id), professionalAuthUserId:profile.authUserId,
        relationshipKind:capability.kind === 'personal_trainer'?'personal_training':'nutrition', eligible:false, canOfferAppointment:false,
        authority:'unavailable', checkedAtUtc:now.toISOString(), validUntilUtc:new Date(now.getTime()+10000).toISOString(), serviceModes:capability.serviceModes, relationshipAccepted } });
    } catch(error) { next(error); }
  });
  return router;
}
