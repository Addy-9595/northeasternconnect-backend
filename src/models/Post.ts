import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  parentCommentId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}
const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [commentSchema],
    tags: [{
      type: String,
      trim: true,
    }],
    imageUrl: {
      type: String,
      default: '',
    },
    images: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

const Post = mongoose.model<IPost>('Post', postSchema);

export default Post;