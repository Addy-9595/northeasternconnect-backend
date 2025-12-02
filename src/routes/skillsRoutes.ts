import express from 'express';
import { searchSkills } from '../services/skillService';

const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q as string;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query required' });
  }

  const sanitized = query.trim().slice(0, 100);
  const results = await searchSkills(sanitized);
  
  res.json({ skills: results });
});

export default router;