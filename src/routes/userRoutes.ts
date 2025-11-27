import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  uploadProfilePicture,
  followUser,
  unfollowUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { upload } from '../middleware/upload';

const router = express.Router();

// ⚠️ CRITICAL: Route Order Matters!
// Specific routes MUST come BEFORE parameterized routes (:id)

// Public route - list all users
router.get('/', getAllUsers);

// 🔴 PROTECTED ROUTES - MUST COME BEFORE /:id
router.put('/profile', authenticate, updateProfile);
router.post('/profile/upload', authenticate, upload.single('profilePicture'), uploadProfilePicture);

// 🔴 PARAMETERIZED ROUTES - MUST COME AFTER SPECIFIC ROUTES
router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/unfollow', authenticate, unfollowUser);

// Public route - get specific user (MUST BE LAST among GET routes)
router.get('/:id', getUserById);

// Admin only routes
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteUser);

export default router;