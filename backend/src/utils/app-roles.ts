export const unsupportedRoleError = {
  code: 'UNSUPPORTED_ROLE',
  message: 'This account role is unavailable in SRMS. Sign in as a Candidate, Recruiter, or Administrator.',
};

export const isSupportedAppRole = (role: unknown): role is 'ADMIN' | 'RECRUITER' | 'CANDIDATE' =>
  role === 'ADMIN' || role === 'RECRUITER' || role === 'CANDIDATE';
