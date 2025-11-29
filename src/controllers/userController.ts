import { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Get all users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate('followers', 'name email profilePicture')
      .populate('following', 'name email profilePicture');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get user's posts
    const posts = await Post.find({ author: id })
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's events
    const events = await Event.find({ organizer: id })
      .sort({ date: 1 })
      .limit(10);

    res.status(200).json({ user, posts, events });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, bio, major, department, profilePicture, skills } = req.body;

    // Prepare update object
    const updateData: any = { name, bio, major, department };
    
    // Only update profilePicture if provided
    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }

    // Handle skills - parse if it's a string (from form data)
    if (skills !== undefined) {
      if (typeof skills === 'string') {
        try {
          updateData.skills = JSON.parse(skills);
        } catch {
          updateData.skills = skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(skills)) {
        updateData.skills = skills;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (user && user.profilePicture && !user.profilePicture.startsWith('http')) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const outputFilename = `profile-${req.user.userId}-${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, '../../uploads/profiles', outputFilename);

    await sharp(req.file.path)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    fs.unlinkSync(req.file.path);

    const baseURL = process.env.NODE_ENV === 'production' 
      ? (process.env.BASE_URL || 'https://northeasternconnect-backend.onrender.com')
      : 'http://localhost:5000';
    
    const profilePictureUrl = `${baseURL}/uploads/profiles/${outputFilename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');


    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ 
      message: 'Profile picture uploaded successfully',
      user: updatedUser,
      profilePicture: profilePictureUrl
    });
  } catch (error: any) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Follow a user
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const currentUserId = req.user.userId;

    if (id === currentUserId) {
      res.status(400).json({ message: 'You cannot follow yourself' });
      return;
    }

    // Add to following list
    const currentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: id } },
      { new: true }
    );

    // Add to followers list
    const targetUser = await User.findByIdAndUpdate(
      id,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    );

    if (!currentUser || !targetUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User followed successfully' });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Remove from following list
    const currentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: id } },
      { new: true }
    );

    // Remove from followers list
    const targetUser = await User.findByIdAndUpdate(
      id,
      { $pull: { followers: currentUserId } },
      { new: true }
    );

    if (!currentUser || !targetUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Optional: Delete user's profile picture
    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      const imagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};