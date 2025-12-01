import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/conversations', authenticate, getConversations);
router.get('/:conversationId', authenticate, getMessages);
router.post('/send', authenticate, sendMessage);
router.put('/:messageId/read', authenticate, markAsRead);
router.delete('/:messageId', authenticate, deleteMessage);

export default router;