export const roleWorkspaces = {
  ADMIN: '/admin',
  RECRUITER: '/recruiter',
  CANDIDATE: '/candidate',
};

export type AppRole = keyof typeof roleWorkspaces;

export const isAppRole = (role: unknown): role is AppRole =>
  typeof role === 'string' && Object.prototype.hasOwnProperty.call(roleWorkspaces, role);

export const unsupportedRoleMessage =
  'This account role is unavailable in SRMS. Sign in as a Candidate, Recruiter, or Administrator.';
