// ===================================================
// SRMS Platform - Shared Formatter Utilities
// ===================================================

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getScoreColor = (score: number): string => {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
};

export const getStageLabel = (stage: string): string => {
  const map: Record<string, string> = {
    APPLIED: 'Applied',
    SCREENING: 'Screening',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
  };
  return map[stage] ?? stage;
};

export const getStageColor = (stage: string): string => {
  const map: Record<string, string> = {
    APPLIED: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    SCREENING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    INTERVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    OFFER: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    HIRED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
  return map[stage] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/30';
};

export const getInitials = (name?: string | null): string => {
  if (!name?.trim()) return '?';
  return name.trim().charAt(0).toUpperCase();
};

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getErrorMessage = (error: unknown): string => {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message ?? 'Unable to connect to server.';
};
