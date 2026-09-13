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
}

const INITIAL_FORM: FormData = {
  title: '',
  companyName: '',
  location: '',
  salaryRange: '',
  description: '',
  requirements: '',
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

  const isDark = theme === 'dark';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        aria-label="Close form"
        className={`fixed inset-0 ${isDark ? 'bg-navy-950/80' : 'bg-slate-900/40'} backdrop-blur-[1px]`}
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-job-title"
          className={`w-full max-w-[760px] overflow-hidden rounded-lg border shadow-card ${
            isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-slate-50'}`}>
            <div>
              <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-brand-light' : 'text-brand'}`}>
                <PlusCircle className="h-4 w-4" />
                Recruitment
              </div>
              <h2 id="create-job-title" className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Post a new job
              </h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Fill in the details so AI can match the best candidates.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`rounded border p-2 transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {message && (
                <div
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                    isSuccess
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
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
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <Briefcase className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  Job title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Senior React Developer"
                  className={`w-full rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                    isDark
                      ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Building2 className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    Company name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. FPT Software"
                    className={`w-full rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                      isDark
                        ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                    }`}
                  />
                </div>
                <div>
                  <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <MapPin className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Hanoi, HCMC, Remote..."
                    className={`w-full rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                      isDark
                        ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <DollarSign className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  Salary range
                </label>
                <input
                  type="text"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g. 15M - 25M or Negotiable"
                  className={`w-full rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                    isDark
                      ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <FileText className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  Job description (JD) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Daily tasks, responsibilities..."
                  className={`w-full resize-none rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                    isDark
                      ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                  }`}
                />
              </div>

              <div>
                <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <ClipboardList className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  Candidate requirements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="requirements"
                  rows={3}
                  value={formData.requirements}
                  onChange={handleChange}
                  required
                  placeholder="Technical skills, years of experience, education..."
                  className={`w-full resize-none rounded border px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 transition ${
                    isDark
                      ? 'border-navy-700 bg-navy-900 text-slate-100 focus:border-brand'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-brand'
                  }`}
                />
                <p className={`mt-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Be specific about skill names for accurate AI matching.
                </p>
              </div>

            </div>

            <div className={`flex gap-3 border-t px-5 py-3 ${isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-slate-50'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`rounded border px-4 py-2.5 text-sm font-semibold transition ${
                  isDark
                    ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Posting...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    Post job
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
