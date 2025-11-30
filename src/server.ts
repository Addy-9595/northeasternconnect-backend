import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import eventRoutes from './routes/eventRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/content', express.static(path.join(__dirname, '../uploads/content')));
// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nexusnu.netlify.app',
    process.env.CLIENT_URL || 'http://localhost:5173'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🚀 Welcome to NexusNU API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      events: '/api/events',
    }
  });
});

// API route handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  console.log('404 for:', req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

export default app;