import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  FileText,
  ClipboardList,
  Gift,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/formatters';

interface FormData {
  title: string;
  companyName: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
  benefits: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  companyName: '',
  location: '',
  salaryRange: '',
  description: '',
  requirements: '',
  benefits: '',
};

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateJobModal({ open, onClose, onCreated }: CreateJobModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('srms-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('srms-theme');
      setTheme(savedTheme === 'light' ? 'light' : 'dark');
    };

    syncTheme();
    window.addEventListener('srms-theme-change', syncTheme as EventListener);
    return () => window.removeEventListener('srms-theme-change', syncTheme as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    setFormData(INITIAL_FORM);
    setMessage('');
    setIsSuccess(false);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      await api.post('/job/create', formData);
      setFormData(INITIAL_FORM);
      onCreated?.();
      onClose();
    } catch (error) {
      setIsSuccess(false);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const isDarkTheme = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        aria-label="Đóng form đăng tin"
        className={`fixed inset-0 ${isDarkTheme ? 'bg-[#071321]/80' : 'bg-slate-900/40'} backdrop-blur-[1px]`}
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-job-title"
          className={`w-full max-w-[760px] overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(6,11,21,0.8)] ${
            isDarkTheme ? 'border-[#334763] bg-[#0f1d2e]' : 'border-slate-200 bg-white'
          }`}
        >
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${isDarkTheme ? 'border-[#2c3d56] bg-[#101d30]' : 'border-slate-200 bg-slate-50'}`}>
          <div>
            <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDarkTheme ? 'text-[#7aa7ff]' : 'text-blue-600'}`}>
              <PlusCircle className="h-4 w-4" />
              Tuyển dụng
            </div>
            <h2 id="create-job-title" className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Đăng tin tuyển dụng mới
            </h2>
            <p className={`mt-1 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              Điền đầy đủ thông tin để AI có thể matching ứng viên phù hợp nhất.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className={`rounded-lg border p-2 transition ${isDarkTheme ? 'border-[#3a4b67] bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            {message && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                  isSuccess
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p className="font-semibold">{message}</p>
              </div>
            )}

            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                <Briefcase className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                Tiêu đề công việc <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ví dụ: Senior React Developer"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                  isDarkTheme
                    ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Building2 className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                  Tên công ty <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: FPT Software"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                    isDarkTheme
                      ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              </div>
              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                  <MapPin className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                  Địa điểm <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Hà Nội, TP.HCM, Remote..."
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                    isDarkTheme
                      ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                <DollarSign className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                Mức lương
              </label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
                placeholder="Ví dụ: 15M – 25M hoặc Thỏa thuận"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                  isDarkTheme
                    ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>

            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                <FileText className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                Mô tả công việc (JD) <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Nhiệm vụ cụ thể hàng ngày, trách nhiệm của vị trí này..."
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                  isDarkTheme
                    ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>

            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                <ClipboardList className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                Yêu cầu ứng viên <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleChange}
                required
                placeholder="Kỹ năng kỹ thuật, số năm kinh nghiệm, trình độ học vấn... (AI sẽ dùng mục này để matching)"
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                  isDarkTheme
                    ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              <p className={`mt-1.5 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                Ghi rõ tên kỹ năng (React, Node.js, Python...) để AI matching chính xác hơn.
              </p>
            </div>

            <div>
              <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                <Gift className={`h-3.5 w-3.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                Quyền lợi cho ứng viên
              </label>
              <textarea
                name="benefits"
                rows={3}
                value={formData.benefits}
                onChange={handleChange}
                placeholder="Ví dụ: Bảo hiểm đầy đủ, 13th month salary, remote hybrid, đào tạo nội bộ..."
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 ${
                  isDarkTheme
                    ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-100 focus:border-[#6ca5ff] focus:ring-[#5ea4ff]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>
          </div>

          <div className={`flex gap-3 border-t px-5 py-3 ${isDarkTheme ? 'border-[#2c3d56] bg-[#101d30]' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                isDarkTheme
                  ? 'border-[#3b4e68] bg-[#0d1a2a] text-slate-200 hover:bg-[#12233d]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5ea4ff] to-[#7a5cf4] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(94,164,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang đăng tin...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Đăng Tin Ngay
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
