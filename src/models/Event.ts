import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  tags?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    maxParticipants: {
      type: Number,
      min: [1, 'Max participants must be at least 1'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ tags: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;