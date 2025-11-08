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
} from '../controllers/eventController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/user/:userId', getEventsByUser);

// Protected routes
router.post('/', authenticate, createEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);
router.post('/:id/join', authenticate, joinEvent);
router.post('/:id/leave', authenticate, leaveEvent);

export default router;