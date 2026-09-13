import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Building2, Edit3, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

interface Job { id: string; title: string; description: string; requirements: string; location: string; salaryRange?: string | null; isActive: boolean; createdAt: string; company?: { name: string }; _count?: { applications: number } }

export default function RecruiterJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    api.get(`/job/manage/${jobId}`).then((response) => { if (active) setJob(response.data); }).catch((error) => { if (active) setMessage(getErrorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId]);

  const toggle = async () => {
    if (!jobId || !job) return;
    if (job.isActive && !window.confirm('Close this job? Candidates will no longer be able to apply.')) return;
    try {
      const response = await api.patch(`/job/manage/${jobId}/toggle`);
      setJob(response.data.job);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading job details...</div>;
  if (!job) return <div className="space-y-4"><button type="button" onClick={() => navigate('/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4" />Back to jobs</button><div className={`rounded-lg border p-6 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><AlertCircle className="mb-2 h-5 w-5" />{message || 'Job not found.'}</div></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button type="button" onClick={() => navigate('/recruiter/jobs')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>
      {message && <div className={`rounded-lg border p-3 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message}</div>}

      <div className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-100">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location}</span>
                <span className="text-emerald-400">{job.salaryRange || 'Salary not specified'}</span>
              </div>
            </div>
          </div>
          <span className={`shrink-0 rounded border px-3 py-1 text-xs font-bold ${job.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
            {job.isActive ? 'Active' : 'Closed'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
          <Edit3 className="h-4 w-4" /> Edit job
        </button>
        <button type="button" onClick={() => void toggle()} className="rounded border border-navy-700 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-navy-600 hover:text-slate-100">
          {job.isActive ? 'Close job' : 'Publish job'}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="text-base font-bold text-slate-100">Description</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{job.description}</p>
        </section>
        <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <h2 className="text-base font-bold text-slate-100">Requirements</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-line">{job.requirements}</p>
        </section>
      </div>
    </div>
  );
}
