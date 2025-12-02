import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });

interface Certification {
  platform: string;
  certificate_name: string;
  issuer: string;
  completion_date: string;
  credential_id: string;
  credential_url: string;
  verified: boolean;
  notes?: string;
}

async function fetchCoursera(id: string): Promise<Certification> {
  const cacheKey = `coursera_${id}`;
  const cached = cache.get<Certification>(cacheKey);
  if (cached) return cached;

  try {
    const url = id.startsWith('http') ? id : `https://www.coursera.org/account/accomplishments/verify/${id}`;
    const res = await axios.get(url, { timeout: 5000 });
    
    const cert: Certification = {
      platform: 'coursera',
      certificate_name: 'Certificate',
      issuer: 'Coursera',
      completion_date: new Date().toISOString().split('T')[0],
      credential_id: id,
      credential_url: url,
      verified: res.status === 200,
      notes: res.status === 200 ? undefined : 'Visit URL to verify'
    };

    cache.set(cacheKey, cert);
    return cert;
  } catch {
    return {
      platform: 'coursera',
      certificate_name: 'Certificate',
      issuer: 'Coursera',
      completion_date: '',
      credential_id: id,
      credential_url: `https://www.coursera.org/account/accomplishments/verify/${id}`,
      verified: false,
      notes: 'Visit URL to manually verify'
    };
  }
}

async function fetchMicrosoft(id: string): Promise<Certification> {
  const url = id.startsWith('http') ? id : `https://learn.microsoft.com/api/credentials/${id}`;
  
  try {
    const res = await axios.get(url, { timeout: 5000 });
    
    return {
      platform: 'microsoft',
      certificate_name: res.data.title || 'Microsoft Certificate',
      issuer: 'Microsoft',
      completion_date: res.data.completionDate || '',
      credential_id: id,
      credential_url: url,
      verified: true
    };
  } catch {
    return {
      platform: 'microsoft',
      certificate_name: 'Microsoft Certificate',
      issuer: 'Microsoft',
      completion_date: '',
      credential_id: id,
      credential_url: url,
      verified: false,
      notes: 'Verify at learn.microsoft.com'
    };
  }
}

async function fetchAWS(id: string): Promise<Certification> {
  const url = id.startsWith('http') ? id : `https://aws.amazon.com/verification`;
  
  return {
    platform: 'aws',
    certificate_name: 'AWS Certificate',
    issuer: 'Amazon Web Services',
    completion_date: '',
    credential_id: id,
    credential_url: url,
    verified: false,
    notes: 'Verify at aws.amazon.com/verification'
  };
}

async function fetchUdemy(id: string): Promise<Certification> {
  return {
    platform: 'udemy',
    certificate_name: 'Udemy Certificate',
    issuer: 'Udemy',
    completion_date: '',
    credential_id: id,
    credential_url: id.startsWith('http') ? id : '',
    verified: false,
    notes: 'No public API. Upload certificate manually'
  };
}

async function fetchLinkedInLearning(id: string): Promise<Certification> {
  return {
    platform: 'linkedin-learning',
    certificate_name: 'LinkedIn Learning Certificate',
    issuer: 'LinkedIn Learning',
    completion_date: '',
    credential_id: id,
    credential_url: id.startsWith('http') ? id : '',
    verified: false,
    notes: 'Share certificate URL from LinkedIn profile'
  };
}

export async function fetchCertification(platform: string, id: string): Promise<Certification> {
  const sanitized = id.trim().slice(0, 500);
  
  switch (platform.toLowerCase()) {
    case 'coursera':
      return fetchCoursera(sanitized);
    case 'microsoft':
      return fetchMicrosoft(sanitized);
    case 'aws':
      return fetchAWS(sanitized);
    case 'udemy':
      return fetchUdemy(sanitized);
    case 'linkedin-learning':
      return fetchLinkedInLearning(sanitized);
    default:
      throw new Error('Invalid platform');
  }
}