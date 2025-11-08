import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  followUser,
  unfollowUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Public routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Protected routes
router.put('/profile', authenticate, updateProfile);
router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/unfollow', authenticate, unfollowUser);

// Admin only routes
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteUser);

export default router;