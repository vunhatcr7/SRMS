interface ParsedResume {
  fullName?: string;
  email?: string;
  skills: string[];
  experienceYears: number;
  position?: string;
  education?: string;
  summary?: string;
}

const defaultEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

const parseJsonResponse = (content: string): unknown => {
  const withoutFence = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(withoutFence);
};

const normalizeResult = (value: unknown): ParsedResume => {
  if (!value || typeof value !== 'object') {
    throw new Error('AI returned an invalid resume object.');
  }

  const data = value as Record<string, unknown>;
  const skills = Array.isArray(data.skills)
    ? [...new Set(data.skills.filter((skill): skill is string => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean))]
    : [];
  const experienceYears = typeof data.experienceYears === 'number' && Number.isFinite(data.experienceYears)
    ? Math.max(0, data.experienceYears)
    : 0;

  return {
    fullName: typeof data.fullName === 'string' ? data.fullName.trim() : undefined,
    email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : undefined,
    skills,
    experienceYears,
    position: typeof data.position === 'string' ? data.position.trim() : undefined,
    education: typeof data.education === 'string' ? data.education.trim() : undefined,
    summary: typeof data.summary === 'string' ? data.summary.trim() : undefined,
  };
};

export const parseResumeWithAI = async (resumeText: string): Promise<ParsedResume> => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured.');
  }

  const response = await fetch(process.env.AI_API_URL || defaultEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{
            text: `Extract resume information. Return only valid JSON with keys: fullName, email, skills, experienceYears, position, education, summary. skills must be a string array and experienceYears a number.\n\nResume:\n${resumeText.slice(0, 20000)}`,
          }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`AI provider returned HTTP ${response.status}.`);
  }

  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('AI provider returned no parsed content.');
  }

  return normalizeResult(parseJsonResponse(content));
};