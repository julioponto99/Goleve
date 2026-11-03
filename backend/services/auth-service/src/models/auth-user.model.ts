import { HydratedDocument, model, Schema } from 'mongoose';

export const USER_TYPES = ['utilizador', 'profissional', 'gestor', 'administrador'] as const;
export type UserType = typeof USER_TYPES[number];

export interface AuthUserData {
  accountStatus?: 'active'|'suspended';
  securityVersion?: number;
  roleVersion?: number;
  adminVersion?: number;
  mfaEnabled?: boolean;
  name: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
  localDemoInstanceId?: string;
  demoInstanceId?: string;
}

const schema = new Schema<AuthUserData>({
  accountStatus:{type:String,enum:['active','suspended'],default:'active'},
  securityVersion:{type:Number,default:0,min:0},roleVersion:{type:Number,default:0,min:0},adminVersion:{type:Number,default:1,min:1},mfaEnabled:{type:Boolean,default:false},
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
  passwordHash: { type: String, required: true, select: false },
  userType: { type: String, required: true, enum: USER_TYPES, default: 'utilizador' },
  localDemoInstanceId: { type: String, match: /^[a-f0-9]{16}$/, select: false, immutable: true },
  demoInstanceId: { type: String, match: /^[a-f0-9]{16}$/, select: false, immutable: true },
}, {
  timestamps: true,
  collection: 'auth_users',
  bufferCommands: false,
  toJSON: {
    transform: (_document, result) => {
      delete (result as Partial<AuthUserData>).passwordHash;
      delete (result as Partial<AuthUserData>).demoInstanceId;
      return result;
    },
  },
});

export const AuthUser = model<AuthUserData>('AuthUser', schema);

export function publicUser(user: HydratedDocument<AuthUserData>) {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    userType: user.userType,
    accountStatus:user.accountStatus||'active',roleVersion:user.roleVersion||0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
