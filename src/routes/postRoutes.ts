import express from 'express';
import { deleteComment } from '../controllers/postController';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getPostsByUser,
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getPostsByUser);

// Protected routes
router.post('/', authenticate, upload.array('images', 5), createPost);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, upload.array('images', 5), updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comment', authenticate, addComment);
router.delete('/:id/comment/:commentId', authenticate, deleteComment);

export default router;
