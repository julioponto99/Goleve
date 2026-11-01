import { Schema } from 'mongoose';

export interface WaterIntakeData {
  ownerId: string;
  amountMl: number;
  consumedAt: Date;
  timezone: string;
  localDate: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export const intakeSchema = new Schema<WaterIntakeData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  amountMl: { type: Number, required: true, min: 1, max: 10000 },
  consumedAt: { type: Date, required: true },
  timezone: { type: String, required: true, maxlength: 64 },
  localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  idempotencyKey: { type: String, required: true, trim: true, minlength: 8, maxlength: 128 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'hydration_intakes' });
intakeSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true });
intakeSchema.index({ ownerId: 1, localDate: 1, consumedAt: 1, _id: 1 });
