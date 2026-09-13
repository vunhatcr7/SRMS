import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Building2, Edit3, Eye, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate } from '../../utils/formatters';

interface Job { id: string; title: string; location: string; salaryRange?: string | null; isActive: boolean; createdAt: string; company?: { name: string }; _count?: { applications: number } }

export default function RecruiterJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    let active = true;
    api.get('/job/manage').then((response) => { if (active) setJobs(Array.isArray(response.data) ? response.data : []); }).catch(() => { if (active) setError('Unable to load jobs.'); }).finally(() => { if (active) setLoading(false); });
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => { active = false; window.removeEventListener('srms-theme-change', syncTheme); };
  }, []);

  const isDark = theme === 'dark';
  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading jobs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Recruiter workspace</p>
          <h1 className="mt-2 text-2xl font-bold">My jobs</h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage the roles owned by your recruiter account.</p>
        </div>
        <button type="button" onClick={() => navigate('/recruiter/jobs/create')} className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
          Create job
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">{error}</div>}

      {!error && jobs.length === 0 && (
        <div className={`rounded-lg border border-dashed p-12 text-center ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className="mt-3 font-bold text-slate-200">No jobs yet</h2>
          <p className="mt-1 text-sm text-slate-400">Create your first role to start recruiting.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <article key={job.id} className={`rounded-lg border p-5 transition ${isDark ? 'border-navy-700 bg-navy-800 hover:border-navy-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${isDark ? 'bg-brand-muted text-brand-light' : 'bg-blue-50 text-blue-600'}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-100">{job.title}</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded border px-2 py-1 text-[11px] font-semibold ${job.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                {job.isActive ? 'Active' : 'Closed'}
              </span>
            </div>

            <div className={`mt-4 flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {job.location}
              </span>
              <span className="text-slate-500">Created {formatDate(job.createdAt)}</span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-navy-700 pt-3">
              <span className="text-xs text-slate-500">{job._count?.applications ?? 0} applications</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}`)} className="rounded border border-navy-700 p-1.5 text-slate-400 transition hover:text-slate-200 hover:border-navy-600" title="View">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} className="rounded border border-navy-700 p-1.5 text-slate-400 transition hover:text-slate-200 hover:border-navy-600" title="Edit">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
