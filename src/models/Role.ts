import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Role = mongoose.model<IRole>('Role', roleSchema);
