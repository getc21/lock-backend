import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  description?: string;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Location = mongoose.model<ILocation>('Location', locationSchema);
