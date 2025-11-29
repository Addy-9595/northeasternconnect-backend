import { Response } from 'express';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';

// Get all events
export const getAllEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email profilePicture role')
      .populate('participants', 'name email profilePicture')
      .sort({ date: 1 });

    res.status(200).json({ events });
  } catch (error: any) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get event by ID
export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizer', 'name email profilePicture role department')
      .populate('participants', 'name email profilePicture major');

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({ event });
  } catch (error: any) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new event
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { title, description, date, location, maxParticipants, tags, imageUrl, images } = req.body;

    if (!title || !description || !date || !location) {
      res.status(400).json({ message: 'Title, description, date, and location are required' });
      return;
    }

    const baseURL = process.env.NODE_ENV === 'production' 
      ? (process.env.BASE_URL || 'https://northeasternconnect-backend.onrender.com')
      : 'http://localhost:5000';
    
    const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : (imageUrl ? `${baseURL}${imageUrl}` : '');

    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizer: req.user.userId,
      maxParticipants,
      tags,
      imageUrl: fullImageUrl,
    });


    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email profilePicture role');

    res.status(201).json({ message: 'Event created successfully', event: populatedEvent });
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update event
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { title, description, date, location, maxParticipants, tags, imageUrl, images } = req.body;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.userId) {
      res.status(403).json({ message: 'You can only update your own events' });
      return;
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.maxParticipants = maxParticipants || event.maxParticipants;
    event.tags = tags || event.tags;
    event.imageUrl = imageUrl || event.imageUrl;
    if (images !== undefined) event.images = images;

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('organizer', 'name email profilePicture role');

    res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user.userId && req.user.role !== 'admin') {
      res.status(403).json({ message: 'You can only delete your own events' });
      return;
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join event
export const joinEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Check if already joined
    if (event.participants.includes(req.user.userId as any)) {
      res.status(400).json({ message: 'You have already joined this event' });
      return;
    }

    // Check max participants
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      res.status(400).json({ message: 'Event is full' });
      return;
    }

    event.participants.push(req.user.userId as any);
    await event.save();

    res.status(200).json({ message: 'Successfully joined event', participants: event.participants.length });
  } catch (error: any) {
    console.error('Join event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Leave event
export const leaveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const participantIndex = event.participants.findIndex(
      (userId) => userId.toString() === req.user!.userId
    );

    if (participantIndex === -1) {
      res.status(400).json({ message: 'You are not a participant of this event' });
      return;
    }

    event.participants.splice(participantIndex, 1);
    await event.save();

    res.status(200).json({ message: 'Successfully left event' });
  } catch (error: any) {
    console.error('Leave event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadEventImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    const imageUrls = req.files.map(file => `/uploads/content/${file.filename}`);
    
    res.status(200).json({ 
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error: any) {
    console.error('Upload event images error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get events by user
export const getEventsByUser = async (req: AuthRequest, res: Response): Promise<void> => {

  try {
    const { userId } = req.params;

    const events = await Event.find({ organizer: userId })
      .populate('organizer', 'name email profilePicture role')
      .sort({ date: 1 });

    res.status(200).json({ events });
  } catch (error: any) {
    console.error('Get events by user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};