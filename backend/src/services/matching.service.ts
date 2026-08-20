interface ExperienceData {
  years?: unknown;
  position?: unknown;
}

interface MatchingResult {
  matchingScore: number;
  skillScore: number;
  experienceScore: number;
  aiExplanation: string;
}

const normalize = (value: string): string => value.trim().toLowerCase();

const extractRequiredYears = (requirements: string): number | null => {
  const match = requirements.match(/(?:at least|minimum|min|over|more than|tu|toi thieu)\s*(\d+)\s*(?:years?|nam)/i)
    ?? requirements.match(/(\d+)\+?\s*(?:years?|nam)\s*(?:of experience|experience|kinh nghiem)/i);

  return match ? Number(match[1]) : null;
};

const readExperienceYears = (experience: unknown): number => {
  if (!experience || typeof experience !== 'object') {
    return 0;
  }

  const years = (experience as ExperienceData).years;
  return typeof years === 'number' && Number.isFinite(years) && years >= 0 ? years : 0;
};

export const calculateMatching = (
  skills: string[],
  experience: unknown,
  requirements: string,
): MatchingResult => {
  const normalizedRequirements = normalize(requirements);
  const candidateSkills = [...new Set(skills.map(normalize).filter(Boolean))];
  const matchedSkills = candidateSkills.filter((skill) => normalizedRequirements.includes(skill));
  const skillScore = candidateSkills.length === 0
    ? 0
    : Math.round((matchedSkills.length / candidateSkills.length) * 100);

  const requiredYears = extractRequiredYears(requirements);
  const candidateYears = readExperienceYears(experience);
  const experienceScore = requiredYears === null
    ? (candidateYears > 0 ? 80 : 50)
    : Math.min(100, Math.round((candidateYears / Math.max(requiredYears, 1)) * 100));
  const matchingScore = Math.round(skillScore * 0.7 + experienceScore * 0.3);

  const explanation = matchedSkills.length > 0
    ? `Matched skills: ${matchedSkills.join(', ')}.`
    : 'No direct skill overlap was found.';
  const experienceExplanation = requiredYears === null
    ? `Candidate experience: ${candidateYears} year(s).`
    : `Experience match: ${candidateYears}/${requiredYears} year(s).`;

  return {
    matchingScore,
    skillScore,
    experienceScore,
    aiExplanation: `${explanation} ${experienceExplanation}`,
  };
};
