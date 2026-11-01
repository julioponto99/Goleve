import { Schema } from 'mongoose';
import { EncryptionEnvelope } from '../config/encryption';

export interface OwnedData {
  authUserId: string;
  schemaVersion: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ownedFields = {
  authUserId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  schemaVersion: { type: Number, required: true, default: 1, enum: [1] },
  version: { type: Number, required: true, default: 1, min: 1, validate: Number.isSafeInteger },
};

export const schemaOptions = { timestamps: true, versionKey: false as const, strict: 'throw' as const, bufferCommands: false };

export const envelopeSchema = new Schema<EncryptionEnvelope>({
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  authenticationTag: { type: String, required: true },
  keyId: { type: String, required: true, enum: ['user-local-v1'] },
  algorithmVersion: { type: String, required: true, enum: ['aes-256-gcm-v1'] },
}, { _id: false, strict: 'throw' });
