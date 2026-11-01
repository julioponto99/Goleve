import { Schema } from 'mongoose';
import { OwnedData, ownedFields, schemaOptions } from './common';
export interface ProfileData extends OwnedData {
  professionalName: string; biography?: string; privateContactEmail?: string;
  publicContacts?: { email?: string; phoneE164?: string };
  countryCode: string; languages: string[]; profileStatus: string;
  directoryVisibility: string; publicationVersion: number;
}
const contacts = new Schema({ email: { type: String, maxlength: 254 }, phoneE164: { type: String, match: /^\+[1-9]\d{6,14}$/ } },
  { _id: false, strict: 'throw' });
export const profileSchema = new Schema<ProfileData>({
  ...ownedFields,
  professionalName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  biography: { type: String, maxlength: 2000 }, privateContactEmail: { type: String, maxlength: 254 },
  publicContacts: { type: contacts, default: undefined },
  countryCode: { type: String, required: true, match: /^[A-Z]{2}$/ },
  languages: { type: [String], required: true, validate: (v: string[]) => v.length >= 1 && v.length <= 10 },
  profileStatus: { type: String, required: true, default: 'draft', enum: ['draft', 'submitted', 'active', 'suspended', 'archived'] },
  directoryVisibility: { type: String, required: true, default: 'hidden', enum: ['hidden', 'public'] },
  publicationVersion: { type: Number, required: true, default: 0, min: 0, validate: Number.isSafeInteger },
}, { ...schemaOptions, collection: 'professional_profiles' });
profileSchema.index({ authUserId: 1 }, { unique: true });
