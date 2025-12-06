import mongoose, { Document, Schema } from 'mongoose';

export interface IJobComment extends Document {
  jobId: string;
  user: mongoose.Types.ObjectId;
  text: string;
  rating?: number;
  createdAt: Date;
}

const jobCommentSchema = new Schema<IJobComment>(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IJobComment>('JobComment', jobCommentSchema);