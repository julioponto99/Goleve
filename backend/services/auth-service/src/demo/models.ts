import { Schema, model } from 'mongoose';
export const DemoPreparation = model('DemoPreparation', new Schema({
  instanceId: { type: String, required: true, unique: true, immutable: true },
  source: { type: String, required: true, enum: ['explicit_local_cli'], immutable: true },
  fixtureCount: { type: Number, required: true, enum: [4] },
  identityIds: { type: [String], required: true, immutable: true, validate: (ids: string[]) => ids.length === 4 && new Set(ids).size === 4 && ids.every((id) => /^[a-f0-9]{24}$/.test(id)) },
  preparedAt: { type: Date, required: true, immutable: true }, expiresAt: { type: Date, required: true, immutable: true },
}, { collection: 'demo_preparations', strict: 'throw', versionKey: false, bufferCommands: false }));
// Deliberately no TTL: stopping the isolated MongoDB discards tmpfs, never project volumes.
