import { Schema } from 'mongoose';
import { OwnedData, ownedFields, schemaOptions } from './common';

export interface ProfileData extends OwnedData {
  displayName: string;
  birthDate?: string;
  gender?: string;
  genderDescription?: string;
  contactEmail?: string;
  phoneE164?: string;
  countryCode?: string;
  approximateLocation?: { regionCode?: string; cityLabel?: string };
  profileStatus: string;
  onboardingVersion: number;
}

const locationSchema = new Schema({
  regionCode: { type: String, maxlength: 20 },
  cityLabel: { type: String, maxlength: 100 },
}, { _id: false, strict: 'throw' });

export const profileSchema = new Schema<ProfileData>({
  ...ownedFields,
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  birthDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  gender: { type: String, enum: ['mulher', 'homem', 'nao_binario', 'autodescrito', 'prefiro_nao_indicar'] },
  genderDescription: { type: String, maxlength: 80 },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  phoneE164: { type: String, match: /^\+[1-9]\d{6,14}$/ },
  countryCode: { type: String, match: /^[A-Z]{2}$/ },
  approximateLocation: { type: locationSchema },
  profileStatus: { type: String, required: true, default: 'draft', enum: ['draft', 'active', 'restricted', 'deletion_pending'] },
  onboardingVersion: { type: Number, required: true, default: 1, enum: [1] },
}, { ...schemaOptions, collection: 'user_profiles' });
profileSchema.index({ authUserId: 1 }, { unique: true });
profileSchema.index({ profileStatus: 1, updatedAt: 1, _id: 1 });
