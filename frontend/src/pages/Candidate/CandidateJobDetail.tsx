import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle2, FileText, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange?: string | null;
  description: string;
  requirements: string;
  benefits?: string | null;
  createdAt: string;
  company?: { name: string; website?: string | null };
}

export default function CandidateJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    Promise.all([api.get(`/job/${jobId}`), api.get(`/application/status/${jobId}`)])
      .then(([jobResponse, statusResponse]) => {
        if (!active) return;
        setJob(jobResponse.data as Job);
        setApplied(Boolean(statusResponse.data?.applied));
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [jobId]);

  const handleApply = async () => {
    if (!jobId || applied) return;
    setApplying(true);
    setFeedback(null);
    try {
      await api.post('/application/apply', { jobId });
      setApplied(true);
      setFeedback({ message: 'Application submitted successfully.', success: true });
    } catch (requestError) {
      const response = (requestError as { response?: { status?: number; data?: { code?: string; message?: string } } }).response;
      if (response?.data?.code === 'ALREADY_APPLIED') {
        setApplied(true);
      }
      setFeedback({ message: response?.data?.message || getErrorMessage(requestError), success: false });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading job details...</div>;
  if (error || !job) return <div className="space-y-4"><button type="button" onClick={() => navigate('/candidate/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light"><ArrowLeft className="h-4 w-4" />Back to jobs</button><div className={`rounded-lg border p-6 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><AlertCircle className="mb-2 h-5 w-5" />{error || 'Job not found.'}</div></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/candidate/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span>
              <span className="font-semibold text-emerald-400">{job.salaryRange || 'Competitive'}</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${feedback.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>{feedback.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{feedback.message}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-100"><Briefcase className="h-5 w-5 text-brand" />Description</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{job.description}</p>
          </section>
          <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-100"><FileText className="h-5 w-5 text-brand" />Requirements</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{job.requirements}</p>
          </section>
          {job.benefits && <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
            <h2 className="text-base font-bold text-slate-100">Benefits</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{job.benefits}</p>
          </section>}
        </div>

        <aside className={`h-fit rounded-lg border p-5 lg:sticky lg:top-24 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="font-bold text-slate-100">Ready to apply?</h2>
          <p className="mt-2 text-sm text-slate-400">Your candidate profile will be attached to this application.</p>
          <button
            type="button"
            disabled={applied || applying}
            onClick={() => void handleApply()}
            className={`mt-5 w-full rounded px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${applied ? 'bg-emerald-600 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark'}`}
          >
            {applied ? 'Applied' : applying ? 'Submitting...' : 'Apply now'}
          </button>
        </aside>
      </div>
    </div>
  );
}


