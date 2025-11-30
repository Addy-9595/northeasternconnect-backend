import { Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';

// Get all posts
export const getAllPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email profilePicture role')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error: any) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get post by ID
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'name email profilePicture role')
      .populate('comments.user', 'name profilePicture');

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.status(200).json({ post });
  } catch (error: any) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new post
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { title, content, tags } = req.body;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required' });
      return;
    }

    const baseURL = process.env.NODE_ENV === 'production' 
      ? (process.env.BASE_URL || 'https://northeasternconnect-backend.onrender.com')
      : 'http://localhost:5000';

     const files = req.files as Express.Multer.File[];
    const images = files?.map(file => `${baseURL}/uploads/content/${file.filename}`) || [];
    const imageUrl = images[0] || '';

    const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;

    const post = await Post.create({
      title,
      content,
      author: req.user.userId,
      tags: tagsArray,
      imageUrl,
      images,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email profilePicture role');

    res.status(201).json({ message: 'Post created successfully', post: populatedPost });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Update post
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { title, content, tags } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (post.author.toString() !== req.user.userId) {
      res.status(403).json({ message: 'You can only update your own posts' });
      return;
    }

    const baseURL = process.env.NODE_ENV === 'production' 
      ? (process.env.BASE_URL || 'https://northeasternconnect-backend.onrender.com')
      : 'http://localhost:5000';

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const newImages = files.map(file => `${baseURL}/uploads/content/${file.filename}`);
      post.images = newImages;
      post.imageUrl = newImages[0];
    }

    post.title = title || post.title;
    post.content = content || post.content;
    
    if (tags) {
      post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('author', 'name email profilePicture role');

    res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error: any) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Delete post
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if user is the author or admin
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      res.status(403).json({ message: 'You can only delete your own posts' });
      return;
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like/Unlike post
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const userIndex = post.likes.findIndex(
      (userId) => userId.toString() === req.user!.userId
    );

    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.userId as any);
    }

    await post.save();

    res.status(200).json({ 
      message: userIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes.length 
    });
  } catch (error: any) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add comment to post
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { text, parentCommentId } = req.body;

    if (!text) {
      res.status(400).json({ message: 'Comment text is required' });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    post.comments.push({
      user: req.user.userId as any,
      text,
      parentCommentId: parentCommentId || undefined,
      createdAt: new Date(),
    });

    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('author', 'name email profilePicture role')
      .populate('comments.user', 'name profilePicture');

    res.status(201).json({ message: 'Comment added successfully', post: updatedPost });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get posts by user

export const uploadPostImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    const imageUrls = req.files.map(file => `/uploads/content/${file.filename}`);
    
    res.status(200).json({ 
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error: any) {
    console.error('Upload post images error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get posts by user
export const getPostsByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate('author', 'name email profilePicture role')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error: any) {
    console.error('Get posts by user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete comment from post
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id, commentId } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const comment = post.comments.find((c: any) => c._id?.toString() === commentId);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Allow: comment author, post author, or admin
    const isCommentAuthor = comment.user.toString() === req.user.userId;
    const isPostAuthor = post.author.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }

    post.comments = post.comments.filter((c: any) => c._id?.toString() !== commentId);
    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('author', 'name email profilePicture role')
      .populate('comments.user', 'name profilePicture');

    res.status(200).json({ message: 'Comment deleted successfully', post: updatedPost });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};