import { Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { AuthRequest } from '../middleware/auth';

const messageCache = new Map<string, number>();

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    console.log('📋 GET CONVERSATIONS REQUEST:', { userId: req.user.userId });

    const conversations = await Conversation.find({
      participants: req.user.userId,
    })
      .populate('participants', 'name email profilePicture role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations
      .map((conv) => {
        const otherUser = conv.participants.find(
          (p: any) => p._id.toString() !== req.user!.userId
        );
        const unreadEntry = conv.unreadCount.find(
          (u) => u.userId.toString() === req.user!.userId
        );

        console.log('🔍 FORMATTING CONV:', { convId: conv._id, participantsCount: conv.participants.length, otherUser: otherUser?._id });

        if (!otherUser) {
          console.error('❌ NO OTHER USER FOUND:', { convId: conv._id, participants: conv.participants });
          return null;
        }

        return {
          _id: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: unreadEntry?.count || 0,
          updatedAt: conv.updatedAt,
        };
      })
      .filter((conv) => conv !== null);

console.log('✅ CONVERSATIONS FOUND:', { count: formattedConversations.length });
    res.status(200).json({ conversations: formattedConversations });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p) => p.toString() === req.user!.userId)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const messages = await Message.find({
      $or: [
        { sender: conversation.participants[0], recipient: conversation.participants[1] },
        { sender: conversation.participants[1], recipient: conversation.participants[0] },
      ],
    })
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: conversation.participants[0], recipient: conversation.participants[1] },
        { sender: conversation.participants[1], recipient: conversation.participants[0] },
      ],
    });

    res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { recipientId, content } = req.body;

    console.log('💬 SEND MESSAGE REQUEST:', { senderId: req.user.userId, recipientId, content: content.substring(0, 50) });

    if (!recipientId || !content) {
      res.status(400).json({ message: 'Recipient and content required' });
      return;
    }

    const cacheKey = `${req.user.userId}_${Date.now()}`;
    const lastMessageTime = messageCache.get(req.user.userId) || 0;
    const hourAgo = Date.now() - 3600000;

    if (lastMessageTime > hourAgo) {
      const recentCount = Array.from(messageCache.entries()).filter(
        ([key, time]) => key.startsWith(req.user!.userId) && time > hourAgo
      ).length;

      if (recentCount >= 50) {
        res.status(429).json({ message: 'Rate limit exceeded. Max 50 messages per hour.' });
        return;
      }
    }

    messageCache.set(cacheKey, Date.now());

    const message = await Message.create({
      sender: req.user.userId,
      recipient: recipientId,
      content,
    });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, recipientId] },
    });

    console.log('🔍 CONVERSATION FIND:', { found: !!conversation, conversationId: conversation?._id });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.userId, recipientId],
        lastMessage: message._id,
        unreadCount: [
          { userId: req.user.userId, count: 0 },
          { userId: recipientId, count: 1 },
        ],
      });
      console.log('✅ CONVERSATION CREATED:', { conversationId: conversation._id, participants: conversation.participants });
    } else {
      conversation.lastMessage = message._id as any;
      conversation.updatedAt = new Date();

      const recipientUnread = conversation.unreadCount.find(
        (u) => u.userId.toString() === recipientId
      );
      if (recipientUnread) {
        recipientUnread.count += 1;
      } else {
        conversation.unreadCount.push({ userId: recipientId as any, count: 1 });
      }

      await conversation.save();
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture');

    res.status(201).json({ message: 'Message sent', data: populatedMessage });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.recipient.toString() !== req.user.userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    message.read = true;
    await message.save();

    const conversation = await Conversation.findOne({
      participants: { $all: [message.sender, message.recipient] },
    });

    if (conversation) {
      const userUnread = conversation.unreadCount.find(
        (u) => u.userId.toString() === req.user!.userId
      );
      if (userUnread && userUnread.count > 0) {
        userUnread.count -= 1;
        await conversation.save();
      }
    }

    res.status(200).json({ message: 'Marked as read' });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.sender.toString() !== req.user.userId && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only sender can delete message' });
      return;
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Message deleted' });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};