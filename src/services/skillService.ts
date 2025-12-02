import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });

interface Skill {
  id: string;
  name: string;
}

const TECH_SKILLS = [
  'React', 'ReactJS', 'React.js', 'Angular', 'Vue', 'Vue.js', 'JavaScript', 'TypeScript',
  'Python', 'Java','C', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby',
  'Node.js', 'Express.js', 'Next.js', 'Nest.js', 'Django', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'DevOps',
  'Git', 'GitHub', 'GitLab', 'REST API', 'GraphQL', 'Microservices', 'OAuth', 'JWT',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'Webpack', 'Vite',
  'Redux', 'MobX', 'Zustand', 'Jest', 'Cypress', 'Selenium', 'Playwright',
  'SQL', 'NoSQL', 'Firebase', 'Supabase', 'Linux', 'Bash', 'PowerShell',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
  'Data Science', 'Data Analysis', 'Big Data', 'Tableau', 'Power BI'
];

async function fetchESCOSkills(query: string): Promise<Skill[]> {
  const cacheKey = `esco_${query}`;
  const cached = cache.get<Skill[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `https://ec.europa.eu/esco/api/search?type=skill&text=${encodeURIComponent(query)}&language=en`,
      { timeout: 5000 }
    );

    const skills = res.data._embedded?.results?.map((s: any) => ({
      id: s.uri || s.title,
      name: s.title
    })) || [];

    cache.set(cacheKey, skills);
    return skills;
  } catch (err: unknown) {
    console.error('ESCO API Error:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function searchSkills(query: string): Promise<Skill[]> {
  if (!query || query.length < 1) return [];

  const normalized = query.trim();
  const lower = normalized.toLowerCase();

  // Search curated tech skills
  const techMatches = TECH_SKILLS
    .filter(skill => skill.toLowerCase().includes(lower))
    .map(skill => ({ id: skill, name: skill }));

  // Search ESCO skills
  const escoSkills = await fetchESCOSkills(normalized);

  // Combine and deduplicate
  const combined = new Map<string, Skill>();
  
  techMatches.forEach(s => combined.set(s.name.toLowerCase(), s));
  escoSkills.forEach(s => {
    if (!combined.has(s.name.toLowerCase())) {
      combined.set(s.name.toLowerCase(), s);
    }
  });

  // Sort: exact match > starts with > contains
  return Array.from(combined.values())
    .sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aExact = aLower === lower;
      const bExact = bLower === lower;
      const aStarts = aLower.startsWith(lower);
      const bStarts = bLower.startsWith(lower);
      const aTech = TECH_SKILLS.some(t => t.toLowerCase() === aLower);
      const bTech = TECH_SKILLS.some(t => t.toLowerCase() === bLower);

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      if (aTech && !bTech) return -1;
      if (!aTech && bTech) return 1;
      
      return a.name.localeCompare(b.name);
    })
    .slice(0, 20);
}