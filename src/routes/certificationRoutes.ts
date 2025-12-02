import express from 'express';
import { fetchCertification } from '../services/certificationService';

const router = express.Router();

router.get('/fetch', async (req, res) => {
  const { platform, id } = req.query;
  
  if (!platform || !id || typeof platform !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ message: 'Platform and ID required' });
  }

  try {
    const cert = await fetchCertification(platform, id);
    res.json(cert);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Fetch failed' });
  }
});

export default router;