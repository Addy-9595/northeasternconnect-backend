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
  uploadPostImages,
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getPostsByUser);

// Protected routes
router.post('/upload-images', authenticate, uploadMultiple.array('images', 10), uploadPostImages);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comment', authenticate, addComment);
router.delete('/:id/comment/:commentId', authenticate, deleteComment);

export default router;
