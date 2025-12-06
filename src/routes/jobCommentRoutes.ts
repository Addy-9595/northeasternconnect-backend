import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCommentsByJob,
  addComment,
  deleteComment,
} from '../controllers/jobCommentController';

const router = express.Router();

router.get('/:jobId', getCommentsByJob);
router.post('/:jobId', authenticate, addComment);
router.delete('/:commentId', authenticate, deleteComment);

export default router;