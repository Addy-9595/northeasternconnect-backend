import mongoose, { Document, Schema } from 'mongoose';

interface UnreadCount {
  userId: mongoose.Types.ObjectId;
  count: number;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  unreadCount: UnreadCount[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCount: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);