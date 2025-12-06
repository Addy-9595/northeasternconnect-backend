import { Response } from 'express';
import JobComment from '../models/jobComment';
import { AuthRequest } from '../middleware/auth';

export const getCommentsByJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const comments = await JobComment.find({ jobId })
      .populate('user', 'name profilePicture role')
      .sort({ createdAt: -1 });
    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { text, rating } = req.body;
    
    if (!text?.trim()) {
      res.status(400).json({ message: 'Comment text required' });
      return;
    }

    const comment = await JobComment.create({
      jobId,
      user: req.user!.userId,
      text,
      rating,
    });

    const populated = await JobComment.findById(comment._id)
      .populate('user', 'name profilePicture role');

    res.status(201).json({ comment: populated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const comment = await JobComment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.user.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    await JobComment.findByIdAndDelete(commentId);
    res.json({ message: 'Comment deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};