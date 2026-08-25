// ===================================================
// SRMS Platform - Shared Formatter Utilities
// ===================================================

/** Format ngày theo định dạng tiếng Việt */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Format ngày + giờ */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Màu sắc theo ngưỡng điểm AI (Tailwind classes) */
export const getScoreColor = (score: number): string => {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
};

/** Màu nền badge điểm AI (Tailwind classes) */
export const getScoreBgColor = (score: number): string => {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (score >= 50) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-rose-50 border-rose-200 text-rose-700';
};

/** Label tiếng Việt cho ProcessStage */
export const getStageLabel = (stage: string): string => {
  const map: Record<string, string> = {
    APPLIED: 'Đã nộp đơn',
    SCREENING: 'Lọc hồ sơ',
    INTERVIEW: 'Phỏng vấn',
    OFFER: 'Gửi Offer',
    HIRED: 'Đã tuyển',
    REJECTED: 'Từ chối',
  };
  return map[stage] ?? stage;
};

/** Màu badge theo ProcessStage (Tailwind classes) */
export const getStageColor = (stage: string): string => {
  const map: Record<string, string> = {
    APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
    SCREENING: 'bg-purple-50 text-purple-700 border-purple-200',
    INTERVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    OFFER: 'bg-pink-50 text-pink-700 border-pink-200',
    HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return map[stage] ?? 'bg-slate-50 text-slate-700 border-slate-200';
};

/** Lấy chữ cái đầu để hiển thị Avatar */
export const getInitials = (name?: string | null): string => {
  if (!name?.trim()) return '?';
  return name.trim().charAt(0).toUpperCase();
};

/** Rút gọn chuỗi dài */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/** Lấy message lỗi từ axios error */
export const getErrorMessage = (error: unknown): string => {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message ?? 'Không thể kết nối tới server.';
};
