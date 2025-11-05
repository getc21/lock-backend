import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  stores: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      default: 'cashier'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date
    },
    stores: [{
      type: Schema.Types.ObjectId,
      ref: 'Store'
    }]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
