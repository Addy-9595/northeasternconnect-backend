import express from 'express';
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

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getPostsByUser);

// Protected routes
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comment', authenticate, addComment);

export default router;