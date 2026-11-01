import { randomUUID } from 'node:crypto';
import { ProfessionalModels } from '../models';
import { ApiError } from '../config/errors';
export async function acquireDraftLock(models: ProfessionalModels, owner: string): Promise<string> {
  const token = randomUUID();
  for (let attempt = 0; attempt < 40; attempt++) {
    const doc = await models.Profile.findOneAndUpdate({ authUserId: owner, profileStatus: 'draft', draftWriteToken: { $exists: false } },
      { $set: { draftWriteToken: token } }, { timestamps: false, returnDocument: 'after' });
    if (doc) return token;
    const current = await models.Profile.findOne({ authUserId: owner }).select('profileStatus');
    if (!current) throw new ApiError(404, 'PROFILE_REQUIRED', 'Create your professional draft profile first');
    if (current.profileStatus !== 'draft') throw new ApiError(403, 'APPLICATION_NOT_EDITABLE', 'This profile cannot be edited');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new ApiError(409, 'APPLICATION_BUSY', 'Application is being changed; retry later');
}
export async function releaseDraftLock(models: ProfessionalModels, owner: string, token: string, invalidateProfile: boolean): Promise<void> {
  // Never expire/reassign an in-flight lock automatically: a crashed writer requires controlled recovery.
  const result = await models.Profile.updateOne({ authUserId: owner, draftWriteToken: token },
    { $unset: { draftWriteToken: '' }, ...(invalidateProfile ? { $inc: { version: 1 } } : {}) }, { timestamps: false });
  if (result.matchedCount !== 1) throw new ApiError(503, 'APPLICATION_LOCK_UNAVAILABLE', 'Application changes require recovery');
}
