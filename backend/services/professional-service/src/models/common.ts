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
  dataMode: { type: String, required: true, default: 'synthetic', enum: ['synthetic'], immutable: true },
};
export const schemaOptions = { timestamps: true, versionKey: false as const, strict: 'throw' as const, bufferCommands: false };
