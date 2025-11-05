import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  deviceInfo: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true
    },
    deviceInfo: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Índices
userSessionSchema.index({ sessionToken: 1 });
userSessionSchema.index({ userId: 1, isActive: 1 });

export const UserSession = mongoose.model<IUserSession>('UserSession', userSessionSchema);
