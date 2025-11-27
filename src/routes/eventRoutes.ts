import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventsByUser,
  uploadEventImages,
} from '../controllers/eventController';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/user/:userId', getEventsByUser);
router.post('/upload-images', authenticate, uploadMultiple.array('images', 10), uploadEventImages);
router.post('/', authenticate, createEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);
router.post('/:id/join', authenticate, joinEvent);
router.post('/:id/leave', authenticate, leaveEvent);

export default router;